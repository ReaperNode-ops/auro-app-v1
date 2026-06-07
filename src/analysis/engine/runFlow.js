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
