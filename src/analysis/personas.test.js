// ─────────────────────────────────────────────────────────────────────────────
// personas.test.js — headless regression suite. Run: `node personas.test.js`.
// Drives the engine with canned answers for the six core personas (plus a
// decisive-vs-uncertain pair) and asserts archetype + flow behaviour.
// ─────────────────────────────────────────────────────────────────────────────

import { simulate } from "../engine/runFlow.js";
import { ARCHETYPES } from "../data/archetypes.js";

// Each persona is a full answer map; the engine only consults the ones it reaches.
const PERSONAS = {
  technical_founder: {
    expect: "architect",
    answers: {
      motivation: "build_mine", domain: ["d_technical"], stakes: "moonshot",
      texture: "solo", spotlight: "invisible", payment: "asset",
      substrate: "sub_product", time: "t_high", capital: "c_mid", locality: "l_remote",
    },
  },
  agency_founder: {
    expect: "operator",
    answers: {
      motivation: "build_mine", domain: ["d_persuasion", "d_operations"],
      stakes: "moonshot", texture: "relational", spotlight: "invisible",
      payment: "asset", substrate: "sub_team", time: "t_high", capital: "c_low",
      locality: "l_remote",
    },
  },
  content_creator: {
    expect: "signal",
    answers: {
      motivation: "build_mine", domain: ["d_creative", "d_words"], stakes: "moonshot",
      texture: "solo", spotlight: "oncamera", payment: "asset",
      substrate: "sub_audience", time: "t_low", capital: "c_zero", locality: "l_remote",
    },
  },
  software_developer: {
    expect: "specialist",
    answers: {
      motivation: "find_good_at", domain: ["d_technical"], stakes: "steady",
      texture: "solo", spotlight: "invisible", payment: "trade",
      substrate: "sub_for_clients", time: "t_low", capital: "c_zero", locality: "l_remote",
    },
  },
  salesperson: {
    expect: "closer",
    answers: {
      motivation: "money_soon", domain: ["d_persuasion"], stakes: "moonshot",
      texture: "relational", spotlight: "invisible", payment: "trade",
      substrate: "sub_for_clients", time: "t_high", capital: "c_zero",
      locality: "l_remote", urgencyPrecision: "u_few",
    },
  },
  urgent_money: {
    expect: "mover",
    answers: {
      motivation: "money_soon", domain: ["d_handsOn", "d_operations"], stakes: "steady",
      texture: "solo", time: "t_high", capital: "c_zero", locality: "l_local",
      vehicle: "v_car", urgencyPrecision: "u_week",
    },
  },
};

// Decisive vs uncertain — same domain, different decisiveness/consistency.
// Decisive: a clean, consistent owner-builder → fixed block locks ownership +
// income, single domain chip → spotlight/payment/substrate all skip.
// Uncertain: no motivation seed, three conflicting domain chips, mixed answers →
// nothing locks early → payment + substrate fire.
const DECISIVE_DEV = {
  motivation: "build_mine", domain: ["d_technical"], stakes: "moonshot",
  texture: "solo", spotlight: "invisible", payment: "asset",
  substrate: "sub_product", time: "t_high", capital: "c_mid", locality: "l_remote",
};
const UNCERTAIN_DEV = {
  motivation: "just_looking",
  domain: ["d_technical", "d_persuasion", "d_numbers"], // wide → fires convergence
  stakes: "moonshot", texture: "relational",            // conflicts technical-solo leak
  spotlight: "oncamera", payment: "asset", substrate: "sub_own_thing",
  time: "t_low", capital: "c_zero", locality: "l_remote",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const provider = (answers) => (qid) => answers[qid];
const pos = (n) => (n >= 0 ? "+" : "") + n.toFixed(2);

function dimLine(d) {
  const f = (k) => `${k}:${pos(d[k].position)}(${d[k].band[0]})`;
  return [f("ownership"), f("incomeModel"), f("visibility"), f("people"), f("riskReward")].join("  ");
}

// ── run ─────────────────────────────────────────────────────────────────────
let failures = 0;
console.log("\n=== ANALYSIS V2 — PERSONA HARNESS ===\n");

for (const [name, p] of Object.entries(PERSONAS)) {
  const r = simulate(provider(p.answers));
  const got = r.archetype.key;
  const ok = got === p.expect;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  console.log(`      archetype : ${ARCHETYPES[got].title}  (expected ${p.expect})`);
  console.log(`      reasons   : ${r.archetype.reasons.join(" · ")}`);
  console.log(`      domain    : ${r.derived.domainTop} (conf ${r.derived.domainConfidence.toFixed(2)})`);
  console.log(`      spectra   : ${dimLine(r.derived)}`);
  console.log(`      questions : ${r.count} — ${r.asked.join(", ")}`);
  console.log("");
}

// ── adaptive shortening demonstration ─────────────────────────────────────────
const dec = simulate(provider(DECISIVE_DEV));
const unc = simulate(provider(UNCERTAIN_DEV));
console.log("--- adaptive shortening (same persona, different decisiveness) ---");
console.log(`      decisive dev : ${dec.count} questions — ${dec.asked.join(", ")}`);
console.log(`      uncertain dev: ${unc.count} questions — ${unc.asked.join(", ")}`);
const shorter = dec.count < unc.count;
if (!shorter) failures++;
console.log(`      ${shorter ? "PASS" : "FAIL"}  decisive (${dec.count}) < uncertain (${unc.count})\n`);

// ── no-collision check: all six core personas → distinct archetypes ───────────
const keys = Object.values(PERSONAS).map((p) => simulate(provider(p.answers)).archetype.key);
const distinct = new Set(keys).size === keys.length;
if (!distinct) failures++;
console.log(`--- collision check ---`);
console.log(`      archetypes: ${keys.join(", ")}`);
console.log(`      ${distinct ? "PASS" : "FAIL"}  all six personas distinct\n`);

console.log(`=== ${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"} ===\n`);
process.exit(failures === 0 ? 0 : 1);
