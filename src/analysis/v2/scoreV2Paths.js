// ─────────────────────────────────────────────────────────────────────────────
// scoreV2Paths.js — V2-native path ranking for the reveal.
//
// The V2 profile is richer than the legacy `answers` shape, so ranking the
// reveal through the old scoreOptions() (via toLegacyAnswers) loses signal and
// sometimes orders paths wrongly. This scorer reads the derived V2 profile and
// archetype DIRECTLY against ALL_OPTIONS.
//
//   scoreV2Paths({ derived, archetype })  → sorted [{ ...option, score }, ...]
//
// It does NOT touch the legacy scorer (engine/scoring.js stays as-is for V1).
// Pure function, no React, no IO.
//
// Reads from the derived profile:
//   domainTop / domainSecond / domainScores / domainConfidence
//   ownership.position · incomeModel.position · riskReward.position
//   people.position · visibility.position
//   gates.urgency / gates.capital / gates.time / gates.locality / gates.vehicle
//   tags.founderType / tags.urgencyHigh
//   archetype.key
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_OPTIONS } from "../data/paths.js";

// Which catalog tags signal membership in each V2 aptitude domain.
const DOMAIN_TAGS = {
  technical:  ["coding/tech", "technology", "ai"],
  creative:   ["design/visual creativity", "art & design", "video/editing",
               "photography", "music/audio", "music", "creative"],
  words:      ["writing/storytelling"],
  persuasion: ["sales/persuasion", "marketing/growth"],
  numbers:    ["finance/numbers"],
  teaching:   ["teaching/explaining"],
  handsOn:    ["hands-on", "trades"],
  operations: ["organisation/admin", "management", "business & entrepreneurship"],
};

// Named slow/long-horizon paths that urgent users must NOT see near the top.
const SLOW_BUILD_IDS = new Set([
  "saas-founder", "youtube", "blogger", "amazon-fba", "course-creator",
  "podcaster", "newsletter", "music-licensing", "stock-photos",
]);

// Archetype → predicate over a path's tag set / id (its natural cluster).
function archetypeFit(key, t, id) {
  switch (key) {
    case "mover":      return t.has("fast") || (t.has("active") && !t.has("long-term"));
    case "architect":  return t.has("coding/tech") || t.has("ai") ||
                               ["saas-founder", "ai-automation", "automation-specialist"].includes(id);
    case "operator":   return t.has("management") || t.has("business & entrepreneurship") ||
                               t.has("organisation/admin") ||
                               ["creator-agency", "growth-operator"].includes(id);
    case "merchant":   return t.has("e-commerce");
    case "signal":     return t.has("content") || t.has("social media");
    case "strategist": return t.has("marketing/growth") || t.has("organisation/admin");
    case "closer":     return t.has("sales/persuasion");
    case "authority":  return t.has("teaching/explaining") ||
                               ["course-creator", "newsletter"].includes(id);
    case "specialist": return t.has("coding/tech") || t.has("writing/storytelling") ||
                               t.has("design/visual creativity") || t.has("finance/numbers");
    case "maker":      return t.has("hands-on") || t.has("trades");
    default:           return false;
  }
}

export function scoreV2Paths(input = {}) {
  const derived = input.derived || input; // tolerate scoreV2Paths(derived, archetype)
  const archetype = input.archetype || arguments[1] || { key: "specialist" };
  const arche = archetype && archetype.key ? archetype.key : "specialist";

  // ── read the profile once ──────────────────────────────────────────────────
  const g = derived.gates || {};
  const urgency = g.urgency;
  const urgencyHigh = !!(derived.tags && derived.tags.urgencyHigh);
  const time = g.time;
  const capital = g.capital;
  const locality = g.locality;
  const vehicle = g.vehicle;

  const own = derived.ownership.position;
  const inc = derived.incomeModel.position;
  const risk = derived.riskReward.position;
  const ppl = derived.people.position;
  const vis = derived.visibility.position;

  const lowTime = time === "minimal" || time === "low";
  const highTime = time === "high" || time === "full";
  const zeroCap = capital === "zero" || capital === "under100";
  const remoteOnly = locality === "remote";
  const localOk = locality === "local" || locality === "either";
  const noVehicle = vehicle === "none";

  // Urgency: "now" (maxed) vs merely "soonish".
  const urgentNow =
    urgency === "this_week" || urgency === "this_month" ||
    (urgencyHigh && lowTime && urgency !== "few_months" && urgency !== "none");
  const soonish = !urgentNow && (urgencyHigh || urgency === "few_months");

  // domains the user actually picked (score > 0)
  const pickedDomains = new Set(
    Object.entries(derived.domainScores || {}).filter(([, v]) => v > 0).map(([k]) => k)
  );
  const pathDomains = (tags) =>
    Object.keys(DOMAIN_TAGS).filter((dom) => DOMAIN_TAGS[dom].some((tg) => tags.includes(tg)));

  const ranked = ALL_OPTIONS.map((opt) => {
    const tagsArr = opt.tags || [];
    const t = new Set(tagsArr);
    const id = opt.id;
    const speed = opt.speed;          // fast | medium | slow
    const diff = opt.difficulty;      // Beginner | Intermediate | Advanced
    let score = 50;
    const reasons = [];

    const isSlow = speed === "slow" || t.has("long-term") || SLOW_BUILD_IDS.has(id);
    const isFast = speed === "fast" || t.has("fast");
    const isCreator = t.has("content") || t.has("social media");
    const isPeopleHeavy = t.has("sales/persuasion") || t.has("teaching/explaining") || t.has("people");
    const localOnly = t.has("local") && !t.has("remote");
    const isTrade = t.has("trades") || t.has("hands-on");

    // ── 1. Domain fit (matters, but bounded so constraints can override) ──────
    const doms = pathDomains(tagsArr);
    if (derived.domainTop && doms.includes(derived.domainTop)) { score += 34; reasons.push("domain:top"); }
    else if (derived.domainSecond && doms.includes(derived.domainSecond)) { score += 20; reasons.push("domain:second"); }
    else if (doms.some((d) => pickedDomains.has(d))) { score += 12; reasons.push("domain:picked"); }

    // ── 2. Urgency ────────────────────────────────────────────────────────────
    if (urgentNow) {
      if (isFast) { score += 30; reasons.push("urgent:fast"); }
      else if (speed === "medium") score += 6;
      if (isSlow) { score -= 45; reasons.push("urgent:slow-penalty"); }
      if (SLOW_BUILD_IDS.has(id)) score -= 30; // stack hard penalty on the worst offenders
      if (diff === "Advanced") score -= 25;
      if (diff === "Beginner") score += 10;
    } else if (soonish) {
      if (isFast) score += 12;
      if (isSlow) score -= 15;
    }

    // ── 3. Capital ─────────────────────────────────────────────────────────────
    if (zeroCap) {
      if (t.has("high-budget")) { score -= 60; reasons.push("zero-cap:high-budget-penalty"); }
      if (t.has("no-budget")) score += 16;
      if (t.has("low-budget")) score += 8;
    } else if (capital === "high") {
      if (t.has("high-budget")) score += 6;
    }

    // ── 4. Time ────────────────────────────────────────────────────────────────
    if (lowTime) {
      if (diff === "Advanced") score -= 22;
      if (isSlow) score -= 16;
    } else if (highTime) {
      if (diff === "Advanced") score += 8;
      if (isSlow) score += 6;
    }

    // ── 5. Ownership + income model ─────────────────────────────────────────────
    if (inc > 0.2) {
      if (t.has("passive")) { score += 20; reasons.push("wants-asset"); }
      else if (t.has("active")) score -= 8;
    } else if (inc < -0.2) {
      if (t.has("active")) { score += 14; reasons.push("wants-active"); }
      if (t.has("passive")) score -= 10;
    }
    if (own > 0.25) {
      if (t.has("business & entrepreneurship") || opt.upside === "very-high") score += 14;
    } else if (own < -0.25) {
      if (t.has("active") && t.has("remote")) score += 10;
      if (["saas-founder", "amazon-fba"].includes(id)) score -= 14;
    }

    // ── 6. Visibility ───────────────────────────────────────────────────────────
    if (vis < -0.2 && isCreator) { score -= 30; reasons.push("low-vis:creator-penalty"); }
    if (vis > 0.2 && isCreator &&
        (doms.includes("creative") || doms.includes("words") || pickedDomains.has("creative") || pickedDomains.has("words"))) {
      score += 24; reasons.push("high-vis:creator");
    }

    // ── 7. People orientation ───────────────────────────────────────────────────
    if (ppl < -0.3 && isPeopleHeavy) { score -= 26; reasons.push("solo:people-penalty"); }
    if (ppl > 0.3 && isPeopleHeavy) { score += 18; reasons.push("relational:people"); }

    // ── 8. Locality + vehicle ───────────────────────────────────────────────────
    if (remoteOnly) {
      if (localOnly || isTrade) { score -= 45; reasons.push("remote:local-penalty"); }
      if (t.has("remote")) score += 12;
    } else if (localOk) {
      if (t.has("local")) score += 14;
    }
    if (noVehicle && t.has("vehicle")) { score -= 55; reasons.push("no-vehicle-penalty"); }

    // ── 9. Archetype cluster ────────────────────────────────────────────────────
    if (archetypeFit(arche, t, id)) { score += 16; reasons.push(`archetype:${arche}`); }

    // small nudge: risk-tolerant users get a lift toward high-upside paths
    if (risk > 0.3 && (opt.upside === "high" || opt.upside === "very-high")) score += 6;
    if (risk < -0.3 && opt.upside === "very-high") score -= 8;

    return { ...opt, score: Math.max(1, Math.round(score)), v2Reasons: reasons };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
