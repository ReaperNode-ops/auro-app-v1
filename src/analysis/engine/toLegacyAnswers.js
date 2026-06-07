// ─────────────────────────────────────────────────────────────────────────────
// toLegacyAnswers.js — Phase 2 compatibility bridge.
//
// Converts a derived V2 profile into the exact legacy `answers` shape that the
// existing scoreOptions() (and, later, derivePathFromAnswers()) read. This is
// what lets V2 ship WITHOUT changing the scorer, Tracking, or Chat: the rest of
// the app keeps speaking the old `answers` dialect.
//
// The scorer keys off substrings of specific string values, so every value
// below is chosen to trip the right branch (see scoreOptions). The mapping is
// intentionally lossy in two places (documented inline): V2 collapses the
// catalog's four "creative" skills into one domain, and has no standalone
// tech-proficiency or sub-direction questions — we reconstruct those from the
// richer V2 signal (visibility, ownership, domain rank) instead of asking again.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER_THRESHOLD = 0.25;

// V2 aptitude domain → a legacy skill string whose substrings trigger the
// matching skill-bonus branch in scoreOptions. Two domains disambiguate using
// extra V2 signal the legacy flow never had:
//   creative  → Video (if they want to be seen) else Design
//   persuasion→ Marketing/growth (owners) else Sales (practitioners)
function domainSkill(domain, d, ownerLeaning) {
  switch (domain) {
    case "technical":  return "Software development / engineering";
    case "creative":   return d.visibility.position > 0
                              ? "Video / editing"
                              : "Design / visual creativity";
    case "words":      return "Writing / content creation";
    case "persuasion": return ownerLeaning
                              ? "Marketing / growth"
                              : "Sales / business development";
    case "numbers":    return "Finance / accounting / analysis";
    case "teaching":   return "Teaching / coaching / mentoring";
    case "handsOn":    return "Hands-on / trades";
    case "operations": return "Marketing / growth"; // ops/systems cluster → growth/agency
    default:           return null;
  }
}

const BUDGET = {
  zero: "$0 (must be free)", under100: "Under $100", low: "$100 to $500",
  mid: "$500 to $2,000", high: "$2,000+",
};
const TIMEFRAME = {
  this_week: "Within 7 days", this_month: "Within 30 days",
  few_months: "1 to 3 months", none: "Flexible / no deadline",
};
const LOCATION = {
  remote: "Fully remote", local: "Open to local work", either: "Either works for me",
};

export function toLegacyAnswers(d) {
  const ownerLeaning = d.ownership.position > OWNER_THRESHOLD || !!d.tags.founderType;

  // skills — one per picked domain (deduped). The strong recommendation lever.
  const pickedDomains = Object.entries(d.domainScores)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);
  const skills = [...new Set(
    pickedDomains.map((dom) => domainSkill(dom, d, ownerLeaning)).filter(Boolean)
  )];

  // tech proficiency — reconstructed from where technical ranks in the profile.
  const tech =
    d.domainTop === "technical" ? "Advanced (I build things)"
    : d.domainScores.technical > 0 ? "Intermediate (comfortable with tools)"
    : "Basic (everyday user)";

  // coding direction — only meaningful for technical users; owners build product.
  const coding_direction =
    d.domainScores.technical > 0
      ? (d.tags.founderType === "technical" || (ownerLeaning && d.domainTop === "technical")
          ? "Building my own product"
          : "Freelancing for clients")
      : "";

  const income_type =
    d.incomeModel.position > 0.2 ? "Passive income"
    : d.incomeModel.position < -0.2 ? "Active income (paid for the work)"
    : "Hybrid (a mix of both)";

  const risk =
    d.riskReward.position > 0.3 ? "Aggressive (high risk, high reward)"
    : d.riskReward.position < -0.3 ? "Conservative (steady and safe)"
    : "Balanced";

  const people =
    d.people.position > 0.3 ? "High - I love working with people"
    : d.people.position < -0.3 ? "Low - I prefer working alone"
    : "Moderate - some interaction is fine";

  const content_comfort =
    d.visibility.position > 0.2
      ? "Very comfortable being on camera"
      : "Prefer to stay behind the scenes";

  const goal =
    ownerLeaning || d.incomeModel.position > 0.2
      ? "Build long-term scalable wealth"
      : "Generate steady income";

  // gates
  const budget = BUDGET[d.gates.capital] || "Under $100";
  const location_pref = LOCATION[d.gates.locality] || "Either works for me";
  const timeframe = TIMEFRAME[d.gates.urgency] || "Flexible / no deadline";
  // remote workers are never asked about a vehicle → "Yes" so no false penalty.
  const has_vehicle =
    d.gates.vehicle === "none" ? "No, I don't" : "Yes, I have one";

  return {
    skills,
    interests: [],
    budget,
    income_type,
    tech,
    timeframe,
    location_pref,
    risk,
    people,
    has_vehicle,
    content_comfort,
    goal,
    coding_direction,
    fitness_direction: "",
    // carried through for traceability / debugging — ignored by scoreOptions.
    _v2: { archetype: undefined, domainTop: d.domainTop },
  };
}
