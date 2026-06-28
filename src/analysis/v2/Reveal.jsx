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
// Per-path rationale. Specific copy for common starter paths first, then varied
// metadata-driven templates so each path reads differently. 1-2 sentences,
// direct and practical — no raw reason codes, no wellness/corporate tone.
const WHY_BY_ID = {
  "online-tutor": "This turns what you already know into paid help. It's people-facing, easy to explain, and you can start with one subject and one student.",
  "tutoring-younger": "A strong starter if you're comfortable helping people directly. You can begin with younger students, simple subjects, and local or online sessions.",
  "homework-helper": "This fits if you're better at keeping people on track than performing for an audience. It's practical, structured, and easier to start than building a brand.",
  "study-coach": "This fits if you're better at keeping people on track than performing for an audience. It's practical, structured, and easier to start than building a brand.",
  "car-washing": "This is a fast local cash path. The offer is simple, people understand it instantly, and you can start with neighbors before building a bigger route.",
  "lawn-care": "Straightforward local money. People always need it, the pitch is obvious, and you can start on your own street.",
  "snow-removal": "Seasonal local cash that's easy to sell. When it snows the demand is instant and the offer explains itself.",
  "babysitting": "A trusted, people-facing starter. It pays from day one and runs on reliability more than any special skill.",
  "pet-sitting": "An easy, trust-based starter. The work is simple, repeat clients come fast, and you can begin right in your area.",
  "house-cleaning": "A dependable local cash path. The offer is clear, repeat clients add up fast, and you can start solo.",
  "errand-runner": "Simple, practical, and fast to start. People pay for time, so the pitch is easy and you can begin locally today.",
  "sneaker-flipping": "This fits if you like spotting demand and moving quickly. The edge comes from research, timing, and buying smart, not from needing a huge audience.",
  "reseller": "This rewards a sharp eye and quick moves. You earn on the spread, so it's about sourcing smart rather than building a following.",
  "furniture-flipping": "This fits if you like hands-on work and a good deal. The margin comes from finding undervalued pieces and making them look worth more.",
  "phone-flipping": "This works if you like fixing and reselling. The margin comes from buying low and knowing what's actually worth flipping.",
  "content-clipper": "This fits if you can spot the best moments in long videos. It's behind-the-scenes editing you can start with a single creator.",
  "short-form-editor": "Editing is in demand and you never need to be on camera. Start by cutting clips for one creator and grow from there.",
  "video-editor": "Skilled, behind-the-scenes work that pays well. A few strong sample edits get you hired faster than any resume.",
  "thumbnail-designer": "Creators always need thumbnails that get clicks. It's quick to start, sample-driven, and you never show your face.",
  "canva-designer": "Simple design work businesses actually pay for. You can start with a few templates and a couple of sample pieces.",
  "logo-social-designer": "Small brands need clean visuals constantly. Build a tiny portfolio and you can start taking paid requests quickly.",
  "caption-writer": "If you're good with words, creators will pay you to write hooks and captions. Low setup, and fast to prove.",
  "social-media-helper": "Businesses want someone to run their posts. It's practical, behind-the-scenes, and you can start with one local client.",
  "community-moderator": "This fits if you're reliable and good with people online. It's steady, low-pressure, and you can start with one server or community.",
  "data-entry": "A low-friction remote starter. It's not glamorous, but it's steady, easy to begin, and pays while you build other skills.",
  "virtual-assistant": "This fits if you're organized and reliable. You handle the busywork others don't want, and you can start with one client.",
  "customer-support": "Steady remote work that rewards being calm and clear. It's easy to start and a solid base while you build other skills.",
  "resume-helper": "If you can make people sound their best on paper, this is quick to start and easy to explain.",
  "spreadsheet-service": "If you're good with numbers and structure, small businesses will pay for clean spreadsheets. Practical, remote, and quick to prove.",
  "cold-email-setter": "This fits if you don't mind reaching out. The money comes from booking meetings, so it's about consistency more than credentials.",
  "local-lead-gen": "This rewards hustle over a big audience. You connect local businesses with customers and get paid for the results you bring.",
  "game-coaching": "If you're genuinely good at a game, people will pay to improve. Start one on one and let word of mouth grow it.",
  "seo-blog": "This is a longer build. It fits if you want an asset that compounds over time, but it'll need patience before the money feels real.",
  "digital-products": "Make it once, sell it many times. It takes upfront work, but each sale after that is mostly profit.",
  "etsy-digital": "Make it once, sell it many times. There's upfront work, but every sale after that is mostly profit.",
  "affiliate-shortform": "This rewards consistent posting. Early money is small, but it can compound if you keep showing up.",
};

function whyCopy(path) {
  if (path && WHY_BY_ID[path.id]) return WHY_BY_ID[path.id];

  // Varied metadata fallbacks — ordered by the most defining trait.
  if (path.requiresLocalAccess && path.quickCash)
    return "This is a fast local cash path. The offer is simple, people understand it right away, and you can start close to home.";
  if (path.quickCash)
    return "This is a quick-cash option you can act on now without much setup or experience.";
  if (path.requiresCamera || path.requiresAudience)
    return "This rewards showing up consistently. The audience builds slowly at first, then the work starts paying off.";
  if (path.requiresSelling === "high")
    return "This fits if you're comfortable reaching out to people. The money comes from outreach and follow-up, not from a fancy background.";
  if (path.requiresPortfolio)
    return "This is skill work where a few good samples open the door. You build proof as you go and start taking paid work early.";
  if (path.readiness === "build-over-time" || path.tier === "long-term")
    return "This is a longer build. It fits if you want something that compounds over time, but expect patience before the money feels real.";
  if (path.requiresExperience === "strong")
    return "This leans on real skill, so it pays more but expects you to know your craft going in.";
  if (path.studentFriendly)
    return "A practical starter that works around a student schedule. It's easy to explain and quick to begin.";
  if (path.readiness === "start-now")
    return "A practical starter you can begin right now and learn by doing, with no audience or big budget required.";
  return "This is a solid, practical match for where you are now. It's straightforward to start and easy to explain to a first client.";
}

// ── display-only "fit" reading derived from the existing score (NOT scoring) ─
// Purely presentational: maps a path score (relative to the top route) into a
// compatibility %% for the meters. Never feeds back into ranking.
function fitPercent(path, topScore, rank) {
  const s = path && typeof path.score === "number" ? path.score : null;
  if (s !== null && topScore > 0) {
    return Math.max(62, Math.min(99, Math.round(70 + 29 * (s / topScore))));
  }
  return [96, 90, 84][rank] != null ? [96, 90, 84][rank] : 80;
}

// ── small cockpit primitives ────────────────────────────────────────────────
function CornerTicks({ color }) {
  const c = (color || C.border) + "55";
  const base = { position: "absolute", width: 10, height: 10, pointerEvents: "none", zIndex: 3 };
  return (
    <>
      <span aria-hidden style={{ ...base, top: 7, left: 7, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span aria-hidden style={{ ...base, top: 7, right: 7, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
      <span aria-hidden style={{ ...base, bottom: 7, left: 7, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span aria-hidden style={{ ...base, bottom: 7, right: 7, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
    </>
  );
}

function CockpitHeader({ label, accent, right }) {
  return (
    <div style={St.cockHead}>
      <span style={{ ...St.cockDot, background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span style={{ ...St.cockLabel, color: `${accent}dd` }}>{label}</span>
      <span style={St.cockRule} />
      {right ? <span style={St.cockRight}>{right}</span> : null}
    </div>
  );
}

// A centred-axis gauge: a dot sits along a track between two poles (from a
// derived spectrum position in [-1, 1]). Reads like a cockpit signal meter.
function SignalGauge({ a, b, pos, accent }) {
  const pct = Math.max(4, Math.min(96, ((pos + 1) / 2) * 100));
  return (
    <div style={St.gauge}>
      <div style={St.gaugeEnds}><span>{a}</span><span>{b}</span></div>
      <div style={St.gaugeTrack}>
        <span aria-hidden style={St.gaugeAxis} />
        <span aria-hidden style={{ ...St.gaugeDot, left: `${pct}%`, background: accent, boxShadow: `0 0 9px ${accent}` }} />
      </div>
    </div>
  );
}

function FitMeter({ pct, accent, label }) {
  return (
    <div style={St.fitWrap}>
      <div style={St.fitTop}>
        <span style={St.fitLabel}>{label}</span>
        <span style={{ ...St.fitVal, color: accent }}>{pct}%</span>
      </div>
      <div style={St.fitTrack}>
        <span style={{ ...St.fitFill, width: `${pct}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})`, boxShadow: `0 0 12px ${accent}66` }} />
      </div>
    </div>
  );
}

function Capsule({ label, value, accent }) {
  return (
    <div style={St.capsule}>
      <span aria-hidden style={{ ...St.capTick, background: accent }} />
      <div style={{ minWidth: 0 }}>
        <div style={St.capLabel}>{label}</div>
        <div style={St.capVal}>{value}</div>
      </div>
    </div>
  );
}

export default function Reveal({ derived, archetype, legacyAnswers, onContinue, history }) {
  const [stage, setStage] = useState("lock"); // 'lock' → 'revealed'
  const [lockLabel, setLockLabel] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0); // default = top pick
  const [settledIndex, setSettledIndex] = useState(0); // debounced — drives briefing re-entry only
  const [copied, setCopied] = useState(false); // debug-report copy feedback (temporary)
  const settleTimer = useRef(null);

  // cycle the lock labels, then settle into the reveal
  useEffect(() => {
    const labels = setInterval(() => setLockLabel((i) => Math.min(i + 1, 2)), 300);
    const done = setTimeout(() => setStage("revealed"), LOCK_MS);
    return () => { clearInterval(labels); clearTimeout(done); };
  }, []);

  // Debounce the briefing re-animation (content still follows selection live).
  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettledIndex(selectedIndex), 140);
    return () => { if (settleTimer.current) clearTimeout(settleTimer.current); };
  }, [selectedIndex]);

  const key = archetype && archetype.key ? archetype.key : "specialist";
  const copy = ARCHETYPES[key] || ARCHETYPES.specialist;
  const sty = styleFor(key);

  // V2-native ranking → top 3. (Unchanged: scoring + data flow are untouched.)
  const ranked = scoreV2Paths({ derived, archetype });
  const top3 = ranked.slice(0, 3);
  const chips = profileChips(derived);
  const topScore = top3[0] && typeof top3[0].score === "number" ? top3[0].score : 0;

  const safeIndex = Math.min(selectedIndex, Math.max(0, top3.length - 1));
  const selectedPath = top3[safeIndex] || null;
  const selFit = selectedPath ? fitPercent(selectedPath, topScore, safeIndex) : 0;

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

  // ── Lock / calibration beat → a system scan ───────────────────────────────
  if (stage === "lock") {
    const labels = ["Reading your signal", "Locking your profile", "Calibration complete"];
    return (
      <div style={St.scanWrap}>
        <Keyframes />
        <div style={St.scanPanel}>
          <CornerTicks color={sty.accent} />
          <CockpitHeader label="SYSTEM SCAN" accent={sty.accent} right="AURO OS" />
          <div style={St.scanRingWrap}>
            <RingPulse accent={sty.accent} />
          </div>
          <div style={St.scanStatus}>
            {labels.map((t, i) => (
              <div key={t} style={{ ...St.scanLine, opacity: i <= lockLabel ? 1 : 0.32 }}>
                <span style={{ ...St.scanLineDot, background: i <= lockLabel ? sty.accent : C.dim, boxShadow: i <= lockLabel ? `0 0 8px ${sty.accent}` : "none" }} />
                <span style={St.scanLineText}>{t}</span>
                <span style={{ ...St.scanLineTick, color: sty.accent, opacity: i < lockLabel ? 1 : 0 }}>{"\u2713"}</span>
              </div>
            ))}
          </div>
          <div style={St.scanBarTrack}><span style={{ ...St.scanBarFill, background: `linear-gradient(90deg, ${sty.accent}66, ${sty.accent})` }} /></div>
        </div>
      </div>
    );
  }

  // ── revealed: the Path Command Center ──────────────────────────────────────
  const gauges = [
    derived && derived.ownership && { a: "Specialist", b: "Builder", pos: derived.ownership.position },
    derived && derived.people && { a: "Solo", b: "People", pos: derived.people.position },
    derived && derived.riskReward && { a: "Steady", b: "Upside", pos: derived.riskReward.position },
    derived && derived.incomeModel && { a: "Active", b: "Asset", pos: derived.incomeModel.position },
  ].filter(Boolean);

  return (
    <div style={St.wrap}>
      <Keyframes />

      {/* top system bar */}
      <div style={St.sysBar}>
        <span style={{ ...St.sysBarDot, background: sty.accent, boxShadow: `0 0 8px ${sty.accent}` }} />
        <span style={St.sysBarText}>AURO {"\u2022"} PATH COMMAND</span>
        <span style={St.sysBarRule} />
        <span style={St.sysBarMeta}>{top3.length} ROUTES</span>
      </div>

      {/* 2: Profile Signal module */}
      <section style={{ ...St.panel, animation: "auroUp .5s ease both" }}>
        <span aria-hidden style={St.panelGrid} />
        <span aria-hidden style={{ ...St.panelGlow, background: `radial-gradient(80% 120% at 88% -10%, ${sty.accent}22, transparent 58%)` }} />
        <CornerTicks color={sty.accent} />
        <CockpitHeader label="PROFILE SIGNAL" accent={sty.accent} right="LOCKED" />
        <div style={St.profTop}>
          <div style={{ ...St.glyphCell, color: sty.accent, boxShadow: `inset 0 0 0 1px ${sty.accent}40, 0 6px 18px rgba(0,0,0,0.45)` }}>
            <span aria-hidden style={{ ...St.glyphRing, borderColor: `${sty.accent}55` }} />
            {sty.glyph}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...St.eyebrow, color: `${sty.accent}cc` }}>ARCHETYPE {"\u2014"} {readinessLabel(derived && derived.gates && derived.gates.readiness) || "SIGNATURE"}</div>
            <h1 style={{ ...St.archTitle, backgroundImage: `linear-gradient(116deg, ${sty.accent2}, ${sty.accent})` }}>{copy.title}</h1>
          </div>
        </div>
        <p style={St.identity}>{copy.identity}</p>
        <span aria-hidden style={St.hair} />
        <p style={St.mirror}>{copy.mirror}</p>
        {gauges.length > 0 && (
          <div style={St.gaugeWrap}>
            {gauges.map((g) => <SignalGauge key={g.a} a={g.a} b={g.b} pos={g.pos} accent={sty.accent} />)}
          </div>
        )}
        {chips.length > 0 && (
          <div style={St.tagRow}>
            {chips.map((c) => (
              <span key={c} style={{ ...St.sigTag, color: sty.accent, borderColor: `${sty.accent}3a`, background: `${sty.accent}12` }}>
                <span aria-hidden style={{ ...St.sigTagDot, background: sty.accent }} />{c}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 3: Route select */}
      <CockpitHeader label="RECOMMENDED ROUTES" accent={sty.accent} right="SELECT" />
      <Podium top3={top3} selectedIndex={safeIndex} onSelect={setSelectedIndex} topScore={topScore} />

      {/* 4: Route Briefing — keyed so it lightly re-animates when selection settles */}
      {selectedPath && (
        <RouteBriefing
          key={Math.min(settledIndex, Math.max(0, top3.length - 1))}
          path={selectedPath}
          medal={MEDAL[safeIndex]}
          fit={selFit}
        />
      )}

      {/* 5: CTA — lock in the route */}
      {selectedPath && (
        <div style={St.ctaWrap}>
          <div style={{ ...St.ctaEyebrow, color: `${MEDAL[safeIndex].accent}cc` }}>{"\u25E2"} LOCK IN ROUTE {"\u2022"} {selFit}% MATCH</div>
          <button
            style={{ ...St.cta, backgroundImage: `linear-gradient(135deg, ${MEDAL[safeIndex].accent2}, ${MEDAL[safeIndex].accent})` }}
            onClick={() => onContinue(selectedPath)}
            onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.985)"; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <span aria-hidden style={St.ctaSheen} />
            <span style={St.ctaLabel}>Begin {selectedPath.title} Path</span>
          </button>
          <div style={St.ctaSub}>You can explore the other routes anytime.</div>
        </div>
      )}

      {/* 6: TEMPORARY developer diagnostic — remove with debugReport.js when done. */}
      <button type="button" style={St.debugBtn} onClick={handleCopyDebug}>
        {copied ? "Copied \u2713" : "Copy debug report"}
      </button>
    </div>
  );
}

// ── Podium: native scroll-snap carousel (mechanics unchanged) ───────────────
function Podium({ top3, selectedIndex, onSelect, topScore }) {
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

  function onScroll() {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      if (programmatic.current) return;
      const sc = scrollerRef.current;
      if (!sc) return;
      const center = sc.scrollLeft + sc.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.abs(cardCenter - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== selectedIndex) onSelect(best);
    });
  }

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
          const zi = i === selectedIndex ? 30 : 10 - ax;
          return (
            <div key={path.id} ref={(el) => { cardRefs.current[i] = el; }} style={{ ...St.snapItem, zIndex: zi }}>
              <RouteModule
                path={path}
                medal={MEDAL[i]}
                rank={i}
                selected={i === selectedIndex}
                offset={i - selectedIndex}
                fit={fitPercent(path, topScore, i)}
                onSelect={() => selectCard(i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Route module: cockpit card (same transform mechanics, fixed box) ────────
function RouteModule({ path, medal, rank, selected, offset, fit, onSelect }) {
  const ax = Math.min(Math.abs(offset), 2);
  const dir = offset < 0 ? 1 : -1;
  const scale = selected ? 1.05 : ax === 1 ? 0.86 : 0.82;
  const tx = selected ? 0 : dir * (ax === 1 ? 8 : 18);
  const ty = selected ? 0 : 14 + ax * 7;
  const ry = selected ? 0 : dir * (ax === 1 ? 14 : 20);
  const op = selected ? 1 : ax === 1 ? 0.97 : 0.93;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        ...St.routeCard,
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale}) rotateY(${ry}deg)`,
        opacity: op,
        borderColor: selected ? `${medal.accent}88` : `${medal.accent}3a`,
        background: selected ? medal.cardSel : medal.cardIdle,
        boxShadow: selected
          ? `0 22px 52px rgba(0,0,0,0.5), 0 0 44px ${medal.glow}, inset 0 1px 0 ${medal.accent}55, inset 0 -28px 46px rgba(0,0,0,0.4)`
          : `0 14px 28px rgba(0,0,0,0.48), inset 0 1px 0 ${medal.accent}2a, inset 0 -18px 32px rgba(0,0,0,0.42)`,
        ...(selected ? { "--glow": medal.glow, "--ring": `${medal.accent}55`, animation: "auroGlow 4.2s ease-in-out infinite" } : null),
      }}
    >
      <span aria-hidden style={St.routeScan} />
      <span aria-hidden style={{ ...St.routeRail, background: `linear-gradient(180deg, ${medal.accent}, ${medal.accent}00)` }} />
      {selected && <span aria-hidden style={St.cardSweep} />}
      <CornerTicks color={medal.accent} />

      <div style={St.routeHead}>
        <span style={{ ...St.rankMark, color: medal.accent }}>{"\u25E2"} {medal.idx}</span>
        <span style={{ ...St.routeKind, color: `${medal.accent}d8`, borderColor: `${medal.accent}40` }}>
          {selected ? "PRIMARY ROUTE" : "ALT ROUTE"}
        </span>
      </div>

      <div style={{ ...St.routeName, color: medal.title }}>{path.title}</div>

      <FitMeter pct={fit} accent={medal.accent} label="MATCH" />

      <div style={St.routeCaps}>
        {path.earnings ? <Capsule label="EST" value={path.earnings} accent={medal.accent} /> : null}
        {path.timeToFirst ? <Capsule label="PAYDAY" value={path.timeToFirst} accent={medal.accent} /> : null}
      </div>
    </button>
  );
}

// ── Route Briefing (was PathInfo) ───────────────────────────────────────────
function RouteBriefing({ path, medal, fit }) {
  const caps = [
    path.timeToFirst && { k: "FIRST PAYDAY", v: path.timeToFirst },
    path.difficulty && { k: "DIFFICULTY", v: path.difficulty },
    path.earnings && { k: "EST. EARNINGS", v: path.earnings, accent: true },
    tierLabel(path.tier) && { k: "TRACK", v: tierLabel(path.tier) },
  ].filter(Boolean);
  const chips = reasonChips(path);
  return (
    <section style={{ ...St.panel, animation: "auroInfoIn .42s cubic-bezier(.2,.7,.2,1) both" }}>
      <span aria-hidden style={St.panelGrid} />
      <span aria-hidden style={{ ...St.panelGlow, background: `radial-gradient(90% 110% at 0% 0%, ${medal.accent}1c, transparent 60%)` }} />
      <CornerTicks color={medal.accent} />
      <CockpitHeader label="ROUTE BRIEFING" accent={medal.accent} right={`MATCH ${fit}%`} />
      <h2 style={{ ...St.briefTitle, backgroundImage: `linear-gradient(118deg, ${medal.accent2}, ${medal.accent})` }}>{path.title}</h2>
      <p style={St.briefWhy}>{whyCopy(path)}</p>
      <FitMeter pct={fit} accent={medal.accent} label="COMPATIBILITY" />
      <div style={St.capGrid}>
        {caps.map((c, i) => (
          <div key={i} style={St.capCell}>
            <span aria-hidden style={{ ...St.capTick, background: c.accent ? medal.accent : `${medal.accent}88` }} />
            <div style={{ minWidth: 0 }}>
              <div style={St.capLabel}>{c.k}</div>
              <div style={{ ...St.capVal, color: c.accent ? medal.title : C.text }}>{c.v}</div>
            </div>
          </div>
        ))}
      </div>
      {chips.length > 0 && (
        <div style={St.briefReasons}>
          <div style={St.miniLabel}>WHY THIS FITS</div>
          <div style={St.tagRow}>
            {chips.map((c) => (
              <span key={c} style={{ ...St.sigTag, color: medal.title, borderColor: `${medal.accent}3a`, background: `${medal.accent}16` }}>
                <span aria-hidden style={{ ...St.sigTagDot, background: medal.accent }} />{c}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
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
      @keyframes auroScanBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(220%); } }
      .auroScroller::-webkit-scrollbar { display: none; height: 0; }
    `}</style>
  );
}

// ── Styles (Auro "command center" idiom) ─────────────────────────────────────
const St = {
  wrap: { width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", gap: 16 },

  // lock / scan
  scanWrap: { width: "100%", maxWidth: 540, display: "flex", justifyContent: "center", padding: "40px 0" },
  scanPanel: { position: "relative", width: "100%", maxWidth: 340, overflow: "hidden", borderRadius: 18,
    border: `1px solid ${C.border}`, padding: "18px 20px 20px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 48px rgba(0,0,0,0.45)" },
  scanRingWrap: { display: "flex", justifyContent: "center", padding: "14px 0 18px" },
  scanStatus: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  scanLine: { display: "flex", alignItems: "center", gap: 9, transition: "opacity .3s ease" },
  scanLineDot: { width: 7, height: 7, borderRadius: 999, flex: "0 0 auto" },
  scanLineText: { fontSize: 12.5, letterSpacing: 1, color: C.text, flex: 1 },
  scanLineTick: { fontSize: 12, fontWeight: 800, transition: "opacity .3s ease" },
  scanBarTrack: { position: "relative", height: 3, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.06)" },
  scanBarFill: { position: "absolute", top: 0, bottom: 0, width: "45%", borderRadius: 3, animation: "auroScanBar 1.1s ease-in-out infinite" },

  ringOuter: { position: "relative", width: 84, height: 84 },
  ring: { position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}`, animation: "auroSpin2 0.9s linear infinite" },
  ringDot: { position: "absolute", top: "50%", left: "50%", width: 10, height: 10, borderRadius: "50%", transform: "translate(-50%,-50%)", animation: "auroBreath 1s ease-in-out infinite" },

  // top system bar
  sysBar: { display: "flex", alignItems: "center", gap: 9, padding: "0 4px" },
  sysBarDot: { width: 7, height: 7, borderRadius: 999, flex: "0 0 auto" },
  sysBarText: { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(245,246,250,0.78)", fontFamily: "ui-monospace, Menlo, monospace" },
  sysBarRule: { flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.14), transparent)" },
  sysBarMeta: { fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, color: C.dim, fontFamily: "ui-monospace, Menlo, monospace" },

  // generic cockpit panel
  panel: { position: "relative", overflow: "hidden", borderRadius: 18, border: `1px solid ${C.border}`,
    padding: "16px 18px 18px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 44px rgba(0,0,0,0.4)" },
  panelGrid: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "26px 26px", maskImage: "radial-gradient(120% 120% at 50% 0%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(120% 120% at 50% 0%, #000, transparent 75%)" },
  panelGlow: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" },

  // cockpit header
  cockHead: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  cockDot: { width: 6, height: 6, borderRadius: 999, flex: "0 0 auto" },
  cockLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 2, fontFamily: "ui-monospace, Menlo, monospace" },
  cockRule: { flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)" },
  cockRight: { fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, color: C.dim, fontFamily: "ui-monospace, Menlo, monospace" },

  // profile signal
  profTop: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 },
  glyphCell: { position: "relative", flex: "0 0 auto", width: 52, height: 52, borderRadius: 14, display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 24, lineHeight: 1,
    background: "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(0,0,0,0.3))" },
  glyphRing: { position: "absolute", inset: 5, borderRadius: 10, border: "1px solid" },
  eyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4, fontFamily: "ui-monospace, Menlo, monospace" },
  archTitle: { fontSize: 27, fontWeight: 900, margin: 0, lineHeight: 1.08, letterSpacing: -0.4,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  identity: { position: "relative", zIndex: 2, fontSize: 15.5, fontWeight: 600, color: C.text, margin: "0 0 12px", lineHeight: 1.4 },
  hair: { position: "relative", zIndex: 2, display: "block", height: 1, width: "100%", margin: "0 0 12px", background: "linear-gradient(90deg, rgba(255,255,255,0.16), transparent 80%)" },
  mirror: { position: "relative", zIndex: 2, fontSize: 14, color: "rgba(245,246,250,0.74)", lineHeight: 1.56, margin: "0 0 16px" },

  // signal gauges
  gaugeWrap: { position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16, rowGap: 12, marginBottom: 16 },
  gauge: { minWidth: 0 },
  gaugeEnds: { display: "flex", justifyContent: "space-between", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: C.dim, marginBottom: 5, fontFamily: "ui-monospace, Menlo, monospace" },
  gaugeTrack: { position: "relative", height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)" },
  gaugeAxis: { position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "rgba(255,255,255,0.16)" },
  gaugeDot: { position: "absolute", top: "50%", width: 9, height: 9, borderRadius: 999, transform: "translate(-50%,-50%)" },

  // tags
  tagRow: { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 7 },
  sigTag: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 650, letterSpacing: 0.2, padding: "5px 11px", borderRadius: 8, border: "1px solid" },
  sigTagDot: { width: 5, height: 5, borderRadius: 999, flex: "0 0 auto" },

  // route carousel (geometry unchanged for smooth, mobile-safe scrolling)
  stageWrap: { position: "relative", width: "100%" },
  atmosphere: { position: "absolute", inset: "-16% -12% -8%", pointerEvents: "none", zIndex: 0,
    background: "radial-gradient(58% 60% at 50% 40%, rgba(245,200,66,0.13), transparent 70%), radial-gradient(70% 50% at 50% 6%, rgba(120,150,210,0.06), transparent 62%), radial-gradient(120% 90% at 50% 54%, transparent 58%, rgba(0,0,0,0.34) 100%)" },
  scroller: { position: "relative", zIndex: 1, display: "flex", flexDirection: "row", flexWrap: "nowrap",
    alignItems: "center", justifyContent: "flex-start", height: 318, width: "100%",
    overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", perspective: "1200px",
    padding: "0 calc(50% - 100px)",
    maskImage: "linear-gradient(90deg, transparent 0, #000 11%, #000 89%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 11%, #000 89%, transparent 100%)",
    scrollbarWidth: "none", msOverflowStyle: "none" },
  snapItem: { flex: "0 0 200px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", margin: "0 -8px" },
  routeCard: { position: "relative", width: 230, minHeight: 222, boxSizing: "border-box", overflow: "hidden",
    padding: "16px 16px 16px 18px", borderRadius: 16, border: "1px solid",
    textAlign: "left", font: "inherit", color: C.text, cursor: "pointer",
    display: "flex", flexDirection: "column", gap: 11,
    transformOrigin: "center", backfaceVisibility: "hidden", willChange: "transform",
    transition: "transform .42s cubic-bezier(.22,.68,.2,1), box-shadow .35s ease, opacity .35s ease, border-color .35s ease" },
  routeScan: { position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", borderRadius: "inherit", opacity: 0.5,
    backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)",
    maskImage: "linear-gradient(180deg, #000, transparent 70%)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 70%)" },
  routeRail: { position: "absolute", top: 12, bottom: 12, left: 0, width: 3, borderRadius: 3, zIndex: 2, pointerEvents: "none" },
  cardSweep: { position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", zIndex: 2, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.12), transparent)", animation: "auroCardSweep 7s ease-in-out infinite" },
  routeHead: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 8 },
  rankMark: { fontSize: 12, fontWeight: 800, letterSpacing: 1, fontFamily: "ui-monospace, Menlo, monospace" },
  routeKind: { fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, padding: "3px 7px", borderRadius: 6, border: "1px solid", marginLeft: "auto", fontFamily: "ui-monospace, Menlo, monospace" },
  routeName: { position: "relative", zIndex: 2, fontSize: 17, fontWeight: 850, lineHeight: 1.22, letterSpacing: -0.2,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" },
  routeCaps: { position: "relative", zIndex: 2, display: "flex", gap: 8, marginTop: "auto" },

  // fit meter
  fitWrap: { position: "relative", zIndex: 2 },
  fitTop: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 },
  fitLabel: { fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, color: C.dim, fontFamily: "ui-monospace, Menlo, monospace" },
  fitVal: { fontSize: 13, fontWeight: 850, letterSpacing: 0.2 },
  fitTrack: { position: "relative", height: 5, borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.07)" },
  fitFill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 5 },

  // capsules
  capsule: { flex: "1 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
    background: "rgba(0,0,0,0.22)", border: `1px solid ${C.border}` },
  capTick: { width: 3, height: 22, borderRadius: 3, flex: "0 0 auto" },
  capLabel: { fontSize: 8.5, fontWeight: 800, letterSpacing: 1, color: C.dim, fontFamily: "ui-monospace, Menlo, monospace", whiteSpace: "nowrap" },
  capVal: { fontSize: 13.5, fontWeight: 800, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  // briefing
  briefTitle: { position: "relative", zIndex: 2, fontSize: 22, fontWeight: 850, margin: "2px 0 9px", lineHeight: 1.12, letterSpacing: -0.4,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  briefWhy: { position: "relative", zIndex: 2, fontSize: 14.5, color: C.text, opacity: 0.88, lineHeight: 1.52, margin: "0 0 14px" },
  capGrid: { position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "14px 0 16px" },
  capCell: { display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 12,
    background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}` },
  briefReasons: { position: "relative", zIndex: 2 },
  miniLabel: { fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, color: C.dim, marginBottom: 9, fontFamily: "ui-monospace, Menlo, monospace" },

  // CTA
  ctaWrap: { display: "flex", flexDirection: "column", gap: 8 },
  ctaEyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textAlign: "center", fontFamily: "ui-monospace, Menlo, monospace" },
  cta: { position: "relative", overflow: "hidden", width: "100%", padding: "16px 22px",
    borderRadius: 14, border: "none", fontWeight: 850, fontSize: 16, letterSpacing: 0.2,
    color: "#120d04", cursor: "pointer", transform: "scale(1)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 9px rgba(0,0,0,0.22), 0 14px 34px rgba(0,0,0,0.4)",
    transition: "transform .16s ease, filter .18s ease, box-shadow .22s ease" },
  ctaLabel: { position: "relative", zIndex: 1 },
  ctaSheen: { position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", zIndex: 0, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.42), transparent)", animation: "auroSheen 6s ease-in-out infinite" },
  ctaSub: { fontSize: 12.5, color: "rgba(245,246,250,0.6)", textAlign: "center" },
  debugBtn: { width: "100%", marginTop: 6, padding: "9px 12px", borderRadius: 10,
    border: `1px dashed ${C.border}`, background: "transparent", color: C.dim,
    fontSize: 12, letterSpacing: 0.5, cursor: "pointer", fontFamily: "ui-monospace, Menlo, monospace" },
};
