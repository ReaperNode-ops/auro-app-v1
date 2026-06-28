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

export default function Reveal({ derived, archetype, legacyAnswers, onContinue, history }) {
  const [stage, setStage] = useState("lock"); // 'lock' → 'revealed'
  const [lockLabel, setLockLabel] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0); // default = top pick
  const [settledIndex, setSettledIndex] = useState(0); // debounced — drives the detail re-entry only
  const [copied, setCopied] = useState(false); // debug-report copy feedback (temporary)
  const settleTimer = useRef(null);

  // cycle the lock labels, then settle into the reveal
  useEffect(() => {
    const labels = setInterval(() => setLockLabel((i) => Math.min(i + 1, 2)), 300);
    const done = setTimeout(() => setStage("revealed"), LOCK_MS);
    return () => { clearInterval(labels); clearTimeout(done); };
  }, []);

  // Debounce the detail re-animation: content follows selection live, but the
  // entrance only replays ~140ms after a switch settles.
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

  const safeIndex = Math.min(selectedIndex, Math.max(0, top3.length - 1));
  const selectedPath = top3[safeIndex] || null;
  const medal = MEDAL[safeIndex] || MEDAL[0];
  const detailKey = Math.min(settledIndex, Math.max(0, top3.length - 1));
  const alts = top3.map((p, i) => ({ p, i })).filter((x) => x.i !== safeIndex);

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

  // ── Lock / calibration beat ────────────────────────────────────────────────
  if (stage === "lock") {
    const labels = ["Reading your answers", "Finding your matches", "Almost ready"];
    return (
      <div style={St.lockWrap}>
        <RingPulse accent={sty.accent} />
        <div style={St.lockLabel}>{labels[lockLabel]}</div>
        <Keyframes />
      </div>
    );
  }

  const rankLabel = (i) => (i === 0 ? "Top match" : i === 1 ? "2nd match" : "3rd match");

  return (
    <div style={St.wrap}>
      <Keyframes />

      {/* 1: Identity reveal — clean, editorial, no card */}
      <header style={{ ...St.identityWrap, animation: "auroUp .5s ease both" }}>
        <span aria-hidden style={{ ...St.glyphMark, color: sty.accent }}>{sty.glyph}</span>
        <div style={{ ...St.kicker, color: `${sty.accent}cc` }}>Your type</div>
        <h1 style={{ ...St.archTitle, backgroundImage: `linear-gradient(116deg, ${sty.accent2}, ${sty.accent})` }}>{copy.title}</h1>
        <p style={St.identityLine}>{copy.identity}</p>
      </header>

      {/* 2: The deck — hero cover + two slim alternates (the one selection mechanic) */}
      <section style={St.deck}>
        <div key={detailKey} style={{ ...St.hero, animation: "auroInfoIn .42s cubic-bezier(.2,.7,.2,1) both" }}>
          <span aria-hidden style={{ ...St.heroWash, background: `radial-gradient(120% 80% at 50% -12%, ${medal.accent}26, transparent 62%)` }} />
          <div style={{ ...St.heroLabel, color: medal.accent }}>{rankLabel(safeIndex)}</div>
          <h2 style={{ ...St.heroTitle, backgroundImage: `linear-gradient(120deg, ${medal.accent2}, ${medal.accent})` }}>{selectedPath.title}</h2>
          {selectedPath.summary && <p style={St.heroSummary}>{selectedPath.summary}</p>}
        </div>

        {alts.length > 0 && (
          <div style={St.altList}>
            {alts.map(({ p, i }) => {
              const m = MEDAL[i] || MEDAL[0];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  style={St.altRow}
                  onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.99)"; }}
                  onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <span aria-hidden style={{ ...St.altDot, background: m.accent, boxShadow: `0 0 10px ${m.glow}` }} />
                  <span style={St.altText}>
                    <span style={St.altName}>{p.title}</span>
                    <span style={St.altMeta}>{rankLabel(i)}{p.earnings ? ` \u00b7 ${p.earnings}` : ""}</span>
                  </span>
                  <span aria-hidden style={St.altChevron}>{"\u203A"}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3 + 4: Why this fits + practical facts (about the selected path) */}
      <section key={detailKey + "-d"} style={{ ...St.detail, animation: "auroInfoIn .42s cubic-bezier(.2,.7,.2,1) both" }}>
        <div style={St.whyHead}>Why this fits</div>
        <p style={St.whyText}>{whyCopy(selectedPath)}</p>
        <MetaRow path={selectedPath} accent={medal.accent} />
      </section>

      {/* 5: CTA */}
      <button
        style={{ ...St.cta, backgroundImage: `linear-gradient(135deg, ${medal.accent2}, ${medal.accent})` }}
        onClick={() => onContinue(selectedPath)}
        onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.985)"; }}
        onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <span aria-hidden style={St.ctaSheen} />
        <span style={St.ctaLabel}>Begin {selectedPath.title} Path</span>
      </button>
      <div style={St.ctaSub}>You can explore the other paths anytime.</div>

      {/* 6: TEMPORARY developer diagnostic — remove with debugReport.js when done. */}
      <button type="button" style={St.debugBtn} onClick={handleCopyDebug}>
        {copied ? "Copied \u2713" : "Copy debug report"}
      </button>
    </div>
  );
}

// ── Clean facts row: first payday · difficulty · est. earnings ──────────────
function MetaRow({ path, accent }) {
  const items = [
    path.timeToFirst && { k: "First payday", v: path.timeToFirst },
    path.difficulty && { k: "Difficulty", v: cap(path.difficulty) },
    path.earnings && { k: "Est. earnings", v: path.earnings, accent: true },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div style={St.metaRow}>
      {items.map((m, i) => (
        <div key={m.k} style={{ ...St.metaCell, borderLeft: i === 0 ? "none" : `1px solid ${C.border}` }}>
          <div style={St.metaKey}>{m.k}</div>
          <div style={{ ...St.metaVal, color: m.accent ? accent : C.text }}>{m.v}</div>
        </div>
      ))}
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
      @keyframes auroUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes auroSpin2 { to { transform: rotate(360deg); } }
      @keyframes auroBreath { 0%,100% { opacity: .5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
      @keyframes auroInfoIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes auroSheen { 0% { transform: translateX(-140%) skewX(-18deg); } 55%,100% { transform: translateX(360%) skewX(-18deg); } }
    `}</style>
  );
}

// ── Styles (Auro — editorial, restrained) ───────────────────────────────────
const St = {
  wrap: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 34 },

  // lock
  lockWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 26, padding: "70px 0" },
  lockLabel: { fontSize: 14, letterSpacing: 1, color: C.dim },
  ringOuter: { position: "relative", width: 84, height: 84 },
  ring: { position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}`, animation: "auroSpin2 0.9s linear infinite" },
  ringDot: { position: "absolute", top: "50%", left: "50%", width: 10, height: 10, borderRadius: "50%", transform: "translate(-50%,-50%)", animation: "auroBreath 1s ease-in-out infinite" },

  // identity reveal
  identityWrap: { position: "relative", paddingTop: 6 },
  glyphMark: { position: "absolute", top: -18, right: -4, fontSize: 96, lineHeight: 1, opacity: 0.08, pointerEvents: "none", userSelect: "none" },
  kicker: { fontSize: 12.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 },
  archTitle: { fontSize: 38, fontWeight: 900, margin: 0, lineHeight: 1.04, letterSpacing: -0.8,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  identityLine: { fontSize: 17, color: "rgba(245,246,250,0.7)", lineHeight: 1.5, margin: "14px 0 0", maxWidth: 420 },

  // deck
  deck: { display: "flex", flexDirection: "column", gap: 12 },
  hero: { position: "relative", overflow: "hidden", borderRadius: 24, padding: "26px 24px 28px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 26px 60px rgba(0,0,0,0.44)" },
  heroWash: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" },
  heroLabel: { position: "relative", zIndex: 1, fontSize: 13, fontWeight: 750, letterSpacing: 0.4, marginBottom: 10 },
  heroTitle: { position: "relative", zIndex: 1, fontSize: 29, fontWeight: 850, margin: 0, lineHeight: 1.1, letterSpacing: -0.5,
    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" },
  heroSummary: { position: "relative", zIndex: 1, fontSize: 15.5, color: "rgba(245,246,250,0.78)", lineHeight: 1.5, margin: "12px 0 0" },

  // alternates (slim, list-like — not boxes)
  altList: { display: "flex", flexDirection: "column" },
  altRow: { display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "15px 6px", background: "transparent",
    border: "none", borderTop: `1px solid ${C.border}`, textAlign: "left", font: "inherit", color: C.text,
    cursor: "pointer", transition: "transform .14s ease, opacity .2s ease" },
  altDot: { flex: "0 0 auto", width: 9, height: 9, borderRadius: "50%" },
  altText: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 },
  altName: { fontSize: 16, fontWeight: 700, letterSpacing: -0.2, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  altMeta: { fontSize: 13, color: C.dim },
  altChevron: { flex: "0 0 auto", fontSize: 22, color: C.dim, lineHeight: 1 },

  // detail (why + facts)
  detail: { display: "flex", flexDirection: "column" },
  whyHead: { fontSize: 12.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.dim, marginBottom: 12 },
  whyText: { fontSize: 16.5, color: C.text, opacity: 0.92, lineHeight: 1.58, margin: 0 },
  metaRow: { display: "flex", marginTop: 24 },
  metaCell: { flex: 1, display: "flex", flexDirection: "column", gap: 5, padding: "0 16px" },
  metaKey: { fontSize: 12.5, color: C.dim, letterSpacing: 0.2 },
  metaVal: { fontSize: 17, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.2 },

  // CTA
  cta: { position: "relative", overflow: "hidden", width: "100%", padding: "18px 22px",
    borderRadius: 18, border: "none", fontWeight: 850, fontSize: 16.5, letterSpacing: 0.2,
    color: "#120d04", cursor: "pointer", transform: "scale(1)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 9px rgba(0,0,0,0.22), 0 16px 38px rgba(0,0,0,0.42)",
    transition: "transform .16s ease, filter .18s ease, box-shadow .22s ease" },
  ctaLabel: { position: "relative", zIndex: 1 },
  ctaSheen: { position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", zIndex: 0, pointerEvents: "none",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.42), transparent)", animation: "auroSheen 6s ease-in-out infinite" },
  ctaSub: { fontSize: 13, color: "rgba(245,246,250,0.6)", textAlign: "center", marginTop: -18 },
  debugBtn: { width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px dashed ${C.border}`,
    background: "transparent", color: C.dim, fontSize: 12, letterSpacing: 0.5, cursor: "pointer",
    fontFamily: "ui-monospace, Menlo, monospace", marginTop: -16 },
};
