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
    prompt: "What are you trying to change first?",
    options: [
      {
        id: "money_soon",
        label: "I need income as soon as possible",
        spectra: { incomeModel: { v: -1, w: 0.4 }, ownership: { v: -0.4, w: 0.3 } },
        gates: { urgency: "provisional_soon" },
        tags: { urgencyHigh: true },
      },
      {
        id: "build_mine",
        label: "I want to build something of my own",
        spectra: {
          ownership:   { v: +1,   w: 0.6 },
          incomeModel: { v: +0.5, w: 0.4 },
          riskReward:  { v: +0.6, w: 0.4 },
        },
      },
      {
        id: "escape_9to5",
        label: "I want more control over my future",
        spectra: { ownership: { v: +0.6, w: 0.4 }, riskReward: { v: +0.4, w: 0.3 } },
      },
      {
        id: "find_good_at",
        label: "I want to understand what I am best suited for",
        tags: { domainProbe: true },
      },
      {
        id: "just_looking",
        label: "I am exploring my options",
        tags: { domainProbe: true },
      },
    ],
  },
 
  // ── Q2 — Domain affinity (fixed; pick up to 3) ─────────────────────────────
  domain: {
    type: "chips",
    maxPick: 3,
    prompt: "What type of work naturally holds your attention?",
    options: [
      { id: "d_technical",  label: "Making systems, tools, or technology work",
        domains: { technical: 2 },
        spectra: { people: { v: -0.4, w: 0.3 }, visibility: { v: -0.3, w: 0.2 } } },
      { id: "d_creative",   label: "Designing or creating something visually strong",
        domains: { creative: 2 } },
      { id: "d_words",      label: "Writing, explaining, or shaping ideas clearly",
        domains: { words: 2 },
        spectra: { people: { v: -0.3, w: 0.2 } } },
      { id: "d_persuasion", label: "Persuading people and creating momentum",
        domains: { persuasion: 2 },
        spectra: { people: { v: +0.7, w: 0.4 }, riskReward: { v: +0.3, w: 0.2 } } },
      { id: "d_numbers",    label: "Solving problems with logic, data, or numbers",
        domains: { numbers: 2 },
        spectra: { people: { v: -0.4, w: 0.3 } } },
      { id: "d_handsOn",    label: "Building, fixing, or improving physical things",
        domains: { handsOn: 2 },
        spectra: { visibility: { v: -0.6, w: 0.4 }, incomeModel: { v: -0.4, w: 0.3 } } },
      { id: "d_teaching",   label: "Helping someone understand something clearly",
        domains: { teaching: 2 },
        spectra: { people: { v: +0.3, w: 0.2 }, visibility: { v: +0.3, w: 0.2 } } },
      { id: "d_operations", label: "Turning disorder into a working system",
        domains: { operations: 2 },
        spectra: { ownership: { v: +0.3, w: 0.2 } } },
    ],
  },
 
  // ── Q3 — Stakes (fixed; primary Risk–Reward) ───────────────────────────────
  stakes: {
    type: "thisOrThat",
    prompt: "Which tradeoff would you rather accept?",
    options: [
      { id: "steady", label: "Reliable income with limited upside",
        spectra: { riskReward: { v: -1, w: 1.2 }, incomeModel: { v: -0.3, w: 0.3 },
                   ownership: { v: -0.4, w: 0.3 } } },
      { id: "moonshot", label: "Uncertain income with much higher upside",
        spectra: { riskReward: { v: +1, w: 1.2 }, incomeModel: { v: +0.3, w: 0.3 },
                   ownership: { v: +0.3, w: 0.3 } } },
    ],
  },
 
  // ── Q4 — Texture (fixed; primary People Orientation) ───────────────────────
  texture: {
    type: "thisOrThat",
    prompt: "Which workday would suit you better?",
    options: [
      { id: "solo", label: "Focused solo work with minimal interruption",
        spectra: { people: { v: -1, w: 1.2 }, visibility: { v: -0.4, w: 0.3 },
                   ownership: { v: -0.3, w: 0.2 } } },
      { id: "relational", label: "Conversations, collaboration, and active momentum",
        spectra: { people: { v: +1, w: 1.2 }, visibility: { v: +0.3, w: 0.3 } } },
    ],
  },
 
  // ── Q5 — Spotlight (adaptive; primary Visibility) ──────────────────────────
  spotlight: {
    type: "thisOrThat",
    prompt: "How public do you want your work to be?",
    options: [
      { id: "oncamera", label: "I am comfortable being visible",
        spectra: { visibility: { v: +1, w: 1.2 }, incomeModel: { v: +0.3, w: 0.3 } } },
      { id: "invisible", label: "I prefer to work behind the scenes",
        spectra: { visibility: { v: -1, w: 1.2 } } },
    ],
  },
 
  // ── Q6 — Payment model (adaptive; primary Income Model) ────────────────────
  payment: {
    type: "thisOrThat",
    prompt: "Which income model is more appealing?",
    options: [
      { id: "trade", label: "Getting paid directly for the work I do",
        spectra: { incomeModel: { v: -1, w: 1.2 } } },
      { id: "asset", label: "Building something that can earn repeatedly",
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
    prompt: "What kind of outcome are you most interested in building?",
    options: [
      // owner mode
      { id: "sub_product", label: "A product or system that can operate without me",
        spectra: { ownership: { v: +1, w: 1.0 }, incomeModel: { v: +0.5, w: 0.4 } },
        tags: { founderType: "technical" } },
      { id: "sub_team", label: "A business that grows through people and process",
        spectra: { ownership: { v: +1, w: 1.0 }, people: { v: +0.4, w: 0.3 } },
        tags: { founderType: "agency" } },
      { id: "sub_store", label: "A product line or store with repeatable sales",
        spectra: { ownership: { v: +1, w: 1.0 } },
        tags: { founderType: "ecommerce" } },
      { id: "sub_audience", label: "An audience or brand that becomes an asset",
        spectra: { ownership: { v: +1, w: 1.0 }, visibility: { v: +0.4, w: 0.3 } },
        tags: { founderType: "media" } },
      { id: "sub_local", label: "A local operation that can scale over time",
        spectra: { ownership: { v: +1, w: 1.0 } },
        gates: { localityLean: "local" },
        tags: { founderType: "service" } },
      // practitioner mode
      { id: "sub_own_thing", label: "An independent path I control",
        spectra: { ownership: { v: +0.6, w: 0.6 } } },
      { id: "sub_for_clients", label: "Valuable work delivered for clients or employers",
        spectra: { ownership: { v: -1, w: 1.0 }, incomeModel: { v: -0.4, w: 0.4 } } },
    ],
  },
 
  // ── Q8 — Time (fixed constraint) ───────────────────────────────────────────
  time: {
    type: "tap",
    prompt: "What level of time can you realistically commit?",
    options: [
      { id: "t_minimal", label: "A few hours when I can",  gates: { time: "minimal" } },
      { id: "t_low",     label: "5-10 hours per week",     gates: { time: "low" } },
      { id: "t_mid",     label: "10-20 hours per week",    gates: { time: "mid" } },
      { id: "t_high",    label: "20-40 hours per week",    gates: { time: "high" } },
      { id: "t_full",    label: "This is my main focus",   gates: { time: "full" } },
    ],
  },
 
  // ── Q9 — Capital (fixed constraint) ────────────────────────────────────────
  capital: {
    type: "tap",
    prompt: "What could you realistically invest to begin?",
    options: [
      { id: "c_zero",  label: "$0, it needs to start free", gates: { capital: "zero" } },
      { id: "c_under", label: "Under $100",                 gates: { capital: "under100" } },
      { id: "c_low",   label: "$100-$500",                  gates: { capital: "low" } },
      { id: "c_mid",   label: "$500-$2K",                   gates: { capital: "mid" } },
      { id: "c_high",  label: "$2K+",                       gates: { capital: "high" } },
    ],
  },
 
  // ── Q10 — Locality (fixed constraint) ──────────────────────────────────────
  locality: {
    type: "tap",
    prompt: "What kind of setup do you prefer?",
    options: [
      { id: "l_remote", label: "Fully online or remote",                  gates: { locality: "remote" } },
      { id: "l_local",  label: "Open to local opportunities",             gates: { locality: "local" } },
      { id: "l_either", label: "Either, as long as the path makes sense", gates: { locality: "either" } },
    ],
  },
 
  // ── Q11 — Vehicle (conditional: local/either) ──────────────────────────────
  vehicle: {
    type: "tap",
    prompt: "What transportation access do you have?",
    options: [
      { id: "v_car",  label: "Car or van access",                   gates: { vehicle: "car" } },
      { id: "v_bike", label: "Bike or motorbike access",            gates: { vehicle: "bike" } },
      { id: "v_none", label: "No reliable transportation right now", gates: { vehicle: "none" } },
    ],
  },
 
  // ── Q12 — Urgency precision (conditional: money_soon) ──────────────────────
  urgencyPrecision: {
    type: "tap",
    prompt: "When do you need this to start working?",
    options: [
      { id: "u_week",   label: "This week",                gates: { urgency: "this_week" } },
      { id: "u_month",  label: "This month",               gates: { urgency: "this_month" } },
      { id: "u_few",    label: "Over the next few months", gates: { urgency: "few_months" } },
      { id: "u_none",   label: "No hard deadline",         gates: { urgency: "none" } },
    ],
  },

  // ── Q13 — Readiness (new; data-only, not yet wired into branching) ─────────
  readiness: {
    type: "tap",
    prompt: "What are you starting with right now?",
    options: [
      { id: "r_none",   label: "No real experience yet",
        gates: { readiness: "none" } },
      { id: "r_basic",  label: "I have basic skills, but no proof yet",
        gates: { readiness: "basic" } },
      { id: "r_proof",  label: "I have some examples or proof",
        gates: { readiness: "proof" } },
      { id: "r_earned", label: "I've already made money from this before",
        gates: { readiness: "earned" },
        spectra: { incomeModel: { v: -0.3, w: 0.3 } } },
    ],
  },

  // ── Q14 — Schedule / life stage (new; writes both time and lifeStage) ──────
  schedule: {
    type: "tap",
    prompt: "What does your week actually look like?",
    options: [
      { id: "s_student",  label: "Still in school, limited hours",
        gates: { lifeStage: "student",  time: "low" } },
      { id: "s_parttime", label: "Part-time availability",
        gates: { lifeStage: "partTime", time: "low" } },
      { id: "s_flexible", label: "Flexible schedule",
        gates: { lifeStage: "flexible", time: "mid" } },
      { id: "s_serious",  label: "I can work on this seriously most days",
        gates: { lifeStage: "serious",  time: "high" } },
    ],
  },

  // ── Q15 — Tools / resources (new; multi-select; absorbs vehicle) ───────────
  // Distinct boolean keys per option so multi-select survives Object.assign.
  tools: {
    type: "chips",
    maxPick: 6,
    prompt: "What do you already have access to?",
    options: [
      { id: "tool_laptop",  label: "Laptop or computer",
        tags: { hasLaptop: true } },
      { id: "tool_camera",  label: "Phone with a decent camera",
        tags: { hasCamera: true } },
      { id: "tool_vehicle", label: "Car or reliable transportation",
        gates: { vehicle: "car" }, tags: { hasVehicle: true } },
      { id: "tool_tools",   label: "Basic tools or equipment",
        tags: { hasTools: true } },
      { id: "tool_money",   label: "Some money to invest",
        tags: { hasMoney: true } },
      { id: "tool_none",    label: "None of these",
        gates: { vehicle: "none" } },
    ],
  },

  // ── Q16 — Quick money willingness (new; multi-select) ──────────────────────
  // Boolean flag per option (NOT a shared quickType key) so picks accumulate.
  quickMoney: {
    type: "chips",
    maxPick: 6,
    prompt: "What would you actually be willing to do for faster money?",
    options: [
      { id: "qm_local",     label: "Local physical work",
        tags: { quickLocalPhysical: true } },
      { id: "qm_remote",    label: "Remote admin or support",
        tags: { quickRemoteAdmin: true } },
      { id: "qm_sales",     label: "Sales or outreach",
        tags: { quickSalesOutreach: true } },
      { id: "qm_tutoring",  label: "Tutoring or helping people",
        tags: { quickTutoring: true } },
      { id: "qm_content",   label: "Content, editing, or design",
        tags: { quickContent: true } },
      { id: "qm_reselling", label: "Reselling or flipping",
        tags: { quickReselling: true } },
    ],
  },

  // ── Q17 — Content type (new; single-select) ────────────────────────────────
  contentType: {
    type: "tap",
    prompt: "What kind of content work would you actually do?",
    options: [
      { id: "ct_facecam",     label: "Face on camera",
        spectra: { visibility: { v: +0.8, w: 0.5 } },
        tags: { contentType: "faceCam" } },
      { id: "ct_faceless",    label: "Faceless edits or clips",
        spectra: { visibility: { v: -0.6, w: 0.4 } },
        tags: { contentType: "facelessEdits" } },
      { id: "ct_ugc",         label: "Product videos or UGC",
        tags: { contentType: "ugc" } },
      { id: "ct_educational", label: "Educational content",
        domains: { teaching: 1 },
        tags: { contentType: "educational" } },
      { id: "ct_behind",      label: "I like content work, but not being the personality",
        spectra: { visibility: { v: -0.6, w: 0.4 } },
        tags: { contentType: "behindContent" } },
    ],
  },

  // ── Q18 — Selling willingness (new; single-select) ─────────────────────────
  selling: {
    type: "tap",
    prompt: "How willing are you to reach out or sell?",
    options: [
      { id: "sell_avoid",    label: "I'd rather avoid it",
        gates: { selling: "avoid" },
        spectra: { people: { v: -0.4, w: 0.3 } } },
      { id: "sell_scripted", label: "I can message people if I have a script",
        gates: { selling: "scripted" } },
      { id: "sell_pitch",    label: "I'm fine pitching strangers",
        gates: { selling: "pitch" },
        spectra: { people: { v: +0.4, w: 0.3 } } },
      { id: "sell_direct",   label: "I'm comfortable selling directly",
        gates: { selling: "direct" },
        spectra: { people: { v: +0.5, w: 0.3 } },
        domains: { persuasion: 1 } },
    ],
  },

  // ── Q19 — Local work type (new; single-select) ─────────────────────────────
  localType: {
    type: "tap",
    prompt: "What kind of local work would you actually do?",
    options: [
      { id: "lt_physical", label: "Physical work",
        gates: { localType: "physical" },
        domains: { handsOn: 1 } },
      { id: "lt_service",  label: "People or service work",
        gates: { localType: "service" },
        spectra: { people: { v: +0.4, w: 0.3 } } },
      { id: "lt_cleaning", label: "Cleaning or detailing",
        gates: { localType: "cleaning" },
        domains: { handsOn: 1 } },
      { id: "lt_delivery", label: "Delivery or transportation",
        gates: { localType: "delivery" } },
      { id: "lt_avoid",    label: "I'd rather avoid local work",
        gates: { localType: "avoid" } },
    ],
  },
};
 
// Fast lookup of an option object by question id + option id.
export function getOption(questionId, optionId) {
  const q = QUESTIONS[questionId];
  if (!q) return null;
  return q.options.find((o) => o.id === optionId) || null;
}
