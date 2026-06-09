// ─────────────────────────────────────────────────────────────────────────────
// questions.js — the Analysis V2 question schema (declarative; UI-agnostic).
//
// This is the "answer-weight table" — the one open parameter from the design
// rounds, now made concrete. Each option carries effects:
//   spectra: { key: { v, w } }   signal toward a spectrum pole (v) at weight (w)
//   domains: { family: points }  affinity points toward an aptitude family
//   gates:   { key: value }      a recorded constraint fact
//   tags:    { ... }             flags (founderType, urgencyHigh, domainProbe)
//
// Weight conventions:
//   ~1.2  primary dedicated read for a spectrum (a this-or-that about it)
//   ~0.5  secondary / leak from a related question
//   ~0.3  diffuse seed (motivation, domain leaks)
// MASS_FULL=1.5, so primary≈0.8 confidence alone (locks for decisive users);
// a lone seed stays unknown until a real question lands.
// ─────────────────────────────────────────────────────────────────────────────
 
export const QUESTIONS = {
  // ── Q1 — Motivation (fixed opener) ─────────────────────────────────────────
  motivation: {
    type: "tap",
    prompt: "What are you actually chasing right now?",
    options: [
      {
        id: "money_soon",
        label: "I need money. Like, yesterday.",
        spectra: { incomeModel: { v: -1, w: 0.4 }, ownership: { v: -0.4, w: 0.3 } },
        gates: { urgency: "provisional_soon" },
        tags: { urgencyHigh: true },
      },
      {
        id: "build_mine",
        label: "I want something that's mine",
        spectra: {
          ownership:   { v: +1,   w: 0.6 },
          incomeModel: { v: +0.5, w: 0.4 },
          riskReward:  { v: +0.6, w: 0.4 },
        },
      },
      {
        id: "escape_9to5",
        label: "I'm tired of building someone else's future",
        spectra: { ownership: { v: +0.6, w: 0.4 }, riskReward: { v: +0.4, w: 0.3 } },
      },
      {
        id: "find_good_at",
        label: "I want to figure out what I'm actually good at",
        tags: { domainProbe: true },
      },
      {
        id: "just_looking",
        label: "Honestly? I'm still figuring it out",
        tags: { domainProbe: true },
      },
    ],
  },
 
  // ── Q2 — Domain affinity (fixed; pick up to 3) ─────────────────────────────
  domain: {
    type: "chips",
    maxPick: 3,
    prompt: "You accidentally disappear for 6 hours. What were you probably doing?",
    options: [
      { id: "d_technical",  label: "Fixing something that wasn't working.",
        domains: { technical: 2 },
        spectra: { people: { v: -0.4, w: 0.3 }, visibility: { v: -0.3, w: 0.2 } } },
      { id: "d_creative",   label: "Making something look better than it needed to.",
        domains: { creative: 2 } },
      { id: "d_words",      label: "Writing, explaining, or finding the perfect words.",
        domains: { words: 2 },
        spectra: { people: { v: -0.3, w: 0.2 } } },
      { id: "d_persuasion", label: "Talking someone into an idea.",
        domains: { persuasion: 2 },
        spectra: { people: { v: +0.7, w: 0.4 }, riskReward: { v: +0.3, w: 0.2 } } },
      { id: "d_numbers",    label: "Solving a problem just because it bothered me.",
        domains: { numbers: 2 },
        spectra: { people: { v: -0.4, w: 0.3 } } },
      { id: "d_handsOn",    label: "Building or fixing something in the real world.",
        domains: { handsOn: 2 },
        spectra: { visibility: { v: -0.6, w: 0.4 }, incomeModel: { v: -0.4, w: 0.3 } } },
      { id: "d_teaching",   label: "Helping someone finally understand something.",
        domains: { teaching: 2 },
        spectra: { people: { v: +0.3, w: 0.2 }, visibility: { v: +0.3, w: 0.2 } } },
      { id: "d_operations", label: "Turning chaos into a system.",
        domains: { operations: 2 },
        spectra: { ownership: { v: +0.3, w: 0.2 } } },
    ],
  },
 
  // ── Q3 — Stakes (fixed; primary Risk–Reward) ───────────────────────────────
  stakes: {
    type: "thisOrThat",
    prompt: "Pick your poison.",
    options: [
      { id: "steady", label: "$3K a month. Reliable. Boring.",
        spectra: { riskReward: { v: -1, w: 1.2 }, incomeModel: { v: -0.3, w: 0.3 },
                   ownership: { v: -0.4, w: 0.3 } } },
      { id: "moonshot", label: "Nothing yet. But a real shot at $30K.",
        spectra: { riskReward: { v: +1, w: 1.2 }, incomeModel: { v: +0.3, w: 0.3 },
                   ownership: { v: +0.3, w: 0.3 } } },
    ],
  },
 
  // ── Q4 — Texture (fixed; primary People Orientation) ───────────────────────
  texture: {
    type: "thisOrThat",
    prompt: "Which day sounds more satisfying?",
    options: [
      { id: "solo", label: "Headphones on. Locked in. Nobody bothering me.",
        spectra: { people: { v: -1, w: 1.2 }, visibility: { v: -0.4, w: 0.3 },
                   ownership: { v: -0.3, w: 0.2 } } },
      { id: "relational", label: "Calls. Conversations. Momentum. Things happening.",
        spectra: { people: { v: +1, w: 1.2 }, visibility: { v: +0.3, w: 0.3 } } },
    ],
  },
 
  // ── Q5 — Spotlight (adaptive; primary Visibility) ──────────────────────────
  spotlight: {
    type: "thisOrThat",
    prompt: "If the money was good, how visible are you willing to be?",
    options: [
      { id: "oncamera", label: "Put me on camera.",
        spectra: { visibility: { v: +1, w: 1.2 }, incomeModel: { v: +0.3, w: 0.3 } } },
      { id: "invisible", label: "I'd rather build behind the scenes.",
        spectra: { visibility: { v: -1, w: 1.2 } } },
    ],
  },
 
  // ── Q6 — Payment model (adaptive; primary Income Model) ────────────────────
  payment: {
    type: "thisOrThat",
    prompt: "Which sounds better?",
    options: [
      { id: "trade", label: "Get paid for what I do.",
        spectra: { incomeModel: { v: -1, w: 1.2 } } },
      { id: "asset", label: "Build something that pays me even when I'm offline.",
        spectra: { incomeModel: { v: +1, w: 1.2 }, riskReward: { v: +0.3, w: 0.3 },
                   ownership: { v: +0.4, w: 0.4 } } },
    ],
  },
 
  // ── Q7 — Venture substrate / craft direction (adaptive; dual-mode) ─────────
  // Owner-mode options set founderType (routes the five founder archetypes).
  // Practitioner-mode options resolve the founder-vs-employee fork.
  substrate: {
    type: "thisOrThat",
    mode: "dual", // UI shows owner options if ownership leans positive, else practitioner
    prompt: "So what's the endgame?",
    options: [
      // owner mode
      { id: "sub_product", label: "A product that works without me.",
        spectra: { ownership: { v: +1, w: 1.0 }, incomeModel: { v: +0.5, w: 0.4 } },
        tags: { founderType: "technical" } },
      { id: "sub_team", label: "A business powered by a team.",
        spectra: { ownership: { v: +1, w: 1.0 }, people: { v: +0.4, w: 0.3 } },
        tags: { founderType: "agency" } },
      { id: "sub_store", label: "A product people keep buying.",
        spectra: { ownership: { v: +1, w: 1.0 } },
        tags: { founderType: "ecommerce" } },
      { id: "sub_audience", label: "An audience that becomes an asset.",
        spectra: { ownership: { v: +1, w: 1.0 }, visibility: { v: +0.4, w: 0.3 } },
        tags: { founderType: "media" } },
      { id: "sub_local", label: "A local operation I can scale.",
        spectra: { ownership: { v: +1, w: 1.0 } },
        gates: { localityLean: "local" },
        tags: { founderType: "service" } },
      // practitioner mode
      { id: "sub_own_thing", label: "My own thing.",
        spectra: { ownership: { v: +0.6, w: 0.6 } } },
      { id: "sub_for_clients", label: "Getting paid to build for other people.",
        spectra: { ownership: { v: -1, w: 1.0 }, incomeModel: { v: -0.4, w: 0.4 } } },
    ],
  },
 
  // ── Q8 — Time (fixed constraint) ───────────────────────────────────────────
  time: {
    type: "tap",
    prompt: "Which sounds most like your life right now?",
    options: [
      { id: "t_minimal", label: "I'm squeezing this in whenever I can.", gates: { time: "minimal" } },
      { id: "t_low",     label: "A few evenings a week.",                gates: { time: "low" } },
      { id: "t_mid",     label: "It's becoming a serious side project.", gates: { time: "mid" } },
      { id: "t_high",    label: "It's almost a second job.",            gates: { time: "high" } },
      { id: "t_full",    label: "This is basically my main focus.",      gates: { time: "full" } },
    ],
  },
 
  // ── Q9 — Capital (fixed constraint) ────────────────────────────────────────
  capital: {
    type: "tap",
    prompt: "If the right opportunity showed up tomorrow, what could you realistically risk?",
    options: [
      { id: "c_zero",  label: "$0 — it has to be free", gates: { capital: "zero" } },
      { id: "c_under", label: "Under $100",             gates: { capital: "under100" } },
      { id: "c_low",   label: "$100–$500",              gates: { capital: "low" } },
      { id: "c_mid",   label: "$500–$2K",               gates: { capital: "mid" } },
      { id: "c_high",  label: "$2K+",                   gates: { capital: "high" } },
    ],
  },
 
  // ── Q10 — Locality (fixed constraint) ──────────────────────────────────────
  locality: {
    type: "tap",
    prompt: "Which sounds more appealing?",
    options: [
      { id: "l_remote", label: "Making money from anywhere with a laptop.", gates: { locality: "remote" } },
      { id: "l_local",  label: "Building something in my local area.",       gates: { locality: "local" } },
      { id: "l_either", label: "I don't care as long as it works.",          gates: { locality: "either" } },
    ],
  },
 
  // ── Q11 — Vehicle (conditional: local/either) ──────────────────────────────
  vehicle: {
    type: "tap",
    prompt: "If an opportunity needed transportation tomorrow...",
    options: [
      { id: "v_car",  label: "I'm good.",                gates: { vehicle: "car" } },
      { id: "v_bike", label: "I could make a bike work.", gates: { vehicle: "bike" } },
      { id: "v_none", label: "I'd need another option.",  gates: { vehicle: "none" } },
    ],
  },
 
  // ── Q12 — Urgency precision (conditional: money_soon) ──────────────────────
  urgencyPrecision: {
    type: "tap",
    prompt: "How soon do you actually need this to work?",
    options: [
      { id: "u_week",   label: "This week",          gates: { urgency: "this_week" } },
      { id: "u_month",  label: "This month",         gates: { urgency: "this_month" } },
      { id: "u_few",    label: "Next couple months", gates: { urgency: "few_months" } },
      { id: "u_none",   label: "No hard deadline",   gates: { urgency: "none" } },
    ],
  },
};
 
// Fast lookup of an option object by question id + option id.
export function getOption(questionId, optionId) {
  const q = QUESTIONS[questionId];
  if (!q) return null;
  return q.options.find((o) => o.id === optionId) || null;
}
