// ─────────────────────────────────────────────────────────────────────────────
// recommendations.test.js — Phase 2 bridge proof. Run: `node recommendations.test.js`.
//
// Full pipeline per persona: V2 flow → derived profile → toLegacyAnswers → the
// EXISTING scoreOptions. Prints archetype, flow length, converted legacy answers,
// top-4 recommendations, and the top score. Asserts each persona's top-4 contains
// at least one sensible expected path.
// ─────────────────────────────────────────────────────────────────────────────

import { simulate } from "../engine/runFlow.js";
import { toLegacyAnswers } from "../engine/toLegacyAnswers.js";
import { scoreOptions } from "../engine/scoring.js";
import { ARCHETYPES } from "../data/archetypes.js";

const PERSONAS = {
  technical_founder: {
    sensible: ["saas-founder", "ai-automation", "automation-specialist", "freelance-developer"],
    answers: { motivation: "build_mine", domain: ["d_technical"], stakes: "moonshot",
      texture: "solo", spotlight: "invisible", payment: "asset", substrate: "sub_product",
      time: "t_high", capital: "c_mid", locality: "l_remote" },
  },
  agency_founder: {
    sensible: ["growth-operator", "personal-brand", "creator-agency", "content-strategist", "affiliate-marketer"],
    answers: { motivation: "build_mine", domain: ["d_persuasion", "d_operations"],
      stakes: "moonshot", texture: "relational", spotlight: "invisible", payment: "asset",
      substrate: "sub_team", time: "t_high", capital: "c_low", locality: "l_remote" },
  },
  content_creator: {
    sensible: ["youtube", "newsletter", "ugc-creator", "blogger", "tiktok-creator", "short-form-editor"],
    answers: { motivation: "build_mine", domain: ["d_creative", "d_words"], stakes: "moonshot",
      texture: "solo", spotlight: "oncamera", payment: "asset", substrate: "sub_audience",
      time: "t_low", capital: "c_zero", locality: "l_remote" },
  },
  software_developer: {
    sensible: ["freelance-developer", "web-developer", "no-code-developer", "ai-automation"],
    answers: { motivation: "find_good_at", domain: ["d_technical"], stakes: "steady",
      texture: "solo", spotlight: "invisible", payment: "trade", substrate: "sub_for_clients",
      time: "t_low", capital: "c_zero", locality: "l_remote" },
  },
  salesperson: {
    sensible: ["remote-closer", "sales-rep", "recruiter", "appointment-setter", "lead-gen"],
    answers: { motivation: "money_soon", domain: ["d_persuasion"], stakes: "moonshot",
      texture: "relational", spotlight: "invisible", payment: "trade", substrate: "sub_for_clients",
      time: "t_high", capital: "c_zero", locality: "l_remote", urgencyPrecision: "u_few" },
  },
  urgent_money: {
    sensible: ["delivery-driver", "uber-driver", "junk-removal", "car-detailer", "reseller", "pressure-washing", "window-cleaner"],
    answers: { motivation: "money_soon", domain: ["d_handsOn", "d_operations"], stakes: "steady",
      texture: "solo", time: "t_high", capital: "c_zero", locality: "l_local",
      vehicle: "v_car", urgencyPrecision: "u_week" },
  },
};

const provider = (answers) => (qid) => answers[qid];
const pos = (n) => (n >= 0 ? "+" : "") + n.toFixed(2);

let failures = 0;
console.log("\n=== ANALYSIS V2 → LEGACY BRIDGE — RECOMMENDATION PROOF ===\n");

for (const [name, p] of Object.entries(PERSONAS)) {
  const run = simulate(provider(p.answers));
  const legacy = toLegacyAnswers(run.derived);
  legacy._v2.archetype = run.archetype.key;
  const ranked = scoreOptions(legacy);
  const top4 = ranked.slice(0, 4);

  const hit = top4.some((o) => p.sensible.includes(o.id));
  if (!hit) failures++;

  console.log(`${hit ? "PASS" : "FAIL"}  ${name}`);
  console.log(`      V2 archetype : ${ARCHETYPES[run.archetype.key].title}`);
  console.log(`      flow length  : ${run.count} — ${run.asked.join(", ")}`);
  console.log(`      legacy answers:`);
  console.log(`        skills        : ${JSON.stringify(legacy.skills)}`);
  console.log(`        income_type   : ${legacy.income_type}`);
  console.log(`        tech          : ${legacy.tech}`);
  console.log(`        timeframe     : ${legacy.timeframe}`);
  console.log(`        location_pref : ${legacy.location_pref}`);
  console.log(`        risk          : ${legacy.risk}`);
  console.log(`        people        : ${legacy.people}`);
  console.log(`        budget        : ${legacy.budget}`);
  console.log(`        has_vehicle   : ${legacy.has_vehicle}`);
  console.log(`        content_comfort: ${legacy.content_comfort}`);
  console.log(`        goal          : ${legacy.goal}`);
  console.log(`        coding_direction: ${legacy.coding_direction || "(n/a)"}`);
  console.log(`      top 4 recs   : ${top4.map((o) => `${o.title} (${o.score})`).join("  ·  ")}`);
  console.log(`      top score    : ${top4[0].title} = ${top4[0].score}`);
  console.log("");
}

console.log(`=== ${failures === 0 ? "ALL PASS — every persona gets sensible recommendations" : failures + " FAILURE(S)"} ===\n`);
process.exit(failures === 0 ? 0 : 1);
