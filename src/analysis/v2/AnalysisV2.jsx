// ─────────────────────────────────────────────────────────────────────────────
// AnalysisV2.jsx — the new adaptive Analysis flow UI.
//
// Drives the already-tested headless engine interactively:
//   • runFlow.deriveSession(history)  → profile, next question, archetype, done
//   • data/questions.QUESTIONS        → prompts + options to render
//   • engine/toLegacyAnswers          → convert finished profile to legacy shape
//
// It renders one question at a time (single- and multi-select), shows soft
// progress WITHOUT assuming a fixed length, supports back/reset, derives the V2
// profile at completion, converts to legacy `answers`, and hands those to the
// EXISTING results flow via onComplete(legacyAnswers, v2). It renders no results
// and touches no other system.
//
// Mounted only when USE_ANALYSIS_V2 === true (see flag.js + App.jsx integration).
//
// Props:
//   onComplete(legacyAnswers, v2)  required — receives the legacy answers object
//                                  (drop-in for the legacy `answers`) plus the
//                                  raw V2 { archetype, derived } for later use.
//   onExit()                       optional — called from Reset → "Start over"
//                                  when the user backs out of the first screen.
//
// Style: uses Auro's existing T tokens (with safe fallbacks) — no new branding.
// All components are top-level function declarations per the project's React rule.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState, useEffect } from "react";
import { T } from "../../theme.js";
import { deriveSession } from "../engine/runFlow.js";
import { QUESTIONS } from "../data/questions.js";
import { toLegacyAnswers } from "../engine/toLegacyAnswers.js";
import { ARCHETYPES } from "../data/archetypes.js";

// Safe palette: prefer Auro tokens, fall back to on-brand dark values.
const C = {
  gold: (T && T.gold) || "#f5c842",
  blue: (T && (T.accent || T.primary)) || "#4a9eff",
  bg: (T && T.bg) || "#0a0b10",
  card: (T && (T.card || T.panel)) || "rgba(255,255,255,0.04)",
  border: (T && T.border) || "rgba(255,255,255,0.09)",
  text: (T && T.text) || "#f5f6fa",
  dim: (T && (T.textDim || T.dim)) || "rgba(245,246,250,0.55)",
};

const IS_DEV =
  typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;

const CALIBRATE_MS = 650; // single brief "analysing" beat before handing off

// ── Root component ────────────────────────────────────────────────────────────
export default function AnalysisV2({ onComplete, onExit }) {
  // phase: 'landing' → 'flow' → 'calibrating' (then onComplete fires)
  const [phase, setPhase] = useState("landing");
  // history: [{ qid, optionIds:[...] }]
  const [history, setHistory] = useState([]);
  // local multi-select buffer for the current chips question
  const [picks, setPicks] = useState([]);

  const session = useMemo(() => deriveSession(history), [history]);
const currentQ = session.nextQuestion;
  // When the engine reports done during the flow, run one calibration beat,
  // then convert and hand off to the existing results flow.
  useEffect(() => {
  if (phase !== "flow" || !session.isComplete) return;

  const legacy = toLegacyAnswers(session.derived);

  onComplete(legacy, {
    archetype: session.archetype,
    derived: session.derived,
  });
}, [phase, session.isComplete]);
  function choose(qid, optionIds) {
    setHistory((h) => [...h, { qid, optionIds }]);
    setPicks([]);
  }

  function back() {
    if (picks.length) {
      setPicks([]);
      return;
    }
    if (history.length === 0) {
      setPhase("landing");
      return;
    }
    setHistory((h) => h.slice(0, -1));
  }

  function reset() {
    setHistory([]);
    setPicks([]);
    setPhase("landing");
    if (onExit) onExit();
  }

  return (
    <div style={S.shell}>
      <GlowField />
      <div style={S.stage}>
        {phase === "landing" && <Landing onBegin={begin} />}

        {phase === "flow" && currentQ && (
          <>
           <ProgressBar asked={session.asked.length} done={session.isComplete} />
            <QuestionView
              qid={session.nextQuestionId}
              question={currentQ}
              picks={picks}
              setPicks={setPicks}
              onChoose={choose}
            />
            <NavRow
              canBack={history.length > 0 || picks.length > 0}
              onBack={back}
              onReset={reset}
            />
          </>
        )}

        {phase === "calibrating" && (
          <Calibrating archetype={session.archetype} />
        )}
      </div>

      {IS_DEV && (
        <DebugPanel
          phase={phase}
          session={session}
          currentId={session.nextQuestionId}
        />
      )}
    </div>
  );
}

// ── Landing ────────────────────────────────────────────────────────────────────
function Landing({ onBegin }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 460 }}>
      <div style={S.kicker}>CALIBRATION</div>
      <h1 style={S.h1}>Let's find out what you're actually built for.</h1>
      <p style={S.sub}>
        A few sharp questions. The system reads your signal and locks a profile —
        no survey, no fluff.
      </p>
      <button style={S.primaryBtn} onClick={onBegin}>
        Begin calibration
      </button>
    </div>
  );
}

// ── One question (single- or multi-select) ──────────────────────────────────────
function QuestionView({ qid, question, picks, setPicks, onChoose }) {
  const isMulti = question.type === "chips";
  const max = question.maxPick || 3;

  function tap(optionId) {
    if (isMulti) {
      setPicks((p) =>
        p.includes(optionId)
          ? p.filter((x) => x !== optionId)
          : p.length < max
          ? [...p, optionId]
          : p
      );
    } else {
      onChoose(qid, [optionId]); // single-select advances immediately
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <h2 style={S.prompt}>{question.prompt}</h2>
      {isMulti && (
        <div style={S.hint}>
          Pick up to {max} — {picks.length}/{max} selected
        </div>
      )}

      <div style={S.options}>
        {question.options.map((opt) => (
          <OptionButton
            key={opt.id}
            label={opt.label}
            selected={isMulti && picks.includes(opt.id)}
            onClick={() => tap(opt.id)}
          />
        ))}
      </div>

      {isMulti && (
        <button
          style={{ ...S.primaryBtn, opacity: picks.length ? 1 : 0.4 }}
          disabled={!picks.length}
          onClick={() => onChoose(qid, picks)}
        >
          Continue
        </button>
      )}
    </div>
  );
}

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.option,
        borderColor: selected ? C.gold : C.border,
        background: selected ? "rgba(245,200,66,0.10)" : C.card,
        boxShadow: selected ? `0 0 24px ${C.gold}22` : "none",
      }}
    >
      {label}
    </button>
  );
}

// ── Soft progress (no fixed total assumed) ──────────────────────────────────────
function ProgressBar({ asked, done }) {
  // Grows toward ~90% as answers accumulate, snaps to 100% on completion.
  const pct = done ? 1 : Math.min(0.9, asked / 11);
  return (
    <div style={S.progressWrap}>
      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill, width: `${Math.round(pct * 100)}%` }} />
      </div>
      <div style={S.progressLabel}>Calibrating signal…</div>
    </div>
  );
}

// ── Back / reset row ─────────────────────────────────────────────────────────────
function NavRow({ canBack, onBack, onReset }) {
  return (
    <div style={S.navRow}>
      <button
        style={{ ...S.ghostBtn, opacity: canBack ? 1 : 0.35 }}
        disabled={!canBack}
        onClick={onBack}
      >
        ← Back
      </button>
      <button style={S.ghostBtn} onClick={onReset}>
        Start over
      </button>
    </div>
  );
}

// ── Brief calibration beat before handing off to results ─────────────────────────
function Calibrating({ archetype }) {
  const title = archetype && ARCHETYPES[archetype.key]
    ? ARCHETYPES[archetype.key].title
    : "your profile";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={S.spinner} />
      <div style={{ ...S.prompt, marginTop: 22 }}>Locking your profile…</div>
      <div style={S.sub}>Calibrated to {title}.</div>
    </div>
  );
}

// ── Dev-only debug panel ─────────────────────────────────────────────────────────
function DebugPanel({ phase, session, currentId }) {
  const legacy = session.isComplete ? toLegacyAnswers(session.derived) : null;
  return (
    <div style={S.debug}>
      <div style={S.debugTitle}>V2 DEBUG (dev only)</div>
      <div>phase: {phase}</div>
      <div>current question: {currentId || "—"}</div>
      <div>answered: {session.asked.length} ({session.asked.join(", ") || "none"})</div>
      <div>archetype: {session.archetype ? session.archetype.key : "—"}</div>
      <div>
        spectra:{" "}
        {["ownership", "incomeModel", "visibility", "people", "riskReward"]
          .map((k) => `${k}=${session.derived[k].position.toFixed(2)}(${session.derived[k].band[0]})`)
          .join("  ")}
      </div>
      {legacy && (
        <pre style={S.debugPre}>
          legacy answers:
          {"\n"}
          {JSON.stringify({ ...legacy, _v2: undefined }, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Styles (Auro idiom) ──────────────────────────────────────────────────────────
const S = {
  shell: {
    position: "relative", minHeight: "100dvh", background: C.bg, color: C.text,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", padding: "32px 20px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  stage: { position: "relative", zIndex: 2, width: "100%", maxWidth: 560,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 26 },
  kicker: { letterSpacing: 4, fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 14 },
  h1: { fontSize: 30, lineHeight: 1.18, fontWeight: 800, margin: "0 0 14px" },
  sub: { color: C.dim, fontSize: 15, lineHeight: 1.5, margin: "0 0 26px" },
  prompt: { fontSize: 22, fontWeight: 750, lineHeight: 1.3, margin: "0 0 8px", textAlign: "center" },
  hint: { color: C.dim, fontSize: 13, textAlign: "center", marginBottom: 16 },
  options: { display: "flex", flexDirection: "column", gap: 12, margin: "18px 0 22px" },
  option: {
    width: "100%", textAlign: "left", padding: "16px 18px", borderRadius: 16,
    border: `1px solid ${C.border}`, color: C.text, fontSize: 15.5, lineHeight: 1.35,
    cursor: "pointer", transition: "all .15s ease",
  },
  primaryBtn: {
    width: "100%", padding: "15px 20px", borderRadius: 16, border: "none",
    background: `linear-gradient(135deg, ${C.gold}, ${C.blue})`,
    color: "#0a0b10", fontWeight: 800, fontSize: 16, cursor: "pointer",
  },
  navRow: { display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 520 },
  ghostBtn: {
    background: "transparent", border: "none", color: C.dim,
    fontSize: 14, cursor: "pointer", padding: "8px 4px",
  },
  progressWrap: { width: "100%", maxWidth: 520 },
  progressTrack: { height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", background: `linear-gradient(90deg, ${C.blue}, ${C.gold})`, transition: "width .4s ease" },
  progressLabel: { fontSize: 11, letterSpacing: 2, color: C.dim, marginTop: 8, textAlign: "center" },
  spinner: {
    width: 46, height: 46, borderRadius: "50%", margin: "0 auto",
    border: `3px solid ${C.border}`, borderTopColor: C.gold,
    animation: "auroSpin 0.8s linear infinite",
  },
  debug: {
    position: "fixed", left: 12, bottom: 12, zIndex: 9999, maxWidth: 420,
    background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10, padding: "10px 12px", fontSize: 11.5, lineHeight: 1.5,
    color: "#cfe3ff", fontFamily: "ui-monospace, Menlo, monospace",
  },
  debugTitle: { color: "#ffd76a", fontWeight: 700, marginBottom: 6, letterSpacing: 1 },
  debugPre: { margin: "6px 0 0", whiteSpace: "pre-wrap", color: "#9fe6b0" },
};

// Background atmosphere — inline (no dependency on shared primitives).
function GlowField() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 460, height: 460,
        background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, filter: "blur(20px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-8%", width: 420, height: 420,
        background: `radial-gradient(circle, ${C.blue}14, transparent 70%)`, filter: "blur(20px)" }} />
      <style>{`@keyframes auroSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
