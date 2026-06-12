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
// Each medal is a physical brushed-metal card: multi-layer backgrounds (top
// light source, diagonal brushed streaks, lower vignette, base metal) plus its
// own text/accent hues. `serial` is the etched HUD code shown on the card.
const MEDAL = [
  {
    label: "Top pick", serial: "PATH-01", accent: "#f5c842", accent2: "#ffe9a3", glow: "rgba(245,200,66,0.42)",
    cardSel:
      "radial-gradient(135% 78% at 50% -14%, rgba(255,238,190,0.20), transparent 56%)," +
      "repeating-linear-gradient(118deg, rgba(255,226,150,0.055) 0 1px, transparent 1px 5px)," +
      "radial-gradient(120% 100% at 50% 122%, rgba(0,0,0,0.62), transparent 54%)," +
      "linear-gradient(157deg, #5c4918 0%, #352810 47%, #181106 100%)",
    cardIdle:
      "radial-gradient(135% 78% at 50% -14%, rgba(255,238,190,0.10), transparent 56%)," +
      "repeating-linear-gradient(118deg, rgba(255,226,150,0.04) 0 1px, transparent 1px 5px)," +
      "radial-gradient(120% 100% at 50% 122%, rgba(0,0,0,0.70), transparent 52%)," +
      "linear-gradient(157deg, #40310f 0%, #251b0a 50%, #110c05 100%)",
    title: "#ffe6a0", body: "rgba(255,242,212,0.82)",
  },
  {
    label: "2nd pick", serial: "PATH-02", accent: "#c9d4e4", accent2: "#eef3fa", glow: "rgba(201,212,228,0.40)",
    cardSel:
      "radial-gradient(135% 78% at 50% -14%, rgba(228,238,252,0.18), transparent 56%)," +
      "repeating-linear-gradient(118deg, rgba(220,232,248,0.05) 0 1px, transparent 1px 5px)," +
      "radial-gradient(120% 100% at 50% 122%, rgba(0,0,0,0.6), transparent 54%)," +
      "linear-gradient(157deg, #3d4450 0%, #232830 47%, #11141a 100%)",
    cardIdle:
      "radial-gradient(135% 78% at 50% -14%, rgba(228,238,252,0.09), transparent 56%)," +
      "repeating-linear-gradient(118deg, rgba(220,232,248,0.038) 0 1px, transparent 1px 5px)," +
      "radial-gradient(120% 100% at 50% 122%, rgba(0,0,0,0.68), transparent 52%)," +
      "linear-gradient(157deg, #2c323b 0%, #191d23 50%, #0e1014 100%)",
    title: "#eaf1fb", body: "rgba(228,236,246,0.82)",
  },
  {
    label: "3rd pick", serial: "PATH-03", accent: "#d08a58", accent2: "#ecb98c", glow: "rgba(208,138,88,0.40)",
    cardSel:
      "radial-gradient(135% 78% at 50% -14%, rgba(255,206,166,0.18), transparent 56%)," +
      "repeating-linear-gradient(118deg, rgba(240,190,150,0.05) 0 1px, transparent 1px 5px)," +
      "radial-gradient(120% 100% at 50% 122%, rgba(0,0,0,0.62), transparent 54%)," +
      "linear-gradient(157deg, #5c3d26 0%, #351f12 47%, #19100a 100%)",
    cardIdle:
      "radial-gradient(135% 78% at 50% -14%, rgba(255,206,166,0.09), transparent 56%)," +
      "repeating-linear-gradient(118deg, rgba(240,190,150,0.038) 0 1px, transparent 1px 5px)," +
      "radial-gradient(120% 100% at 50% 122%, rgba(0,0,0,0.70), transparent 52%)," +
      "linear-gradient(157deg, #42291a 0%, #24160d 50%, #130b06 100%)",
    title: "#f3cba4", body: "rgba(242,212,186,0.82)",
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
      <div style={St.sectionHead}>
        <span style={St.sectionRule} />
        <span style={St.sectionText}>SELECT PATH</span>
        <span style={St.sectionRule} />
      </div>
      <Podium top3={top3} selectedIndex={safeIndex} onSelect={setSelectedIndex} />

      {/* 4: Path Info — keyed so it lightly re-animates when the selection changes */}
      {selectedPath && <PathInfo key={selectedPath.id} path={selectedPath} medal={MEDAL[safeIndex]} />}

      {/* 5: CTA */}
      {selectedPath && (
        <button
          style={{
            ...St.cta,
            backgroundImage: `linear-gradient(135deg, ${MEDAL[safeIndex].accent2}, ${MEDAL[safeIndex].accent})`,
          }}
          onClick={() => onContinue(selectedPath)}
          onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.985)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span aria-hidden style={St.ctaSheen} />
          <span style={St.ctaLabel}>Begin {selectedPath.title} Path</span>
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
    <div style={St.stageWrap}>
      <div aria-hidden style={St.atmosphere} />
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
                rank={i}
                selected={i === selectedIndex}
                offset={i - selectedIndex}
                onSelect={() => selectCard(i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Four etched corner brackets — the HUD frame of a metal access card.
function Corners({ color, alpha }) {
  const a = `${color}${alpha}`;
  const base = { position: "absolute", width: 12, height: 12, pointerEvents: "none", zIndex: 3 };
  return (
    <>
      <span aria-hidden style={{ ...base, top: 8, left: 8, borderTop: `1.5px solid ${a}`, borderLeft: `1.5px solid ${a}` }} />
      <span aria-hidden style={{ ...base, top: 8, right: 8, borderTop: `1.5px solid ${a}`, borderRight: `1.5px solid ${a}` }} />
      <span aria-hidden style={{ ...base, bottom: 8, left: 8, borderBottom: `1.5px solid ${a}`, borderLeft: `1.5px solid ${a}` }} />
      <span aria-hidden style={{ ...base, bottom: 8, right: 8, borderBottom: `1.5px solid ${a}`, borderRight: `1.5px solid ${a}` }} />
    </>
  );
}

function PodiumCard({ path, medal, rank, selected, offset, onSelect }) {
  // Transform applied to the BUTTON only (wrapper stays untransformed so the
  // scroll-snap centring math is unaffected). The selected card is a wide hero;
  // the others stay solid but sit smaller, lower, tilted and behind it. Depth
  // comes from scale / translate / rotate / shadow / z-index — NOT transparency.
  const ax = Math.min(Math.abs(offset), 2);   // distance from selected (0,1,2)
  const dir = offset < 0 ? 1 : -1;            // left cards shift right; right cards shift left
  const scale = selected ? 1 : ax === 1 ? 0.82 : 0.78;
  const tx = selected ? 0 : dir * (ax === 1 ? 22 : 40); // light tuck toward centre
  const ty = selected ? 0 : 20 + ax * 10;               // sit lower → podium silhouette
  const ry = selected ? 0 : dir * (ax === 1 ? 20 : 26); // coverflow tilt (parent has perspective)
  const op = selected ? 1 : ax === 1 ? 0.97 : 0.92;     // stay solid, never ghosted

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        ...St.podCard,
        width: selected ? 250 : 204,
        minHeight: selected ? 216 : 158,
        padding: selected ? "16px 17px 17px" : "13px 14px 14px",
        borderRadius: selected ? "16px 16px 16px 6px" : "13px 13px 13px 5px",
        transform: `translateX(${tx}px) translateY(${ty}px) scale(${scale}) rotateY(${ry}deg)`,
        opacity: op,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? medal.accent : `${medal.accent}77`,
        background: selected ? medal.cardSel : medal.cardIdle,
        boxShadow: selected
          ? `0 26px 64px rgba(0,0,0,0.62), 0 0 46px ${medal.glow}, inset 0 1px 0 ${medal.accent}66, inset 0 0 0 1px ${medal.accent}55, inset 0 -22px 40px rgba(0,0,0,0.5)`
          : `0 16px 30px rgba(0,0,0,0.64), inset 0 1px 0 ${medal.accent}33, inset 0 0 0 1px ${medal.accent}33, inset 0 -16px 30px rgba(0,0,0,0.55)`,
        ...(selected
          ? { "--glow": medal.glow, "--ring": `${medal.accent}88`, animation: "auroGlow 3.6s ease-in-out infinite" }
          : null),
      }}
    >
      {/* material overlays */}
      <span aria-hidden style={{ ...St.topEdge, background: `linear-gradient(90deg, transparent, ${medal.accent}aa 22%, ${medal.accent2} 50%, ${medal.accent}aa 78%, transparent)` }} />
      <span aria-hidden style={St.scanlines} />
      {selected && <span aria-hidden style={St.cardSweep} />}
      <Corners color={medal.accent} alpha={selected ? "88" : "55"} />

      {/* header: rank serial + medal label */}
      <div style={St.cardHead}>
        <span style={{ ...St.serial, color: `${medal.accent}cc` }}>{medal.serial}</span>
        <span style={{ ...St.medalTag, color: medal.accent, borderColor: `${medal.accent}66`, background: `${medal.accent}1c` }}>
          {selected && <span style={{ ...St.tagDot, background: medal.accent }} />}
          {medal.label}
        </span>
      </div>

      <div style={{ ...St.podName, color: medal.title, fontSize: selected ? 19 : 14.5, WebkitLineClamp: selected ? 2 : 3 }}>
        {path.title}
      </div>

      {selected && (
        <>
          <span aria-hidden style={{ ...St.cardDivider, background: `linear-gradient(90deg, ${medal.accent}66, transparent)` }} />
          {path.summary && <div style={{ ...St.podSummary, color: medal.body }}>{path.summary}</div>}
          {path.earnings && (
            <div style={St.cardMetaRow}>
              <span style={{ ...St.cardMetaLabel, color: `${medal.accent}aa` }}>EST</span>
              <span style={{ ...St.cardMetaVal, color: medal.title }}>{path.earnings}</span>
            </div>
          )}
        </>
      )}
    </button>
  );
}

// ── Path Info detail panel (system readout) ─────────────────────────────────
function PathInfo({ path, medal }) {
  const meta = [
    path.earnings && { k: "EST", v: path.earnings, accent: true },
    path.timeToFirst && { k: "TTFP", v: path.timeToFirst },
    path.difficulty && { k: "TIER", v: path.difficulty },
    tierLabel(path.tier) && { k: "TRACK", v: tierLabel(path.tier) },
  ].filter(Boolean);
  const chips = reasonChips(path);

  return (
    <div style={{ ...St.infoCard, animation: "auroInfoIn .42s cubic-bezier(.2,.7,.2,1) both" }}>
      <span aria-hidden style={{ ...St.infoAccentLine, background: `linear-gradient(180deg, ${medal.accent}, ${medal.accent}00)` }} />
      <span aria-hidden style={St.scanlines} />

      <div style={St.infoHeadRow}>
        <span style={{ ...St.infoKicker, color: `${medal.accent}cc` }}>▸ PATH DETAIL</span>
        <span style={St.infoKickerDim}>{medal.serial}</span>
      </div>

      <h2 style={{ ...St.infoTitle, backgroundImage: `linear-gradient(120deg, ${medal.accent2}, ${medal.accent})` }}>
        {path.title}
      </h2>
      <p style={St.infoWhy}>{whyCopy(path)}</p>

      <div style={St.metaGrid}>
        {meta.map((m, i) => (
          <div key={i} style={St.metaCell}>
            <span style={{ ...St.metaKey, color: `${medal.accent}99` }}>{m.k}</span>
            <span style={{ ...St.metaVal, color: m.accent ? C.gold : C.text }}>{m.v}</span>
          </div>
        ))}
      </div>

      {chips.length > 0 && (
        <>
          <div style={{ ...St.sysLabel, color: `${medal.accent}aa` }}>MATCH RATIONALE</div>
          <div style={St.reasonRow}>
            {chips.map((c) => (
              <span key={c} style={{ ...St.reasonChip, borderColor: `${medal.accent}55`, color: medal.accent, background: `${medal.accent}12` }}>
                <span style={{ ...St.chipTick, background: medal.accent }} />{c}
              </span>
            ))}
          </div>
        </>
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
      @keyframes auroGlow {
        0%,100% { box-shadow: 0 26px 64px rgba(0,0,0,0.6), 0 0 34px var(--glow), inset 0 0 0 1px var(--ring); }
        50%     { box-shadow: 0 26px 64px rgba(0,0,0,0.6), 0 0 66px var(--glow), inset 0 0 0 1px var(--ring); }
      }
      @keyframes auroInfoIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes auroSheen { 0% { transform: translateX(-140%) skewX(-18deg); } 55%,100% { transform: translateX(360%) skewX(-18deg); } }
      @keyframes auroCardSweep { 0% { transform: translateX(-160%) skewX(-16deg); opacity: 0; } 18% { opacity: .8; } 50%,100% { transform: translateX(320%) skewX(-16deg); opacity: 0; } }
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

  sectionHead: { display: "flex", alignItems: "center", gap: 12, margin: "8px 6px 0" },
  sectionRule: { flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" },
  sectionText: { fontSize: 10, letterSpacing: 3, color: C.dim, fontWeight: 800, fontFamily: "ui-monospace, Menlo, monospace" },

  // Podium atmosphere + carousel (native scroll-snap, dressed as coverflow)
  stageWrap: { position: "relative", width: "100%" },
  atmosphere: { position: "absolute", inset: "-12% -8% -4%", pointerEvents: "none", zIndex: 0,
    background:
      "radial-gradient(58% 50% at 50% 42%, rgba(245,200,66,0.07), transparent 70%)," +
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.016) 0 1px, transparent 1px 4px)," +
      "radial-gradient(120% 86% at 50% 50%, transparent 52%, rgba(0,0,0,0.55) 100%)" },
  scroller: { position: "relative", zIndex: 1, display: "flex", flexDirection: "row", flexWrap: "nowrap",
    alignItems: "center", justifyContent: "flex-start", height: 320, width: "100%",
    overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch", perspective: "1100px",
    // calc() lets the first/last card reach centre; ~94px = half the 188px snap step.
    padding: "0 calc(50% - 94px)",
    scrollbarWidth: "none", msOverflowStyle: "none" },
  snapItem: { flex: "0 0 188px", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", scrollSnapAlign: "center",
    margin: "0 -26px" }, // gentle overlap: side cards stay clearly visible behind the hero
  podCard: { position: "relative", width: 200, boxSizing: "border-box", overflow: "hidden",
    textAlign: "left", font: "inherit", color: C.text, cursor: "pointer",
    border: "1px solid", display: "flex", flexDirection: "column", gap: 7,
    transformOrigin: "center", backfaceVisibility: "hidden",
    transition: "transform .36s cubic-bezier(.2,.7,.2,1), box-shadow .3s ease, opacity .3s ease, border-color .3s ease, width .3s ease, min-height .3s ease, padding .3s ease" },
  // card overlays
  topEdge: { position: "absolute", top: 0, left: 9, right: 9, height: 1, zIndex: 2, pointerEvents: "none" },
  scanlines: { position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", borderRadius: "inherit",
    background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.028) 0 1px, transparent 1px 3px)", opacity: 0.45 },
  cardSweep: { position: "absolute", top: 0, bottom: 0, left: 0, width: "34%", zIndex: 2, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.16), transparent)",
    animation: "auroCardSweep 6.5s ease-in-out infinite" },
  // card content
  cardHead: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  serial: { fontSize: 9.5, fontWeight: 700, letterSpacing: 2, fontFamily: "ui-monospace, Menlo, monospace" },
  medalTag: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, fontWeight: 800,
    letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", borderRadius: 3, border: "1px solid" },
  tagDot: { width: 5, height: 5, borderRadius: "50%", flex: "0 0 auto" },
  cardDivider: { position: "relative", zIndex: 2, height: 1, margin: "3px 0 1px" },
  cardMetaRow: { position: "relative", zIndex: 2, display: "flex", alignItems: "baseline", gap: 7, marginTop: "auto", paddingTop: 4 },
  cardMetaLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, fontFamily: "ui-monospace, Menlo, monospace" },
  cardMetaVal: { fontSize: 12.5, fontWeight: 750 },
  podName: { position: "relative", zIndex: 2, fontWeight: 800, color: C.text, lineHeight: 1.2, letterSpacing: 0.2,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" },
  podSummary: { position: "relative", zIndex: 2, fontSize: 12.5, lineHeight: 1.45,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" },

  // Path Info (system readout)
  infoCard: { position: "relative", overflow: "hidden",
    background:
      "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.03), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.014))",
    border: `1px solid ${C.border}`, borderRadius: "4px 16px 16px 16px", padding: "15px 18px 16px 20px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 14px 30px rgba(0,0,0,0.35)" },
  infoAccentLine: { position: "absolute", top: 14, bottom: 14, left: 0, width: 3, borderRadius: 2, zIndex: 1 },
  infoHeadRow: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  infoKicker: { letterSpacing: 2.5, fontSize: 10, fontWeight: 800, fontFamily: "ui-monospace, Menlo, monospace" },
  infoKickerDim: { letterSpacing: 2, fontSize: 9.5, fontWeight: 700, color: C.dim, fontFamily: "ui-monospace, Menlo, monospace" },
  infoTitle: { position: "relative", zIndex: 2, fontSize: 22, fontWeight: 850, margin: "0 0 8px", lineHeight: 1.14,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  infoWhy: { position: "relative", zIndex: 2, fontSize: 14, color: C.text, opacity: 0.86, lineHeight: 1.5, margin: "0 0 14px" },
  metaGrid: { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  metaCell: { display: "flex", flexDirection: "column", gap: 3, padding: "7px 11px", minWidth: 60,
    borderRadius: 4, background: "rgba(255,255,255,0.035)", border: `1px solid ${C.border}` },
  metaKey: { fontSize: 8.5, fontWeight: 800, letterSpacing: 1.5, fontFamily: "ui-monospace, Menlo, monospace" },
  metaVal: { fontSize: 13, fontWeight: 750 },
  sysLabel: { position: "relative", zIndex: 2, fontSize: 9, fontWeight: 800, letterSpacing: 2,
    fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 8 },
  reasonRow: { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 6 },
  reasonChip: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 650,
    letterSpacing: 0.2, padding: "5px 9px", borderRadius: 4, border: "1px solid" },
  chipTick: { width: 4, height: 4, borderRadius: "50%", flex: "0 0 auto" },

  // CTA
  cta: { position: "relative", overflow: "hidden", width: "100%", padding: "15px 20px",
    borderRadius: "4px 12px 12px 12px", border: "none", fontWeight: 800, fontSize: 15.5, letterSpacing: 0.3,
    color: "#0a0b10", cursor: "pointer", marginTop: 2, transform: "scale(1)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 7px rgba(0,0,0,0.28), 0 10px 26px rgba(0,0,0,0.42)",
    transition: "transform .14s ease, filter .15s ease, box-shadow .2s ease" },
  ctaLabel: { position: "relative", zIndex: 1 },
  ctaSheen: { position: "absolute", top: 0, bottom: 0, left: 0, width: "38%", zIndex: 0, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.5), transparent)",
    animation: "auroSheen 5.5s ease-in-out infinite" },
  ctaSub: { fontSize: 12, color: C.dim, textAlign: "center" },
  debugBtn: { width: "100%", marginTop: 6, padding: "9px 12px", borderRadius: 10,
    border: `1px dashed ${C.border}`, background: "transparent", color: C.dim,
    fontSize: 12, letterSpacing: 0.5, cursor: "pointer", fontFamily: "ui-monospace, Menlo, monospace" },
};
