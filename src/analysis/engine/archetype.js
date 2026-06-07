// ─────────────────────────────────────────────────────────────────────────────
// archetype.js — select one of ten archetypes from a derived profile.
//
// Priority cascade (locked design):
//   1. Urgency override   → Mover
//   2. Owner branch       → founderType (or inferred) → Architect/Operator/
//                           Merchant/Signal/Strategist
//   3. Practitioner branch→ Domain + secondary axis → Closer/Signal/Authority/
//                           Specialist/Strategist/Maker
//
// Returns { key, reasons } — reasons are the dimension reads that produced it,
// used for the reveal's match rationale.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER_THRESHOLD = 0.25; // position above which we treat someone as owner-leaning

function urgencyMaxed(d) {
  const u = d.gates.urgency;
  if (u === "this_week" || u === "this_month") return true;
  // money_soon + barely any time = treat as urgent even before precision asked
  if (d.tags.urgencyHigh && (d.gates.time === "minimal" || d.gates.time === "low")) {
    return u !== "few_months" && u !== "none";
  }
  return false;
}

export function selectArchetype(d) {
  const reasons = [];

  // 1) Urgency override
  if (urgencyMaxed(d)) {
    return { key: "mover", reasons: ["urgency: needs income now"] };
  }

  const ownerLeaning =
    d.ownership.position > OWNER_THRESHOLD || !!d.tags.founderType;

  // 2) Owner branch
  if (ownerLeaning) {
    reasons.push("owner");
    const ft = d.tags.founderType;
    if (ft === "technical" || (!ft && d.domainTop === "technical"))
      return { key: "architect", reasons: [...reasons, "builds a product"] };
    if (ft === "agency" || ft === "service")
      return { key: "operator", reasons: [...reasons, "builds through a team"] };
    if (ft === "ecommerce")
      return { key: "merchant", reasons: [...reasons, "builds a product line"] };
    if (ft === "media")
      return { key: "signal", reasons: [...reasons, "builds an audience"] };
    // owner without a clear substrate: route by domain
    if (d.domainTop === "persuasion" && d.visibility.position < 0)
      return { key: "strategist", reasons: [...reasons, "growth behind the scenes"] };
    if (d.domainTop === "operations" || d.domainTop === "persuasion")
      return { key: "operator", reasons: [...reasons, "runs the operation"] };
    // creative/words owner who wants to be seen
    if (d.visibility.position > 0)
      return { key: "signal", reasons: [...reasons, "public-facing"] };
    return { key: "architect", reasons: [...reasons, "builds an asset"] };
  }

  // 3) Practitioner branch — route by domain + secondary axis
  reasons.push("practitioner");
  switch (d.domainTop) {
    case "persuasion":
      return d.people.position > 0
        ? { key: "closer", reasons: [...reasons, "persuasion · people-facing"] }
        : { key: "strategist", reasons: [...reasons, "commercial · behind the scenes"] };
    case "creative":
    case "words":
      return d.visibility.position > 0
        ? { key: "signal", reasons: [...reasons, `${d.domainTop} · wants to be seen`] }
        : { key: "specialist", reasons: [...reasons, `${d.domainTop} · craft-focused`] };
    case "teaching":
      return { key: "authority", reasons: [...reasons, "teaching"] };
    case "handsOn":
      return { key: "maker", reasons: [...reasons, "hands-on"] };
    case "operations":
      return { key: "strategist", reasons: [...reasons, "systems · behind the scenes"] };
    case "numbers":
    case "technical":
    default:
      return { key: "specialist", reasons: [...reasons, `${d.domainTop || "craft"} · depth`] };
  }
}
