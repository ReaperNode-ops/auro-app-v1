// ─────────────────────────────────────────────────────────────────────────────
// confidence.js — pure math turning accumulated evidence into position + confidence.
//
// Each answer contributes a signal to a spectrum: a direction/extremity v in
// [-1..+1] and an importance weight w. We accumulate three running totals per
// spectrum (in profile.js):
//   mass   = Σ w            total evidence weight
//   signed = Σ (w * v)      direction
//   abs    = Σ (w * |v|)    magnitude regardless of direction
//
// From those:
//   position  = signed / mass                  where the user sits (-1..+1)
//   agreement = |signed| / abs                 1 = all signals point one way,
//                                              →0 = signals conflict / cancel
//   massFactor = min(1, mass / MASS_FULL)       saturating "how much evidence"
//   confidence = massFactor * agreement         high only when there's enough
//                                              CONSISTENT evidence
//
// This is why decisiveness shortens the flow: an extreme, consistent answer
// drives confidence past LOCKED fast (skip the confirmer); conflicting or
// low-weight answers keep it in the AMBIGUOUS/unknown band (ask more).
// ─────────────────────────────────────────────────────────────────────────────

import { MASS_FULL } from "../data/dimensions.js";

export function emptyAccumulator() {
  return { mass: 0, signed: 0, abs: 0 };
}

export function addSignal(acc, v, w) {
  acc.mass += w;
  acc.signed += w * v;
  acc.abs += w * Math.abs(v);
  return acc;
}

export function resolve(acc) {
  if (acc.mass <= 1e-9) {
    return { position: 0, confidence: 0, agreement: 0, mass: 0 };
  }
  const position = acc.signed / acc.mass;
  const agreement = acc.abs > 1e-9 ? Math.abs(acc.signed) / acc.abs : 0;
  const massFactor = Math.min(1, acc.mass / MASS_FULL);
  const confidence = massFactor * agreement;
  return { position, confidence, agreement, mass: acc.mass };
}

// Domain confidence: is there a clear leader? Margin between #1 and #2 relative
// to the leader. One chip → 1.0 (decisive). Three equal chips → 0.0 (wide/tied),
// which fires the convergence question.
export function domainConfidence(domainScores) {
  const sorted = Object.values(domainScores).sort((a, b) => b - a);
  const top = sorted[0] || 0;
  const second = sorted[1] || 0;
  if (top <= 0) return 0;
  return (top - second) / top;
}
