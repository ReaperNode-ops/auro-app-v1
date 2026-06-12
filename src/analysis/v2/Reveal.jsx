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
// Each medal is a soft brushed-metal collectible card: warm layered surfaces
// (gentle top sheen, soft brushed grain, warm depth) plus its own accent/text
// hues. `idx` is a quiet index numeral (not a HUD serial).
const MEDAL = [
  {
    label: "Top pick", idx: "01", accent: "#f5c842", accent2: "#ffe9a3", glow: "rgba(245,200,66,0.34)",
    cardSel:
      "radial-gradient(140% 70% at 50% -8%, rgba(255,236,188,0.20), transparent 60%)," +
      "radial-gradient(120% 120% at 50% 120%, rgba(10,7,2,0.5), transparent 60%)," +
      "linear-gradient(162deg, #5a4a22 0%, #3a2c13 46%, #221809 100%)",
    cardIdle:
      "radial-gradient(140% 70% at 50% -8%, rgba(255,236,188,0.12), transparent 60%)," +
      "radial-gradient(120% 120% at 50% 120%, rgba(8,6,2,0.58), transparent 58%)," +
      "linear-gradient(162deg, #463819 0%, #2c2010 50%, #18110699 100%)",
    title: "#ffe7a6", body: "rgba(255,243,216,0.85)",
  },
  {
    label: "2nd pick", idx: "02", accent: "#bcd0e6", accent2: "#eef4fb", glow: "rgba(188,208,230,0.32)",
    cardSel:
      "radial-gradient(140% 70% at 50% -8%, rgba(226,238,252,0.18), transparent 60%)," +
      "radial-gradient(120% 120% at 50% 120%, rgba(4,7,10,0.5), transparent 60%)," +
      "linear-gradient(162deg, #424b59 0%, #2a313b 46%, #181d24 100%)",
    cardIdle:
      "radial-gradient(140% 70% at 50% -8%, rgba(226,238,252,0.11), transparent 60%)," +
      "radial-gradient(120% 120% at 50% 120%, rgba(3,6,9,0.58), transparent 58%)," +
      "linear-gradient(162deg, #343c47 0%, #20262e 50%, #12161b99 100%)",
    title: "#eef4fb", body: "rgba(231,239,248,0.85)",
  },
  {
    label: "3rd pick", idx: "03", accent: "#d99a6c", accent2: "#f0c39a", glow: "rgba(217,154,108,0.32)",
    cardSel:
      "radial-gradient(140% 70% at 50% -8%, rgba(255,210,172,0.18), transparent 60%)," +
      "radial-gradient(120% 120% at 50% 120%, rgba(10,5,2,0.5), transparent 60%)," +
      "linear-gradient(162deg, #5c4330 0%, #3a281b 46%, #21140c 100%)",
    cardIdle:
      "radial-gradient(140% 70% at 50% -8%, rgba(255,210,172,0.11), transparent 60%)," +
      "radial-gradient(120% 120% at 50% 120%, rgba(8,4,2,0.58), transparent 58%)," +
      "linear-gradient(162deg, #483425 0%, #2c1e14 50%, #1a0f0899 100%)",
    title: "#f4cda8", body: "rgba(244,216,192,0.85)",
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
  const [settledIndex, setSettledIndex] = useState(0); // debounced — drives PathInfo re-entry only
  const [copied, setCopied] = useState(false); // debug-report copy feedback (temporary)
  const settleTimer = useRef(null);

  // cycle the lock labels, then settle into the reveal
  useEffect(() => {
    const labels = setInterval(() => setLockLabel((i) => Math.min(i + 1, 2)), 300);
    const done = setTimeout(() => setStage("revealed"), LOCK_MS);
    return () => { clearInterval(labels); clearTimeout(done); };
  }, []);

  // Debounce the Path Detail re-animation: its CONTENT follows selection live
  // (below), but the entrance animation only replays ~140ms after scrolling
  // settles, so it doesn't re-trigger on every card crossed mid-scroll.
  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettledIndex(selectedIndex), 140);
    return () => { if (settleTimer.current) clearTimeout(settleTimer.current); };
  }, [selectedIndex]);

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
        <div aria-hidden style={{ ...St.archTexture, background: `radial-gradient(80% 120% at 88% -10%, ${sty.accent}1f, transparent 58%), radial-gradient(60% 100% at 0% 110%, ${sty.accent}12, transparent 60%)` }} />
        <div style={St.archTopRow}>
          <div style={{ ...St.archMedallion, color: sty.accent, boxShadow: `inset 0 1px 0 ${sty.accent}55, inset 0 0 0 1px ${sty.accent}33, 0 6px 16px rgba(0,0,0,0.4)` }}>
            {sty.glyph}
          </div>
          <div style={St.archTopText}>
            <div style={{ ...St.archKicker, color: `${sty.accent}cc` }}>YOUR ARCHETYPE</div>
            <h1 style={{ ...St.archTitle, backgroundImage: `linear-gradient(116deg, ${sty.accent2}, ${sty.accent})` }}>
              {copy.title}
            </h1>
          </div>
        </div>
        <p style={St.identity}>{copy.identity}</p>
        <span aria-hidden style={{ ...St.archHair, background: `linear-gradient(90deg, ${sty.accent}40, transparent 80%)` }} />
        <p style={St.mirror}>{copy.mirror}</p>
        {chips.length > 0 && (
          <div style={St.chips}>
            {chips.map((c) => (
              <span key={c} style={{ ...St.chip, borderColor: `${sty.accent}3a`, color: sty.accent, background: `${sty.accent}12` }}>{c}</span>
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
      {selectedPath && <PathInfo key={Math.min(settledIndex, Math.max(0, top3.length - 1))} path={selectedPath} medal={MEDAL[safeIndex]} />}

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
      setTimeout(() => { programmatic.current = false; }, 320);
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

// Soft embossed rank medallion — the quiet identity mark of a collectible card.
function Medallion({ medal }) {
  return (
    <span
      style={{
        ...St.medallion,
        color: medal.accent,
        background: `radial-gradient(120% 120% at 30% 20%, ${medal.accent}2e, rgba(0,0,0,0.28))`,
        boxShadow: `inset 0 1px 0 ${medal.accent}66, inset 0 0 0 1px ${medal.accent}33, 0 3px 8px rgba(0,0,0,0.4)`,
      }}
    >
      {medal.idx}
    </span>
  );
}

function PodiumCard({ path, medal, rank, selected, offset, onSelect }) {
  // SMOOTHNESS: every card keeps an IDENTICAL layout box (width / min-height /
  // padding / radius / border are constant). The hero vs side difference is
  // expressed only through GPU-friendly transform / opacity / shadow / colour,
  // so nothing reflows the scroll track while scrolling. The box is sized for
  // the hero's content at all times, so showing the summary causes no shift.
  const ax = Math.min(Math.abs(offset), 2);   // distance from selected (0,1,2)
  const dir = offset < 0 ? 1 : -1;            // left cards shift right; right cards shift left
  const scale = selected ? 1.05 : ax === 1 ? 0.84 : 0.8; // hierarchy via scale, not width
  const tx = selected ? 0 : dir * (ax === 1 ? 14 : 28);
  const ty = selected ? 0 : 16 + ax * 8;
  const ry = selected ? 0 : dir * (ax === 1 ? 16 : 22);
  const op = selected ? 1 : ax === 1 ? 0.97 : 0.93;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        ...St.podCard,
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale}) rotateY(${ry}deg)`,
        opacity: op,
        borderColor: selected ? `${medal.accent}88` : `${medal.accent}44`,
        background: selected ? medal.cardSel : medal.cardIdle,
        boxShadow: selected
          ? `0 30px 70px rgba(0,0,0,0.55), 0 0 50px ${medal.glow}, inset 0 1px 0 ${medal.accent}55, inset 0 -30px 50px rgba(0,0,0,0.42)`
          : `0 18px 34px rgba(0,0,0,0.5), inset 0 1px 0 ${medal.accent}2a, inset 0 -20px 36px rgba(0,0,0,0.45)`,
        ...(selected
          ? { "--glow": medal.glow, "--ring": `${medal.accent}55`, animation: "auroGlow 4.2s ease-in-out infinite" }
          : null),
      }}
    >
      {/* one soft top sheen + (hero only) a slow light pass — no scanlines/brackets */}
      <span aria-hidden style={St.cardGloss} />
      {selected && <span aria-hidden style={St.cardSweep} />}

      <div style={St.cardHead}>
        <Medallion medal={medal} />
        <span style={{ ...St.medalLabel, color: `${medal.accent}d8` }}>{medal.label}</span>
      </div>

      <div style={{ ...St.podName, color: medal.title }}>{path.title}</div>

      {/* content is conditional but the box height is fixed, so no track shift */}
      {selected && path.summary && (
        <div style={{ ...St.podSummary, color: medal.body }}>{path.summary}</div>
      )}
      {selected && path.earnings && (
        <div style={St.cardMetaRow}>
          <span style={{ ...St.cardMetaLabel, color: `${medal.accent}b0` }}>Est. earnings</span>
          <span style={{ ...St.cardMetaVal, color: medal.title }}>{path.earnings}</span>
        </div>
      )}
    </button>
  );
}

// ── Path Info → personalized route briefing ─────────────────────────────────
function PathInfo({ path, medal }) {
  const meta = [
    path.earnings && { k: "Est. earnings", v: path.earnings, accent: true },
    path.timeToFirst && { k: "First payday", v: path.timeToFirst },
    path.difficulty && { k: "Level", v: path.difficulty },
    tierLabel(path.tier) && { k: "Track", v: tierLabel(path.tier) },
  ].filter(Boolean);
  const chips = reasonChips(path);

  return (
    <div style={{ ...St.infoCard, animation: "auroInfoIn .42s cubic-bezier(.2,.7,.2,1) both" }}>
      <span aria-hidden style={{ ...St.infoTopGlow, background: `radial-gradient(90% 100% at 0% 0%, ${medal.accent}16, transparent 62%)` }} />

      <div style={St.infoHeadRow}>
        <span style={{ ...St.infoDot, background: medal.accent, boxShadow: `0 0 10px ${medal.glow}` }} />
        <span style={{ ...St.infoKicker, color: `${medal.accent}cc` }}>Your route</span>
      </div>

      <h2 style={{ ...St.infoTitle, backgroundImage: `linear-gradient(118deg, ${medal.accent2}, ${medal.accent})` }}>
        {path.title}
      </h2>
      <p style={St.infoWhy}>{whyCopy(path)}</p>

      <div style={St.metaRow}>
        {meta.map((m, i) => (
          <div key={i} style={{ ...St.metaItem, borderLeft: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <span style={St.metaKey}>{m.k}</span>
            <span style={{ ...St.metaVal, color: m.accent ? medal.title : C.text }}>{m.v}</span>
          </div>
        ))}
      </div>

      {chips.length > 0 && (
        <div style={St.reasonWrap}>
          <div style={St.sysLabel}>Why this fits you</div>
          <div style={St.reasonRow}>
            {chips.map((c) => (
              <span key={c} style={{ ...St.reasonChip, color: medal.title, background: `${medal.accent}16`, boxShadow: `inset 0 0 0 1px ${medal.accent}33` }}>
                {c}
              </span>
            ))}
          </div>
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
      @keyframes auroGlow {
        0%,100% { box-shadow: 0 26px 64px rgba(0,0,0,0.6), 0 0 34px var(--glow), inset 0 0 0 1px var(--ring); }
        50%     { box-shadow: 0 26px 64px rgba(0,0,0,0.6), 0 0 66px var(--glow), inset 0 0 0 1px var(--ring); }
      }
      @keyframes auroInfoIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes auroSheen { 0% { transform: translateX(-140%) skewX(-18deg); } 55%,100% { transform: translateX(360%) skewX(-18deg); } }
      @keyframes auroCardSweep { 0% { transform: translateX(-170%) skewX(-14deg); opacity: 0; } 22% { opacity: .5; } 50%,100% { transform: translateX(320%) skewX(-14deg); opacity: 0; } }
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

  // Archetype card → soft identity plate (editorial, asymmetric)
  archCard: { position: "relative", overflow: "hidden",
    background:
      "radial-gradient(130% 80% at 50% -10%, rgba(255,255,255,0.05), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))",
    border: `1px solid ${C.border}`, borderRadius: "26px 26px 22px 20px", padding: "24px 24px 22px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 48px rgba(0,0,0,0.42)" },
  archTexture: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" },
  archTopRow: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 14, marginBottom: 14 },
  archMedallion: { flex: "0 0 auto", width: 48, height: 48, borderRadius: 16, display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 24, lineHeight: 1,
    background: "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))" },
  archTopText: { minWidth: 0 },
  archKicker: { fontSize: 10.5, fontWeight: 800, letterSpacing: 2.5, marginBottom: 4 },
  archTitle: { fontSize: 30, fontWeight: 900, margin: 0, lineHeight: 1.08, letterSpacing: -0.4,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  identity: { position: "relative", zIndex: 2, fontSize: 16, fontWeight: 600, color: C.text, margin: "0 0 14px", lineHeight: 1.4 },
  archHair: { position: "relative", zIndex: 2, display: "block", height: 1, width: "100%", margin: "0 0 13px" },
  mirror: { position: "relative", zIndex: 2, fontSize: 14.5, color: "rgba(245,246,250,0.76)", lineHeight: 1.58, margin: 0 },
  chips: { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 },
  chip: { fontSize: 11.5, fontWeight: 650, letterSpacing: 0.2, padding: "5px 11px", borderRadius: 999, border: "1px solid" },

  sectionHead: { display: "flex", alignItems: "center", gap: 12, margin: "10px 8px 2px" },
  sectionRule: { flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" },
  sectionText: { fontSize: 11, letterSpacing: 2, color: "rgba(245,246,250,0.62)", fontWeight: 700 },

  // Podium atmosphere + carousel (native scroll-snap, soft coverflow)
  stageWrap: { position: "relative", width: "100%" },
  atmosphere: { position: "absolute", inset: "-16% -12% -8%", pointerEvents: "none", zIndex: 0,
    background:
      "radial-gradient(58% 60% at 50% 40%, rgba(245,200,66,0.13), transparent 70%)," +
      "radial-gradient(70% 50% at 50% 6%, rgba(120,150,210,0.06), transparent 62%)," +
      "radial-gradient(120% 90% at 50% 54%, transparent 58%, rgba(0,0,0,0.34) 100%)" },
  scroller: { position: "relative", zIndex: 1, display: "flex", flexDirection: "row", flexWrap: "nowrap",
    alignItems: "center", justifyContent: "flex-start", height: 330, width: "100%",
    overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch", perspective: "1200px",
    padding: "0 calc(50% - 94px)",
    scrollbarWidth: "none", msOverflowStyle: "none" },
  snapItem: { flex: "0 0 188px", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", scrollSnapAlign: "center", margin: "0 -18px" },
  podCard: { position: "relative", width: 230, minHeight: 224, boxSizing: "border-box", overflow: "hidden",
    padding: "18px 20px 20px", borderRadius: "22px 22px 20px 18px", border: "1px solid",
    textAlign: "left", font: "inherit", color: C.text, cursor: "pointer",
    display: "flex", flexDirection: "column", gap: 10,
    transformOrigin: "center", backfaceVisibility: "hidden", willChange: "transform",
    // only GPU-friendly props transition — NEVER width/height/padding (layout)
    transition: "transform .42s cubic-bezier(.22,.68,.2,1), box-shadow .35s ease, opacity .35s ease, border-color .35s ease" },
  // soft overlays (one gloss + a gentle sweep on the hero)
  cardGloss: { position: "absolute", top: 0, left: 0, right: 0, height: "52%", zIndex: 1, pointerEvents: "none",
    borderRadius: "inherit",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))" },
  cardSweep: { position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", zIndex: 2, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.12), transparent)",
    animation: "auroCardSweep 7s ease-in-out infinite" },
  // card content
  cardHead: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 9 },
  medallion: { flex: "0 0 auto", width: 28, height: 28, display: "inline-flex", alignItems: "center",
    justifyContent: "center", borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 0.3 },
  medalLabel: { fontSize: 11.5, fontWeight: 750, letterSpacing: 0.2 },
  cardMetaRow: { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 1, marginTop: "auto", paddingTop: 6 },
  cardMetaLabel: { fontSize: 10.5, fontWeight: 600, letterSpacing: 0.2 },
  cardMetaVal: { fontSize: 15, fontWeight: 800, letterSpacing: -0.2 },
  podName: { position: "relative", zIndex: 2, fontSize: 16.5, fontWeight: 800, color: C.text, lineHeight: 1.24, letterSpacing: -0.2,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" },
  podSummary: { position: "relative", zIndex: 2, fontSize: 13, lineHeight: 1.46,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" },

  // Path Info → personalized route briefing
  infoCard: { position: "relative", overflow: "hidden",
    background:
      "radial-gradient(130% 70% at 0% 0%, rgba(255,255,255,0.045), transparent 56%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012))",
    border: `1px solid ${C.border}`, borderRadius: "22px 22px 22px 26px", padding: "18px 20px 18px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 38px rgba(0,0,0,0.36)" },
  infoTopGlow: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" },
  infoHeadRow: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 8, marginBottom: 9 },
  infoDot: { width: 7, height: 7, borderRadius: 999, flex: "0 0 auto" },
  infoKicker: { fontSize: 11.5, fontWeight: 750, letterSpacing: 0.4 },
  infoTitle: { position: "relative", zIndex: 2, fontSize: 23, fontWeight: 850, margin: "0 0 9px", lineHeight: 1.12, letterSpacing: -0.4,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  infoWhy: { position: "relative", zIndex: 2, fontSize: 14.5, color: C.text, opacity: 0.88, lineHeight: 1.52, margin: "0 0 16px" },
  metaRow: { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 16 },
  metaItem: { display: "flex", flexDirection: "column", gap: 3, padding: "2px 14px 2px 14px", minWidth: 70 },
  metaKey: { fontSize: 11, fontWeight: 600, color: C.dim, letterSpacing: 0.2 },
  metaVal: { fontSize: 15, fontWeight: 800, letterSpacing: -0.2 },
  sysLabel: { position: "relative", zIndex: 2, fontSize: 11.5, fontWeight: 700, color: "rgba(245,246,250,0.6)",
    letterSpacing: 0.3, marginBottom: 9 },
  reasonWrap: { position: "relative", zIndex: 2 },
  reasonRow: { display: "flex", flexWrap: "wrap", gap: 7 },
  reasonChip: { display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 600,
    letterSpacing: 0.1, padding: "6px 12px", borderRadius: 999 },

  // CTA → soft premium key
  cta: { position: "relative", overflow: "hidden", width: "100%", padding: "16px 22px",
    borderRadius: "18px 18px 18px 14px", border: "none", fontWeight: 800, fontSize: 16, letterSpacing: 0.2,
    color: "#120d04", cursor: "pointer", marginTop: 4, transform: "scale(1)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 9px rgba(0,0,0,0.22), 0 14px 34px rgba(0,0,0,0.4)",
    transition: "transform .16s ease, filter .18s ease, box-shadow .22s ease" },
  ctaLabel: { position: "relative", zIndex: 1 },
  ctaSheen: { position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", zIndex: 0, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.42), transparent)",
    animation: "auroSheen 6s ease-in-out infinite" },
  ctaSub: { fontSize: 12.5, color: "rgba(245,246,250,0.6)", textAlign: "center" },
  debugBtn: { width: "100%", marginTop: 6, padding: "9px 12px", borderRadius: 10,
    border: `1px dashed ${C.border}`, background: "transparent", color: C.dim,
    fontSize: 12, letterSpacing: 0.5, cursor: "pointer", fontFamily: "ui-monospace, Menlo, monospace" },
};
