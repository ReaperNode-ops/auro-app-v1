// ─────────────────────────────────────────────────────────────────────────────
// dimensions.js — the locked Analysis V2 profile model (data only, no logic).
// 9 dimensions: 1 categorical spine + 5 continuous spectra + 3 constraint gates.
// ─────────────────────────────────────────────────────────────────────────────

// ── The spine: aptitude domains (categorical, multi-value) ───────────────────
// A user holds an affinity score across these families; the top one routes them.
export const DOMAINS = [
  "technical",   // building / code / automation / data / cyber
  "creative",    // design / video / photo / music / illustration
  "words",       // copy / ghostwriting / newsletters / blogging
  "persuasion",  // sales / recruiting / growth / brand / commercial
  "teaching",    // tutoring / courses / coaching
  "numbers",     // bookkeeping / data analysis / finance
  "handsOn",     // trades / manual gig / barber / tattoo / physical
  "operations",  // VA / event / agency ops / systems
];

// ── The five continuous spectra (position in [-1..+1], plus a confidence) ─────
// Each spectrum names its two poles so UI / mirror copy can read them.
export const SPECTRA = {
  ownership:   { neg: "practitioner", pos: "owner" },
  incomeModel: { neg: "active",       pos: "passive" },
  visibility:  { neg: "behind",       pos: "public" },
  people:      { neg: "solo",         pos: "relational" },
  riskReward:  { neg: "steady",       pos: "variance" },
};
export const SPECTRUM_KEYS = Object.keys(SPECTRA);

// ── The three hard gates (discrete facts, asked never inferred) ───────────────
export const GATES = ["locality", "capital", "time", "vehicle", "urgency"];

// ── Confidence bands ──────────────────────────────────────────────────────────
// LOCKED   : confident enough to skip the confirmer for this dimension.
// AMBIGUOUS: fire the confirmer only if the dimension is decision-relevant.
// below AMBIGUOUS = "unknown".
export const BANDS = { LOCKED: 0.7, AMBIGUOUS: 0.4 };

// ── Tuning constants for the confidence math (see confidence.js) ──────────────
// MASS_FULL: total evidence weight at which the "mass" factor saturates.
//   Tuned so that:
//     • a dedicated this-or-that (w≈1.2) locks a dimension on its own,
//     • two CONSISTENT seeds (≈0.7 mass) also lock it — so a decisive fixed
//       block can preempt and skip a confirmer,
//     • a lone seed (≈0.4) stays in the AMBIGUOUS band (won't lock),
//     • conflicting signals never lock (agreement suppresses confidence).
//   This is what makes decisive users get a shorter flow.
export const MASS_FULL = 1.0;

// Domains are considered "wide / tied" (fires the convergence question) when the
// top family barely leads the second.
export const DOMAIN_DECISIVE = 0.5;

// Which top-domain families ever use Visibility as a routing signal. Trades and
// numbers don't, so the spotlight question is irrelevant for them.
export const VISIBILITY_DOMAINS = ["creative", "words", "persuasion", "teaching"];
