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
    prompt: "Real talk — what's this actually about?",
    options: [
      {
        id: "money_soon",
        label: "I need money, and soon",
        spectra: { incomeModel: { v: -1, w: 0.4 }, ownership: { v: -0.4, w: 0.3 } },
        gates: { urgency: "provisional_soon" },
        tags: { urgencyHigh: true },
      },
      {
        id: "build_mine",
        label: "I want to build something that's mine",
        spectra: {
          ownership:   { v: +1,   w: 0.6 },
          incomeModel: { v: +0.5, w: 0.4 },
          riskReward:  { v: +0.6, w: 0.4 },
        },
      },
      {
        id: "escape_9to5",
        label: "I'm done working for someone else",
        spectra: { ownership: { v: +0.6, w: 0.4 }, riskReward: { v: +0.4, w: 0.3 } },
      },
      {
        id: "find_good_at",
        label: "I want to find what I'm actually good at",
        tags: { domainProbe: true },
      },
      {
        id: "just_looking",
        label: "Honestly? Just looking",
        tags: { domainProbe: true },
      },
    ],
  },

  // ── Q2 — Domain affinity (fixed; pick up to 3) ─────────────────────────────
  domain: {
    type: "chips",
    maxPick: 3,
    prompt: "Which of these could you lose hours doing — and not even notice?",
    options: [
      { id: "d_technical",  label: "Making something technical actually work",
        domains: { technical: 2 },
        spectra: { people: { v: -0.4, w: 0.3 }, visibility: { v: -0.3, w: 0.2 } } },
      { id: "d_creative",   label: "Designing or creating something that looks good",
        domains: { creative: 2 } },
      { id: "d_words",      label: "Putting the right words together",
        domains: { words: 2 },
        spectra: { people: { v: -0.3, w: 0.2 } } },
      { id: "d_persuasion", label: "Talking people around, making the deal",
        domains: { persuasion: 2 },
        spectra: { people: { v: +0.7, w: 0.4 }, riskReward: { v: +0.3, w: 0.2 } } },
      { id: "d_numbers",    label: "Cracking a problem with logic and numbers",
        domains: { numbers: 2 },
        spectra: { people: { v: -0.4, w: 0.3 } } },
      { id: "d_handsOn",    label: "Building or fixing something with your hands",
        domains: { handsOn: 2 },
        spectra: { visibility: { v: -0.6, w: 0.4 }, incomeModel: { v: -0.4, w: 0.3 } } },
      { id: "d_teaching",   label: "Explaining something till it finally clicks",
        domains: { teaching: 2 },
        spectra: { people: { v: +0.3, w: 0.2 }, visibility: { v: +0.3, w: 0.2 } } },
      { id: "d_operations", label: "Taking a mess and turning it into a system",
        domains: { operations: 2 },
        spectra: { ownership: { v: +0.3, w: 0.2 } } },
    ],
  },

  // ── Q3 — Stakes (fixed; primary Risk–Reward) ───────────────────────────────
  stakes: {
    type: "thisOrThat",
    prompt: "Pick your poison.",
    options: [
      { id: "steady", label: "$3K a month, steady and a little boring",
        spectra: { riskReward: { v: -1, w: 1.2 }, incomeModel: { v: -0.3, w: 0.3 },
                   ownership: { v: -0.4, w: 0.3 } } },
      { id: "moonshot", label: "Nothing yet — but a real shot at $30K",
        spectra: { riskReward: { v: +1, w: 1.2 }, incomeModel: { v: +0.3, w: 0.3 },
                   ownership: { v: +0.3, w: 0.3 } } },
    ],
  },

  // ── Q4 — Texture (fixed; primary People Orientation) ───────────────────────
  texture: {
    type: "thisOrThat",
    prompt: "Which day sounds better to you?",
    options: [
      { id: "solo", label: "Headphones on, locked in, nobody bothering you",
        spectra: { people: { v: -1, w: 1.2 }, visibility: { v: -0.4, w: 0.3 },
                   ownership: { v: -0.3, w: 0.2 } } },
      { id: "relational", label: "Calls, people, energy, stuff actually happening",
        spectra: { people: { v: +1, w: 1.2 }, visibility: { v: +0.3, w: 0.3 } } },
    ],
  },

  // ── Q5 — Spotlight (adaptive; primary Visibility) ──────────────────────────
  spotlight: {
    type: "thisOrThat",
    prompt: "When the money's good — are you cool being seen?",
    options: [
      { id: "oncamera", label: "Put me on camera, I'll build an audience",
        spectra: { visibility: { v: +1, w: 1.2 }, incomeModel: { v: +0.3, w: 0.3 } } },
      { id: "invisible", label: "I'd rather be the one nobody sees",
        spectra: { visibility: { v: -1, w: 1.2 } } },
    ],
  },

  // ── Q6 — Payment model (adaptive; primary Income Model) ────────────────────
  payment: {
    type: "thisOrThat",
    prompt: "How do you actually want to get paid?",
    options: [
      { id: "trade", label: "For the work I put in — clean and direct",
        spectra: { incomeModel: { v: -1, w: 1.2 } } },
      { id: "asset", label: "Build it once, let it pay me on repeat",
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
    prompt: "So what are you actually trying to build?",
    options: [
      // owner mode
      { id: "sub_product", label: "Something that runs without me",
        spectra: { ownership: { v: +1, w: 1.0 }, incomeModel: { v: +0.5, w: 0.4 } },
        tags: { founderType: "technical" } },
      { id: "sub_team", label: "A business that delivers through a team",
        spectra: { ownership: { v: +1, w: 1.0 }, people: { v: +0.4, w: 0.3 } },
        tags: { founderType: "agency" } },
      { id: "sub_store", label: "A store or product line that sells",
        spectra: { ownership: { v: +1, w: 1.0 } },
        tags: { founderType: "ecommerce" } },
      { id: "sub_audience", label: "An audience or brand that becomes the asset",
        spectra: { ownership: { v: +1, w: 1.0 }, visibility: { v: +0.4, w: 0.3 } },
        tags: { founderType: "media" } },
      { id: "sub_local", label: "A local operation I can grow past myself",
        spectra: { ownership: { v: +1, w: 1.0 } },
        gates: { localityLean: "local" },
        tags: { founderType: "service" } },
      // practitioner mode
      { id: "sub_own_thing", label: "Building my own thing",
        spectra: { ownership: { v: +0.6, w: 0.6 } } },
      { id: "sub_for_clients", label: "Getting paid to build for others",
        spectra: { ownership: { v: -1, w: 1.0 }, incomeModel: { v: -0.4, w: 0.4 } } },
    ],
  },

  // ── Q8 — Time (fixed constraint) ───────────────────────────────────────────
  time: {
    type: "tap",
    prompt: "Straight up — how much time can you really give this each week?",
    options: [
      { id: "t_minimal", label: "A few hours here and there", gates: { time: "minimal" } },
      { id: "t_low",     label: "5–10 hours",                  gates: { time: "low" } },
      { id: "t_mid",     label: "10–20 hours",                 gates: { time: "mid" } },
      { id: "t_high",    label: "20–40 hours",                 gates: { time: "high" } },
      { id: "t_full",    label: "All of it — this is the main thing", gates: { time: "full" } },
    ],
  },

  // ── Q9 — Capital (fixed constraint) ────────────────────────────────────────
  capital: {
    type: "tap",
    prompt: "What can you put in to start? No judgment either way.",
    options: [
      { id: "c_zero",  label: "$0 — gotta be free", gates: { capital: "zero" } },
      { id: "c_under", label: "Under $100",         gates: { capital: "under100" } },
      { id: "c_low",   label: "$100–$500",          gates: { capital: "low" } },
      { id: "c_mid",   label: "$500–$2K",           gates: { capital: "mid" } },
      { id: "c_high",  label: "$2K+",               gates: { capital: "high" } },
    ],
  },

  // ── Q10 — Locality (fixed constraint) ──────────────────────────────────────
  locality: {
    type: "tap",
    prompt: "Does this need to be fully online, or are you open to local work too?",
    options: [
      { id: "l_remote", label: "Online only",                gates: { locality: "remote" } },
      { id: "l_local",  label: "I'm open to local stuff",    gates: { locality: "local" } },
      { id: "l_either", label: "Whatever pays — don't care", gates: { locality: "either" } },
    ],
  },

  // ── Q11 — Vehicle (conditional: local/either) ──────────────────────────────
  vehicle: {
    type: "tap",
    prompt: "Got a car or van you can use?",
    options: [
      { id: "v_car",  label: "Yeah, car or van",     gates: { vehicle: "car" } },
      { id: "v_bike", label: "Bike or motorbike",    gates: { vehicle: "bike" } },
      { id: "v_none", label: "No wheels right now",  gates: { vehicle: "none" } },
    ],
  },

  // ── Q12 — Urgency precision (conditional: money_soon) ──────────────────────
  urgencyPrecision: {
    type: "tap",
    prompt: "How soon is soon, honestly?",
    options: [
      { id: "u_week",   label: "This week",            gates: { urgency: "this_week" } },
      { id: "u_month",  label: "This month",           gates: { urgency: "this_month" } },
      { id: "u_few",    label: "Next couple months",   gates: { urgency: "few_months" } },
      { id: "u_none",   label: "No hard deadline",     gates: { urgency: "none" } },
    ],
  },
};

// Fast lookup of an option object by question id + option id.
export function getOption(questionId, optionId) {
  const q = QUESTIONS[questionId];
  if (!q) return null;
  return q.options.find((o) => o.id === optionId) || null;
}
