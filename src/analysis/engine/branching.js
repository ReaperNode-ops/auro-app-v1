// ─────────────────────────────────────────────────────────────────────────────
// branching.js — decide the next question from the derived profile.
//
// Pipeline order is fixed; each step has a `when` predicate. nextQuestion walks
// the pipeline and returns the first step not yet asked whose predicate passes.
// Decisive answers lock dimensions → confirmer predicates fail → they're skipped
// → the flow is shorter. Urgent users (money_soon) skip the disposition
// confirmers entirely and go straight to constraints.
// ─────────────────────────────────────────────────────────────────────────────

import { BANDS, DOMAIN_DECISIVE, VISIBILITY_DOMAINS } from "../data/dimensions.js";

const visibilityRelevant = (d) => VISIBILITY_DOMAINS.includes(d.domainTop);

const PIPELINE = [
  // Fixed disposition block — always asked.
  { id: "motivation" },
  { id: "domain" },
  { id: "stakes" },
  { id: "texture" },

  // Adaptive confirmers — fire only if their dimension is below LOCKED AND
  // still decision-relevant. Urgent users skip all three.
  { id: "spotlight",
    when: (d) => !d.tags.urgencyHigh && visibilityRelevant(d) && !d.visibility.locked },
  { id: "payment",
    when: (d) => !d.tags.urgencyHigh && !d.incomeModel.locked },
  { id: "substrate",
    when: (d) => !d.tags.urgencyHigh &&
                 (!d.ownership.locked || d.domainConfidence < DOMAIN_DECISIVE) },

  // Constraints — always asked, last.
  { id: "time" },
  { id: "capital" },
  { id: "locality" },

  // Conditionals — pure logic gates.
  { id: "vehicle",
    when: (d) => d.gates.locality === "local" || d.gates.locality === "either" },
  { id: "urgencyPrecision",
    when: (d) => d.tags.urgencyHigh === true },
];

export function nextQuestion(askedIds, derived) {
  const asked = new Set(askedIds);
  for (const step of PIPELINE) {
    if (asked.has(step.id)) continue;
    if (!step.when || step.when(derived)) return step.id;
  }
  return null; // complete
}

export function isComplete(askedIds, derived) {
  return nextQuestion(askedIds, derived) === null;
}

export { BANDS };
