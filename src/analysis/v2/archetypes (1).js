// ─────────────────────────────────────────────────────────────────────────────
// v2/archetypes.js — REVEAL PRESENTATION ONLY.
//
// The archetype *copy* (title, identity line, mirror, feeling) lives in
// data/archetypes.js and is NOT duplicated here. This file adds the visual
// treatment the reveal card needs — accent gradient + glyph — keyed by the same
// archetype keys. Kept on-brand: gold + blue family with subtle per-identity
// variation. Purely presentational; no logic, no engine coupling.
// ─────────────────────────────────────────────────────────────────────────────

export const ARCHETYPE_STYLE = {
  mover:      { accent: "#ff8a3d", accent2: "#f5c842", glyph: "◇" },
  architect:  { accent: "#4a9eff", accent2: "#7be0ff", glyph: "△" },
  operator:   { accent: "#6c7bff", accent2: "#4a9eff", glyph: "▦" },
  merchant:   { accent: "#f5c842", accent2: "#ff8a3d", glyph: "◈" },
  signal:     { accent: "#f5c842", accent2: "#ffe9a3", glyph: "◉" },
  strategist: { accent: "#3ad1c6", accent2: "#4a9eff", glyph: "⬡" },
  closer:     { accent: "#ff5e7a", accent2: "#f5c842", glyph: "◆" },
  specialist: { accent: "#4a9eff", accent2: "#a3c9ff", glyph: "◇" },
  authority:  { accent: "#b07bff", accent2: "#4a9eff", glyph: "✦" },
  maker:      { accent: "#ffa64d", accent2: "#f5c842", glyph: "▲" },
};

export function styleFor(key) {
  return ARCHETYPE_STYLE[key] || ARCHETYPE_STYLE.specialist;
}
