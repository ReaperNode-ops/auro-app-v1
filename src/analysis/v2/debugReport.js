// ─────────────────────────────────────────────────────────────────────────────
// debugReport.js — TEMPORARY developer diagnostic (not production).
//
// Builds a single copy-pasteable plain-text report for one completed Analysis V2
// run: answer history (with prompts/labels/effects), the derived profile, the
// archetype, the top-10 scoreV2Paths results with full metadata + v2Reasons, the
// selectV2Result tiers (if the export exists), and the selected path.
//
// Pure formatting. Reads (does not modify) questions.js + scoreV2Paths.js.
// Remove this file (and the "Copy debug report" button in Reveal.jsx) when done.
// ─────────────────────────────────────────────────────────────────────────────

import { QUESTIONS, getOption } from "../data/questions.js";
import { scoreV2Paths, selectV2Result } from "./scoreV2Paths.js";

const HR = "─".repeat(70);

function fmtVal(v) {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function fmtSpectrum(s) {
  if (!s) return "n/a";
  const pos = typeof s.position === "number" ? s.position.toFixed(3) : fmtVal(s.position);
  return `pos=${pos}  conf=${typeof s.confidence === "number" ? s.confidence.toFixed(3) : fmtVal(s.confidence)}  ${s.locked ? "LOCKED" : "unlocked"}  band=${fmtVal(s.band)}`;
}

function effectsOf(opt) {
  if (!opt) return "";
  const parts = [];
  if (opt.spectra) parts.push("spectra=" + JSON.stringify(opt.spectra));
  if (opt.domains) parts.push("domains=" + JSON.stringify(opt.domains));
  if (opt.gates) parts.push("gates=" + JSON.stringify(opt.gates));
  if (opt.tags) parts.push("tags=" + JSON.stringify(opt.tags));
  return parts.length ? parts.join("  ") : "(no effects)";
}

function historySection(history) {
  const out = ["1) ANSWER HISTORY", HR];
  if (!Array.isArray(history) || history.length === 0) {
    out.push(
      "(history not provided to Reveal — add `history={history}` to <Reveal/> in",
      " AnalysisV2.jsx to enable this section; the rest of the report is unaffected.)"
    );
    return out.join("\n");
  }
  history.forEach((entry, i) => {
    const qid = entry.qid ?? entry.questionId ?? entry.id;
    const optionIds = Array.isArray(entry.optionIds)
      ? entry.optionIds
      : [entry.optionIds ?? entry.optionId ?? entry.choice ?? entry.answer];
    const q = QUESTIONS[qid];
    out.push(`#${i + 1}  [${qid}]  ${q ? q.prompt : "(unknown question)"}`);
    optionIds.forEach((oid) => {
      const opt = getOption(qid, oid);
      out.push(`     • ${oid}  "${opt ? opt.label : "(unknown option)"}"`);
      out.push(`         ${effectsOf(opt)}`);
    });
  });
  return out.join("\n");
}

function profileSection(d) {
  const out = ["2) DERIVED PROFILE", HR];
  out.push(`domainTop:        ${fmtVal(d.domainTop)}`);
  out.push(`domainSecond:     ${fmtVal(d.domainSecond)}`);
  out.push(`domainScores:     ${fmtVal(d.domainScores)}`);
  out.push(`domainConfidence: ${typeof d.domainConfidence === "number" ? d.domainConfidence.toFixed(3) : fmtVal(d.domainConfidence)}`);
  out.push("");
  out.push("spectra:");
  for (const k of ["ownership", "incomeModel", "riskReward", "people", "visibility"]) {
    out.push(`  ${k.padEnd(12)} ${fmtSpectrum(d[k])}`);
  }
  out.push("");
  out.push(`gates: ${JSON.stringify(d.gates || {}, null, 0)}`);
  out.push(`tags:  ${JSON.stringify(d.tags || {}, null, 0)}`);
  return out.join("\n");
}

function archetypeSection(a) {
  const out = ["3) ARCHETYPE", HR];
  out.push(`key:     ${a ? fmtVal(a.key) : "n/a"}`);
  out.push(`reasons: ${a && a.reasons ? JSON.stringify(a.reasons) : "[]"}`);
  return out.join("\n");
}

function pathBlock(p, rank) {
  const flags = [
    `readiness=${fmtVal(p.readiness)}`,
    `tier=${fmtVal(p.tier)}`,
    `difficulty=${fmtVal(p.difficulty)}`,
    `speed=${fmtVal(p.speed)}`,
    `timeToFirst=${fmtVal(p.timeToFirst)}`,
    `reqExp=${fmtVal(p.requiresExperience)}`,
    `reqPortfolio=${fmtVal(p.requiresPortfolio)}`,
    `reqAudience=${fmtVal(p.requiresAudience)}`,
    `reqSelling=${fmtVal(p.requiresSelling)}`,
    `reqVehicle=${fmtVal(p.requiresVehicle)}`,
    `reqLocalAccess=${fmtVal(p.requiresLocalAccess)}`,
    `reqCamera=${fmtVal(p.requiresCamera)}`,
    `studentFriendly=${fmtVal(p.studentFriendly)}`,
    `quickCash=${fmtVal(p.quickCash)}`,
  ];
  const lines = [];
  const r = rank != null ? `#${String(rank).padStart(2, " ")}  ` : "";
  lines.push(`${r}[${p.id}]  ${p.title}   score=${fmtVal(p.score)}`);
  lines.push(`      ${flags.join("  ")}`);
  lines.push(`      tags: ${JSON.stringify(p.tags || [])}`);
  lines.push(`      v2Reasons: ${JSON.stringify(p.v2Reasons || [])}`);
  return lines.join("\n");
}

function resultsSection(derived, archetype) {
  const out = ["4) RECOMMENDATIONS — top 10 (scoreV2Paths)", HR];
  let ranked = [];
  try {
    ranked = scoreV2Paths({ derived, archetype });
  } catch (e) {
    out.push("ERROR running scoreV2Paths: " + (e && e.message));
    return out.join("\n");
  }
  ranked.slice(0, 10).forEach((p, i) => out.push(pathBlock(p, i + 1)));
  return out.join("\n");
}

function tiersSection(derived, archetype) {
  const out = ["5) TIERS (selectV2Result)", HR];
  if (typeof selectV2Result !== "function") {
    out.push("(selectV2Result not exported — skipping)");
    return out.join("\n");
  }
  let tiers;
  try {
    tiers = selectV2Result({ derived, archetype });
  } catch (e) {
    out.push("ERROR running selectV2Result: " + (e && e.message));
    return out.join("\n");
  }
  for (const key of ["startNow", "buildNext", "longTerm", "backup"]) {
    const p = tiers[key];
    out.push(`▸ ${key}:`);
    out.push(p ? pathBlock(p) : "      (none)");
  }
  return out.join("\n");
}

function selectedSection(selectedPath) {
  const out = ["6) SELECTED PATH", HR];
  if (!selectedPath) {
    out.push("(none selected yet)");
    return out.join("\n");
  }
  out.push(`id:        ${fmtVal(selectedPath.id)}`);
  out.push(`title:     ${fmtVal(selectedPath.title)}`);
  out.push(`score:     ${fmtVal(selectedPath.score)}`);
  out.push(`v2Reasons: ${JSON.stringify(selectedPath.v2Reasons || [])}`);
  return out.join("\n");
}

export function buildDebugReport({ derived, archetype, history, selectedPath }) {
  const stamp = new Date().toISOString();
  const blocks = [
    `ANALYSIS V2 — DEBUG REPORT  (${stamp})`,
    HR,
    historySection(history),
    "",
    profileSection(derived),
    "",
    archetypeSection(archetype),
    "",
    resultsSection(derived, archetype),
    "",
    tiersSection(derived, archetype),
    "",
    selectedSection(selectedPath),
    HR,
    "END OF REPORT",
  ];
  return blocks.join("\n");
}
