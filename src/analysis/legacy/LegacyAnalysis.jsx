import React, { useState } from "react";
import { T } from "../../theme";
import { ICON_B64 } from "../../assets/icon";
import { GlowOrb, Badge } from "../../ui/primitives";
import { STEPS } from "../data/paths";
import { scoreOptions } from "../engine/scoring";
import { getArchetype } from "../engine/archetype.legacy";


export const diffColor = { "Beginner":"#34d399", "Intermediate": T.gold, "Advanced":"#f87171" };
export const upsideLabel = { "low":"Low Upside","medium":"Solid","high":"High Upside","very-high":"🔥 Very High" };
export const upsideColor = { "low":T.muted,"medium":T.accentB,"high":T.gold,"very-high":"#f87171" };
export function Landing({ onStart }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(n => n+1), 3000); return () => clearInterval(t); }, []);
  const mottos = ["Build income that doesn't need you to show up","Turn your skills into a system","Stop trading time. Start building freedom","Your next income stream starts here"];

  return (
    <div style={{ position:"relative", overflow:"hidden" }}>
      <GlowOrb x="-60px" y="-40px" color={T.gold} size={400} opacity={0.09} />
      <GlowOrb x="60%" y="30%" color={T.primary} size={300} opacity={0.07} />
      <div style={{ position:"relative", zIndex:1 }}>
        {/* Brand */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:32, gap:14 }}>
          <img src={"data:image/png;base64," + ICON_B64} alt="Auro" style={{ width:90, height:90, borderRadius:22, boxShadow:"0 0 40px #f5c84240, 0 0 80px #4a9eff20", display:"block" }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:2, color:T.text, lineHeight:1, fontFamily:"Georgia,serif", background:"linear-gradient(135deg,#f5c842,#c9920e 50%,#4a9eff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AURO</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:3, color:T.muted, textTransform:"uppercase", marginTop:5 }}>Income Intelligence</div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:34, fontWeight:900, lineHeight:1.1, margin:"0 0 14px", fontFamily:"Georgia,serif", letterSpacing:"-0.5px" }}>
            <span style={{ background:T.gradDual, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Discover your</span>
            <br /><span style={{ color:T.text }}>income path.</span>
          </h1>
          <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, margin:0, minHeight:46, transition:"all 0.5s" }}>
            {mottos[tick % mottos.length]}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:28 }}>
          {[["80+","Income paths"],["AI-Driven","Analysis"],["Instant","Roadmap"]].map(([v,l]) => (
            <div key={l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:900, color:T.primary, marginBottom:3 }}>{v}</div>
              <div style={{ fontSize:10, color:T.muted, fontWeight:600, lineHeight:1.2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:32 }}>
          {[
            { icon:"🎯", title:"Adaptive Analysis", desc:"Questions that adapt to your answers in real-time" },
            { icon:"🗺️", title:"Personalized Roadmap", desc:"Step-by-step guide for every recommended path" },
            { icon:"📊", title:"Match Scoring", desc:"See exactly why each path is right for you" },
          ].map(f => (
            <div key={f.title} style={{ display:"flex", alignItems:"flex-start", gap:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px" }}>
              <span style={{ fontSize:20, lineHeight:1 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:12, color:T.muted }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onStart} style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", fontFamily:"inherit", background:T.gradDual, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", letterSpacing:0.5, boxShadow:"0 0 30px rgba(79,142,247,0.35)", position:"relative", overflow:"hidden" }}>
          Begin Your Analysis →
        </button>
        <p style={{ textAlign:"center", fontSize:11, color:T.dim, marginTop:12 }}>Free · 2–3 minutes · No signup</p>
      </div>
    </div>
  );
}
export function QuestionCard({ question, onAnswer, progress, total }) {
  const [selected, setSelected] = useState(question.type === "multiselect" ? [] : null);
  const [animating, setAnimating] = useState(false);
  useEffect(() => { setSelected(question.type === "multiselect" ? [] : null); }, [question.id]);
   const handleSelect = (opt) => {
    if (question.type === "multiselect") {
      setSelected(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]);
    } else {
      setSelected(opt);
      setAnimating(true);
      setTimeout(() => { setAnimating(false); onAnswer(opt); }, 220);
    }
  };

  const canContinue = question.type === "multiselect" ? selected.length > 0 : !!selected;
  const pct = Math.round((progress / total) * 100);

  return (
    <div style={{ animation:"slideIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
      {/* Progress */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:10, fontWeight:800, color:T.primary, letterSpacing:2, textTransform:"uppercase" }}>Question {progress} / {total}</span>
          <span style={{ fontSize:10, color:T.muted, fontWeight:600 }}>{pct}% complete</span>
        </div>
        <div style={{ height:3, background:T.border, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:pct+"%", background:T.gradPrimary, borderRadius:2, transition:"width 0.5s cubic-bezier(0.16,1,0.3,1)", boxShadow:`0 0 8px ${T.gold}80` }} />
        </div>
      </div>

      {/* Question */}
      <h2 style={{ fontSize:20, fontWeight:800, color:T.text, marginBottom:22, lineHeight:1.35, fontFamily:"Georgia,serif" }}>{question.text}</h2>

      {question.type === "multiselect" && (
        <p style={{ fontSize:12, color:T.muted, marginBottom:16, marginTop:-16 }}>Select all that apply</p>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:22 }}>
        {question.options.map(opt => {
          const isSel = question.type === "multiselect" ? selected.includes(opt) : selected === opt;
          return (
            <button key={opt} onClick={() => handleSelect(opt)} style={{
              padding:"13px 16px", borderRadius:13, textAlign:"left", fontFamily:"inherit",
              border:`1.5px solid ${isSel ? T.primary : T.border}`,
              background: isSel ? `${T.primary}18` : T.card,
              color: isSel ? T.primary : T.text,
              fontSize:14, fontWeight: isSel ? 700 : 400,
              cursor:"pointer", transition:"all 0.18s",
              display:"flex", alignItems:"center", gap:12,
              boxShadow: isSel ? `0 0 16px ${T.primary}30` : "none",
              transform: isSel ? "scale(1.01)" : "scale(1)",
            }}>
              <div style={{ width:18, height:18, borderRadius: question.type==="multiselect" ? 5 : "50%", border:`2px solid ${isSel ? T.primary : T.dim}`, background: isSel ? T.primary : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s" }}>
                {isSel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {question.type === "multiselect" && (
        <button onClick={() => canContinue && onAnswer(selected)} disabled={!canContinue} style={{ width:"100%", padding:"14px", borderRadius:13, border:"none", fontFamily:"inherit", background: canContinue ? T.gradPrimary : T.border, color: canContinue ? "#0a0800" : T.muted, fontSize:15, fontWeight:800, cursor: canContinue ? "pointer" : "not-allowed", transition:"all 0.2s", boxShadow: canContinue ? `0 0 20px ${T.primary}40` : "none" }}>
          Continue {canContinue ? `(${selected.length} selected)` : ""}
        </button>
      )}
    </div>
  );
}
export function ScoreCircle({ score }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const target = score;
    let current = 0;
    const step = target / 40;
    const t = setInterval(() => {
      current = Math.min(target, current + step);
      setDisplayed(Math.round(current));
      if (current >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [score]);

  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (displayed / 100) * circ;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke={T.border} strokeWidth="6" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke="url(#pg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%", transition:"stroke-dashoffset 0.05s linear" }} />
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5c842" />
            <stop offset="100%" stopColor="#4a9eff" />
          </linearGradient>
        </defs>
        <text x="55" y="51" textAnchor="middle" fill={T.text} fontSize="22" fontWeight="900" fontFamily="-apple-system,sans-serif">{displayed}%</text>
        <text x="55" y="66" textAnchor="middle" fill={T.muted} fontSize="9" fontFamily="-apple-system,sans-serif">MATCH</text>
      </svg>
    </div>
  );
}
export function ResultCard({ rec, index, isBest, isFastest, isHighest }) {
  const [open, setOpen] = useState(index === 0);
  const steps = STEPS[rec.id] || ["Research this path thoroughly","Find a community already doing it","Take one concrete action today"];
  const accentColors = [T.gold, T.primary, "#c9920e", "#1a6fd4"];
  const col = accentColors[index % accentColors.length];

  return (
    <div style={{ background:T.card, borderRadius:18, border:`1.5px solid ${open ? col+"60" : T.border}`, overflow:"hidden", marginBottom:12, transition:"all 0.2s", boxShadow: open ? `0 4px 30px ${col}20` : "none" }}>
      <div onClick={() => setOpen(!open)} style={{ padding:"18px 18px", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:14 }}>
        <div style={{ width:38, height:38, borderRadius:11, background:`${col}20`, border:`1px solid ${col}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:15, fontWeight:900, color:col }}>{index + 1}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:T.text, margin:0, lineHeight:1.2 }}>{rec.title}</h3>
            <span style={{ fontSize:10, fontWeight:700, color:diffColor[rec.difficulty]||T.muted, background:(diffColor[rec.difficulty]||T.muted)+"20", padding:"3px 8px", borderRadius:20, flexShrink:0, whiteSpace:"nowrap", border:`1px solid ${(diffColor[rec.difficulty]||T.muted)}40` }}>{rec.difficulty}</span>
          </div>
          <p style={{ fontSize:12, color:T.muted, margin:"0 0 10px", lineHeight:1.5 }}>{rec.summary}</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:12, color:T.gold, fontWeight:700 }}>{rec.earnings}</span>
            <span style={{ fontSize:11, color:T.muted }}>·</span>
            <span style={{ fontSize:11, color:T.muted }}>{rec.timeToFirst} to first $</span>
            {rec.upside && <span style={{ fontSize:10, color:upsideColor[rec.upside]||T.muted, fontWeight:700, marginLeft:4 }}>{upsideLabel[rec.upside]}</span>}
          </div>
          {(isBest || isFastest || isHighest) && (
            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
              {isBest && <Badge color={T.primary}>⭐ Best Match</Badge>}
              {isFastest && <Badge color="#34d399">⚡ Fastest Income</Badge>}
              {isHighest && <Badge color={T.gold}>🔥 Highest Upside</Badge>}
            </div>
          )}
        </div>
        <span style={{ color:T.muted, fontSize:12, flexShrink:0, marginTop:4, display:"inline-block", transform:open?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>
      </div>
      {open && (
        <div style={{ padding:"0 18px 20px", animation:"fadeIn 0.25s ease" }}>
          <div style={{ height:1, background:T.border, marginBottom:16 }} />
          <p style={{ fontSize:11, fontWeight:800, color:T.muted, marginBottom:12, textTransform:"uppercase", letterSpacing:1.5 }}>Your Roadmap</p>
          {steps.map((step, i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:11 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:T.gradPrimary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff", flexShrink:0 }}>{i+1}</div>
              <p style={{ fontSize:13, color:T.text, margin:0, lineHeight:1.55, paddingTop:3 }}>{step}</p>
            </div>
          ))}
          <div style={{ marginTop:16, padding:"12px 14px", background:`${col}12`, borderRadius:12, border:`1px solid ${col}30` }}>
            <p style={{ fontSize:12, color:col, margin:0, fontWeight:600, lineHeight:1.5 }}>
              💡 Pro tip: The first 30 days are everything. Focus on getting your first client or result — that momentum compounds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export function Results({ answers, onReset }) {
  const allScored = scoreOptions(answers);
  const recs = allScored.slice(0, 4);
  const archetype = getArchetype(answers);
  const matchScore = Math.min(97, 58 + Math.round((recs[0]?.score - 40) * 0.38));

  // Find special labels
  const fastest = [...recs].sort((a,b) => {
    const spd = { fast:3, medium:2, slow:1 };
    return (spd[b.speed]||0)-(spd[a.speed]||0);
  })[0];
  const highest = [...recs].sort((a,b) => {
    const ups = {"very-high":4,high:3,medium:2,low:1};
    return (ups[b.upside]||0)-(ups[a.upside]||0);
  })[0];

  return (
    <div style={{ animation:"fadeIn 0.4s ease" }}>
      <GlowOrb x="-40px" y="-20px" color={T.gold} size={250} opacity={0.08} />
      <div style={{ position:"relative", zIndex:1 }}>
        {/* Archetype hero */}
        <div style={{ background:T.card, border:`1px solid ${archetype.color}40`, borderRadius:20, padding:"22px 20px", marginBottom:16, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, right:0, width:120, height:120, background:`${archetype.color}08`, borderRadius:"0 20px 0 80px" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:2, marginBottom:8, textTransform:"uppercase" }}>Your Profile</p>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:24 }}>{archetype.icon}</span>
                <h2 style={{ fontSize:20, fontWeight:900, color:archetype.color, margin:0, fontFamily:"Georgia,serif" }}>{archetype.name}</h2>
              </div>
              <p style={{ fontSize:13, color:T.muted, margin:0, lineHeight:1.6 }}>{archetype.desc}</p>
            </div>
            <ScoreCircle score={matchScore} />
          </div>
        </div>

        {/* Summary row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
          {[
            { label:"Best Match", value:recs[0]?.title?.split(" ").slice(0,2).join(" ") || "—", color:T.primary },
            { label:"Fastest Path", value:fastest?.title?.split(" ").slice(0,2).join(" ") || "—", color:"#34d399" },
            { label:"Top Upside", value:highest?.title?.split(" ").slice(0,2).join(" ") || "—", color:T.gold },
          ].map(item => (
            <div key={item.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"12px 10px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:T.muted, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:0.8 }}>{item.label}</div>
              <div style={{ fontSize:12, color:item.color, fontWeight:800, lineHeight:1.2 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize:11, fontWeight:800, color:T.muted, marginBottom:14, textTransform:"uppercase", letterSpacing:1.5 }}>Your Top Income Paths</p>

        {recs.map((rec, i) => (
          <ResultCard
            key={rec.id}
            rec={rec}
            index={i}
            isBest={i === 0}
            isFastest={fastest?.id === rec.id}
            isHighest={highest?.id === rec.id && i > 0}
          />
        ))}

        <button onClick={onReset} style={{ width:"100%", padding:"13px", borderRadius:13, marginTop:10, fontFamily:"inherit", border:`1.5px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:14, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>
          ↩ Start Over
        </button>
      </div>
    </div>
  );
}

  
