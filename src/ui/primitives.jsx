import { T } from "../theme";

export function GlowOrb({ x, y, color, size = 300, opacity = 0.07 }) {
  return (
    <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, filter:"blur(80px)", opacity, pointerEvents:"none", zIndex:0 }} />
  );
}

export function Badge({ children, color = T.primary }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:0.5, background: color+"1a", color, border:`1px solid ${color}44` }}>
      {children}
    </span>
  );
}
