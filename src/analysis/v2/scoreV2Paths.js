// ─────────────────────────────────────────────────────────────────────────────
// scoreV2Paths.js — V2-native path ranking for the reveal.
//
// Phase 4.6.4 — doability pass. Earlier versions ranked on aptitude/disposition
// fit alone, which surfaced directionally-right but unrealistic paths (e.g. a
// broke, no-experience student getting UI/UX Designer or SaaS Founder). The
// scorer now reads the doability signal the 4.6.2/4.6.3 flow collects — readiness,
// lifeStage, selling, localType, the resource flags (hasLaptop/Camera/Vehicle/…)
// and the quick-money routing flags — against the per-path metadata added in
// 4.6.1 (readiness/tier/requires*/studentFriendly/quickCash).
//
// Two scores are tracked per path:
//   fit   — aptitude + disposition + archetype (who the user IS)
//   score — fit + doability (what the user can actually START NOW)
// scoreV2Paths() ranks by `score`. selectV2Result() uses both to split results
// into Start now / Build next / Long-term upside / Backup tiers.
//
// Doability DOMINATES for starter/doability-sensitive users (low readiness,
// student, urgent, broke, low time); for higher-readiness non-urgent users the
// starter layer goes quiet and strong fit paths (SaaS, automation, UI/UX, data,
// agency) rank normally again.
//
// Does NOT touch the legacy scorer (engine/scoring.js). Pure function, no IO.
//
//   scoreV2Paths({ derived, archetype })    → sorted [{ ...opt, score, v2Reasons }]
//   selectV2Result({ derived, archetype })  → { startNow, buildNext, longTerm, backup }
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

// Named slow/long-horizon paths urgent users must NOT see near the top.
const SLOW_BUILD_IDS = new Set([
  "saas-founder", "youtube", "blogger", "amazon-fba", "course-creator",
  "podcaster", "newsletter", "music-licensing", "stock-photos",
]);

// ── Quick-money / localType routing id sets ──────────────────────────────────
const QUICK_LOCAL_IDS = new Set([
  "lawn-care", "snow-removal", "car-washing", "house-cleaning", "moving-helper",
  "pressure-washing", "window-cleaner", "painter-decorator", "errand-runner",
  "junk-removal", "car-detailer",
]);
const SERVICE_LOCAL_IDS = new Set([
  "babysitting", "pet-sitting", "dog-walker", "errand-runner", "house-sitting",
  "moving-helper", "event-planner",
]);
const CLEANING_IDS = new Set([
  "house-cleaning", "car-washing", "car-detailer", "window-cleaner", "pressure-washing",
]);
const DELIVERY_IDS = new Set(["delivery-driver", "uber-driver", "junk-removal"]);
const QUICK_REMOTE_IDS = new Set([
  "virtual-assistant", "data-entry", "customer-support", "spreadsheet-service", "resume-helper",
]);
const QUICK_SALES_IDS = new Set([
  "appointment-setter", "cold-email-setter", "lead-gen", "local-lead-gen",
  "sales-rep", "remote-closer",
]);
const QUICK_TUTOR_IDS = new Set(["online-tutor", "tutoring-younger", "homework-helper"]);
const QUICK_CONTENT_IDS = new Set([
  "short-form-editor", "video-editor", "thumbnail-designer", "canva-designer",
  "logo-social-designer", "content-clipper", "caption-writer", "social-media-helper",
  "motion-graphics",
]);
const QUICK_RESELL_IDS = new Set([
  "reseller", "furniture-flipping", "sneaker-flipping", "phone-flipping",
]);
// Public, on-camera personality paths (distinct from behind-the-scenes content WORK).
const ON_CAMERA_IDS = new Set([
  "youtube", "tiktok-creator", "twitch-streamer", "personal-brand",
  "ugc-creator", "affiliate-shortform",
]);
const EDIT_IDS = new Set([
  "short-form-editor", "video-editor", "thumbnail-designer", "content-clipper",
  "canva-designer", "logo-social-designer", "motion-graphics",
]);
// Remote, laptop-based STARTER SKILL paths that match a creative/technical/words/
// operations direction — the realistic-but-aligned options a remote beginner
// should see first (distinct from generic admin gigs and physical flipping).
const REMOTE_SKILL_IDS = new Set([
  "content-clipper", "short-form-editor", "video-editor", "thumbnail-designer",
  "canva-designer", "logo-social-designer", "caption-writer", "social-media-helper",
]);
const LAPTOP_DOMAIN_TAGS = [
  "coding/tech", "technology", "ai", "design/visual creativity",
  "writing/storytelling", "organisation/admin", "marketing/growth", "finance/numbers",
];

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

// ── Build the per-user context once (all the reads + derived flags) ──────────
function buildContext(derived, archetype) {
  const g = derived.gates || {};
  const tg = derived.tags || {};
  const arche = archetype && archetype.key ? archetype.key : "specialist";

  const urgency = g.urgency;
  const urgencyHigh = !!tg.urgencyHigh;
  const time = g.time;
  const capital = g.capital;
  const locality = g.locality;
  const vehicle = g.vehicle;
  const readinessGate = g.readiness;   // none | basic | proof | earned
  const lifeStage = g.lifeStage;       // student | partTime | flexible | serious
  const selling = g.selling;           // avoid | scripted | pitch | direct
  const localType = g.localType;       // physical | service | cleaning | delivery | avoid

  const lowTime = time === "minimal" || time === "low";
  const highTime = time === "high" || time === "full";
  const zeroCap = capital === "zero" || capital === "under100";
  const remoteOnly = locality === "remote";
  const localOk = locality === "local" || locality === "either";

  const urgentNow =
    urgency === "this_week" || urgency === "this_month" ||
    (urgencyHigh && lowTime && urgency !== "few_months" && urgency !== "none");
  const soonish = !urgentNow && (urgencyHigh || urgency === "few_months");

  const hasLaptop = !!tg.hasLaptop;
  const hasCamera = !!tg.hasCamera;
  const hasTools = !!tg.hasTools;
  const userHasVehicle = !!tg.hasVehicle || vehicle === "car" || vehicle === "bike";
  const noVehicleNow = vehicle === "none" || !userHasVehicle;

  const qLocal = !!tg.quickLocalPhysical;
  const qRemote = !!tg.quickRemoteAdmin;
  const qSales = !!tg.quickSalesOutreach;
  const qTutor = !!tg.quickTutoring;
  const qContent = !!tg.quickContent;
  const qResell = !!tg.quickReselling;

  const contentType = tg.contentType; // faceCam | facelessEdits | ugc | educational | behindContent
  const lowReadiness = readinessGate === "none" || readinessGate === "basic";

  // Starter / doability-sensitive user (4.6.4 rule 1).
  const starterMode =
    lowReadiness || lifeStage === "student" || urgentNow || urgencyHigh ||
    zeroCap || lowTime;

  const pickedDomains = new Set(
    Object.entries(derived.domainScores || {}).filter(([, v]) => v > 0).map(([k]) => k)
  );

  // True when the user signals behind-the-scenes content WORK (not on camera).
  const behindContent = contentType === "facelessEdits" || contentType === "behindContent";
  // User has a laptop-based skill direction (creative/technical/words/operations).
  const skillDomains = ["creative", "technical", "words", "operations"];
  const hasSkillDomain =
    skillDomains.includes(derived.domainTop) ||
    skillDomains.includes(derived.domainSecond) ||
    skillDomains.some((d) => pickedDomains.has(d));
  // Remote + laptop + a skill direction + a content lean → surface remote starter
  // SKILL paths over generic admin / physical flipping (4.6.4b rule 2).
  const remoteSkillMode =
    remoteOnly && hasLaptop && hasSkillDomain && (behindContent || qContent);

  return {
    arche, urgency, urgencyHigh, capital, locality, vehicle,
    readinessGate, lifeStage, selling, localType,
    lowTime, highTime, zeroCap, remoteOnly, localOk,
    urgentNow, soonish,
    hasLaptop, hasCamera, hasTools, userHasVehicle, noVehicleNow,
    qLocal, qRemote, qSales, qTutor, qContent, qResell,
    contentType, lowReadiness, starterMode,
    behindContent, hasSkillDomain, remoteSkillMode,
    pickedDomains,
    own: derived.ownership.position,
    inc: derived.incomeModel.position,
    risk: derived.riskReward.position,
    ppl: derived.people.position,
    vis: derived.visibility.position,
    domainTop: derived.domainTop,
    domainSecond: derived.domainSecond,
  };
}

const pathDomains = (tags) =>
  Object.keys(DOMAIN_TAGS).filter((dom) => DOMAIN_TAGS[dom].some((tg) => tags.includes(tg)));

// A path that is physically impossible given the user's hard constraints.
function physicallyImpossible(opt, c) {
  return (
    (opt.requiresVehicle && c.noVehicleNow) ||
    (opt.requiresLocalAccess && c.remoteOnly) ||
    (opt.requiresCamera && !c.hasCamera)
  );
}

// ── Score one path. Returns { score, fit, reasons }. ─────────────────────────
function scoreOne(opt, c) {
  const tagsArr = opt.tags || [];
  const t = new Set(tagsArr);
  const id = opt.id;
  const speed = opt.speed;
  const diff = opt.difficulty;
  const reasons = [];

  // Beginner paths that produce proof fast (days / a couple weeks) — the
  // portfolio bar is low because samples can be built quickly.
  const ttf = String(opt.timeToFirst || "");
  const quickProof = diff === "Beginner" && /day|wk/i.test(ttf) && !/mo/i.test(ttf);

  let fit = 50;   // aptitude + disposition + archetype
  let doab = 0;   // doability (constraints, readiness, resources, routing)

  const isSlow = speed === "slow" || t.has("long-term") || SLOW_BUILD_IDS.has(id);
  const isFast = speed === "fast" || t.has("fast");
  const isOnCamera = opt.requiresCamera === true || ON_CAMERA_IDS.has(id);
  const isContentWork = t.has("content") || t.has("social media") || t.has("video/editing");
  const isPeopleHeavy = t.has("sales/persuasion") || t.has("teaching/explaining") || t.has("people");
  const localOnly = t.has("local") && !t.has("remote");
  const isTrade = t.has("trades") || t.has("hands-on");
  const doms = pathDomains(tagsArr);

  // ══ FIT ════════════════════════════════════════════════════════════════════
  if (c.domainTop && doms.includes(c.domainTop)) { fit += 34; reasons.push("domain:top"); }
  else if (c.domainSecond && doms.includes(c.domainSecond)) { fit += 20; reasons.push("domain:second"); }
  else if (doms.some((d) => c.pickedDomains.has(d))) { fit += 12; reasons.push("domain:picked"); }

  if (c.inc > 0.2) { if (t.has("passive")) { fit += 20; } else if (t.has("active")) fit -= 8; }
  else if (c.inc < -0.2) { if (t.has("active")) fit += 14; if (t.has("passive")) fit -= 10; }
  if (c.own > 0.25) { if (t.has("business & entrepreneurship") || opt.upside === "very-high") fit += 14; }
  else if (c.own < -0.25) {
    if (t.has("active") && t.has("remote")) fit += 10;
    if (["saas-founder", "amazon-fba"].includes(id)) fit -= 14;
  }

  if (c.vis < -0.2 && isOnCamera) { fit -= 30; reasons.push("low-vis:on-camera-penalty"); }
  if (c.vis > 0.2 && isContentWork &&
      (doms.includes("creative") || doms.includes("words") ||
       c.pickedDomains.has("creative") || c.pickedDomains.has("words"))) {
    fit += 20; reasons.push("high-vis:content");
  }

  if (c.ppl < -0.3 && isPeopleHeavy) { fit -= 26; reasons.push("solo:people-penalty"); }
  if (c.ppl > 0.3 && isPeopleHeavy) { fit += 18; reasons.push("relational:people"); }

  if (c.contentType === "faceCam" && isOnCamera) { fit += 18; reasons.push("ct:faceCam"); }
  if (c.contentType === "facelessEdits" || c.contentType === "behindContent") {
    if (EDIT_IDS.has(id) || REMOTE_SKILL_IDS.has(id)) { fit += 28; reasons.push("ct:behind-content"); }
    if (isOnCamera) { fit -= 24; reasons.push("ct:behind-on-camera-penalty"); }
  }
  if (c.contentType === "ugc" && (id === "ugc-creator" || t.has("video/editing"))) fit += 14;
  if (c.contentType === "educational" &&
      (t.has("teaching/explaining") || QUICK_TUTOR_IDS.has(id) || id === "course-creator")) {
    fit += 14; reasons.push("ct:educational");
  }

  if (archetypeFit(c.arche, t, id)) { fit += 16; reasons.push("archetype:" + c.arche); }
  if (c.risk > 0.3 && (opt.upside === "high" || opt.upside === "very-high")) fit += 6;
  if (c.risk < -0.3 && opt.upside === "very-high") fit -= 8;

  // ══ DOABILITY ═══════════════════════════════════════════════════════════════
  if (c.urgentNow) {
    if (isFast) { doab += 30; reasons.push("urgent:fast"); }
    else if (speed === "medium") doab += 6;
    if (isSlow) { doab -= 45; reasons.push("urgent:slow-penalty"); }
    if (SLOW_BUILD_IDS.has(id)) doab -= 30;
    if (diff === "Advanced") doab -= 25;
    if (diff === "Beginner") doab += 10;
  } else if (c.soonish) {
    if (isFast) doab += 12;
    if (isSlow) doab -= 15;
  }

  if (c.zeroCap) {
    if (t.has("high-budget")) { doab -= 60; reasons.push("zero-cap:high-budget-penalty"); }
    if (t.has("no-budget")) doab += 16;
    if (t.has("low-budget")) doab += 8;
  } else if (c.capital === "high") {
    if (t.has("high-budget")) doab += 6;
  }

  if (c.lowTime) {
    if (diff === "Advanced") doab -= 22;
    if (isSlow) doab -= 16;
  } else if (c.highTime) {
    if (diff === "Advanced") doab += 8;
    if (isSlow) doab += 6;
  }

  if (c.remoteOnly) {
    if (localOnly || isTrade) { doab -= 45; reasons.push("remote:local-penalty"); }
    if (t.has("remote")) doab += 12;
  } else if (c.localOk) {
    if (t.has("local")) doab += 14;
  }
  if (c.noVehicleNow && t.has("vehicle")) { doab -= 55; reasons.push("no-vehicle:tag-penalty"); }

  // Universal reality gates (metadata-driven; apply to everyone)
  if (opt.requiresVehicle && c.noVehicleNow) { doab -= 60; reasons.push("requires-vehicle:none"); }
  if (opt.requiresLocalAccess && c.remoteOnly) { doab -= 50; reasons.push("requires-local:remote"); }
  if (opt.requiresCamera && !c.hasCamera) { doab -= 38; reasons.push("requires-camera:none"); }
  if (opt.requiresSelling === "high" && (c.selling === "avoid" || c.selling === "scripted")) {
    doab -= 34; reasons.push("requires-selling-high:wont");
  }
  if (opt.requiresExperience === "strong" && c.lowReadiness) { doab -= 30; reasons.push("needs-strong-exp"); }
  if (opt.requiresPortfolio && c.lowReadiness) {
    doab -= quickProof ? 10 : 26; reasons.push(quickProof ? "needs-portfolio:soft" : "needs-portfolio");
  }
  if (opt.requiresAudience) doab -= 8;

  // Resource routing (tools)
  const laptopHeavy = t.has("remote") && LAPTOP_DOMAIN_TAGS.some((x) => t.has(x));
  if (!c.hasLaptop && laptopHeavy) { doab -= 22; reasons.push("no-laptop:remote-skilled"); }
  if (c.hasTools && (t.has("hands-on") || t.has("trades"))) doab += 12;

  // Starter layer (doability dominates for starter-mode users)
  if (c.starterMode) {
    if (opt.readiness === "start-now") { doab += 24; reasons.push("starter:start-now"); }
    if (opt.readiness === "build-over-time") { doab -= 34; reasons.push("starter:build-over-time-penalty"); }
    if (opt.tier === "starter") { doab += 22; reasons.push("starter:tier"); }
    else if (opt.tier === "skill-builder") doab += 8;
    else if (opt.tier === "creator") doab -= 30;
    else if (opt.tier === "business") doab -= 30;
    else if (opt.tier === "career") doab -= 34;
    else if (opt.tier === "long-term") doab -= 45;
    // quickCash is a tiebreaker, not a trump card — kept small so a generic
    // cash gig can't outrank a domain-aligned starter SKILL path.
    if (opt.quickCash) { doab += 14; reasons.push("starter:quickCash"); }
    if (opt.studentFriendly && c.lifeStage === "student") { doab += 16; reasons.push("starter:studentFriendly"); }
    if (opt.requiresExperience === "strong") doab -= 20;
    if (opt.requiresAudience) doab -= 26;
    if (diff === "Beginner") doab += 12;
    if (isFast) doab += 10;
    for (const tag of ["fast", "no-budget", "low-budget", "active", "flexible", "low-tech"]) {
      if (t.has(tag)) doab += 3;
    }

    const domainAligned =
      doms.includes(c.domainTop) || doms.includes(c.domainSecond) ||
      doms.some((d) => c.pickedDomains.has(d));

    // Directional fit AFTER doability: once a starter/learn-first path is
    // realistic, reward the ones that actually match the user's direction so
    // aligned skill paths beat generic gigs.
    const starterish = opt.readiness === "start-now" || opt.readiness === "learn-first";
    const starterTier = opt.tier === "starter" || opt.tier === "skill-builder";
    if (starterish && starterTier && domainAligned) { doab += 18; reasons.push("starter:directional"); }
    // Behind-the-scenes content lean → lift the matching content-service paths.
    if (c.behindContent && REMOTE_SKILL_IDS.has(id)) { doab += 14; reasons.push("starter:behind-content"); }

    // Non-urgent starter users get recommendations WITHIN their area of interest:
    // an urgent broke user takes any fast gig, but a non-urgent beginner who
    // chose "creative" should see beginner CREATIVE work, not generic data entry.
    if (!c.urgentNow && !c.urgencyHigh && c.pickedDomains.size > 0 && !domainAligned) {
      doab -= 40; reasons.push("starter:off-domain");
    }
  }

  // Remote + laptop + skill direction + content lean → surface remote starter
  // SKILL paths; keep generic admin (VA/data entry) as practical backup only.
  if (c.remoteSkillMode) {
    if (REMOTE_SKILL_IDS.has(id)) { doab += 24; reasons.push("remote-skill"); }
    else if (id === "spreadsheet-service" &&
             (c.pickedDomains.has("operations") || c.pickedDomains.has("technical"))) {
      doab += 20; reasons.push("remote-skill:spreadsheet");
    } else if (id === "virtual-assistant" || id === "data-entry") {
      doab += 8; reasons.push("remote-skill:backup");
    }
  }

  // Remote locality is a stronger FINAL constraint than earlier quick-money
  // willingness: physical/local flipping shouldn't ride quickReselling to the
  // top of a remote user's list.
  if (c.remoteOnly && QUICK_RESELL_IDS.has(id)) { doab -= 30; reasons.push("remote:flip-penalty"); }

  // Quick-money routing (urgent users who said what they'd do)
  if (c.qLocal && QUICK_LOCAL_IDS.has(id) && !c.remoteOnly) { doab += 30; reasons.push("quick:local"); }
  if (c.qRemote && QUICK_REMOTE_IDS.has(id)) { doab += 30; reasons.push("quick:remote"); }
  if (c.qSales && QUICK_SALES_IDS.has(id) && c.selling !== "avoid") { doab += 30; reasons.push("quick:sales"); }
  if (c.qTutor && QUICK_TUTOR_IDS.has(id)) { doab += 30; reasons.push("quick:tutor"); }
  if (c.qContent && QUICK_CONTENT_IDS.has(id)) { doab += 30; reasons.push("quick:content"); }
  // Reselling stays available but is dialed back for remote users so it lands as
  // a backup, not the headline, unless commerce is clearly their direction.
  if (c.qResell && QUICK_RESELL_IDS.has(id)) {
    doab += c.remoteOnly ? 12 : 30; reasons.push("quick:resell");
  }

  // localType routing
  if (c.localType === "physical" && (QUICK_LOCAL_IDS.has(id) || (localOnly && isTrade))) doab += 20;
  if (c.localType === "service" && SERVICE_LOCAL_IDS.has(id)) doab += 20;
  if (c.localType === "cleaning" && CLEANING_IDS.has(id)) doab += 20;
  if (c.localType === "delivery" && DELIVERY_IDS.has(id) && c.userHasVehicle) doab += 20;
  if (c.localType === "avoid" && (localOnly || opt.requiresLocalAccess)) { doab -= 34; reasons.push("localType:avoid"); }

  const fitScore = Math.round(fit);
  const score = Math.max(1, Math.round(fit + doab));
  return { score, fit: fitScore, reasons };
}

// ── Public: ranked single list (reveal-compatible) ──────────────────────────
export function scoreV2Paths(input = {}) {
  const derived = input.derived || input;
  const archetype = input.archetype || arguments[1] || { key: "specialist" };
  const c = buildContext(derived, archetype);

  return ALL_OPTIONS
    .map((opt) => {
      const { score, reasons } = scoreOne(opt, c);
      return { ...opt, score, v2Reasons: reasons };
    })
    .sort((a, b) => b.score - a.score);
}

// ── Public: tiered result (Start now / Build next / Long-term / Backup) ──────
// Not wired into Reveal yet (Phase 4.6.5). Each bucket is a single best path
// object (or null), de-duplicated across buckets.
export function selectV2Result(input = {}) {
  const derived = input.derived || input;
  const archetype = input.archetype || arguments[1] || { key: "specialist" };
  const c = buildContext(derived, archetype);

  const scored = ALL_OPTIONS.map((opt) => {
    const { score, fit, reasons } = scoreOne(opt, c);
    return { ...opt, score, fit, v2Reasons: reasons };
  });

  const byScore = [...scored].sort((a, b) => b.score - a.score);
  const byFit = [...scored].sort((a, b) => b.fit - a.fit);

  const isStartNow = (p) =>
    p.readiness === "start-now" || p.tier === "starter" || p.quickCash === true;
  const isBuildNext = (p) =>
    !isStartNow(p) && (p.tier === "skill-builder" || p.readiness === "learn-first");
  const isLongTerm = (p) =>
    p.readiness === "build-over-time" ||
    ["business", "career", "long-term", "creator"].includes(p.tier);

  const used = new Set();
  const take = (list, pred) => {
    for (const p of list) {
      if (used.has(p.id)) continue;
      if (pred(p)) { used.add(p.id); return p; }
    }
    return null;
  };

  const startNow = take(byScore, isStartNow);
  const buildNext = take(byScore, isBuildNext);
  const longTerm = take(byFit, (p) => isLongTerm(p) && !physicallyImpossible(p, c));
  const backup = take(byScore, isStartNow);

  return { startNow, buildNext, longTerm, backup };
}
