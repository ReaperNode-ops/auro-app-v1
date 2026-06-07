import { T } from "../../theme";


export function getArchetype(answers) {
  const skills = (answers.skills || []).map(s => s.toLowerCase());
  const incomeType = answers.income_type || "";
  const goal = answers.goal || "";
  const risk = answers.risk || "";
  const tech = answers.tech || "";
  const isCreative = skills.some(s => ["design","writing","music","photography","video","art"].some(c => s.includes(c)));
  const isBusiness = skills.some(s => ["sales","marketing","finance","business"].some(c => s.includes(c)));
  const isTech = skills.some(s => s.includes("development") || s.includes("engineering"));
  const isTeacher = skills.some(s => s.includes("teaching") || s.includes("coaching") || s.includes("mentoring"));
  const isHandsOn = skills.some(s => s.includes("trades") || s.includes("hands-on"));
  const wantsPassive = incomeType.startsWith("Passive") || incomeType.startsWith("Hybrid");
  const needsFast = goal.includes("immediately") || goal.includes("urgency");
  const isAmbitious = goal.includes("scalable") || goal.includes("independence") || risk.startsWith("Aggressive");
  if (isTech && tech.startsWith("Advanced")) return { name:"The Architect", icon:"⚡", desc:"Your technical edge is rare. You can build solutions others can't even imagine. The highest-value paths are within reach.", color: T.primary };
  if (isCreative && wantsPassive) return { name:"The Creative Engine", icon:"🎨", desc:"You create things people love. The internet lets creative people earn while they sleep — you're positioned perfectly for it.", color:"#f472b6" };
  if (isBusiness) return { name:"The Strategic Operator", icon:"♟️", desc:"You understand leverage — how to turn effort into outsized returns. Your commercial instincts are your greatest weapon.", color: T.gold };
  if (isTeacher) return { name:"The Knowledge Authority", icon:"🧠", desc:"What you know is genuinely valuable. People will pay serious money to learn from someone who can actually explain it.", color: T.accentB };
  if (isHandsOn) return { name:"The Skilled Operator", icon:"🔧", desc:"Hands-on skills are chronically undersupplied. In a world of desk workers, people who can build and fix things command real premiums.", color:"#fb923c" };
  if (isAmbitious) return { name:"The Empire Builder", icon:"👑", desc:"You're not playing for pocket money. You want to build something that matters and earns accordingly. These paths were made for you.", color: T.gold };
  if (needsFast) return { name:"The Fast Mover", icon:"🚀", desc:"Execution speed is your biggest advantage. While others plan, you move. These paths are built for rapid first income.", color:"#34d399" };
  if (wantsPassive) return { name:"The System Builder", icon:"🔄", desc:"You think like an investor — building systems that earn without your constant presence. The long game always wins.", color: T.accent };
  return { name:"The Smart Starter", icon:"✨", desc:"You're approaching this intelligently — exploring options before committing. That clarity will make your first move far more effective.", color: T.primary };
}
