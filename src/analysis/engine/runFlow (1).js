// ─────────────────────────────────────────────────────────────────────────────
// runFlow.js — headless orchestration. Given an answer-provider, run the whole
// adaptive flow and return the asked questions, final profile, and archetype.
// This is the seam the UI will eventually drive; tests drive it with canned answers.
// ─────────────────────────────────────────────────────────────────────────────

import { QUESTIONS, getOption } from "../data/questions.js";
import { createProfile, applyOption, derive } from "./profile.js";
import { nextQuestion } from "./branching.js";
import { selectArchetype } from "./archetype.js";

// answerFor(questionId, question) => optionId (string) or [optionId,...] for chips.
export function simulate(answerFor, { maxSteps = 30 } = {}) {
  const profile = createProfile();
  const asked = [];
  let derived = derive(profile);

  for (let i = 0; i < maxSteps; i++) {
    const qid = nextQuestion(asked, derived);
    if (qid === null) break;
    const question = QUESTIONS[qid];

    const choice = answerFor(qid, question);
    const optionIds = Array.isArray(choice) ? choice : [choice];
    for (const oid of optionIds) applyOption(profile, getOption(qid, oid));

    asked.push(qid);
    derived = derive(profile);
  }

  return {
    asked,
    count: asked.length,
    derived,
    archetype: selectArchetype(derived),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// deriveSession — the interactive seam for the UI. Given an answer history
// (array of { qid, optionIds:[...] }), rebuild the profile from scratch and
// report where the flow stands. Pure and stateless, so the UI can support
// back/reset simply by popping/clearing the history. Uses the SAME logic as
// simulate(); does not change any existing behaviour.
// ─────────────────────────────────────────────────────────────────────────────
export function deriveSession(history) {
  const profile = createProfile();
  for (const step of history) {
    for (const oid of step.optionIds) applyOption(profile, getOption(step.qid, oid));
  }
  const derived = derive(profile);
  const asked = history.map((h) => h.qid);
  const nextId = nextQuestion(asked, derived);
  return {
    profile,
    derived,
    asked,
    nextId,
    done: nextId === null,
    archetype: selectArchetype(derived),
  };
}
