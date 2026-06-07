// ─────────────────────────────────────────────────────────────────────────────
// profile.js — accumulate answered options into a profile, then derive it.
//
// The profile holds raw accumulators; derive() turns them into positions +
// confidences that branching.js and archetype.js read. Pure: no React, no IO.
// ─────────────────────────────────────────────────────────────────────────────

import { DOMAINS, SPECTRUM_KEYS, BANDS } from "../data/dimensions.js";
import { emptyAccumulator, addSignal, resolve, domainConfidence } from "./confidence.js";

export function createProfile() {
  const spectra = {};
  for (const k of SPECTRUM_KEYS) spectra[k] = emptyAccumulator();
  const domains = {};
  for (const d of DOMAINS) domains[d] = 0;
  return { spectra, domains, gates: {}, tags: {} };
}

// Fold a single chosen option's effects into the profile (mutates + returns).
export function applyOption(profile, option) {
  if (!option) return profile;
  if (option.spectra) {
    for (const [key, sig] of Object.entries(option.spectra)) {
      if (profile.spectra[key]) addSignal(profile.spectra[key], sig.v, sig.w);
    }
  }
  if (option.domains) {
    for (const [d, pts] of Object.entries(option.domains)) {
      profile.domains[d] = (profile.domains[d] || 0) + pts;
    }
  }
  if (option.gates) Object.assign(profile.gates, option.gates);
  if (option.tags) Object.assign(profile.tags, option.tags);
  return profile;
}

// Turn raw accumulators into the read-only view the rest of the engine uses.
export function derive(profile) {
  const out = { gates: { ...profile.gates }, tags: { ...profile.tags } };

  for (const k of SPECTRUM_KEYS) {
    const r = resolve(profile.spectra[k]);
    out[k] = {
      position: r.position,
      confidence: r.confidence,
      locked: r.confidence >= BANDS.LOCKED,
      band: r.confidence >= BANDS.LOCKED ? "locked"
           : r.confidence >= BANDS.AMBIGUOUS ? "ambiguous" : "unknown",
    };
  }

  // domain ranking
  const ranked = Object.entries(profile.domains)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  out.domainTop = ranked.length ? ranked[0][0] : null;
  out.domainSecond = ranked.length > 1 ? ranked[1][0] : null;
  out.domainScores = { ...profile.domains };
  out.domainConfidence = domainConfidence(profile.domains);

  return out;
}
