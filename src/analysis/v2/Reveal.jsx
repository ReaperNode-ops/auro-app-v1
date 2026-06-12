// ─────────────────────────────────────────────────────────────────────────────
// Reveal.jsx — the V2-only reveal / results experience (podium redesign).
//
// Sequence:
//   1. lock / calibration beat (unchanged)
//   2. Archetype Info card — glyph, title, identity, mirror, profile chips
//   3. Podium — top 3 paths as gold / silver / bronze cards; the SELECTED card
//      sits centered + enlarged + in front, the other two flank it smaller and
//      behind. Tapping a side card centers it (selectedIndex state, no real
//      scroll needed). Medal colour is fixed by rank; position follows selection.
//   4. Path Info — detail panel for the currently selected path (human-readable)
//   5. CTA — "Begin {title} Path" → onContinue(selectedPath)
//   6. TEMPORARY "Copy debug report" button (kept working)
//
// Ranking uses the V2-native scorer (scoreV2Paths). The legacy bridge
// (legacyAnswers) is still received for compatibility but not used here.
//
// Props:
//   derived       completed V2 derived profile (session.derived)
//   archetype     { key, reasons } from session.archetype
//   legacyAnswers bridged legacy answers (kept for compatibility; unused here)
//   onContinue(selectedPath)  called by the CTA with the chosen path object
//   history       answer history (for the debug report; optional)
//
// Top-level function declarations per the project's React rule.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { T } from "../../theme.js";
import { ARCHETYPES } from "../data/archetypes.js";
import { styleFor } from "./archetypes.js";
import { scoreV2Paths } from "./scoreV2Paths.js";
import { buildDebugReport } from "./debugReport.js"; // TEMPORARY dev diagnostic

const C = {
  gold: (T && T.gold) || "#f5c842",
  blue: (T && (T.accent || T.primary)) || "#4a9eff",
  card: (T && (T.card || T.panel)) || "rgba(255,255,255,0.04)",
  border: (T && T.border) || "rgba(255,255,255,0.09)",
  text: (T && T.text) || "#f5f6fa",
  dim: (T && (T.textDim || T.dim)) || "rgba(245,246,250,0.55)",
};

const LOCK_MS = 950; // the single earned pause before the archetype lands

// Medal treatment by RANK (0 = top pick). Position is decided by selection.
// Each medal carries solid dark card fills (selected vs idle) plus its own text
// colours so titles/pills/checks read in the medal's hue while body stays cream.
const MEDAL = [
  {
    label: "Top pick", accent: "#f5c842", accent2: "#ffe9a3", glow: "rgba(245,200,66,0.45)",
    cardSel: "linear-gradient(160deg, #4a3a14 0%, #241b09 100%)",
    cardIdle: "linear-gradient(160deg, #2f2510 0%, #171106 100%)",
    title: "#ffe6a0", body: "rgba(255,242,212,0.80)",
  },
  {
    label: "2nd pick", accent: "#c9d4e4", accent2: "#eef3fa", glow: "rgba(201,212,228,0.42)",
    cardSel: "linear-gradient(160deg, #363d49 0%, #191d23 100%)",
    cardIdle: "linear-gradient(160deg, #262b33 0%, #13161a 100%)",
    title: "#eaf1fb", body: "rgba(228,236,246,0.80)",
  },
  {
    label: "3rd pick", accent: "#d08a58", accent2: "#ecb98c", glow: "rgba(208,138,88,0.42)",
    cardSel: "linear-gradient(160deg, #4a3220 0%, #26180f 100%)",
    cardIdle: "linear-gradient(160deg, #33241a 0%, #1a1009 100%)",
    title: "#f3cba4", body: "rgba(242,212,186,0.80)",
  },
];

// ── Human-readable copy for v2Reasons + metadata ────────────────────────────
const REASON_LABELS = {
  "domain:top": "Matches your strengths",
  "domain:second": "Fits your interests",
  "domain:picked": "In your wheelhouse",
  "urgent:fast": "Fast to start",
  "starter:start-now": "Start right away",
  "starter:tier": "Beginner friendly",
  "starter:quickCash": "Quick cash",
  "starter:studentFriendly": "Student friendly",
  "starter:directional": "On your path",
  "starter:behind-content": "Behind the scenes",
  "remote-skill": "Remote skill work",
  "remote-skill:spreadsheet": "Remote skill work",
  "remote-skill:backup": "Solid backup",
  "ct:behind-content": "Behind-the-scenes content",
  "ct:faceCam": "On-camera content",
  "ct:educational": "Teaching content",
  "quick:content": "Content work",
  "quick:local": "Local work",
  "quick:remote": "Remote admin",
  "quick:sales": "Sales / outreach",
  "quick:tutor": "Teaching / tutoring",
  "quick:resell": "Reselling",
  "relational:people": "People-facing",
  "high-vis:content": "Public-facing",
  "wants-asset": "Builds an asset",
  "wants-active": "Paid for your work",
};

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function tierLabel(tier) {
  return tier ? tier.split("-").map(cap).join(" ") : null;
}
function readinessLabel(r) {
  return r === "start-now" ? "Start now"
    : r === "learn-first" ? "Learn as you go"
    : r === "build-over-time" ? "Build over time"
    : null;
}

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

// Pick 2–4 human-readable reason chips for the selected path.
function reasonChips(path) {
  const seen = new Set();
  const out = [];
  const add = (label) => {
    if (label && !seen.has(label)) { seen.add(label); out.push(label); }
  };
  for (const code of path.v2Reasons || []) {
    if (out.length >= 4) break;
    add(REASON_LABELS[code]);
  }
  if (out.length < 2) {
    add(readinessLabel(path.readiness));
    if (path.quickCash) add("Quick cash");
    if (path.studentFriendly) add("Student friendly");
    if (path.speed === "fast") add("Fast to start");
    if (path.difficulty) add(path.difficulty);
  }
  return out.slice(0, 4);
}

// One short, human sentence on why this path fits.
function whyCopy(path) {
  const r = path.v2Reasons || [];
  const strength =
    r.includes("domain:top") ? "plays to your strongest area"
    : r.includes("domain:second") ? "lines up with your interests"
    : (r.includes("remote-skill") || r.some((x) => x.startsWith("ct:"))) ? "matches the kind of work you want to do"
    : "fits the profile you just built";
  const ramp =
    path.readiness === "start-now" ? "You can start right now."
    : path.readiness === "learn-first" ? "A short ramp, then you're earning."
    : "It's a longer build, but the upside is real.";
  return `This one ${strength}. ${ramp}`;
}

export default function Reveal({ derived, archetype, legacyAnswers, onContinue, history }) {
  const [stage, setStage] = useState("lock"); // 'lock' → 'revealed'
  const [lockLabel, setLockLabel] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0); // default = top pick
  const [copied, setCopied] = useState(false); // debug-report copy feedback (temporary)

  // cycle the lock labels, then settle into the reveal
  useEffect(() => {
    const labels = setInterval(() => setLockLabel((i) => Math.min(i + 1, 2)), 300);
    const done = setTimeout(() => setStage("revealed"), LOCK_MS);
    return () => { clearInterval(labels); clearTimeout(done); };
  }, []);

  const key = archetype && archetype.key ? archetype.key : "specialist";
  const copy = ARCHETYPES[key] || ARCHETYPES.specialist;
  const sty = styleFor(key);

  // V2-native ranking → top 3 for the podium.
  const ranked = scoreV2Paths({ derived, archetype });
  const top3 = ranked.slice(0, 3);
  const chips = profileChips(derived);

  const safeIndex = Math.min(selectedIndex, Math.max(0, top3.length - 1));
  const selectedPath = top3[safeIndex] || null;

  // ── TEMPORARY developer diagnostic: copy a full debug report to clipboard. ──
  async function handleCopyDebug() {
    const report = buildDebugReport({ derived, archetype, history, selectedPath });
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = report;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (_) {
        // eslint-disable-next-line no-console
        console.log(report);
        alert("Clipboard blocked — debug report logged to the console.");
      }
    }
  }

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

      {/* 2: Archetype Info card */}
      <div style={{ ...St.archCard, animation: "auroUp .5s ease both" }}>
        <div style={{ ...St.archGlow, background: `radial-gradient(120% 80% at 50% 0%, ${sty.accent}1f, transparent 70%)` }} />
        <div style={{ ...St.glyph, color: sty.accent }}>{sty.glyph}</div>
        <div style={St.kicker}>YOUR PROFILE</div>
        <h1 style={{ ...St.archTitle, backgroundImage: `linear-gradient(135deg, ${sty.accent2}, ${sty.accent})` }}>
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

      {/* 3: Podium */}
      <div style={St.sectionHead}>Choose your path</div>
      <Podium top3={top3} selectedIndex={safeIndex} onSelect={setSelectedIndex} />

      {/* 4: Path Info */}
      {selectedPath && <PathInfo path={selectedPath} medal={MEDAL[safeIndex]} />}

      {/* 5: CTA */}
      {selectedPath && (
        <button
          style={{
            ...St.cta,
            backgroundImage: `linear-gradient(135deg, ${MEDAL[safeIndex].accent2}, ${MEDAL[safeIndex].accent})`,
          }}
          onClick={() => onContinue(selectedPath)}
        >
          Begin {selectedPath.title} Path
        </button>
      )}
      <div style={St.ctaSub}>You can explore the other paths anytime.</div>

      {/* 6: TEMPORARY developer diagnostic — remove with debugReport.js when done. */}
      <button type="button" style={St.debugBtn} onClick={handleCopyDebug}>
        {copied ? "Copied \u2713" : "Copy debug report"}
      </button>
    </div>
  );
}

// ── Podium: native scroll-snap carousel with a coverflow LOOK ───────────────
// Mechanics are the real scroll-snap version (two-finger trackpad scroll + touch
// swipe feel native). The flat row is dressed up to read as a podium: the
// centred card is full-size, glowing and forward; the others scale down, tuck
// toward centre, tilt back (perspective), dim, and drop behind via z-index.
function Podium({ top3, selectedIndex, onSelect }) {
  const scrollerRef = useRef(null);
  const cardRefs = useRef([]);      // refs to the (untransformed) snap wrappers
  const ticking = useRef(false);    // rAF throttle for the scroll handler
  const programmatic = useRef(false); // ignore scroll churn during click-centering

  if (!top3.length) return null;

  // Centre the initially-selected card on mount (no animation).
  useEffect(() => {
    const el = cardRefs.current[selectedIndex];
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The card whose centre is nearest the viewport centre becomes selected.
  function onScroll() {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      if (programmatic.current) return; // a click is smooth-centering; don't fight it
      const sc = scrollerRef.current;
      if (!sc) return;
      const center = sc.scrollLeft + sc.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const cardCenter = el.offsetLeft + el.offsetWidth / 2; // layout, transform-free
        const d = Math.abs(cardCenter - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== selectedIndex) onSelect(best);
    });
  }

  // Tap / click a card → select it and smooth-centre it.
  function selectCard(i) {
    onSelect(i);
    const el = cardRefs.current[i];
    if (el && el.scrollIntoView) {
      programmatic.current = true;
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setTimeout(() => { programmatic.current = false; }, 400);
    }
  }

  return (
    <div ref={scrollerRef} className="auroScroller" style={St.scroller} onScroll={onScroll}>
      {top3.map((path, i) => {
        const ax = Math.abs(i - selectedIndex);
        // Flex items honor z-index even when statically positioned, so stacking
        // the WRAPPER guarantees the selected card paints in front of its
        // overlapping neighbours (a static card's z-index would be ignored).
        const zi = i === selectedIndex ? 30 : 10 - ax;
        return (
          <div
            key={path.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            style={{ ...St.snapItem, zIndex: zi }}
          >
            <PodiumCard
              path={path}
              medal={MEDAL[i]}
              selected={i === selectedIndex}
              offset={i - selectedIndex}
              onSelect={() => selectCard(i)}
            />
          </div>
        );
      })}
    </div>
  );
}

function PodiumCard({ path, medal, selected, offset, onSelect }) {
  // Transform applied to the BUTTON only (wrapper stays untransformed so the
  // scroll-snap centring math is unaffected). The selected card is a wide hero;
  // the others scale down, drop lower, tilt back and tuck behind it.
  const ax = Math.min(Math.abs(offset), 2);   // distance from selected (0,1,2)
  const dir = offset < 0 ? 1 : -1;            // left cards shift right; right cards shift left
  const scale = selected ? 1 : ax === 1 ? 0.74 : 0.62;
  const tx = selected ? 0 : dir * (ax === 1 ? 34 : 58); // extra tuck toward centre (overlap)
  const ty = selected ? 0 : 24 + ax * 14;               // sit lower → podium silhouette
  const ry = selected ? 0 : dir * (ax === 1 ? 26 : 34); // coverflow tilt (parent has perspective)
  const op = selected ? 1 : ax === 1 ? 0.72 : 0.46;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        ...St.podCard,
        width: selected ? 248 : 200,
        minHeight: selected ? 212 : 150,
        padding: selected ? "20px 20px" : "15px 16px",
        transform: `translateX(${tx}px) translateY(${ty}px) scale(${scale}) rotateY(${ry}deg)`,
        opacity: op,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? medal.accent : `${medal.accent}66`,
        background: selected ? medal.cardSel : medal.cardIdle,
        boxShadow: selected
          ? `0 26px 64px rgba(0,0,0,0.6), 0 0 60px ${medal.glow}, inset 0 0 0 1px ${medal.accent}88`
          : `0 16px 30px rgba(0,0,0,0.62), inset 0 0 0 1px ${medal.accent}33`,
      }}
    >
      {/* premium top sheen on the hero card */}
      {selected && <div aria-hidden style={St.cardSheen} />}

      <div style={St.medalRow}>
        <span style={{ ...St.medalPill, background: `${medal.accent}26`, color: medal.accent, borderColor: `${medal.accent}66` }}>
          {medal.label}
        </span>
        {selected && (
          <span style={{ ...St.podCheck, background: medal.accent, color: "#0a0b10" }}>✓</span>
        )}
      </div>

      <div style={{ ...St.podName, color: medal.title, fontSize: selected ? 19 : 14, WebkitLineClamp: selected ? 2 : 3 }}>
        {path.title}
      </div>

      {selected && path.summary && (
        <div style={{ ...St.podSummary, color: medal.body }}>{path.summary}</div>
      )}
    </button>
  );
}

// ── Path Info detail panel ──────────────────────────────────────────────────
function PathInfo({ path, medal }) {
  const meta = [
    path.earnings && { label: path.earnings, gold: true },
    path.timeToFirst && { label: path.timeToFirst },
    path.difficulty && { label: path.difficulty },
    tierLabel(path.tier) && { label: tierLabel(path.tier) },
  ].filter(Boolean);
  const chips = reasonChips(path);

  return (
    <div style={{ ...St.infoCard, animation: "auroUp .35s ease both" }}>
      <div style={St.infoKicker}>PATH DETAIL</div>
      <h2 style={{ ...St.infoTitle, backgroundImage: `linear-gradient(135deg, ${medal.accent2}, ${medal.accent})` }}>
        {path.title}
      </h2>
      <p style={St.infoWhy}>{whyCopy(path)}</p>

      <div style={St.metaRow}>
        {meta.map((m, i) => (
          <span key={i} style={{ ...St.metaPill, color: m.gold ? C.gold : C.text }}>{m.label}</span>
        ))}
      </div>

      {chips.length > 0 && (
        <div style={St.reasonRow}>
          {chips.map((c) => (
            <span key={c} style={{ ...St.reasonChip, borderColor: `${medal.accent}44`, color: medal.accent }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lock-beat visual ────────────────────────────────────────────────────────
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
      .auroScroller::-webkit-scrollbar { display: none; height: 0; }
    `}</style>
  );
}

// ── Styles (Auro idiom) ──────────────────────────────────────────────────────
const St = {
  wrap: { width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", gap: 16 },

  lockWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 26, padding: "60px 0" },
  lockLabel: { fontSize: 13, letterSpacing: 3, color: C.dim, textTransform: "uppercase" },
  ringOuter: { position: "relative", width: 84, height: 84 },
  ring: { position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}`,
    animation: "auroSpin2 0.9s linear infinite" },
  ringDot: { position: "absolute", top: "50%", left: "50%", width: 10, height: 10, borderRadius: "50%",
    transform: "translate(-50%,-50%)", animation: "auroBreath 1s ease-in-out infinite" },

  // Archetype card
  archCard: { position: "relative", overflow: "hidden", background: C.card,
    border: `1px solid ${C.border}`, borderRadius: 22, padding: "26px 22px", textAlign: "center" },
  archGlow: { position: "absolute", inset: 0, pointerEvents: "none" },
  glyph: { position: "relative", fontSize: 30, marginBottom: 8, lineHeight: 1 },
  kicker: { position: "relative", letterSpacing: 4, fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 6 },
  archTitle: { position: "relative", fontSize: 34, fontWeight: 900, margin: "0 0 12px", lineHeight: 1.1,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  identity: { position: "relative", fontSize: 16.5, fontWeight: 650, color: C.text, margin: "0 0 12px", lineHeight: 1.35 },
  mirror: { position: "relative", fontSize: 14.5, color: C.dim, lineHeight: 1.55, margin: 0 },
  chips: { position: "relative", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 },
  chip: { fontSize: 12, padding: "5px 11px", borderRadius: 999, border: "1px solid",
    color: C.text, background: "rgba(255,255,255,0.03)" },

  sectionHead: { fontSize: 13, color: C.dim, letterSpacing: 1, margin: "8px 2px 0", fontWeight: 600, textAlign: "center" },

  // Podium carousel (native scroll-snap, dressed as coverflow)
  scroller: { position: "relative", display: "flex", flexDirection: "row", flexWrap: "nowrap",
    alignItems: "center", justifyContent: "flex-start", height: 320, width: "100%",
    overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch", perspective: "1100px",
    // calc() lets the first/last card reach centre; ~94px = half the 188px snap step.
    padding: "0 calc(50% - 94px)", margin: "4px 0",
    scrollbarWidth: "none", msOverflowStyle: "none" },
  snapItem: { flex: "0 0 188px", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", scrollSnapAlign: "center",
    margin: "0 -40px" }, // overlap: the hero card spills over its neighbours
  podCard: { position: "relative", width: 200, boxSizing: "border-box", overflow: "hidden",
    textAlign: "left", font: "inherit", color: C.text, cursor: "pointer", borderRadius: 22,
    border: "1px solid", display: "flex", flexDirection: "column", gap: 10,
    transformOrigin: "center", backfaceVisibility: "hidden",
    transition: "transform .36s cubic-bezier(.2,.7,.2,1), box-shadow .3s ease, opacity .3s ease, border-color .3s ease, width .3s ease, min-height .3s ease, padding .3s ease" },
  cardSheen: { position: "absolute", top: 0, left: 0, right: 0, height: "46%", pointerEvents: "none",
    borderRadius: "22px 22px 0 0",
    background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0))" },
  medalRow: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  medalPill: { fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase",
    padding: "4px 9px", borderRadius: 999, border: "1px solid" },
  podCheck: { width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center",
    justifyContent: "center", fontSize: 12, fontWeight: 900, flex: "0 0 auto" },
  podName: { position: "relative", zIndex: 1, fontWeight: 800, color: C.text, lineHeight: 1.22,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" },
  podSummary: { position: "relative", zIndex: 1, fontSize: 12.5, color: C.dim, lineHeight: 1.45,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" },

  // Path Info
  infoCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "18px 18px 16px" },
  infoKicker: { letterSpacing: 3, fontSize: 10.5, color: C.dim, fontWeight: 700, marginBottom: 6 },
  infoTitle: { fontSize: 22, fontWeight: 850, margin: "0 0 8px", lineHeight: 1.15,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  infoWhy: { fontSize: 14, color: C.text, opacity: 0.85, lineHeight: 1.5, margin: "0 0 14px" },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  metaPill: { fontSize: 12.5, fontWeight: 700, padding: "6px 11px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}` },
  reasonRow: { display: "flex", flexWrap: "wrap", gap: 7 },
  reasonChip: { fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 999,
    border: "1px solid", background: "rgba(255,255,255,0.02)" },

  // CTA
  cta: { width: "100%", padding: "16px 20px", borderRadius: 16, border: "none",
    fontWeight: 800, fontSize: 16, color: "#0a0b10", cursor: "pointer", marginTop: 6,
    transition: "filter .15s ease" },
  ctaSub: { fontSize: 12, color: C.dim, textAlign: "center" },
  debugBtn: { width: "100%", marginTop: 6, padding: "9px 12px", borderRadius: 10,
    border: `1px dashed ${C.border}`, background: "transparent", color: C.dim,
    fontSize: 12, letterSpacing: 0.5, cursor: "pointer", fontFamily: "ui-monospace, Menlo, monospace" },
};
