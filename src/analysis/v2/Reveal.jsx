// ─────────────────────────────────────────────────────────────────────────────
// Reveal.jsx — the V2-only reveal / results experience.
//
// Replaces the legacy V1 Results page FOR V2 RUNS ONLY. AnalysisV2 renders this
// at completion (phase === "flow" && session.isComplete) instead of calling
// onComplete immediately. Sequence:
//   1. lock / calibration beat
//   2. archetype reveal card
//   3. identity line
//   4. mirror copy
//   5. top recommended paths  (selectable — user must pick one)
//   6. final handoff CTA (gated until a path is selected)
//
// Path ranking now uses the V2-NATIVE scorer (scoreV2Paths), which reads the
// derived profile + archetype directly — NOT the legacy scoreOptions(). The
// legacy bridge (legacyAnswers) is still received for compatibility/handoff but
// is no longer used to rank the reveal. The legacy scorer is untouched (V1).
//
// Props:
//   derived       the completed V2 derived profile (session.derived)
//   archetype     { key, reasons } from session.archetype
//   legacyAnswers the bridged legacy answers (kept for compatibility; not used
//                 for ranking anymore)
//   onContinue(selectedPath)  called by the CTA after a path is chosen
//
// Top-level function declarations per the project's React rule.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { T } from "../../theme.js";
import { ARCHETYPES } from "../data/archetypes.js";
import { styleFor } from "./archetypes.js";
import { scoreV2Paths } from "./scoreV2Paths.js";

const C = {
  gold: (T && T.gold) || "#f5c842",
  blue: (T && (T.accent || T.primary)) || "#4a9eff",
  card: (T && (T.card || T.panel)) || "rgba(255,255,255,0.04)",
  border: (T && T.border) || "rgba(255,255,255,0.09)",
  text: (T && T.text) || "#f5f6fa",
  dim: (T && (T.textDim || T.dim)) || "rgba(245,246,250,0.55)",
};

const LOCK_MS = 950; // the single earned pause before the archetype lands

// Build short profile chips from the derived spectra (the "why").
function profileChips(d) {
  const chips = [];
  if (d.domainTop) chips.push(cap(d.domainTop));
  if (d.ownership.position > 0.25) chips.push("Builder");
  else if (d.ownership.position < -0.25) chips.push("Specialist");
  if (d.people.position > 0.3) chips.push("People-first");
  else if (d.people.position < -0.3) chips.push("Solo");
  if (d.riskReward.position > 0.3) chips.push("High-upside");
  else if (d.riskReward.position < -0.3) chips.push("Steady");
  if (d.incomeModel.position > 0.2) chips.push("Asset-builder");
  return chips.slice(0, 4);
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function Reveal({ derived, archetype, legacyAnswers, onContinue }) {
  const [stage, setStage] = useState("lock"); // 'lock' → 'revealed'
  const [lockLabel, setLockLabel] = useState(0);
  const [selectedId, setSelectedId] = useState(null); // chosen path id (none by default)

  // cycle the lock labels, then settle into the reveal
  useEffect(() => {
    const labels = setInterval(() => setLockLabel((i) => Math.min(i + 1, 2)), 300);
    const done = setTimeout(() => setStage("revealed"), LOCK_MS);
    return () => { clearInterval(labels); clearTimeout(done); };
  }, []);

  const key = archetype && archetype.key ? archetype.key : "specialist";
  const copy = ARCHETYPES[key] || ARCHETYPES.specialist;
  const sty = styleFor(key);

  // V2-native ranking: reads the derived profile + archetype directly.
  const ranked = scoreV2Paths({ derived, archetype }).slice(0, 4);
  const topScore = ranked.length ? ranked[0].score : 1;
  const chips = profileChips(derived);

  const selectedPath = selectedId ? ranked.find((o) => o.id === selectedId) : null;

  if (stage === "lock") {
    const labels = ["Reading your signal…", "Locking your profile…", "Calibration complete"];
    return (
      <div style={St.lockWrap}>
        <RingPulse accent={sty.accent} />
        <div style={St.lockLabel}>{labels[lockLabel]}</div>
        <Keyframes />
      </div>
    );
  }

  return (
    <div style={St.wrap}>
      <Keyframes />

      {/* 2–4: archetype card + identity + mirror */}
      <div style={{ ...St.card, animation: "auroUp .5s ease both" }}>
        <div style={{ ...St.glyph, color: sty.accent }}>{sty.glyph}</div>
        <div style={St.kicker}>YOUR PROFILE</div>
        <h1 style={{ ...St.title, backgroundImage: `linear-gradient(135deg, ${sty.accent2}, ${sty.accent})` }}>
          {copy.title}
        </h1>
        <p style={St.identity}>{copy.identity}</p>
        <p style={St.mirror}>{copy.mirror}</p>
        {chips.length > 0 && (
          <div style={St.chips}>
            {chips.map((c) => (
              <span key={c} style={{ ...St.chip, borderColor: `${sty.accent}55` }}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* 5: top recommended paths — selectable */}
      <div style={St.pathsHead}>Pick where you want to start</div>
      <div style={St.paths}>
        {ranked.map((opt, i) => (
          <PathCard
            key={opt.id}
            opt={opt}
            pct={Math.max(72, Math.round((opt.score / topScore) * 99))}
            best={i === 0}
            accent={sty.accent}
            delay={i * 0.08}
            selected={selectedId === opt.id}
            onSelect={() => setSelectedId(opt.id)}
          />
        ))}
      </div>

      {/* 6: handoff CTA — gated until a path is selected */}
      <button
        style={{
          ...St.cta,
          backgroundImage: selectedPath
            ? `linear-gradient(135deg, ${sty.accent2}, ${sty.accent})`
            : "none",
          background: selectedPath ? undefined : "rgba(255,255,255,0.06)",
          color: selectedPath ? "#0a0b10" : C.dim,
          cursor: selectedPath ? "pointer" : "not-allowed",
          opacity: selectedPath ? 1 : 0.7,
        }}
        disabled={!selectedPath}
        onClick={() => selectedPath && onContinue(selectedPath)}
      >
        {selectedPath ? `Lock in ${selectedPath.title}` : "Choose a path to continue"}
      </button>
      <div style={St.ctaSub}>You can explore the rest anytime.</div>
    </div>
  );
}

// ── Top path card (selectable) ─────────────────────────────────────────────────
function PathCard({ opt, pct, best, accent, delay, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        ...St.path,
        borderColor: selected ? accent : C.border,
        background: selected ? `${accent}14` : C.card,
        boxShadow: selected ? `0 0 26px ${accent}33` : "none",
        animation: `auroUp .45s ease both`,
        animationDelay: `${delay}s`,
      }}
    >
      <div style={St.pathTop}>
        <div style={St.pathTitle}>{opt.title}</div>
        <div style={St.pathTopRight}>
          {best && <span style={{ ...St.bestTag, background: `${accent}22`, color: accent }}>Best match</span>}
          <span
            style={{
              ...St.check,
              borderColor: selected ? accent : C.border,
              background: selected ? accent : "transparent",
              color: selected ? "#0a0b10" : "transparent",
            }}
          >
            ✓
          </span>
        </div>
      </div>
      {opt.summary && <div style={St.pathSummary}>{opt.summary}</div>}
      <div style={St.pathMeta}>
        {opt.earnings && <span style={St.earn}>{opt.earnings}</span>}
        <span style={St.matchNum}>{pct}% match</span>
      </div>
      <div style={St.matchTrack}>
        <div style={{ ...St.matchFill, width: `${pct}%`, background: `linear-gradient(90deg, ${C.blue}, ${accent})` }} />
      </div>
    </button>
  );
}

// ── Lock-beat visual ─────────────────────────────────────────────────────────
function RingPulse({ accent }) {
  return (
    <div style={St.ringOuter}>
      <div style={{ ...St.ring, borderTopColor: accent }} />
      <div style={{ ...St.ringDot, background: accent, boxShadow: `0 0 24px ${accent}` }} />
    </div>
  );
}

function Keyframes() {
  return (
    <style>{`
      @keyframes auroUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes auroSpin2 { to { transform: rotate(360deg); } }
      @keyframes auroBreath { 0%,100% { opacity: .5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
    `}</style>
  );
}

// ── Styles (Auro idiom) ────────────────────────────────────────────────────────
const St = {
  wrap: { width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", gap: 18 },

  lockWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 26, padding: "60px 0" },
  lockLabel: { fontSize: 13, letterSpacing: 3, color: C.dim, textTransform: "uppercase" },
  ringOuter: { position: "relative", width: 84, height: 84 },
  ring: { position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}`,
    animation: "auroSpin2 0.9s linear infinite" },
  ringDot: { position: "absolute", top: "50%", left: "50%", width: 10, height: 10, borderRadius: "50%",
    transform: "translate(-50%,-50%)", animation: "auroBreath 1s ease-in-out infinite" },

  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 22,
    padding: "26px 22px", textAlign: "center" },
  glyph: { fontSize: 30, marginBottom: 8, lineHeight: 1 },
  kicker: { letterSpacing: 4, fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 6 },
  title: { fontSize: 34, fontWeight: 900, margin: "0 0 12px", lineHeight: 1.1,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
    WebkitTextFillColor: "transparent" },
  identity: { fontSize: 16.5, fontWeight: 650, color: C.text, margin: "0 0 12px", lineHeight: 1.35 },
  mirror: { fontSize: 14.5, color: C.dim, lineHeight: 1.55, margin: 0 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 },
  chip: { fontSize: 12, padding: "5px 11px", borderRadius: 999, border: "1px solid",
    color: C.text, background: "rgba(255,255,255,0.03)" },

  pathsHead: { fontSize: 13, color: C.dim, letterSpacing: 1, margin: "10px 2px 2px", fontWeight: 600 },
  paths: { display: "flex", flexDirection: "column", gap: 12 },
  // path is now a <button>: reset native styling, full width, left aligned.
  path: { display: "block", width: "100%", textAlign: "left", font: "inherit",
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "15px 16px",
    cursor: "pointer", transition: "border-color .15s ease, box-shadow .15s ease, background .15s ease" },
  pathTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  pathTopRight: { display: "flex", alignItems: "center", gap: 8 },
  pathTitle: { fontSize: 16, fontWeight: 750, color: C.text },
  bestTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, padding: "3px 9px", borderRadius: 999 },
  check: { width: 22, height: 22, borderRadius: "50%", border: "1.5px solid", display: "inline-flex",
    alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900,
    transition: "all .15s ease", flex: "0 0 auto" },
  pathSummary: { fontSize: 13, color: C.dim, lineHeight: 1.45, margin: "6px 0 10px" },
  pathMeta: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  earn: { fontSize: 13, fontWeight: 700, color: C.gold },
  matchNum: { fontSize: 12, color: C.dim },
  matchTrack: { height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  matchFill: { height: "100%", borderRadius: 4 },

  cta: { width: "100%", padding: "16px 20px", borderRadius: 16, border: "none",
    fontWeight: 800, fontSize: 16, marginTop: 8, transition: "opacity .15s ease" },
  ctaSub: { fontSize: 12, color: C.dim, textAlign: "center" },
};
