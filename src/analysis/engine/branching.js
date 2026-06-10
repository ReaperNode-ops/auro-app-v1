// ─────────────────────────────────────────────────────────────────────────────
// branching.js — decide the next question from the derived profile.
//
// Pipeline order is fixed; each step has a `when` predicate. nextQuestion walks
// the pipeline and returns the first step not yet asked whose predicate passes.
// Decisive answers lock dimensions → confirmer predicates fail → they're skipped
// → the flow is shorter.
//
// Phase 4.6.3 — doability pass. The flow now collects what a path actually
// REQUIRES to start, not just disposition:
//   • readiness is asked early (right after domain).
//   • Urgent users get MORE practical questions, not fewer: they answer
//     urgencyPrecision + quickMoney (what they're actually willing to do) and
//     still go through every constraint. They only skip the long-term
//     PREFERENCE confirmers (spotlight / payment / substrate).
//   • schedule replaces the old `time` question (writes gates.time + lifeStage).
//   • tools     replaces the old `vehicle` question (writes gates.vehicle + the
//     resource flags). The old `time`/`vehicle` definitions still exist in
//     questions.js but are no longer asked here.
//   • contentType / selling / localType are adaptive doability follow-ups that
//     only fire when relevant.
//
// spotlight vs contentType: both probe visibility, so we never ask both. Content
// users (creative/words, or "content" picked for quick money) get the richer
// contentType; the other visibility-relevant domains (persuasion/teaching) keep
// spotlight.
// ─────────────────────────────────────────────────────────────────────────────

import { BANDS, DOMAIN_DECISIVE, VISIBILITY_DOMAINS } from "../data/dimensions.js";

// Safety ceiling — the pipeline is built to top out around 14, this just
// guarantees the flow can never exceed the design's hard max.
const HARD_MAX = 16;

const visibilityRelevant = (d) => VISIBILITY_DOMAINS.includes(d.domainTop);

// Content-format question applies to content-leaning users: creative/words by
// domain, or anyone who said they'd do "content" for quick money.
const isContentDomain = (d) =>
  ["creative", "words"].includes(d.domainTop) ||
  ["creative", "words"].includes(d.domainSecond);
const contentTypeApplies = (d) => isContentDomain(d) || !!d.tags.quickContent;

// Selling-willingness question applies to people-/sales-/business-leaning users.
const sellingApplies = (d) => {
  const persuasionLean = d.domainTop === "persuasion" || d.domainSecond === "persuasion";
  const relational = d.people.position > 0.3;
  const quickSales = !!d.tags.quickSalesOutreach;
  const businessLean = ["agency", "service", "ecommerce"].includes(d.tags.founderType);
  return persuasionLean || relational || quickSales || businessLean;
};

const PIPELINE = [
  // ── Fixed disposition block — always asked (readiness slotted in early). ──
  { id: "motivation" },
  { id: "domain" },
  { id: "readiness" },
  { id: "stakes" },
  { id: "texture" },

  // ── Urgent doability branch — fires before any ranking constraint so urgent
  //    users are routed by what they're actually willing to do. ──
  { id: "urgencyPrecision", when: (d) => d.tags.urgencyHigh === true },
  { id: "quickMoney",       when: (d) => d.tags.urgencyHigh === true },

  // ── Long-term PREFERENCE confirmers — non-urgent only, and only while the
  //    dimension is still unresolved + decision-relevant. ──
  { id: "spotlight",
    when: (d) => !d.tags.urgencyHigh && visibilityRelevant(d) &&
                 !d.visibility.locked && !contentTypeApplies(d) },
  { id: "payment",
    when: (d) => !d.tags.urgencyHigh && !d.incomeModel.locked },
  { id: "substrate",
    when: (d) => !d.tags.urgencyHigh &&
                 (!d.ownership.locked || d.domainConfidence < DOMAIN_DECISIVE) },

  // ── Adaptive doability follow-ups — asked for urgent + non-urgent alike. ──
  { id: "contentType", when: (d) => contentTypeApplies(d) },
  { id: "selling",     when: (d) => sellingApplies(d) },

  // ── Core constraints — everyone. schedule⟶time, tools⟶vehicle. ──
  { id: "schedule" },
  { id: "tools" },
  { id: "capital" },
  { id: "locality" },

  // ── Local-only follow-up. ──
  { id: "localType",
    when: (d) => d.gates.locality === "local" || d.gates.locality === "either" },
];

export function nextQuestion(askedIds, derived) {
  const asked = new Set(askedIds);
  if (asked.size >= HARD_MAX) return null; // safety ceiling
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
