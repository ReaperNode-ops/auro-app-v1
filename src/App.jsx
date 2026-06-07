import { useState, useEffect, useRef } from "react";
import { ALL_OPTIONS, STEPS } from "./analysis/data/paths";
import { getArchetype } from "./analysis/engine/archetype.legacy";
import { Landing, QuestionCard, Results } from "./analysis/legacy/LegacyAnalysis";
import { BASE_QUESTIONS, getAdaptiveQuestions } from "./analysis/data/questions.legacy";
import { USE_ANALYSIS_V2 } from "./analysis/v2/flag.js";
import AnalysisV2 from "./analysis/v2/AnalysisV2.jsx";
import AuthScreen from "./AuthScreen.jsx";
import { GlowOrb, Badge } from "./ui/primitives";
import { auroChat } from "./auroAI.js";
import { ICON_B64 } from "./assets/icon";
import { getDailyUsage, incrementDailyUsage } from "./usage.js";
import { T } from "./theme";
import {
  auth,
  reload,
  onAuthChange,
  checkEmailVerified,
  resendVerificationEmail,
  updateDisplayName,
  requestEmailChange,
  reauthenticate,
  firebaseSignOut,
  firebaseDeleteAccount,
  friendlyAuthError,
} from "./firebase.js";

// ── Design tokens ─────────────────────────────────────────────────────────────



// ── Income options database ───────────────────────────────────────────────────


// ── Adaptive questions ────────────────────────────────────────────────────────








// ── Utility ───────────────────────────────────────────────────────────────────

// ── Components ────────────────────────────────────────────────────────────────




 





// ── App shell ─────────────────────────────────────────────────────────────────

// ── Email Verification Screen ──────────────────────────────────────────────────
// Used inline for nav-tracking / nav-chat when emailVerified is false.
// Calls real Firebase reload before checking — no fake timeouts.
function EmailVerificationScreen({ email, onResend, onVerified }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setResending(true); setError("");
    try {
      await resendVerificationEmail();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
      if (onResend) onResend();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerified = async () => {
    setChecking(true); setError("");
    try {
      const verified = await checkEmailVerified(); // reload() + read emailVerified
      if (verified) {
        onVerified(); // only fires when Firebase confirms emailVerified === true
      } else {
        setError("Email not verified yet. Click the link in your inbox, then try again.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ textAlign:"center", padding:"8px 0 24px", animation:"fadeIn 0.4s ease" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:`${T.primary}15`, border:`2px solid ${T.primary}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 22px", boxShadow:`0 0 30px ${T.primary}20` }}>
        ✉️
      </div>
      <h2 style={{ fontSize:22, fontWeight:900, color:T.text, margin:"0 0 10px", fontFamily:"Georgia,serif" }}>Check Your Email</h2>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:6 }}>
        We sent a verification link to
      </p>
      <p style={{ fontSize:14, fontWeight:700, color:T.primary, marginBottom:16 }}>{email}</p>
      <p style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:20 }}>
        Open the link in your email to verify your account before continuing. Check your spam folder if you don't see it.
      </p>
      {error && (
        <div style={{ background:"#450a0a", border:"1px solid #f8717160", borderRadius:11, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#f87171", lineHeight:1.45 }}>
          ⚠ {error}
        </div>
      )}
      <button
        onClick={handleCheckVerified}
        disabled={checking}
        style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", fontFamily:"inherit", background: checking ? T.dim : T.gradPrimary, color: checking ? T.muted : "#0a0800", fontSize:15, fontWeight:900, cursor: checking ? "default" : "pointer", marginBottom:12, transition:"all 0.2s", boxShadow: checking ? "none" : `0 0 24px ${T.gold}40` }}
      >
        {checking ? "Checking…" : "I've Verified My Email →"}
      </button>
      <button
        onClick={handleResend}
        disabled={resending || resent}
        style={{ width:"100%", padding:"13px", borderRadius:13, border:`1px solid ${T.border}`, fontFamily:"inherit", background:"transparent", color: resent ? "#34d399" : T.muted, fontSize:13, fontWeight:600, cursor: resending || resent ? "default" : "pointer", marginBottom:24, transition:"all 0.2s" }}
      >
        {resent ? "✓ Email Sent!" : resending ? "Sending…" : "Resend Verification Email"}
      </button>
      <p style={{ fontSize:11, color:T.dim }}>Wrong email? <span style={{ color:T.primary, cursor:"pointer" }}>Sign out and try again</span></p>
    </div>
  );
}

// ── Tracking Page ──────────────────────────────────────────────────────────────
// Defined OUTSIDE App to prevent remount on parent re-render (fixes keyboard bug)

// ── Career Path Definitions ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// AURO CAREER TRACKING ENGINE — Modular, Schema-Driven, Infinitely Expandable
// ═══════════════════════════════════════════════════════════════════════════════

// ── Shared primitives ──────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════

// ── Shared primitives ──────────────────────────────────────────────────────────

const DAYS7 = () => [false,false,false,false,false,false,false];

// buildHabitFromDef: converts a path habit definition into live tracking state
const buildHabitFromDef = (def) => ({
  ...def,
  days: DAYS7(),
  streak: 0,
  completions: 0,
  custom: false,
});

// ── CAREER PATH CONFIGS ────────────────────────────────────────────────────────
// Each config is a complete, self-contained definition of how success works
// in that specific field. Add new paths here — everything else adapts.

const PATH_CONFIGS = {

  // ── SOFTWARE / TECH ────────────────────────────────────────────────────────
  tech: {
    id: "tech",
    label: "Software Engineer",
    icon: "💻",
    color: "#4a9eff",
    accentB: "#7c6af7",
    aiPersona: "analytical and precision-focused",
    tagline: "Ship code. Build systems. Get hired.",

    // Unique streak dimensions — tech has THREE separate streak types
    streakDimensions: [
      { id:"coding", label:"Coding", icon:"💻", color:"#4a9eff" },
      { id:"learning", label:"Learning", icon:"📚", color:"#7c6af7" },
      { id:"building", label:"Building", icon:"🏗️", color:"#34d399" },
    ],

    // Quantitative metrics unique to this path
    metrics: [
      { id:"consistency", label:"Consistency Score", icon:"📊", unit:"%", color:"#4a9eff", baseline:68 },
      { id:"tech_growth", label:"Technical Growth", icon:"⚡", unit:"pts", color:"#7c6af7", baseline:74 },
      { id:"portfolio", label:"Portfolio Strength", icon:"🗂️", unit:"%", color:"#34d399", baseline:42 },
      { id:"hire_ready", label:"Hire Readiness", icon:"🎯", unit:"%", color:"#f5c842", baseline:55 },
    ],

    // Daily habits specific to this path
    habits: [
      { id:"h1", label:"Code for 60+ minutes", icon:"💻", streakDim:"coding", xp:30 },
      { id:"h2", label:"LeetCode / algo practice", icon:"🧩", streakDim:"learning", xp:25 },
      { id:"h3", label:"Work on portfolio project", icon:"🗂️", streakDim:"building", xp:35 },
      { id:"h4", label:"Study a new technology", icon:"📚", streakDim:"learning", xp:20 },
    ],

    // Momentum formula — weighted by what matters most in this field
    momentumFormula: (habits, dimStreaks) => {
      const habComp = habits.reduce((s,h) => s + h.days.filter(Boolean).length/7, 0) / Math.max(habits.length,1);
      const streakBonus = Math.min((dimStreaks.coding + dimStreaks.learning + dimStreaks.building) / 60, 1) * 0.3;
      return Math.round((habComp * 0.7 + streakBonus) * 100);
    },

    momentumLabels: [
      { min:85, label:"🔥 Shipping", sub:"Elite execution" },
      { min:70, label:"⚡ In the Zone", sub:"Strong velocity" },
      { min:50, label:"📈 Building Up", sub:"Gaining momentum" },
      { min:25, label:"🌱 Starting Out", sub:"Foundation mode" },
      { min:0,  label:"💤 Dormant", sub:"Time to activate" },
    ],

    // Analytics panels shown in the Analytics tab
    analyticsPanels: ["habit_consistency","streak_dimensions","metric_radar","weekly_output"],

    // Unique progression roadmap
    roadmap: [
      { label:"Joined Auro", icon:"🚀", xpRequired:0 },
      { label:"First GitHub commit", icon:"💻", xpRequired:100 },
      { label:"Portfolio site live", icon:"🌐", xpRequired:250 },
      { label:"Contributed to open source", icon:"🤝", xpRequired:500 },
      { label:"Internship / junior offer", icon:"📄", xpRequired:900 },
      { label:"First $5k/month role", icon:"💰", xpRequired:1500 },
      { label:"Senior Engineer path", icon:"🏆", xpRequired:2500 },
    ],

    // Motivational insights shown in the AI insight card
    insights: [
      "Your coding streak is building neural pathways that compound. Keep it unbroken.",
      "Engineers who ship daily outperform those who plan for weeks. Execute.",
      "LeetCode consistency now = salary negotiation power later.",
      "Every portfolio project is a job application that never expires.",
      "The engineers who get hired are the ones who are already acting like engineers.",
    ],

    // Stat cards for the dashboard header area
    dashboardStats: (state) => [
      { label:"Code Hours (wk)", value: state.habits.filter(h=>h.id==="h1").reduce((s,h)=>s+h.days.filter(Boolean).length,0) + "h", icon:"⏱️", color:"#4a9eff" },
      { label:"Total XP", value: state.totalXP, icon:"⚡", color:"#7c6af7" },
      { label:"Hire Ready", value:"55%", icon:"🎯", color:"#f5c842" },
    ],

    // Free-tier limit messaging
    freeLimit: "Basic habit tracking only",
    premiumPerks: ["GitHub integration ready","Technical interview prep tracker","Salary benchmarking","AI code review suggestions"],
  },

  // ── ENTREPRENEUR ──────────────────────────────────────────────────────────
  entrepreneur: {
    id: "entrepreneur",
    label: "Entrepreneur",
    icon: "🚀",
    color: "#f5c842",
    accentB: "#fb923c",
    aiPersona: "aggressive and execution-obsessed",
    tagline: "Build. Ship. Grow. Repeat.",

    streakDimensions: [
      { id:"execution", label:"Execution", icon:"⚡", color:"#f5c842" },
      { id:"outreach", label:"Outreach", icon:"🤝", color:"#fb923c" },
      { id:"product", label:"Product", icon:"🏗️", color:"#34d399" },
    ],

    metrics: [
      { id:"execution", label:"Execution Intensity", icon:"⚡", unit:"pts", color:"#f5c842", baseline:71 },
      { id:"biz_growth", label:"Business Momentum", icon:"📈", unit:"%", color:"#fb923c", baseline:38 },
      { id:"consistency", label:"Consistency", icon:"🎯", unit:"%", color:"#34d399", baseline:65 },
      { id:"revenue_prog", label:"Revenue Progress", icon:"💰", unit:"%", color:"#f87171", baseline:22 },
    ],

    habits: [
      { id:"h1", label:"Deep work on the business", icon:"🏗️", streakDim:"product", xp:40 },
      { id:"h2", label:"Customer outreach / networking", icon:"🤝", streakDim:"outreach", xp:30 },
      { id:"h3", label:"Publish content / marketing", icon:"✍️", streakDim:"execution", xp:25 },
      { id:"h4", label:"Review metrics and iterate", icon:"📊", streakDim:"execution", xp:20 },
    ],

    momentumFormula: (habits, dimStreaks) => {
      const habComp = habits.reduce((s,h) => s + h.days.filter(Boolean).length/7, 0) / Math.max(habits.length,1);
      const execBonus = Math.min((dimStreaks.execution + dimStreaks.outreach) / 40, 1) * 0.35;
      return Math.round((habComp * 0.65 + execBonus) * 100);
    },

    momentumLabels: [
      { min:85, label:"🚀 Founder Mode", sub:"Maximum output" },
      { min:70, label:"⚡ Executing Hard", sub:"Strong momentum" },
      { min:50, label:"📈 Gaining Traction", sub:"Building steam" },
      { min:25, label:"🌱 Early Days", sub:"Keep showing up" },
      { min:0,  label:"💤 Stalled", sub:"Time to move" },
    ],

    analyticsPanels: ["habit_consistency","streak_dimensions","metric_radar","revenue_trend"],

    roadmap: [
      { label:"Joined Auro", icon:"🚀", xpRequired:0 },
      { label:"Business concept defined", icon:"💡", xpRequired:100 },
      { label:"MVP built", icon:"🏗️", xpRequired:300 },
      { label:"First paying customer", icon:"💳", xpRequired:600 },
      { label:"$1,000 MRR", icon:"💰", xpRequired:1000 },
      { label:"$10,000 MRR", icon:"📈", xpRequired:2000 },
      { label:"Profitable & scaling", icon:"🏆", xpRequired:3500 },
    ],

    insights: [
      "Revenue is your only real metric. Everything else is vanity.",
      "Entrepreneurs who talk to customers daily build products people actually buy.",
      "Your outreach streak is your pipeline. Never let it drop to zero.",
      "One focused hour on the product beats three distracted ones.",
      "Ship imperfect things fast. Perfect things kill momentum.",
    ],

    dashboardStats: (state) => [
      { label:"Exec Streak", value: state.dimStreaks?.execution || 0, icon:"⚡", color:"#f5c842" },
      { label:"Total XP", value: state.totalXP, icon:"🚀", color:"#fb923c" },
      { label:"Business Score", value:"38%", icon:"📈", color:"#34d399" },
    ],

    freeLimit: "Basic execution tracking",
    premiumPerks: ["Revenue trend analytics","Customer pipeline tracker","AI pitch feedback","Competitor monitoring"],
  },

  // ── CONTENT CREATOR / FITNESS CREATOR ────────────────────────────────────
  creator: {
    id: "creator",
    label: "Content Creator",
    icon: "🎥",
    color: "#f472b6",
    accentB: "#c084fc",
    aiPersona: "encouraging and momentum-driven",
    tagline: "Create. Post. Grow. Monetise.",

    streakDimensions: [
      { id:"posting", label:"Posting", icon:"📸", color:"#f472b6" },
      { id:"creating", label:"Creating", icon:"🎬", color:"#c084fc" },
      { id:"discipline", label:"Discipline", icon:"💪", color:"#34d399" },
    ],

    metrics: [
      { id:"content_output", label:"Content Output", icon:"🎬", unit:"/wk", color:"#f472b6", baseline:3 },
      { id:"audience_growth", label:"Audience Growth", icon:"📈", unit:"%", color:"#c084fc", baseline:2.4 },
      { id:"creator_score", label:"Creator Momentum", icon:"⚡", unit:"pts", color:"#f5c842", baseline:62 },
      { id:"consistency", label:"Posting Consistency", icon:"🎯", unit:"%", color:"#34d399", baseline:71 },
    ],

    habits: [
      { id:"h1", label:"Film or record content", icon:"🎬", streakDim:"creating", xp:35 },
      { id:"h2", label:"Post or publish something", icon:"📸", streakDim:"posting", xp:40 },
      { id:"h3", label:"Edit / post-production work", icon:"✂️", streakDim:"creating", xp:25 },
      { id:"h4", label:"Engage with audience / comments", icon:"💬", streakDim:"discipline", xp:15 },
    ],

    momentumFormula: (habits, dimStreaks) => {
      const postingH = habits.find(h=>h.id==="h2");
      const postingConsistency = postingH ? postingH.days.filter(Boolean).length / 7 : 0;
      const habComp = habits.reduce((s,h) => s + h.days.filter(Boolean).length/7, 0) / Math.max(habits.length,1);
      const postBonus = postingConsistency * 0.3;
      return Math.round((habComp * 0.55 + postBonus + Math.min(dimStreaks.posting/21, 1) * 0.15) * 100);
    },

    momentumLabels: [
      { min:85, label:"🔥 Going Viral", sub:"Peak creator energy" },
      { min:70, label:"📈 Trending Up", sub:"Strong output" },
      { min:50, label:"🎬 In Production", sub:"Building consistently" },
      { min:25, label:"🌱 Finding Voice", sub:"Early momentum" },
      { min:0,  label:"💤 Offline", sub:"Time to create" },
    ],

    analyticsPanels: ["habit_consistency","streak_dimensions","content_output","audience_funnel"],

    roadmap: [
      { label:"Joined Auro", icon:"🚀", xpRequired:0 },
      { label:"Posted first content", icon:"📸", xpRequired:50 },
      { label:"100 followers", icon:"👥", xpRequired:200 },
      { label:"1,000 followers", icon:"📈", xpRequired:600 },
      { label:"First brand deal", icon:"💰", xpRequired:1200 },
      { label:"10,000 followers", icon:"🌟", xpRequired:2200 },
      { label:"Full-time creator income", icon:"🏆", xpRequired:4000 },
    ],

    insights: [
      "Posting streak matters more than production quality early on. Volume first.",
      "Algorithms reward consistency over perfection. Show up daily.",
      "Your first 1,000 followers are everything. Serve them obsessively.",
      "One viral video can replace months of gradual growth. Keep creating.",
      "Creators who engage with comments grow 3x faster. Do it every day.",
    ],

    dashboardStats: (state) => [
      { label:"Posts This Wk", value: state.habits.find(h=>h.id==="h2")?.days.filter(Boolean).length || 0, icon:"📸", color:"#f472b6" },
      { label:"Creator XP", value: state.totalXP, icon:"⚡", color:"#c084fc" },
      { label:"Posting Streak", value: (state.dimStreaks?.posting || 0) + "d", icon:"🔥", color:"#f87171" },
    ],

    freeLimit: "Basic posting tracker",
    premiumPerks: ["Audience growth analytics","Best time to post insights","Brand deal readiness score","AI caption & hook generator"],
  },

  // ── FINANCE / INVESTING ───────────────────────────────────────────────────
  finance: {
    id: "finance",
    label: "Finance & Investing",
    icon: "📈",
    color: "#34d399",
    accentB: "#10b981",
    aiPersona: "disciplined and analytically rigorous",
    tagline: "Research. Invest. Compound. Retire.",

    streakDimensions: [
      { id:"research", label:"Research", icon:"🔍", color:"#34d399" },
      { id:"investing", label:"Investing", icon:"💹", color:"#10b981" },
      { id:"discipline", label:"Discipline", icon:"🎯", color:"#f5c842" },
    ],

    metrics: [
      { id:"fin_discipline", label:"Financial Discipline", icon:"🎯", unit:"%", color:"#34d399", baseline:78 },
      { id:"invest_consistency", label:"Invest Consistency", icon:"💹", unit:"%", color:"#10b981", baseline:61 },
      { id:"knowledge", label:"Knowledge Growth", icon:"📚", unit:"pts", color:"#f5c842", baseline:54 },
      { id:"savings_rate", label:"Savings Momentum", icon:"🏦", unit:"%", color:"#4a9eff", baseline:34 },
    ],

    habits: [
      { id:"h1", label:"Market research session", icon:"🔍", streakDim:"research", xp:25 },
      { id:"h2", label:"Review portfolio / networth", icon:"💼", streakDim:"investing", xp:20 },
      { id:"h3", label:"Study finance content", icon:"📚", streakDim:"research", xp:20 },
      { id:"h4", label:"Log budget / track spending", icon:"📊", streakDim:"discipline", xp:30 },
    ],

    momentumFormula: (habits, dimStreaks) => {
      const habComp = habits.reduce((s,h) => s + h.days.filter(Boolean).length/7, 0) / Math.max(habits.length,1);
      const discBonus = Math.min(dimStreaks.discipline / 30, 1) * 0.25;
      const resBonus = Math.min(dimStreaks.research / 21, 1) * 0.15;
      return Math.round((habComp * 0.6 + discBonus + resBonus) * 100);
    },

    momentumLabels: [
      { min:85, label:"💎 Compounding", sub:"Wealth-building mode" },
      { min:70, label:"📈 Disciplined", sub:"Strong financial habits" },
      { min:50, label:"🎯 On Track", sub:"Building the foundation" },
      { min:25, label:"🌱 Starting", sub:"Early discipline" },
      { min:0,  label:"💤 Unfocused", sub:"Time to commit" },
    ],

    analyticsPanels: ["habit_consistency","streak_dimensions","metric_radar","savings_trend"],

    roadmap: [
      { label:"Joined Auro", icon:"🚀", xpRequired:0 },
      { label:"Emergency fund built", icon:"🛡️", xpRequired:150 },
      { label:"First investment made", icon:"💸", xpRequired:350 },
      { label:"$10k portfolio", icon:"💰", xpRequired:700 },
      { label:"Diversified portfolio", icon:"📊", xpRequired:1200 },
      { label:"$100k milestone", icon:"🏦", xpRequired:2500 },
      { label:"Financial independence path", icon:"🏆", xpRequired:4500 },
    ],

    insights: [
      "Compound interest is the eighth wonder of the world. Your discipline activates it.",
      "Track every dollar. Awareness is the first step to wealth.",
      "Research streaks build the conviction you need to hold through volatility.",
      "Financial independence is built one disciplined day at a time.",
      "The investor who never misses a review day makes better decisions over time.",
    ],

    dashboardStats: (state) => [
      { label:"Research Days", value: state.habits.find(h=>h.id==="h1")?.days.filter(Boolean).length || 0, icon:"🔍", color:"#34d399" },
      { label:"Total XP", value: state.totalXP, icon:"⚡", color:"#10b981" },
      { label:"Discipline Score", value:"78%", icon:"🎯", color:"#f5c842" },
    ],

    freeLimit: "Basic financial habit tracking",
    premiumPerks: ["Portfolio performance analytics","Savings projection calculator","Market insight digest","AI financial planning coach"],
  },

  // ── FITNESS / PERSONAL TRAINER ────────────────────────────────────────────
  fitness: {
    id: "fitness",
    label: "Fitness Coach",
    icon: "💪",
    color: "#fb923c",
    accentB: "#f87171",
    aiPersona: "intensity-driven and accountability-focused",
    tagline: "Train. Coach. Inspire. Earn.",

    streakDimensions: [
      { id:"training", label:"Training", icon:"🏋️", color:"#fb923c" },
      { id:"coaching", label:"Coaching", icon:"📱", color:"#f87171" },
      { id:"content", label:"Content", icon:"📸", color:"#f472b6" },
    ],

    metrics: [
      { id:"training_cons", label:"Training Consistency", icon:"🏋️", unit:"%", color:"#fb923c", baseline:82 },
      { id:"client_retention", label:"Client Retention", icon:"🤝", unit:"%", color:"#f87171", baseline:91 },
      { id:"content_output", label:"Content Output", icon:"📸", unit:"/wk", color:"#f472b6", baseline:4 },
      { id:"biz_growth", label:"Business Growth", icon:"📈", unit:"%", color:"#34d399", baseline:28 },
    ],

    habits: [
      { id:"h1", label:"Train — gym / workout session", icon:"🏋️", streakDim:"training", xp:40 },
      { id:"h2", label:"Check in with clients", icon:"📱", streakDim:"coaching", xp:30 },
      { id:"h3", label:"Post fitness content", icon:"📸", streakDim:"content", xp:25 },
      { id:"h4", label:"Study programming / nutrition", icon:"📚", streakDim:"coaching", xp:20 },
    ],

    momentumFormula: (habits, dimStreaks) => {
      const trainingH = habits.find(h=>h.id==="h1");
      const trainingScore = trainingH ? trainingH.days.filter(Boolean).length / 7 : 0;
      const habComp = habits.reduce((s,h) => s + h.days.filter(Boolean).length/7, 0) / Math.max(habits.length,1);
      return Math.round((trainingScore * 0.4 + habComp * 0.4 + Math.min(dimStreaks.training / 30, 1) * 0.2) * 100);
    },

    momentumLabels: [
      { min:85, label:"🔥 Beast Mode", sub:"Peak performance" },
      { min:70, label:"💪 Locked In", sub:"Strong discipline" },
      { min:50, label:"📈 Consistent", sub:"Building your base" },
      { min:25, label:"🌱 Early Days", sub:"Build the habit" },
      { min:0,  label:"💤 Rest Day (Too Many)", sub:"Time to train" },
    ],

    analyticsPanels: ["habit_consistency","streak_dimensions","training_load","client_metrics"],

    roadmap: [
      { label:"Joined Auro", icon:"🚀", xpRequired:0 },
      { label:"30-day training streak", icon:"🏋️", xpRequired:200 },
      { label:"PT certification complete", icon:"📜", xpRequired:400 },
      { label:"First paying client", icon:"🤝", xpRequired:700 },
      { label:"10 active clients", icon:"💪", xpRequired:1200 },
      { label:"Online coaching launched", icon:"🌐", xpRequired:2000 },
      { label:"$5k/month coaching revenue", icon:"🏆", xpRequired:3500 },
    ],

    insights: [
      "Your training streak is your most powerful sales tool. Stay consistent and document it.",
      "Clients don't buy fitness plans. They buy the version of you they want to become.",
      "Miss one training session and it becomes easier to miss the next. Never skip.",
      "The trainer who posts daily content grows 5x faster than one who trains in silence.",
      "Your own transformation story is your most powerful marketing asset.",
    ],

    dashboardStats: (state) => [
      { label:"Training Days", value: state.habits.find(h=>h.id==="h1")?.days.filter(Boolean).length || 0, icon:"🏋️", color:"#fb923c" },
      { label:"Coach XP", value: state.totalXP, icon:"⚡", color:"#f87171" },
      { label:"Training Streak", value: (state.dimStreaks?.training||0)+"d", icon:"🔥", color:"#f472b6" },
    ],

    freeLimit: "Basic training tracker",
    premiumPerks: ["Client pipeline tracker","Training load analytics","Content performance insights","AI programme builder"],
  },

  // ── FREELANCER / CONSULTANT ───────────────────────────────────────────────
  freelance: {
    id: "freelance",
    label: "Freelancer",
    icon: "🎯",
    color: "#7c6af7",
    accentB: "#a78bfa",
    aiPersona: "strategic and client-obsessed",
    tagline: "Pitch. Deliver. Scale. Repeat.",

    streakDimensions: [
      { id:"delivery", label:"Delivery", icon:"✅", color:"#7c6af7" },
      { id:"outreach", label:"Outreach", icon:"📧", color:"#a78bfa" },
      { id:"learning", label:"Learning", icon:"📚", color:"#4a9eff" },
    ],

    metrics: [
      { id:"delivery_rate", label:"Delivery Rate", icon:"✅", unit:"%", color:"#7c6af7", baseline:94 },
      { id:"pipeline", label:"Pipeline Score", icon:"📧", unit:"pts", color:"#a78bfa", baseline:41 },
      { id:"skill_growth", label:"Skill Growth", icon:"🔧", unit:"pts", color:"#4a9eff", baseline:58 },
      { id:"income_velocity", label:"Income Velocity", icon:"💰", unit:"%", color:"#f5c842", baseline:33 },
    ],

    habits: [
      { id:"h1", label:"Client work / deliverables", icon:"✅", streakDim:"delivery", xp:40 },
      { id:"h2", label:"Prospecting / outreach", icon:"📧", streakDim:"outreach", xp:35 },
      { id:"h3", label:"Upskill — learn something new", icon:"🔧", streakDim:"learning", xp:20 },
      { id:"h4", label:"Update portfolio / case studies", icon:"🗂️", streakDim:"delivery", xp:15 },
    ],

    momentumFormula: (habits, dimStreaks) => {
      const deliveryH = habits.find(h=>h.id==="h1");
      const outreachH = habits.find(h=>h.id==="h2");
      const delScore = deliveryH ? deliveryH.days.filter(Boolean).length / 7 : 0;
      const outScore = outreachH ? outreachH.days.filter(Boolean).length / 7 : 0;
      const habComp = habits.reduce((s,h) => s + h.days.filter(Boolean).length/7, 0) / Math.max(habits.length,1);
      return Math.round((delScore * 0.35 + outScore * 0.3 + habComp * 0.25 + Math.min(dimStreaks.delivery/21, 1) * 0.1) * 100);
    },

    momentumLabels: [
      { min:85, label:"💰 Fully Booked", sub:"Maximum client load" },
      { min:70, label:"📈 Scaling Up", sub:"Strong pipeline" },
      { min:50, label:"🎯 Delivering", sub:"Solid foundation" },
      { min:25, label:"🌱 Building Pipeline", sub:"Early days" },
      { min:0,  label:"💤 Quiet", sub:"Ramp up outreach" },
    ],

    analyticsPanels: ["habit_consistency","streak_dimensions","metric_radar","income_trend"],

    roadmap: [
      { label:"Joined Auro", icon:"🚀", xpRequired:0 },
      { label:"First proposal sent", icon:"📄", xpRequired:50 },
      { label:"First client signed", icon:"🤝", xpRequired:200 },
      { label:"First $1k month", icon:"💰", xpRequired:500 },
      { label:"Retainer client secured", icon:"🔒", xpRequired:1000 },
      { label:"$5k/month freelance", icon:"📈", xpRequired:2000 },
      { label:"Agency / scaled model", icon:"🏆", xpRequired:4000 },
    ],

    insights: [
      "One outreach per day beats 10 in a panic. Consistency builds pipelines.",
      "The freelancer who delivers early gets the next project. Always exceed expectations.",
      "Your best client is a happy current client. Retention > acquisition.",
      "Raising rates is easier than finding new clients. Deliver excellence first.",
      "Your portfolio page is working while you sleep. Keep it updated.",
    ],

    dashboardStats: (state) => [
      { label:"Delivery Streak", value: (state.dimStreaks?.delivery||0)+"d", icon:"✅", color:"#7c6af7" },
      { label:"Total XP", value: state.totalXP, icon:"⚡", color:"#a78bfa" },
      { label:"Pipeline Score", value:"41pts", icon:"📧", color:"#f5c842" },
    ],

    freeLimit: "Basic client & delivery tracking",
    premiumPerks: ["Income velocity analytics","Client churn prediction","Rate optimisation advisor","AI proposal generator"],
  },
};

// ── PATH DERIVATION FROM QUIZ ANSWERS ─────────────────────────────────────────
function derivePathFromAnswers(answers) {
  const skills = ((answers?.skills || []).join(" ")).toLowerCase();
  const interests = ((answers?.interests || []).join(" ")).toLowerCase();
  const combined = skills + " " + interests;
  if (combined.includes("development") || combined.includes("engineering") || combined.includes("coding")) return "tech";
  if (combined.includes("fitness") || combined.includes("wellness") || combined.includes("health")) return "fitness";
  if (combined.includes("video") || combined.includes("social media") || combined.includes("audio") || combined.includes("music")) return "creator";
  if (combined.includes("finance") || combined.includes("accounting") || combined.includes("investing")) return "finance";
  if (combined.includes("sales") || combined.includes("marketing") || combined.includes("business development")) return "entrepreneur";
  return "freelance";
}

// ── MOMENTUM ENGINE ────────────────────────────────────────────────────────────
function getMomentumState(config, habits, dimStreaks) {
  const score = config.momentumFormula(habits, dimStreaks);
  const label = config.momentumLabels.find(l => score >= l.min) || config.momentumLabels[config.momentumLabels.length - 1];
  return { score, ...label };
}

// ── XP ENGINE ─────────────────────────────────────────────────────────────────
function calcTotalXP(habits) {
  return habits.reduce((total, h) => total + (h.completions || 0) * (h.xp || 20), 0);
}

function getRoadmapProgress(roadmap, xp) {
  const completed = roadmap.filter(m => xp >= m.xpRequired).length;
  const next = roadmap.find(m => xp < m.xpRequired);
  return { completed, next, pct: next ? Math.round((xp / next.xpRequired) * 100) : 100 };
}

// ── SHARED UI COMPONENTS ───────────────────────────────────────────────────────

function BarChart({ data, color, height, labels }) {
  const max = Math.max(...data, 1);
  const h = height || 60;
  return (
    <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:h }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{ width:"100%", height:`${Math.round((v/max)*h*0.85)}px`, minHeight:3, background:`linear-gradient(180deg,${color},${color}60)`, borderRadius:4, boxShadow:v>0?`0 0 6px ${color}50`:"none", transition:"height 0.5s ease" }} />
          {labels && <div style={{ fontSize:9, color:T.muted, fontWeight:600 }}>{labels[i]}</div>}
        </div>
      ))}
    </div>
  );
}

function StreakRingMulti({ dimStreaks, dimensions }) {
  // Renders multiple small streak rings side by side for multi-dimension streak systems
  return (
    <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
      {dimensions.map(dim => {
        const val = dimStreaks[dim.id] || 0;
        const max = 21;
        const r = 28, circ = 2 * Math.PI * r;
        const offset = circ - Math.min(val/max, 1) * circ;
        return (
          <div key={dim.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={r} fill="none" stroke={T.border} strokeWidth="5" />
              <circle cx="36" cy="36" r={r} fill="none" stroke={dim.color} strokeWidth="5"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%", filter:`drop-shadow(0 0 4px ${dim.color}80)` }} />
              <text x="36" y="32" textAnchor="middle" fill={dim.color} fontSize="16" fontWeight="900" fontFamily="-apple-system,sans-serif">{val}</text>
              <text x="36" y="45" textAnchor="middle" fill={T.muted} fontSize="7" fontFamily="-apple-system,sans-serif">DAYS</text>
            </svg>
            <div style={{ fontSize:10, color:dim.color, fontWeight:700, textAlign:"center" }}>{dim.icon} {dim.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ metric, value }) {
  const display = value !== undefined ? value : metric.baseline;
  return (
    <div style={{ background:T.card, border:`1px solid ${metric.color}30`, borderRadius:14, padding:"13px 12px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-10, right:-10, width:50, height:50, borderRadius:"50%", background:`${metric.color}08`, filter:"blur(12px)" }} />
      <div style={{ width:32, height:32, borderRadius:9, background:`${metric.color}15`, border:`1px solid ${metric.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, marginBottom:8 }}>{metric.icon}</div>
      <div style={{ fontSize:20, fontWeight:900, color:metric.color, lineHeight:1 }}>{display}{metric.unit}</div>
      <div style={{ fontSize:10, fontWeight:600, color:T.muted, marginTop:4, lineHeight:1.3 }}>{metric.label}</div>
    </div>
  );
}

// ── MODALS ─────────────────────────────────────────────────────────────────────
function PathSelectorModal({ onSelect, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, background:T.surface, borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", border:`1px solid ${T.border}`, animation:"modalIn 0.3s cubic-bezier(0.16,1,0.3,1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:4, borderRadius:2, background:T.border, margin:"0 auto 20px" }} />
        <h3 style={{ fontSize:18, fontWeight:900, color:T.text, margin:"0 0 4px", fontFamily:"Georgia,serif" }}>Your Career Path</h3>
        <p style={{ fontSize:12, color:T.muted, marginBottom:20 }}>Auro will build a completely personalised tracking system for your chosen path.</p>
        {Object.values(PATH_CONFIGS).map(path => (
          <div key={path.id} onClick={() => { onSelect(path.id); onClose(); }} style={{ display:"flex", alignItems:"center", gap:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"13px 16px", marginBottom:8, cursor:"pointer", transition:"border-color 0.15s" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${path.color}15`, border:`1px solid ${path.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{path.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{path.label}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{path.tagline}</div>
            </div>
            <span style={{ color:T.dim, fontSize:16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddHabitModal({ onAdd, onClose, pathColor }) {
  const [text, setText] = useState("");
  const [icon, setIcon] = useState("✅");
  const icons = ["✅","💻","📚","🏋️","✍️","🎯","📈","🤝","🎬","🔍","📧","💼","🎵","📸","🔧","⚡","💡","🚀"];
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, background:T.surface, borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", border:`1px solid ${T.border}`, animation:"modalIn 0.3s cubic-bezier(0.16,1,0.3,1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:4, borderRadius:2, background:T.border, margin:"0 auto 20px" }} />
        <h3 style={{ fontSize:17, fontWeight:900, color:T.text, margin:"0 0 14px", fontFamily:"Georgia,serif" }}>Add Custom Habit</h3>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
          {icons.map(ic => (
            <div key={ic} onClick={() => setIcon(ic)} style={{ width:36, height:36, borderRadius:10, background: icon===ic ? `${pathColor}20` : T.card, border:`1.5px solid ${icon===ic ? pathColor : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, cursor:"pointer", transition:"all 0.15s" }}>{ic}</div>
          ))}
        </div>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==="Enter" && text.trim() && onAdd({label:text.trim(),icon})} placeholder="What habit do you want to build?" style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:`1px solid ${pathColor}50`, background:T.card, color:T.text, fontSize:14, fontFamily:"inherit", outline:"none", marginBottom:14, boxSizing:"border-box" }} />
        <button onClick={() => text.trim() && onAdd({label:text.trim(),icon})} style={{ width:"100%", padding:"14px", borderRadius:13, border:"none", fontFamily:"inherit", background:T.gradPrimary, color:"#0a0800", fontSize:14, fontWeight:800, cursor:"pointer" }}>Add Habit</button>
      </div>
    </div>
  );
}

// ── PATH-SPECIFIC DASHBOARD HEADER ─────────────────────────────────────────────
function PathDashboard({ config, habits, dimStreaks, totalXP, momentum }) {
  const stats = config.dashboardStats({ habits, dimStreaks, totalXP });
  return (
    <div style={{ background:T.card, border:`1px solid ${config.color}30`, borderRadius:20, padding:"18px 16px", marginBottom:16, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:`${config.color}06`, filter:"blur(30px)" }} />
      {/* Streak multi-ring */}
      <div style={{ marginBottom:14 }}>
        <StreakRingMulti dimStreaks={dimStreaks} dimensions={config.streakDimensions} />
      </div>
      {/* Momentum bar */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
          <span style={{ fontSize:14, fontWeight:800, color:momentum.color }}>{momentum.label}</span>
          <span style={{ fontSize:11, color:config.color, fontWeight:700 }}>{momentum.score}%</span>
        </div>
        <div style={{ height:5, background:T.border, borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${momentum.score}%`, background:`linear-gradient(90deg,${config.color},${config.color}80)`, borderRadius:3, transition:"width 0.8s ease", boxShadow:`0 0 8px ${config.color}60` }} />
        </div>
        <div style={{ fontSize:11, color:T.muted, marginTop:6, lineHeight:1.5 }}>{momentum.sub}</div>
      </div>
      {/* Stat pills */}
      <div style={{ display:"flex", gap:8 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ flex:1, background:`${s.color}10`, border:`1px solid ${s.color}30`, borderRadius:11, padding:"8px 8px", textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:T.muted, fontWeight:600, marginTop:2, lineHeight:1.2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN TRACKING PAGE ─────────────────────────────────────────────────────────
function TrackingPage({ isPremium, onUpgrade, answers }) {
  const initPath = derivePathFromAnswers(answers);
  const [pathId, setPathId] = useState(initPath);
  const config = PATH_CONFIGS[pathId] || PATH_CONFIGS.freelance;

  // Build initial habits from config
  const buildHabits = (cfg) => cfg.habits.map(buildHabitFromDef);

  const [habits, setHabits] = useState(() => buildHabits(config));
  const [dimStreaks, setDimStreaks] = useState(() => {
    const d = {};
    config.streakDimensions.forEach(dim => { d[dim.id] = 0; });
    return d;
  });
  const [goals, setGoals] = useState([
    { id:1, text:`Land first ${config.label} opportunity`, done:false, progress:25, priority:"high" },
    { id:2, text:"Complete Auro analysis", done:true, progress:100, priority:"high" },
    { id:3, text:`Build ${config.icon} portfolio / proof`, done:false, progress:15, priority:"medium" },
  ]);
  const [showPathModal, setShowPathModal] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalText, setEditGoalText] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [celebration, setCelebration] = useState(null);
  const addGoalRef = useRef(null);
  const editGoalRef = useRef(null);

  const WEEK = ["M","T","W","T","F","S","S"];
  const totalXP = calcTotalXP(habits);
  const momentum = getMomentumState(config, habits, dimStreaks);
  const roadmapProgress = getRoadmapProgress(config.roadmap, totalXP);
  const completedGoals = goals.filter(g => g.done).length;
  const insightIdx = Math.floor(Date.now() / 86400000) % config.insights.length;

  const celebrate = (msg) => { setCelebration(msg); setTimeout(() => setCelebration(null), 2600); };

  const switchPath = (newPathId) => {
    const newCfg = PATH_CONFIGS[newPathId];
    setPathId(newPathId);
    setHabits(buildHabits(newCfg));
    const d = {};
    newCfg.streakDimensions.forEach(dim => { d[dim.id] = 0; });
    setDimStreaks(d);
    setGoals([
      { id:Date.now(), text:`Land first ${newCfg.label} opportunity`, done:false, progress:0, priority:"high" },
      { id:Date.now()+1, text:"Complete Auro analysis", done:true, progress:100, priority:"high" },
    ]);
    setActiveTab("dashboard");
    celebrate(`${newCfg.icon} Switched to ${newCfg.label} — your tracker has been rebuilt!`);
  };

  const toggleHabitDay = (habitId, dayIdx) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const days = [...h.days];
      const wasOn = days[dayIdx];
      days[dayIdx] = !wasOn;
      // Calc streak for this habit's dimension (trailing days from today)
      let streak = 0;
      for (let i = 6; i >= 0; i--) { if (days[i]) streak++; else break; }
      const completions = Math.max(0, (h.completions||0) + (wasOn ? -1 : 1));
      if (!wasOn && dayIdx === 6) celebrate(`${h.icon} ${h.label} — done today! +${h.xp}XP 🔥`);
      return { ...h, days, streak, completions };
    }));
    // Update dimension streaks
    setDimStreaks(prev => {
      const hab = habits.find(h => h.id === habitId);
      if (!hab) return prev;
      const dim = hab.streakDim;
      if (!dim) return prev;
      // Recalculate max streak for this dim across all habits using it
      const dimHabs = habits.map(h => h.id === habitId ? { ...h, days: h.days.map((d,i) => i === dayIdx ? !d : d) } : h).filter(h => h.streakDim === dim);
      const dimDays = WEEK.map((_,i) => dimHabs.some(h => h.days[i]));
      let s = 0;
      for (let i = 6; i >= 0; i--) { if (dimDays[i]) s++; else break; }
      return { ...prev, [dim]: s };
    });
  };

  const addHabit = ({ label, icon }) => {
    const id = "c" + Date.now();
    const defaultDim = config.streakDimensions[0]?.id;
    setHabits(prev => [...prev, { id, label, icon, streakDim:defaultDim, xp:20, days:DAYS7(), streak:0, completions:0, custom:true }]);
    setShowAddHabit(false);
    celebrate(`${icon} "${label}" added to your ${config.label} tracker!`);
  };

  const deleteHabit = (id) => setHabits(prev => prev.filter(h => h.id !== id));

  const addGoal = () => {
    if (!newGoalText.trim()) return;
    setGoals(prev => [...prev, { id:Date.now(), text:newGoalText.trim(), done:false, progress:0, priority:"medium" }]);
    setNewGoalText(""); setShowAddGoal(false);
    celebrate("🎯 New goal added!");
  };

  const toggleGoal = (id) => setGoals(prev => prev.map(g => {
    if (g.id !== id) return g;
    if (!g.done) celebrate("✅ Goal completed! Keep pushing.");
    return { ...g, done:!g.done, progress: g.done ? g.progress : 100 };
  }));

  const saveGoalEdit = () => {
    if (!editGoalText.trim()) return;
    setGoals(prev => prev.map(g => g.id === editingGoal ? {...g, text:editGoalText.trim()} : g));
    setEditingGoal(null); setEditGoalText("");
  };

  // ── Analytics data (per-path specific) ────────────────────────────────────
  const weeklyConsistency = [72,85,61,90,78,95, habits.length ? Math.round(habits.reduce((s,h)=>s+h.days.filter(Boolean).length/7,0)/habits.length*100) : 0];
  const weeklyGoals = [30,45,40,60,55,75, Math.round((completedGoals/Math.max(goals.length,1))*100)];

  return (
    <div style={{ animation:"fadeIn 0.35s ease" }}>

      {/* Celebration toast */}
      {celebration && (
        <div style={{ position:"fixed", top:60, left:"50%", transform:"translateX(-50%)", zIndex:800, animation:"toastIn 0.3s ease", pointerEvents:"none" }}>
          <div style={{ background:"#14532d", border:"1px solid #22c55e60", borderRadius:14, padding:"10px 22px", boxShadow:"0 8px 32px rgba(0,0,0,0.6)", whiteSpace:"nowrap" }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#34d399" }}>{celebration}</span>
          </div>
        </div>
      )}

      {showPathModal && <PathSelectorModal onSelect={switchPath} onClose={() => setShowPathModal(false)} />}
      {showAddHabit && <AddHabitModal onAdd={addHabit} onClose={() => setShowAddHabit(false)} pathColor={config.color} />}

      {/* ── PAGE HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:T.text, margin:0, fontFamily:"Georgia,serif" }}>Your Progress</h2>
          <p style={{ fontSize:12, color:T.muted, margin:"3px 0 0" }}>{config.tagline}</p>
        </div>
        <button onClick={() => setShowPathModal(true)} style={{ display:"flex", alignItems:"center", gap:7, background:`${config.color}15`, border:`1px solid ${config.color}40`, borderRadius:13, padding:"8px 13px", cursor:"pointer", fontFamily:"inherit" }}>
          <span style={{ fontSize:16 }}>{config.icon}</span>
          <span style={{ fontSize:11, fontWeight:800, color:config.color }}>{config.label}</span>
          <span style={{ fontSize:10, color:T.muted }}>▾</span>
        </button>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:"flex", background:T.card, borderRadius:13, padding:4, marginBottom:18, border:`1px solid ${T.border}`, gap:2 }}>
        {[["dashboard","Dashboard"],["habits","Habits"],["goals","Goals"],["roadmap","Roadmap"],["analytics","Analytics"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1, padding:"8px 0", border:"none", fontFamily:"inherit", fontSize:10, fontWeight: activeTab===id ? 800 : 600, cursor:"pointer", borderRadius:10, transition:"all 0.18s", background: activeTab===id ? `${config.color}20` : "transparent", color: activeTab===id ? config.color : T.muted, borderBottom: activeTab===id ? `2px solid ${config.color}` : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD TAB — Path-specific hero */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div>
          <PathDashboard config={config} habits={habits} dimStreaks={dimStreaks} totalXP={totalXP} momentum={momentum} />

          {/* Metrics grid — unique per path */}
          <div style={{ marginBottom:18 }}>
            <p style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Key Metrics</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
              {config.metrics.map(metric => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </div>

          {/* Daily XP progress */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px 16px", marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>XP Progress</div>
              <div style={{ fontSize:11, color:config.color, fontWeight:800 }}>{totalXP} XP</div>
            </div>
            {roadmapProgress.next && (
              <>
                <div style={{ fontSize:11, color:T.muted, marginBottom:8 }}>
                  Next: <span style={{ color:config.color, fontWeight:700 }}>{roadmapProgress.next.icon} {roadmapProgress.next.label}</span>
                  <span style={{ color:T.dim }}> · {roadmapProgress.next.xpRequired - totalXP} XP away</span>
                </div>
                <div style={{ height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${roadmapProgress.pct}%`, background:`linear-gradient(90deg,${config.color},${config.accentB})`, borderRadius:3, transition:"width 0.8s ease", boxShadow:`0 0 10px ${config.color}60` }} />
                </div>
              </>
            )}
            {!roadmapProgress.next && (
              <div style={{ fontSize:12, color:"#34d399", fontWeight:700 }}>🏆 All milestones complete!</div>
            )}
          </div>

          {/* AI Insight card — path-specific */}
          <div style={{ background:`linear-gradient(135deg,${config.color}10,${T.card})`, border:`1px solid ${config.color}30`, borderRadius:16, padding:"16px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>🧠</span>
              <div style={{ fontSize:12, fontWeight:800, color:config.color }}>Auro AI · {config.label} Coach</div>
            </div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.65 }}>
              {config.insights[insightIdx]}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HABITS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "habits" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:800, color:T.muted, letterSpacing:2, textTransform:"uppercase", margin:0 }}>{config.label} Habits</p>
              <p style={{ fontSize:11, color:T.muted, margin:"3px 0 0" }}>Tailored for your path</p>
            </div>
            <button onClick={() => setShowAddHabit(true)} style={{ fontSize:11, fontWeight:700, color:config.color, background:`${config.color}10`, border:`1px solid ${config.color}40`, borderRadius:8, padding:"5px 11px", cursor:"pointer", fontFamily:"inherit" }}>+ Custom</button>
          </div>

          {habits.map(habit => {
            const done = habit.days.filter(Boolean).length;
            const pct = Math.round((done/7)*100);
            const dim = config.streakDimensions.find(d => d.id === habit.streakDim);
            return (
              <div key={habit.id} style={{ background:T.card, border:`1px solid ${pct>=70 ? config.color+"50" : T.border}`, borderRadius:16, padding:"14px 14px", marginBottom:10, transition:"all 0.2s" }}>
                <div style={{ display:"flex", alignItems:"center", marginBottom:10, gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:11, background:`${config.color}15`, border:`1px solid ${config.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{habit.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{habit.label}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:3 }}>
                      {dim && <span style={{ fontSize:10, color:dim.color, fontWeight:700, background:`${dim.color}15`, borderRadius:6, padding:"2px 6px" }}>{dim.icon} {dim.label}</span>}
                      <span style={{ fontSize:10, color:T.muted }}>{done}/7 days · +{habit.xp}XP/day</span>
                    </div>
                  </div>
                  {habit.streak >= 3 && <span style={{ fontSize:11, color:"#f87171", fontWeight:800 }}>🔥{habit.streak}</span>}
                  {habit.custom && (
                    <button onClick={() => deleteHabit(habit.id)} style={{ background:"none", border:"none", color:"#f8717150", cursor:"pointer", fontSize:14, padding:"2px" }}>🗑️</button>
                  )}
                </div>
                {/* 7-day grid */}
                <div style={{ display:"flex", gap:5, marginBottom:8 }}>
                  {WEEK.map((day, idx) => (
                    <div key={idx} style={{ flex:1, textAlign:"center" }}>
                      <div style={{ fontSize:9, color:T.muted, marginBottom:4, fontWeight:600 }}>{day}</div>
                      <div onClick={() => toggleHabitDay(habit.id, idx)} style={{ width:"100%", aspectRatio:"1", borderRadius:6, background: habit.days[idx] ? config.color : T.border, cursor:"pointer", transition:"all 0.15s", boxShadow: habit.days[idx] ? `0 0 8px ${config.color}60` : "none" }} />
                    </div>
                  ))}
                </div>
                <div style={{ height:3, background:T.border, borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${config.color},${config.color}80)`, borderRadius:2, transition:"width 0.5s ease" }} />
                </div>
              </div>
            );
          })}

          {!habits.length && (
            <div style={{ textAlign:"center", padding:"40px 0", color:T.muted }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
              <div style={{ fontSize:14, fontWeight:600 }}>No habits yet</div>
              <div style={{ fontSize:12, marginTop:4 }}>Tap + Custom to add one</div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GOALS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "goals" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:800, color:T.muted, letterSpacing:2, textTransform:"uppercase", margin:0 }}>Goals</p>
            <button onClick={() => { setShowAddGoal(true); setTimeout(() => addGoalRef.current?.focus(), 80); }} style={{ fontSize:11, fontWeight:700, color:T.primary, background:`${T.primary}10`, border:`1px solid ${T.primary}40`, borderRadius:8, padding:"5px 11px", cursor:"pointer", fontFamily:"inherit" }}>+ Add</button>
          </div>
          {showAddGoal && (
            <div style={{ display:"flex", gap:8, marginBottom:12, animation:"fadeIn 0.2s ease" }}>
              <input ref={addGoalRef} value={newGoalText} onChange={e => setNewGoalText(e.target.value)} onKeyDown={e => e.key==="Enter" && addGoal()} placeholder="Enter your goal..." style={{ flex:1, padding:"10px 12px", borderRadius:10, border:`1px solid ${T.primary}50`, background:T.card, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
              <button onClick={addGoal} style={{ padding:"10px 14px", borderRadius:10, border:"none", background:T.gradPrimary, color:"#0a0800", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Save</button>
              <button onClick={() => { setShowAddGoal(false); setNewGoalText(""); }} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
            </div>
          )}
          {goals.map(goal => (
            <div key={goal.id} style={{ background:T.card, border:`1px solid ${editingGoal===goal.id ? T.primary+"60" : goal.done ? "#34d39930" : T.border}`, borderRadius:14, padding:"12px 14px", marginBottom:8, transition:"all 0.2s" }}>
              {editingGoal === goal.id ? (
                <div style={{ display:"flex", gap:8 }}>
                  <input ref={editGoalRef} value={editGoalText} onChange={e => setEditGoalText(e.target.value)} onKeyDown={e => e.key==="Enter" && saveGoalEdit()} style={{ flex:1, padding:"8px 10px", borderRadius:8, border:`1px solid ${T.primary}50`, background:T.bg, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
                  <button onClick={saveGoalEdit} style={{ padding:"8px 12px", borderRadius:8, border:"none", background:T.gradPrimary, color:"#0a0800", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✓</button>
                  <button onClick={() => setEditingGoal(null)} style={{ padding:"8px 10px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <div onClick={() => toggleGoal(goal.id)} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${goal.done ? "#34d399" : T.dim}`, background: goal.done ? "#34d399" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.18s" }}>
                      {goal.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color: goal.done ? T.muted : T.text, fontWeight:600, textDecoration: goal.done ? "line-through" : "none" }}>{goal.text}</div>
                      <div style={{ fontSize:10, marginTop:2, color: goal.priority==="high" ? "#f87171" : goal.priority==="medium" ? T.gold : T.muted, fontWeight:700 }}>
                        {goal.priority==="high" ? "● High" : goal.priority==="medium" ? "● Medium" : "● Low"} priority
                      </div>
                    </div>
                    <button onClick={() => { setEditingGoal(goal.id); setEditGoalText(goal.text); setTimeout(() => editGoalRef.current?.focus(), 80); }} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:13, padding:"2px" }}>✏️</button>
                    <button onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))} style={{ background:"none", border:"none", color:"#f8717150", cursor:"pointer", fontSize:13, padding:"2px" }}>🗑️</button>
                  </div>
                  <div style={{ height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${goal.progress}%`, background: goal.done ? "#34d399" : T.gradPrimary, borderRadius:2, transition:"width 0.5s ease" }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROADMAP TAB — Path-specific milestones */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "roadmap" && (
        <div>
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:800, color:T.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>{config.icon} {config.label} Roadmap</p>
            <div style={{ fontSize:11, color:T.muted }}>{roadmapProgress.completed}/{config.roadmap.length} milestones complete · {totalXP} XP earned</div>
          </div>
          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:16, top:0, bottom:0, width:2, background:`linear-gradient(180deg,${config.color},${T.border})`, zIndex:0 }} />
            {config.roadmap.map((m, i) => {
              const done = totalXP >= m.xpRequired;
              const isNext = !done && (i === 0 || totalXP >= config.roadmap[i-1].xpRequired);
              const locked = !done && !isNext;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14, position:"relative", zIndex:1 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background: locked ? T.card : done ? "#34d399" : `${config.color}20`, border:`2px solid ${locked ? T.dim : done ? "#34d399" : config.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0, boxShadow: done ? "0 0 14px #34d39970" : isNext ? `0 0 12px ${config.color}60` : "none", transition:"all 0.2s" }}>
                    {locked ? "🔒" : m.icon}
                  </div>
                  <div style={{ flex:1, background: locked ? `${T.card}60` : T.card, border:`1px solid ${done ? "#34d39940" : isNext ? config.color+"40" : T.dim+"20"}`, borderRadius:13, padding:"11px 14px", opacity: locked ? 0.5 : 1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:13, fontWeight: done ? 700 : 600, color: done ? "#34d399" : T.text }}>{m.label}</div>
                      <div style={{ fontSize:10, color: done ? "#34d399" : T.dim, fontWeight:700 }}>{m.xpRequired} XP</div>
                    </div>
                    {done && <div style={{ fontSize:11, color:"#34d399", marginTop:2 }}>✓ Milestone unlocked</div>}
                    {isNext && (
                      <div style={{ marginTop:6 }}>
                        <div style={{ height:3, background:T.border, borderRadius:2, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.round((totalXP/m.xpRequired)*100)}%`, background:`linear-gradient(90deg,${config.color},${config.accentB})`, borderRadius:2 }} />
                        </div>
                        <div style={{ fontSize:10, color:config.color, marginTop:3, fontWeight:700 }}>
                          {m.xpRequired - totalXP} XP to unlock →
                        </div>
                      </div>
                    )}
                    {locked && <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>Earn {m.xpRequired} XP to unlock</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ANALYTICS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div>
          {isPremium ? (
            <div>
              {/* Weekly habit consistency */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Weekly Habit Consistency</div>
                  <div style={{ fontSize:11, color:config.color, fontWeight:700 }}>{weeklyConsistency[6]}%</div>
                </div>
                <BarChart data={weeklyConsistency} color={config.color} height={70} labels={["M","T","W","T","F","S","S"]} />
              </div>

              {/* Dimension streaks breakdown */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>Streak Dimensions</div>
                {config.streakDimensions.map(dim => {
                  const val = dimStreaks[dim.id] || 0;
                  const pct = Math.min(Math.round((val/21)*100), 100);
                  return (
                    <div key={dim.id} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>{dim.icon} {dim.label} Streak</span>
                        <span style={{ fontSize:12, color:dim.color, fontWeight:800 }}>{val} days</span>
                      </div>
                      <div style={{ height:5, background:T.border, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${dim.color},${dim.color}80)`, borderRadius:3, boxShadow:`0 0 6px ${dim.color}50` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Per-habit performance */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:12 }}>Habit Performance This Week</div>
                {habits.map(h => {
                  const pct = Math.round((h.days.filter(Boolean).length/7)*100);
                  return (
                    <div key={h.id} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:T.text }}>{h.icon} {h.label}</span>
                        <span style={{ fontSize:12, color: pct>=70 ? config.color : pct>=40 ? T.gold : T.muted, fontWeight:700 }}>{pct}%</span>
                      </div>
                      <div style={{ height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background: pct>=70 ? `linear-gradient(90deg,${config.color},${config.color}80)` : pct>=40 ? `linear-gradient(90deg,${T.gold},${T.gold}80)` : T.dim, borderRadius:2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Goal trend */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Goal Completion Trend</div>
                  <div style={{ fontSize:11, color:T.gold, fontWeight:700 }}>{weeklyGoals[6]}% this week</div>
                </div>
                <BarChart data={weeklyGoals} color={T.gold} height={55} labels={["W1","W2","W3","W4","W5","W6","Now"]} />
              </div>

              {/* Path-specific AI insight */}
              <div style={{ background:`linear-gradient(135deg,${config.color}12,${T.card})`, border:`1px solid ${config.color}30`, borderRadius:16, padding:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:18 }}>🧠</span>
                  <div style={{ fontSize:12, fontWeight:800, color:config.color }}>Auro AI · {config.aiPersona}</div>
                </div>
                <div style={{ fontSize:13, color:T.text, lineHeight:1.65, marginBottom:10 }}>
                  Momentum score: <strong style={{ color:config.color }}>{momentum.score}%</strong> — {momentum.sub.toLowerCase()}. {config.insights[insightIdx]}
                </div>
                {isPremium && (
                  <div style={{ padding:"10px 12px", background:`${config.color}10`, borderRadius:10, border:`1px solid ${config.color}20` }}>
                    <div style={{ fontSize:11, fontWeight:700, color:config.color, marginBottom:4 }}>Premium Insight</div>
                    <div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{config.premiumPerks[0]} · {config.premiumPerks[1]}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Blurred teaser */}
              <div style={{ filter:"blur(3px)", pointerEvents:"none", userSelect:"none", marginBottom:14 }}>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px", marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:12 }}>Weekly Consistency</div>
                  <BarChart data={weeklyConsistency} color={config.color} height={60} labels={["M","T","W","T","F","S","S"]} />
                </div>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:10 }}>Streak Dimensions</div>
                  <StreakRingMulti dimStreaks={dimStreaks} dimensions={config.streakDimensions} />
                </div>
              </div>
              {/* Upgrade card */}
              <div style={{ background:`linear-gradient(135deg,${T.card},${T.bg})`, border:`1.5px solid ${T.gold}40`, borderRadius:18, padding:"24px 20px", textAlign:"center", boxShadow:`0 0 30px ${T.gold}10` }}>
                <div style={{ fontSize:30, marginBottom:12 }}>📊</div>
                <div style={{ fontSize:16, fontWeight:900, color:T.gold, marginBottom:8 }}>Advanced Analytics</div>
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.7, marginBottom:18 }}>
                  Unlock {config.label}-specific analytics, AI-driven insights, streak breakdowns, and momentum forecasting.
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:18, textAlign:"left" }}>
                  {config.premiumPerks.map((perk,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.text }}>
                      <span style={{ color:T.gold }}>✓</span> {perk}
                    </div>
                  ))}
                </div>
                <button onClick={onUpgrade} style={{ width:"100%", padding:"14px", borderRadius:13, border:"none", fontFamily:"inherit", background:T.gradPrimary, color:"#0a0800", fontSize:14, fontWeight:900, cursor:"pointer", boxShadow:`0 0 24px ${T.gold}40` }}>Unlock Premium →</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}


// ── AI Chat Page ───────────────────────────────────────────────────────────────
// Defined OUTSIDE App — critical for stable input refs and no keyboard dismissal
function AIChatPage({ isPremium, onUpgrade, userProfile, userStats, answers, firebaseUid }) {
  const FREE_LIMIT    = 3;
  const PREMIUM_LIMIT = 25;
  const limit         = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;


const [messages, setMessages] = useState(() => {
  const saved = localStorage.getItem("auro_messages");
  return saved ? JSON.parse(saved) : [];
});
  const [inputText,       setInputText]       = useState("");
  const [isTyping,        setIsTyping]        = useState(false);
  const [msgsUsed, setMsgsUsed] =
  useState(() => Number(getDailyUsage(firebaseUid)) || 0);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [aiError,         setAiError]         = useState("");
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => { localStorage.setItem( "auro_messages", JSON.stringify(messages) ); }, [messages]);

  const suggestions = [
    "What should I focus on today?",
    "Help me stay disciplined",
    "Analyse my progress",
    "Best income path for me",
    "Give me a motivation boost",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const buildHistory = (currentMessages) =>
    currentMessages.slice(-10).map(m => ({ role: m.role, text: m.text }));


const sendMessage = async (text) => {
  const trimmed = (text || inputText).trim();
  if (!trimmed || isTyping) return;

  if (!isPremium && msgsUsed >= limit) {
    setShowLimitBanner(true);
    return;
  }

  const userMsg = {
    id: Date.now(),
    role: "user",
    text: trimmed,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
  };

  setMessages(prev => [...prev, userMsg]);
  setInputText("");
  setAiError("");
  setIsTyping(true);

  try {
    const responseText = await auroChat([
      ...buildHistory(messages),
      {
        role: "user",
        content: trimmed
      }
    ]);

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: "ai",
      text: responseText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
    }]);

    setMsgsUsed(prev => {
      const updated = prev + 1;

      try {
        const d = new Date();
        const dk =
          `auro_chat_usage_${firebaseUid ?? "anon"}_` +
          `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

        localStorage.setItem(dk, String(updated));
      } catch (_) {}

      return updated;
    });

  } catch (err) {
    setAiError(
      err?.message ?? "Something went wrong. Please try again."
    );

  } finally {
    setIsTyping(false);
  }
};





const safeLimit = Number(limit ?? 3);
const safeUsed = Number(msgsUsed ?? 0);

const remaining = Math.max(0, safeLimit - safeUsed);
const hasMessages = messages.length > 0;

return (
  <div style={{
    display: "flex",
    flexDirection: "column",
    minHeight: 440,
    animation: "fadeIn 0.35s ease"
  }}>

    {/* Header */}
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingBottom: 14,
      borderBottom: `1px solid ${T.border}`
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: `${T.primary}15`,
          border: `1px solid ${T.primary}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          position: "relative"
        }}>
          🤖
          <div style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#34d399",
            border: `2px solid ${T.surface}`
          }} />
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
            Auro AI Coach
          </div>
          <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
            ● Auro AI Core
          </div>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        {isPremium ? (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: `${T.gold}15`,
            border: `1px solid ${T.gold}40`,
            borderRadius: 12,
            padding: "4px 10px"
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: T.gold
            }}>
              ⭐ Premium
            </span>
          </div>
        ) : (
          <div style={{
            fontSize: 11,
            color: remaining <= 1 ? "#f87171" : T.muted,
            fontWeight: 600
          }}>
            {remaining}/{safeLimit} messages left
          </div>
        )}
      </div>
    </div>

    {/* Clear Chat Button */}
    {hasMessages && (
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 12
      }}>
        <button
          onClick={() => {
            localStorage.removeItem("auro_messages");
            setMessages([]);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Clear Chat
        </button>
      </div>
    )}


      
      {/* Limit banner */}
      {showLimitBanner && (
        <div style={{ background:`${T.gold}15`, border:`1px solid ${T.gold}40`, borderRadius:14, padding:"12px 14px", marginBottom:12, animation:"fadeIn 0.2s ease" }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.gold, marginBottom:4 }}>Daily limit reached</div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:10 }}>Upgrade to Premium for {PREMIUM_LIMIT} messages per day.</div>
          <button onClick={onUpgrade} style={{ padding:"8px 16px", borderRadius:10, border:"none", background:T.gradPrimary, color:"#0a0800", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Upgrade Now →</button>
        </div>
      )}

      {/* AI error banner */}
      {aiError && (
        <div style={{ background:"#450a0a", border:"1px solid #f8717160", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#f87171", lineHeight:1.45, animation:"fadeIn 0.2s ease" }}>
          ⚠ {aiError}
          <span onClick={() => setAiError("")} style={{ float:"right", cursor:"pointer", opacity:0.7 }}>✕</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", marginBottom:12, minHeight:240, maxHeight:340 }}>
        {!hasMessages ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:44, marginBottom:14 }}>🧠</div>
            <h3 style={{ fontSize:18, fontWeight:900, color:T.text, margin:"0 0 8px", fontFamily:"Georgia,serif" }}>Your AI Coach is Ready</h3>
            <p style={{ fontSize:13, color:T.muted, lineHeight:1.65, maxWidth:280, margin:"0 auto 24px" }}>
              Ask anything about your career, goals, habits, or income strategy. I know your profile and progress.
            </p>
            {!isPremium && (
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"10px 14px", marginBottom:20, display:"inline-block" }}>
                <span style={{ fontSize:11, color:T.muted }}>Free plan: </span>
                <span style={{ fontSize:11, fontWeight:700, color:T.primary }}>{FREE_LIMIT} messages/day</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10, paddingBottom:4 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display:"flex", flexDirection:"column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", animation:"fadeIn 0.22s ease" }}>
                {msg.role === "ai" && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <div style={{ width:18, height:18, borderRadius:6, background:`${T.primary}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>🤖</div>
                    <span style={{ fontSize:10, color:T.muted, fontWeight:600 }}>Auro AI · {msg.time}</span>
                  </div>
                )}
                <div style={{
                  maxWidth:"82%", padding:"11px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background:   msg.role === "user" ? T.gradPrimary : T.card,
                  border:       msg.role === "ai" ? `1px solid ${T.border}` : "none",
                  color:        msg.role === "user" ? "#0a0800" : T.text,
                  fontSize:13, lineHeight:1.6, fontWeight: msg.role === "user" ? 600 : 400,
                  boxShadow:    msg.role === "user" ? `0 0 16px ${T.gold}30` : "none",
                }}>
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <span style={{ fontSize:10, color:T.muted, marginTop:3 }}>{msg.time}</span>
                )}
              </div>
            ))}
            {isTyping && (
              <div style={{ display:"flex", alignItems:"center", gap:6, animation:"fadeIn 0.2s ease" }}>
                <div style={{ width:18, height:18, borderRadius:6, background:`${T.primary}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>🤖</div>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"16px 16px 16px 4px", padding:"11px 16px", display:"flex", gap:4, alignItems:"center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.primary, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {!hasMessages && (
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14 }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)} style={{ padding:"7px 12px", borderRadius:20, border:`1px solid ${T.border}`, background:T.card, color:T.text, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display:"flex", gap:8, alignItems:"flex-end", paddingTop:10, borderTop:`1px solid ${T.border}` }}>
        <input
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={msgsUsed >= limit ? "Daily limit reached" : "Ask your AI coach\u2026"}
          disabled={(msgsUsed >= limit && !isPremium) || isTyping}
          maxLength={500}
          style={{
            flex:1, padding:"11px 14px", borderRadius:13,
            border:`1px solid ${inputText ? T.primary+"60" : T.border}`,
            background:T.card, color:T.text, fontSize:14,
            fontFamily:"inherit", outline:"none", resize:"none",
            opacity: (msgsUsed >= limit && !isPremium) ? 0.5 : 1,
            transition:"border-color 0.18s",
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!inputText.trim() || isTyping || (msgsUsed >= limit && !isPremium)}
          style={{
            width:42, height:42, borderRadius:12, border:"none", flexShrink:0,
            background: inputText.trim() && !isTyping ? T.gradPrimary : T.border,
            color:      inputText.trim() && !isTyping ? "#0a0800" : T.muted,
            cursor:     inputText.trim() && !isTyping ? "pointer" : "default",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, transition:"all 0.18s",
            boxShadow: inputText.trim() && !isTyping ? `0 0 12px ${T.gold}40` : "none",
          }}
        >\u2191</button>
      </div>
      {inputText.length > 400 && (
        <div style={{ fontSize:10, color: inputText.length >= 500 ? "#f87171" : T.muted, textAlign:"right", marginTop:4 }}>
          {inputText.length}/500
        </div>
      )}
    </div>
  );
}


// ── Toggle component (top-level — stable identity, no keyboard issues) ────────
function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width:44, height:26, borderRadius:13, background:value ? T.gold : T.border, cursor:"pointer", position:"relative", transition:"background 0.22s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:value ? 21 : 3, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.22s", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }} />
    </div>
  );
}

// ── SubScreenShell (top-level) ─────────────────────────────────────────────────
function SubScreenShell({ title, children, onBack }) {
  return (
    <div style={{ animation:"slideIn 0.25s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={{ width:34, height:34, borderRadius:10, background:T.card, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:T.muted, flexShrink:0 }}>←</button>
        <h2 style={{ fontSize:17, fontWeight:800, color:T.text, margin:0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── AuthStateDebug — DEBUG only, shows live Firebase auth state ───────────────
// Used inside the debug panel in ProfileEditScreen.
// Remove this component when removing the debug panel.
function AuthStateDebug() {
  const user = auth.currentUser;
  if (!user) {
    return (
      <p style={{ fontSize:11, color:"#f87171", fontFamily:"monospace", margin:0 }}>
        ✗ auth.currentUser is null
      </p>
    );
  }
  return (
    <div style={{ fontSize:11, fontFamily:"monospace", color:T.muted, lineHeight:1.7 }}>
      <p style={{ margin:0 }}><strong style={{ color:T.text }}>uid:</strong> {user.uid}</p>
      <p style={{ margin:0 }}><strong style={{ color:T.text }}>email:</strong> {user.email}</p>
      <p style={{ margin:0 }}><strong style={{ color:T.text }}>emailVerified:</strong>{" "}
        <span style={{ color: user.emailVerified ? "#34d399" : "#f87171" }}>
          {String(user.emailVerified)}
        </span>
      </p>
      <p style={{ margin:0 }}><strong style={{ color:T.text }}>providerData[0].providerId:</strong>{" "}
        {user.providerData?.[0]?.providerId ?? "(none)"}
      </p>
    </div>
  );
}

// ── Profile Edit Screen ────────────────────────────────────────────────────────
// Name:  saved immediately via Firebase updateProfile — no security boundary.
// Email: never saved locally. Sends a verification link to the NEW address via
//        verifyBeforeUpdateEmail. Firebase applies the change only after the
//        user clicks that link. The old email stays active until then.
// ── Profile Edit Screen ────────────────────────────────────────────────────────
//
// NAME:  saved immediately via Firebase updateProfile. No security boundary.
//
// EMAIL: three-stage flow
//   "idle"    → user types new email, instant format validation
//   "reauth"  → Firebase returned auth/requires-recent-login; user enters password
//   "sent"    → verifyBeforeUpdateEmail() succeeded; confirmation shown
//
// verifyBeforeUpdateEmail() sends a link to the NEW address.
// Firebase applies the change only after the user clicks that link.
// auth.currentUser.email is never changed by this screen — onAuthChange in App
// will pick up the update automatically when Firebase processes the link click.
//
function ProfileEditScreen({ currentName, currentEmail, onNameSaved, onEmailVerificationSent, onBack, onToast }) {

  // ── Name ──────────────────────────────────────────────────────────────────
  const [name, setName]             = useState(currentName);
  const [nameSaving, setNameSaving] = useState(false);

  // ── Email ──────────────────────────────────────────────────────────────────
  const [newEmail, setNewEmail]         = useState("");
  const [emailError, setEmailError]     = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // "idle" | "reauth" | "sent"
  const [emailStep, setEmailStep] = useState("idle");

  // Reauth sub-state (only used when emailStep === "reauth")
  const [password, setPassword]         = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [reauthLoading, setReauthLoading] = useState(false);
  // Remember the target email across the reauth step
  const pendingEmailRef = useState("")[1]; // write-only ref pattern
  const [pendingEmail, setPendingEmail]   = useState("");

  // DEBUG — raw Firebase error captured for in-UI display; null when no error
  const [debugError, setDebugError] = useState(null);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateEmail = (value) => {
    const v = value.trim();
    if (!v) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address.";
    if (v.toLowerCase() === currentEmail.toLowerCase()) return "This is already your current email.";
    return "";
  };

  const handleNewEmailInput = (value) => {
    setNewEmail(value);
    setEmailError(validateEmail(value));
    if (emailStep === "sent") setEmailStep("idle");
  };

  const emailReady = newEmail.trim() !== "" && !emailError && newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputSty = (hasError) => ({
    width: "100%", padding: "13px 14px", borderRadius: 12, outline: "none",
    border: `1px solid ${hasError ? "#f87171" : T.border}`,
    background: T.card, color: T.text, fontSize: 14,
    fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.18s",
  });

  const primaryBtn = (disabled) => ({
    width: "100%", padding: "14px", borderRadius: 13, border: "none",
    fontFamily: "inherit", fontSize: 14, fontWeight: 800, transition: "all 0.18s",
    background: disabled ? T.dim : T.gradPrimary,
    color: disabled ? T.muted : "#0a0800",
    cursor: disabled ? "default" : "pointer",
    boxShadow: disabled ? "none" : `0 0 18px ${T.gold}30`,
  });

  const ghostBtn = (active = true) => ({
    width: "100%", padding: "13px", borderRadius: 12,
    border: `1px solid ${active ? T.primary + "50" : T.border}`,
    fontFamily: "inherit", fontSize: 14, fontWeight: 800, transition: "all 0.18s",
    background: active ? `${T.primary}18` : "transparent",
    color: active ? T.primary : T.muted,
    cursor: active ? "pointer" : "default",
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed)                   { onToast("Name cannot be empty.", "error"); return; }
    if (trimmed === currentName)    { onToast("No changes to save.", "info");   return; }
    setNameSaving(true);
    try {
      await updateDisplayName(trimmed);
      onNameSaved(trimmed);
      onToast("Name updated.", "success");
    } catch (err) {
      onToast(friendlyAuthError(err), "error");
    } finally {
      setNameSaving(false);
    }
  };

  // Core email-change call — called both on first attempt and after reauth
  const attemptEmailChange = async (targetEmail) => {
    setEmailSending(true); setEmailError(""); setDebugError(null);

    // ── DEBUG: log entry point ─────────────────────────────────────────────
    console.group("[Auro] attemptEmailChange — entry");
    console.log("targetEmail:", targetEmail);
    console.log("auth.currentUser at call time:", auth.currentUser);
    console.groupEnd();

    try {
      console.log("[Auro] awaiting requestEmailChange…");
      await requestEmailChange(targetEmail);      // verifyBeforeUpdateEmail()
      console.log("[Auro] requestEmailChange resolved — success");
      setPendingEmail(targetEmail);
      setEmailStep("sent");
      setDebugError(null);
      if (onEmailVerificationSent) onEmailVerificationSent(targetEmail);
      onToast("Verification email sent. Check your inbox.", "success");
    } catch (err) {
      // ── DEBUG: capture full error for UI display ───────────────────────
      console.group("[Auro] attemptEmailChange — CAUGHT error");
      console.error("err:", err);
      console.error("err.code:", err?.code);
      console.error("err.message:", err?.message);
      console.groupEnd();

      // Store the raw error for the debug panel in the UI
      setDebugError({
        code:    err?.code    ?? "(no code)",
        message: err?.message ?? "(no message)",
        name:    err?.name    ?? "(no name)",
      });

      if (err?.code === "auth/requires-recent-login") {
        // Session too old — slide into reauth step
        setPendingEmail(targetEmail);
        setEmailStep("reauth");
        setPassword("");
        setPasswordError("");
      } else {
        const msg = friendlyAuthError(err);
        setEmailError(msg);
        onToast(msg, "error");
      }
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendVerification = async () => {
    const trimmed = newEmail.trim();
    const err = validateEmail(trimmed);
    if (err) { setEmailError(err); return; }
    await attemptEmailChange(trimmed);
  };

  // Called from the reauth modal — re-signs in, then retries the email change
  const handleReauth = async () => {
    if (!password) { setPasswordError("Please enter your password."); return; }
    setReauthLoading(true); setPasswordError("");
    try {
      await reauthenticate(password);           // reauthenticateWithCredential()
      // Reauth succeeded — immediately retry the email change
      setEmailStep("idle");                     // clear reauth UI first
      await attemptEmailChange(pendingEmail);   // will set "sent" on success
    } catch (err) {
      setPasswordError(friendlyAuthError(err));
    } finally {
      setReauthLoading(false);
    }
  };

  const resetEmailFlow = () => {
    setEmailStep("idle");
    setNewEmail("");
    setEmailError("");
    setPassword("");
    setPasswordError("");
    setPendingEmail("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SubScreenShell title="Edit Profile" onBack={onBack}>

      {/* Avatar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold}50,${T.primary}50)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 18px", border:`2px solid ${T.gold}40` }}>👤</div>
        <button onClick={() => onToast("Photo upload coming soon.", "info")} style={{ display:"block", margin:"0 auto 24px", padding:"8px 18px", borderRadius:10, border:`1px solid ${T.border}`, background:T.card, color:T.primary, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer" }}>Change Photo</button>
      </div>

      {/* ── Display Name ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>Display Name</p>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus style={inputSty(false)} />
        <button
          onClick={handleSaveName}
          disabled={nameSaving || !name.trim() || name.trim() === currentName}
          style={{ ...primaryBtn(nameSaving || !name.trim() || name.trim() === currentName), marginTop: 10 }}
        >
          {nameSaving ? "Saving…" : "Save Name"}
        </button>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: T.border, margin: "4px 0 22px" }} />

      {/* ── Email Section ────────────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:10 }}>Email Address</p>

        {/* Current email — always visible, read-only */}
        <div style={{ padding:"11px 14px", borderRadius:11, background:T.bg, border:`1px solid ${T.border}`, marginBottom:16 }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Current</p>
          <p style={{ fontSize:14, color:T.text, fontWeight:600, margin:0 }}>{currentEmail}</p>
        </div>

        {/* ── STEP: idle — new email input ─────────────────────────────── */}
        {emailStep === "idle" && (
          <>
            <p style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>New Email</p>
            <input
              value={newEmail}
              onChange={e => handleNewEmailInput(e.target.value)}
              onBlur={() => { if (newEmail) setEmailError(validateEmail(newEmail)); }}
              type="email"
              placeholder="Enter new email address"
              style={inputSty(!!emailError)}
            />
            {emailError && (
              <p style={{ fontSize:12, color:"#f87171", marginTop:6, lineHeight:1.4 }}>⚠ {emailError}</p>
            )}

            <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginTop:12, padding:"10px 12px", background:`${T.primary}0d`, border:`1px solid ${T.primary}25`, borderRadius:10 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>🔒</span>
              <p style={{ fontSize:11, color:T.muted, margin:0, lineHeight:1.6 }}>
                A verification link is sent to your <strong style={{ color:T.text }}>new address</strong>. Your email only updates after you click that link — your current address stays active until then.
              </p>
            </div>

            <button
              onClick={handleSendVerification}
              disabled={emailSending || !emailReady}
              style={{ ...ghostBtn(emailReady && !emailSending), marginTop: 14 }}
            >
              {emailSending ? "Sending…" : "Send Verification Email →"}
            </button>
          </>
        )}

        {/* ── STEP: reauth — Firebase requires recent login ────────────── */}
        {emailStep === "reauth" && (
          <div style={{ animation:"fadeIn 0.25s ease" }}>
            <div style={{ padding:"14px", background:`${T.gold}10`, border:`1px solid ${T.gold}35`, borderRadius:12, marginBottom:16 }}>
              <p style={{ fontSize:13, fontWeight:800, color:T.gold, marginBottom:5 }}>🔒 Confirm your password</p>
              <p style={{ fontSize:12, color:T.muted, lineHeight:1.55, margin:0 }}>
                For security, Firebase requires you to confirm your password before changing your email to{" "}
                <strong style={{ color:T.text }}>{pendingEmail}</strong>.
              </p>
            </div>

            <p style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>Current Password</p>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
              onKeyDown={e => e.key === "Enter" && handleReauth()}
              placeholder="Enter your password"
              autoFocus
              style={inputSty(!!passwordError)}
            />
            {passwordError && (
              <p style={{ fontSize:12, color:"#f87171", marginTop:6, lineHeight:1.4 }}>⚠ {passwordError}</p>
            )}

            <button
              onClick={handleReauth}
              disabled={reauthLoading || !password}
              style={{ ...primaryBtn(reauthLoading || !password), marginTop: 14 }}
            >
              {reauthLoading ? "Verifying…" : "Confirm & Send Verification Email →"}
            </button>

            <button
              onClick={resetEmailFlow}
              style={{ ...ghostBtn(false), marginTop: 10 }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── STEP: sent — confirmation ─────────────────────────────────── */}
        {emailStep === "sent" && (
          <div style={{ padding:"18px", background:"#14532d22", border:"1px solid #22c55e40", borderRadius:12, animation:"fadeIn 0.3s ease" }}>
            <p style={{ fontSize:14, fontWeight:800, color:"#34d399", marginBottom:8 }}>✓ Verification email sent</p>
            <p style={{ fontSize:12, color:T.muted, lineHeight:1.65, marginBottom:14 }}>
              We sent a confirmation link to{" "}
              <strong style={{ color:T.text }}>{pendingEmail}</strong>. Click it to apply your new address.
              Until then, your email stays as{" "}
              <strong style={{ color:T.text }}>{currentEmail}</strong>.
            </p>
            <p style={{ fontSize:11, color:T.muted, lineHeight:1.5, marginBottom:14 }}>
              Didn't receive it? Check your spam folder, or use the button below to try a different address.
            </p>
            <button
              onClick={resetEmailFlow}
              style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:9, padding:"8px 14px", color:T.muted, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer" }}
            >
              Use a different email
            </button>
          </div>
        )}

        {/* ── DEBUG PANEL — shows raw Firebase error; remove before shipping ── */}
        <div style={{ marginTop:20, padding:"14px", borderRadius:12, border:"2px solid #f5c84260", background:"#f5c84208" }}>
          <p style={{ fontSize:10, fontWeight:800, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
            ⚙ Debug — Firebase Email Change
          </p>

          {/* Live auth state */}
          <div style={{ marginBottom:10 }}>
            <p style={{ fontSize:10, fontWeight:700, color:T.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>auth.currentUser</p>
            <AuthStateDebug />
          </div>

          {/* Last error */}
          {debugError ? (
            <div style={{ background:"#450a0a", border:"1px solid #f8717160", borderRadius:9, padding:"10px 12px" }}>
              <p style={{ fontSize:10, fontWeight:800, color:"#f87171", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Last Firebase Error</p>
              <p style={{ fontSize:12, color:"#fca5a5", fontFamily:"monospace", marginBottom:3 }}>
                <strong>code:</strong> {debugError.code}
              </p>
              <p style={{ fontSize:11, color:"#fca5a5", fontFamily:"monospace", marginBottom:3, wordBreak:"break-all" }}>
                <strong>message:</strong> {debugError.message}
              </p>
              <p style={{ fontSize:11, color:"#fca5a5", fontFamily:"monospace" }}>
                <strong>name:</strong> {debugError.name}
              </p>
            </div>
          ) : (
            <div style={{ background:"#14532d22", border:"1px solid #22c55e40", borderRadius:9, padding:"8px 12px" }}>
              <p style={{ fontSize:11, color:"#34d399", fontFamily:"monospace", margin:0 }}>
                {emailStep === "sent" ? "✓ No error — verifyBeforeUpdateEmail() resolved" : "No error yet"}
              </p>
            </div>
          )}

          <button
            onClick={() => setDebugError(null)}
            style={{ marginTop:10, background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 10px", color:T.dim, fontFamily:"inherit", fontSize:10, fontWeight:700, cursor:"pointer" }}
          >
            Clear debug error
          </button>
        </div>
        {/* ── END DEBUG PANEL ─────────────────────────────────────────────── */}

      </div>
    </SubScreenShell>
  );
}

// ── Notifications Screen (top-level) ──────────────────────────────────────────
function NotificationsScreen({ notifSettings, setNotifSettings, onSave, onBack }) {
  const items = [
    { key:"daily", label:"Daily Check-In", desc:"Morning prompts to review your goals" },
    { key:"streaks", label:"Streak Reminders", desc:"Never break your momentum streak" },
    { key:"insights", label:"New Insights", desc:"When Auro generates fresh analysis for you" },
    { key:"marketing", label:"Product Updates", desc:"News and feature announcements" },
  ];
  return (
    <SubScreenShell title="Notifications" onBack={onBack}>
      {items.map(item => (
        <div key={item.key} style={{ display:"flex", alignItems:"center", gap:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:3 }}>{item.label}</div>
            <div style={{ fontSize:12, color:T.muted }}>{item.desc}</div>
          </div>
          <Toggle value={notifSettings[item.key]} onChange={v => setNotifSettings(p => ({...p, [item.key]:v}))} />
        </div>
      ))}
      <button onClick={onSave} style={{ width:"100%", padding:"14px", borderRadius:13, border:"none", fontFamily:"inherit", background:T.gradPrimary, color:"#0a0800", fontSize:14, fontWeight:800, cursor:"pointer", marginTop:12 }}>Save</button>
    </SubScreenShell>
  );
}

// ── Privacy Screen (top-level) ────────────────────────────────────────────────
function PrivacyScreen({ privacySettings, setPrivacySettings, onBack, onToast }) {
  return (
    <SubScreenShell title="Privacy" onBack={onBack}>
      {[
        { label:"Usage Analytics", desc:"Help improve Auro by sharing anonymised usage data.", key:"analytics" },
        { label:"AI Personalisation", desc:"Use your history to personalise recommendations.", key:"personalisation" },
      ].map((item, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:2 }}>{item.label}</div>
            <div style={{ fontSize:12, color:T.muted }}>{item.desc}</div>
          </div>
          <Toggle value={privacySettings[item.key]} onChange={v => setPrivacySettings(p => ({...p, [item.key]:v}))} />
        </div>
      ))}
      <div style={{ marginTop:6, padding:"14px 16px", background:T.card, border:`1px solid ${T.border}`, borderRadius:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:6 }}>Your Data Rights</div>
        <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:12 }}>Download or request deletion of all data Auro holds about you (GDPR / CCPA compliant).</div>
        <button onClick={() => onToast("Data export requested. You will receive an email within 24 hours.", "info")} style={{ padding:"10px 18px", borderRadius:10, border:`1px solid ${T.border}`, background:"transparent", color:T.primary, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer" }}>Export My Data</button>
      </div>
    </SubScreenShell>
  );
}

// ── AI Preferences Screen (top-level) ─────────────────────────────────────────
function AIPreferencesScreen({ aiSettings, setAiSettings, onSave, onBack }) {
  return (
    <SubScreenShell title="AI Preferences" onBack={onBack}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
        {[
          { key:"memory", label:"AI Memory", desc:"Remember context between sessions" },
          { key:"adaptive", label:"Adaptive Questioning", desc:"Questions evolve based on your responses" },
        ].map((item, ii) => (
          <div key={item.key} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom: ii === 0 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:2 }}>{item.label}</div>
              <div style={{ fontSize:12, color:T.muted }}>{item.desc}</div>
            </div>
            <Toggle value={aiSettings[item.key]} onChange={v => setAiSettings(p => ({...p, [item.key]:v}))} />
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Response Detail Level</p>
      {["Concise","Balanced","In-Depth"].map(level => (
        <button key={level} onClick={() => setAiSettings(p => ({...p, detailLevel:level}))} style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:`1.5px solid ${aiSettings.detailLevel === level ? T.gold : T.border}`, background: aiSettings.detailLevel === level ? `${T.gold}12` : T.card, color: aiSettings.detailLevel === level ? T.gold : T.text, fontFamily:"inherit", fontSize:14, fontWeight: aiSettings.detailLevel === level ? 700 : 400, cursor:"pointer", textAlign:"left", marginBottom:8, transition:"all 0.18s" }}>
          {level === "Concise" && "Concise — Short, direct answers"}
          {level === "Balanced" && "Balanced — Clear with context"}
          {level === "In-Depth" && "In-Depth — Detailed explanations"}
        </button>
      ))}
      <button onClick={onSave} style={{ width:"100%", padding:"14px", borderRadius:13, border:"none", fontFamily:"inherit", background:T.gradPrimary, color:"#0a0800", fontSize:14, fontWeight:800, cursor:"pointer", marginTop:8 }}>Save</button>
    </SubScreenShell>
  );
}

// ── Appearance Screen (top-level) ─────────────────────────────────────────────
function AppearanceScreen({ onBack }) {
  return (
    <SubScreenShell title="Appearance" onBack={onBack}>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.65, marginBottom:20 }}>Auro is purpose-built for dark mode. Light mode and custom accent themes are coming in a future update.</p>
      <div style={{ background:T.card, border:`1px solid ${T.gold}40`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:`${T.gold}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🌙</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.gold }}>Dark Mode</div>
          <div style={{ fontSize:12, color:T.muted }}>Active — premium aesthetic enabled</div>
        </div>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399" }} />
      </div>
    </SubScreenShell>
  );
}

// ── Help Screen (top-level) ───────────────────────────────────────────────────
function HelpScreen({ onBack, onToast }) {
  return (
    <SubScreenShell title="Help & Support" onBack={onBack}>
      {[
        { icon:"📖", title:"Documentation", desc:"Guides and FAQs for getting started", action:() => window.open("https://auro.app/docs","_blank") },
        { icon:"💬", title:"Contact Support", desc:"Get help from the Auro team directly", action:() => window.open("mailto:support@auro.app","_blank") },
        { icon:"🐛", title:"Report a Bug", desc:"Found something broken? Let us know", action:() => onToast("Thank you — our team will investigate.", "info") },
        { icon:"💡", title:"Request a Feature", desc:"Share ideas to shape our roadmap", action:() => onToast("Feature request noted. Thank you!", "info") },
      ].map((item, i) => (
        <div key={i} onClick={item.action} style={{ display:"flex", alignItems:"flex-start", gap:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer" }}>
          <div style={{ width:38, height:38, borderRadius:12, background:`${T.primary}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{item.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:3 }}>{item.title}</div>
            <div style={{ fontSize:12, color:T.muted }}>{item.desc}</div>
          </div>
          <span style={{ color:T.dim, fontSize:16, marginTop:6 }}>›</span>
        </div>
      ))}
      <p style={{ textAlign:"center", fontSize:11, color:T.dim, marginTop:16 }}>support@auro.app · Response within 24 hours</p>
    </SubScreenShell>
  );
}

// ── Rate Screen (top-level) ───────────────────────────────────────────────────
function RateScreen({ onBack, onToast }) {
  return (
    <SubScreenShell title="Rate Auro" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⭐</div>
        <h3 style={{ fontSize:19, fontWeight:800, color:T.text, marginBottom:10, fontFamily:"Georgia,serif" }}>Enjoying Auro?</h3>
        <p style={{ fontSize:13, color:T.muted, lineHeight:1.65, marginBottom:28 }}>Your rating helps more people discover Auro and keeps us building. It takes under 10 seconds.</p>
        <button onClick={() => { window.open("https://apps.apple.com","_blank"); onToast("Thank you for your support!", "success"); onBack(); }} style={{ width:"100%", padding:"15px", borderRadius:13, border:"none", fontFamily:"inherit", background:T.gradPrimary, color:"#0a0800", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:`0 0 24px ${T.gold}40`, marginBottom:12 }}>
          Rate on the App Store →
        </button>
        <button onClick={onBack} style={{ width:"100%", padding:"12px", borderRadius:12, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" }}>Maybe Later</button>
      </div>
    </SubScreenShell>
  );
}

// ── Subscription Page (top-level) ──────────────────────────────────────────────
function SubscriptionPage({ isPremium, setIsPremium, billingCycle, setBillingCycle, subLoading, setSubLoading, restoreLoading, setRestoreLoading, onToast }) {
  const freeFeatures = [
    { icon:"🔍", text:"Standard onboarding flow" },
    { icon:"📊", text:"Basic income path analysis" },
    { icon:"📈", text:"Basic progress tracking" },
    { icon:"💬", text:"3 AI messages per day" },
    { icon:"🗺️", text:"Limited coaching insights" },
  ];
  const premiumFeatures = [
    { icon:"🧠", text:"Adaptive AI questioning engine" },
    { icon:"⚡", text:"AI-powered deep analysis" },
    { icon:"📡", text:"Advanced progress tracking" },
    { icon:"🔮", text:"Dynamic future-path insights" },
    { icon:"💬", text:"20–30 AI messages per day" },
    { icon:"🎯", text:"Smarter personalised coaching" },
    { icon:"🔄", text:"Re-analysis & growth over time" },
    { icon:"💾", text:"Enhanced AI memory & context" },
  ];
  const benefits = [
    { icon:"🤖", title:"Personal AI Strategist", desc:"An AI that learns your goals and adapts its advice continuously." },
    { icon:"📈", title:"Career Optimisation Engine", desc:"Data-driven recommendations that evolve with your progress." },
    { icon:"🏆", title:"Long-Term Progress Tracking", desc:"Visualise your growth arc and hold yourself to account." },
    { icon:"🔄", title:"Adaptive Growth System", desc:"Your roadmap updates as you hit milestones and change direction." },
    { icon:"🎯", title:"Smarter Recommendations", desc:"Increasingly precise suggestions as Auro learns what works for you." },
  ];

  const handleUpgrade = () => {
    setSubLoading(true);
    setTimeout(() => {
      setSubLoading(false);
      setIsPremium(true);
      onToast("Welcome to Auro Premium! Your AI coach is now fully unlocked.", "success");
    }, 2200);
  };

  const handleRestore = () => {
    setRestoreLoading(true);
    setTimeout(() => {
      setRestoreLoading(false);
      onToast("No active subscription found to restore.", "info");
    }, 1800);
  };

  return (
    <div style={{ animation:"fadeIn 0.35s ease" }}>
      <div style={{ position:"relative", textAlign:"center", padding:"8px 0 24px", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, left:"50%", transform:"translateX(-50%)", width:240, height:240, borderRadius:"50%", background:`radial-gradient(circle, ${T.gold}18 0%, transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${T.gold}15`, border:`1px solid ${T.gold}40`, borderRadius:20, padding:"5px 14px", marginBottom:16 }}>
            <span style={{ fontSize:10, fontWeight:800, color:T.gold, letterSpacing:2, textTransform:"uppercase" }}>Auro Premium</span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:T.text, margin:"0 0 10px", fontFamily:"Georgia,serif", lineHeight:1.2 }}>Unlock Your<br/><span style={{ background:T.gradDual, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Full Potential</span></h1>
          <p style={{ fontSize:13, color:T.muted, lineHeight:1.65, maxWidth:300, margin:"0 auto" }}>Go beyond the basics. Let Auro's AI work harder for you — deeper analysis, smarter coaching, real results.</p>
        </div>
      </div>
      <div style={{ display:"flex", background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:4, marginBottom:20, position:"relative" }}>
        {["monthly","yearly"].map(cycle => (
          <button key={cycle} onClick={() => setBillingCycle(cycle)} style={{ flex:1, padding:"10px 0", borderRadius:11, border:"none", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.22s", background: billingCycle === cycle ? T.gradPrimary : "transparent", color: billingCycle === cycle ? "#0a0800" : T.muted, position:"relative" }}>
            {cycle === "monthly" ? "Monthly" : "Yearly"}
            {cycle === "yearly" && <span style={{ position:"absolute", top:-8, right:6, fontSize:9, fontWeight:800, background:"#22c55e", color:"#fff", padding:"2px 6px", borderRadius:8, letterSpacing:0.5 }}>SAVE 50%</span>}
          </button>
        ))}
      </div>
      <div style={{ background:`linear-gradient(145deg,${T.card},${T.bg})`, border:`1.5px solid ${T.gold}50`, borderRadius:20, padding:"24px 20px", marginBottom:20, textAlign:"center", position:"relative", overflow:"hidden", boxShadow:`0 0 40px ${T.gold}15` }}>
        <div style={{ position:"absolute", top:0, right:0, width:100, height:100, background:`${T.gold}06`, borderRadius:"0 20px 0 80px" }} />
        <div style={{ fontSize:11, fontWeight:800, color:T.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Premium Plan</div>
        {billingCycle === "monthly" ? (
          <div><span style={{ fontSize:44, fontWeight:900, color:T.text, fontFamily:"Georgia,serif" }}>$9</span><span style={{ fontSize:20, fontWeight:700, color:T.muted }}>.99</span><span style={{ fontSize:13, color:T.muted, marginLeft:4 }}>/month</span></div>
        ) : (
          <div>
            <div style={{ fontSize:12, color:T.muted, textDecoration:"line-through", marginBottom:2 }}>$119.88/year</div>
            <span style={{ fontSize:44, fontWeight:900, color:T.text, fontFamily:"Georgia,serif" }}>$59</span><span style={{ fontSize:20, fontWeight:700, color:T.muted }}>.99</span><span style={{ fontSize:13, color:T.muted, marginLeft:4 }}>/year</span>
            <div style={{ marginTop:8, display:"inline-block", background:"#22c55e20", border:"1px solid #22c55e50", borderRadius:12, padding:"4px 12px" }}>
              <span style={{ fontSize:11, fontWeight:800, color:"#22c55e" }}>You save $59.89 annually</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:22 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px 14px" }}>
          <div style={{ fontSize:11, fontWeight:800, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Free</div>
          {freeFeatures.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:9 }}>
              <span style={{ fontSize:13 }}>{f.icon}</span>
              <span style={{ fontSize:11, color:T.muted, lineHeight:1.4 }}>{f.text}</span>
            </div>
          ))}
        </div>
        <div style={{ background:`linear-gradient(145deg,${T.card},${T.bg})`, border:`1px solid ${T.gold}40`, borderRadius:16, padding:"16px 14px", boxShadow:`0 0 20px ${T.gold}10` }}>
          <div style={{ fontSize:11, fontWeight:800, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Premium</div>
          {premiumFeatures.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:9 }}>
              <span style={{ fontSize:13 }}>{f.icon}</span>
              <span style={{ fontSize:11, color:T.text, lineHeight:1.4, fontWeight:500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>What You Unlock</p>
      {benefits.map((b,i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:9 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:`${T.gold}15`, border:`1px solid ${T.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>{b.icon}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:T.text, marginBottom:3 }}>{b.title}</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{b.desc}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop:24 }}>
        <button onClick={handleUpgrade} disabled={subLoading || isPremium} style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", fontFamily:"inherit", background: isPremium ? "#22c55e" : T.gradPrimary, color:"#0a0800", fontSize:15, fontWeight:900, cursor: subLoading || isPremium ? "default" : "pointer", letterSpacing:0.5, boxShadow:`0 0 30px ${T.gold}50, 0 0 60px ${T.gold}15`, marginBottom:12, opacity: subLoading ? 0.8 : 1, transition:"all 0.2s" }}>
          {isPremium ? "✓ Premium Active" : subLoading ? "Processing..." : `Upgrade to Premium — ${billingCycle === "yearly" ? "$59.99/yr" : "$9.99/mo"} →`}
        </button>
        <button onClick={handleRestore} disabled={restoreLoading} style={{ width:"100%", padding:"12px", borderRadius:12, border:`1px solid ${T.border}`, fontFamily:"inherit", background:"transparent", color: restoreLoading ? T.dim : T.muted, fontSize:13, fontWeight:600, cursor: restoreLoading ? "default" : "pointer", marginBottom:20, transition:"all 0.2s" }}>
          {restoreLoading ? "Checking..." : "Restore Purchases"}
        </button>
        <div style={{ textAlign:"center" }}>
          <span style={{ fontSize:11, color:T.dim }}>By upgrading you agree to our </span>
          <span onClick={() => window.open("https://auro.app/terms","_blank")} style={{ fontSize:11, color:T.primary, cursor:"pointer" }}>Terms of Service</span>
          <span style={{ fontSize:11, color:T.dim }}> and </span>
          <span onClick={() => window.open("https://auro.app/privacy","_blank")} style={{ fontSize:11, color:T.primary, cursor:"pointer" }}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

// ── Account Page (top-level) ───────────────────────────────────────────────────
function AccountPage({ isPremium, billingCycle, subScreen, setSubScreen, userProfile, userStats, notifSettings, setNotifSettings, privacySettings, setPrivacySettings, aiSettings, setAiSettings, editName, setEditName, editEmail, setEditEmail, setUserProfile, onSignOut, onDeleteAccount, onToast, onUpgrade }) {
  const goBack = () => setSubScreen(null);

  if (subScreen === "settings-profile") return (
    <ProfileEditScreen
      currentName={editName}
      currentEmail={userProfile.email}
      onNameSaved={(newName) => {
        setEditName(newName);
        setUserProfile(p => ({ ...p, name: newName }));
      }}
      onEmailVerificationSent={() => {}}
      onBack={goBack}
      onToast={onToast}
    />
  );
  if (subScreen === "settings-notifications") return <NotificationsScreen notifSettings={notifSettings} setNotifSettings={setNotifSettings} onSave={() => { onToast("Notification preferences saved.", "success"); goBack(); }} onBack={goBack} />;
  if (subScreen === "settings-privacy") return <PrivacyScreen privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} onBack={goBack} onToast={onToast} />;
  if (subScreen === "settings-ai") return <AIPreferencesScreen aiSettings={aiSettings} setAiSettings={setAiSettings} onSave={() => { onToast("AI preferences saved.", "success"); goBack(); }} onBack={goBack} />;
  if (subScreen === "settings-appearance") return <AppearanceScreen onBack={goBack} />;
  if (subScreen === "settings-help") return <HelpScreen onBack={goBack} onToast={onToast} />;
  if (subScreen === "settings-rate") return <RateScreen onBack={goBack} onToast={onToast} />;

  const stats = [
    { label:"Auro Score", value:userStats.score, icon:"⚡", color:T.gold },
    { label:"Day Streak", value:userStats.streak, icon:"🔥", color:"#f87171" },
    { label:"Goals Done", value:userStats.goals, icon:"✅", color:"#34d399" },
    { label:"Progress", value:`${userStats.progress}%`, icon:"📈", color:T.primary },
  ];
  const settingsGroups = [
    { title:"Profile", items:[{ icon:"👤", label:"Edit Profile" },{ icon:"🔔", label:"Notifications" },{ icon:"🔒", label:"Privacy" }] },
    { title:"Auro AI", items:[{ icon:"🧠", label:"AI Preferences" },{ icon:"🎨", label:"Appearance" }] },
    { title:"Subscription", items:[{ icon:"⭐", label:"Manage Subscription", accent:T.gold }] },
    { title:"Support", items:[{ icon:"💬", label:"Help & Support" },{ icon:"⭐", label:"Rate Auro" }] },
  ];
  const handleSettingsTap = (label) => {
    const routes = { "Edit Profile":"settings-profile","Notifications":"settings-notifications","Privacy":"settings-privacy","AI Preferences":"settings-ai","Appearance":"settings-appearance","Manage Subscription":"nav-subscription","Help & Support":"settings-help","Rate Auro":"settings-rate" };
    const dest = routes[label];
    if (dest === "nav-subscription") { onUpgrade(); return; }
    if (dest) setSubScreen(dest);
  };

  return (
    <div style={{ animation:"fadeIn 0.35s ease" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold}60,${T.primary}60)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto", border:`2px solid ${T.gold}50`, boxShadow:`0 0 24px ${T.gold}30` }}>👤</div>
          {isPremium && <div style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:T.gradPrimary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, border:`2px solid ${T.surface}` }}>⭐</div>}
        </div>
        <h2 style={{ fontSize:20, fontWeight:900, color:T.text, margin:"0 0 4px", fontFamily:"Georgia,serif" }}>{userProfile.name}</h2>
        <p style={{ fontSize:13, color:T.muted, marginBottom:10 }}>{userProfile.email}</p>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background: isPremium ? `${T.gold}18` : T.border, border:`1px solid ${isPremium ? T.gold+"50" : T.border}`, borderRadius:20, padding:"5px 14px" }}>
          <span style={{ fontSize:11, fontWeight:800, color: isPremium ? T.gold : T.muted, letterSpacing:1.5, textTransform:"uppercase" }}>{isPremium ? "⭐ Premium Member" : "Free Plan"}</span>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:22 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px 14px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${s.color}15`, border:`1px solid ${s.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:3, fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      {isPremium ? (
        <div style={{ background:`linear-gradient(135deg,${T.gold}20,${T.primary}15)`, border:`1.5px solid ${T.gold}50`, borderRadius:18, padding:"18px 18px", marginBottom:22, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${T.gold}15`, filter:"blur(20px)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <span style={{ fontSize:22 }}>⭐</span>
            <div><div style={{ fontSize:14, fontWeight:800, color:T.gold }}>Premium Active</div><div style={{ fontSize:11, color:T.muted }}>Renews {billingCycle === "yearly" ? "in 12 months" : "next month"}</div></div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["AI Analysis","Smart Coaching","Advanced Tracking"].map(f => (
              <span key={f} style={{ fontSize:10, fontWeight:700, color:T.gold, background:`${T.gold}15`, border:`1px solid ${T.gold}30`, borderRadius:12, padding:"3px 10px" }}>{f}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background:`linear-gradient(135deg,${T.card},${T.bg})`, border:`1.5px solid ${T.gold}40`, borderRadius:18, padding:"18px 18px", marginBottom:22, position:"relative", overflow:"hidden", boxShadow:`0 0 30px ${T.gold}10` }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${T.gold}10`, filter:"blur(20px)" }} />
          <div style={{ fontSize:13, fontWeight:800, color:T.gold, marginBottom:6 }}>⭐ Unlock Auro Premium</div>
          <div style={{ fontSize:12, color:T.muted, lineHeight:1.55, marginBottom:14 }}>Get AI-powered analysis, smarter coaching, and unlimited growth tracking.</div>
          <button onClick={onUpgrade} style={{ padding:"10px 20px", borderRadius:11, border:"none", fontFamily:"inherit", background:T.gradPrimary, color:"#0a0800", fontSize:12, fontWeight:800, cursor:"pointer" }}>Upgrade Now →</button>
        </div>
      )}
      {settingsGroups.map((group, gi) => (
        <div key={gi} style={{ marginBottom:18 }}>
          <p style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{group.title}</p>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
            {group.items.map((item, ii) => (
              <div key={ii} onClick={() => handleSettingsTap(item.label)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom: ii < group.items.length - 1 ? `1px solid ${T.border}` : "none", cursor:"pointer" }}>
                <div style={{ width:34, height:34, borderRadius:10, background: item.accent ? `${item.accent}18` : `${T.primary}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{item.icon}</div>
                <span style={{ fontSize:14, fontWeight:600, color: item.accent || T.text, flex:1 }}>{item.label}</span>
                <span style={{ color:T.dim, fontSize:16 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginTop:8, marginBottom:32 }}>
        <button onClick={onSignOut} style={{ width:"100%", padding:"13px", borderRadius:13, border:`1px solid ${T.border}`, fontFamily:"inherit", background:"transparent", color:T.muted, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10 }}>Sign Out</button>
        <button onClick={onDeleteAccount} style={{ width:"100%", padding:"13px", borderRadius:13, border:"1px solid #f8717130", fontFamily:"inherit", background:"#f8717108", color:"#f87171", fontSize:13, fontWeight:600, cursor:"pointer" }}>Delete Account</button>
        <p style={{ textAlign:"center", fontSize:11, color:T.dim, marginTop:16 }}>Auro v1.0.0 · Built with ♥</p>
      </div>
    </div>
  );
}


// ── VerificationGate ──────────────────────────────────────────────────────────
// Full-screen block for signed-in but unverified users.
// onVerified is ONLY called after reload() confirms emailVerified === true.
// onSignOut lets the user escape to sign in with a different account.
function VerificationGate({ email, onVerified, onSignOut }) {
  const [checking, setChecking]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [error, setError]         = useState("");

  const handleCheck = async () => {
    setChecking(true); setError("");
    try {
      const verified = await checkEmailVerified(); // reload() + emailVerified
      if (verified) {
        onVerified();
      } else {
        setError("Email not verified yet. Click the link in your inbox, then try again.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setError("");
    try {
      await resendVerificationEmail();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${T.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${T.text};-webkit-font-smoothing:antialiased;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        button:active{opacity:0.82;transform:scale(0.97)!important;}
        input:focus{border-color:${T.gold}!important;}
      `}</style>
      <div style={{ minHeight:"100vh", background:T.gradHero, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px 48px", position:"relative", overflow:"hidden" }}>
        <GlowOrb x="-60px" y="-40px" color={T.gold} size={400} opacity={0.08} />
        <GlowOrb x="60%" y="50%" color={T.primary} size={300} opacity={0.06} />
        <div style={{ width:"100%", maxWidth:440, background:T.surface, borderRadius:26, padding:"36px 26px", border:`1px solid ${T.border}`, boxShadow:"0 24px 80px rgba(0,0,0,0.55)", position:"relative", zIndex:1, animation:"fadeIn 0.4s ease" }}>
          {/* Icon */}
          <div style={{ width:80, height:80, borderRadius:"50%", background:`${T.primary}15`, border:`2px solid ${T.primary}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 22px", boxShadow:`0 0 30px ${T.primary}20` }}>
            ✉️
          </div>
          <h2 style={{ fontSize:22, fontWeight:900, color:T.text, textAlign:"center", margin:"0 0 10px", fontFamily:"Georgia,serif" }}>Verify Your Email</h2>
          <p style={{ fontSize:13, color:T.muted, textAlign:"center", lineHeight:1.7, marginBottom:6 }}>We sent a verification link to</p>
          <p style={{ fontSize:14, fontWeight:700, color:T.primary, textAlign:"center", marginBottom:16 }}>{email}</p>
          <p style={{ fontSize:12, color:T.muted, textAlign:"center", lineHeight:1.65, marginBottom:20 }}>
            Click the link in that email, then press the button below. Check your spam folder if you don't see it.
          </p>
          {error && (
            <div style={{ background:"#450a0a", border:"1px solid #f8717160", borderRadius:11, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#f87171", lineHeight:1.45 }}>
              ⚠ {error}
            </div>
          )}
          <button onClick={handleCheck} disabled={checking} style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", fontFamily:"inherit", background: checking ? T.dim : T.gradPrimary, color: checking ? T.muted : "#0a0800", fontSize:15, fontWeight:900, cursor: checking ? "default" : "pointer", marginBottom:12, transition:"all 0.2s", boxShadow: checking ? "none" : `0 0 24px ${T.gold}40` }}>
            {checking ? "Checking…" : "I've Verified My Email →"}
          </button>
          <button onClick={handleResend} disabled={resending || resent} style={{ width:"100%", padding:"13px", borderRadius:13, border:`1px solid ${T.border}`, fontFamily:"inherit", background:"transparent", color: resent ? "#34d399" : T.muted, fontSize:13, fontWeight:600, cursor: resending || resent ? "default" : "pointer", marginBottom:22, transition:"all 0.2s" }}>
            {resent ? "✓ Email Resent!" : resending ? "Sending…" : "Resend Verification Email"}
          </button>
          <p style={{ fontSize:11, color:T.dim, textAlign:"center" }}>
            Wrong email?{" "}
            <span onClick={onSignOut} style={{ color:T.primary, cursor:"pointer" }}>Sign out and try again</span>
          </p>
        </div>
      </div>
    </>
  );
}

// ── Splash screen shown while Firebase resolves auth state ────────────────────
function SplashLoader() {
  return (
    <div style={{
      minHeight: "100vh", background: "#070708",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "linear-gradient(135deg,#f5c84240,#4a9eff40)",
        border: "1.5px solid #f5c84250",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, animation: "splashPulse 1.4s ease-in-out infinite",
      }}>⚡</div>
      <style>{`
        @keyframes splashPulse {
          0%,100% { opacity:0.4; transform:scale(0.92) }
          50%      { opacity:1;   transform:scale(1)    }
        }
      `}</style>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#6a6455", textTransform: "uppercase" }}>
        Loading Auro…
      </div>
    </div>
  );
}

export default function App() {
  // ── Firebase auth state ────────────────────────────────────────────────────
  // "loading" → "unauthenticated" → "unverified" → "authenticated"
  // "unverified" = signed in but emailVerified === false; blocks app access
  const [authState, setAuthState] = useState("loading");
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        // Always reload from Firebase so emailVerified is fresh, never stale
        await reload(user);
        const freshUser = auth.currentUser;
        setFirebaseUser(freshUser);
        const displayName = freshUser.displayName || freshUser.email.split("@")[0];
        setUserProfile({ name: displayName, email: freshUser.email });
        setEditName(displayName);
        setEditEmail(freshUser.email);
        if (freshUser.emailVerified) {
          setEmailVerified(true);
          setAuthState("authenticated");
        } else {
          setEmailVerified(false);
          setAuthState("unverified"); // signed in but not verified — show verify screen
        }
      } else {
        setFirebaseUser(null);
        setEmailVerified(false);
        setAuthState("unauthenticated");
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Quiz / screen state ────────────────────────────────────────────────────
  const [screen, setScreen] = useState("landing");
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [questions, setQuestions] = useState([]);

  const start = () => {
    const qs = getAdaptiveQuestions({});
    setAnswers({}); setQIndex(0); setQuestions(qs); setScreen("quiz");
  };

  const handleAnswer = (value) => {
    const q = questions[qIndex];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);
    const newQs = getAdaptiveQuestions(newAnswers);
    setQuestions(newQs);
    if (qIndex + 1 >= newQs.length) setScreen("results");
    else setQIndex(i => i + 1);
  };

  const goBack = () => {
    if (qIndex === 0) setScreen("landing");
    else setQIndex(i => i - 1);
  };

  const NAV = [
    {
      id: "subscription", label: "Auro+", screen: "nav-subscription",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.gold : T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    },
    {
      id: "tracking", label: "Track", screen: "nav-tracking",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.primary : T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      )
    },
    {
      id: "analysis", label: "Analyse", screen: "landing",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.primary : T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      )
    },
    {
      id: "chat", label: "AI Chat", screen: "nav-chat",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.accent : T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      id: "account", label: "Account", screen: "nav-account",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.primary : T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
  ];

  const activeNav = NAV.find(n => n.screen === screen)?.id || "analysis";

  const handleNavTap = (tab) => {
    if (tab.screen === "landing") {
      setScreen("landing");
    } else {
      setScreen(tab.screen);
    }
  };

  // ── App-wide shared state ─────────────────────────────────────────────────────
  const [isPremium, setIsPremium] = useState(false);
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [subLoading, setSubLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [subScreen, setSubScreen] = useState(null);
  const [userProfile, setUserProfile] = useState({ name:"Alex Johnson", email:"alex@example.com" });
  const [editName, setEditName] = useState("Alex Johnson");
  const [editEmail, setEditEmail] = useState("alex@example.com");
  const [notifSettings, setNotifSettings] = useState({ daily:true, streaks:true, insights:false, marketing:false });
  const [aiSettings, setAiSettings] = useState({ memory:true, adaptive:true, detailLevel:"Balanced" });
  const [privacySettings, setPrivacySettings] = useState({ analytics:true, personalisation:true });
  const [emailVerified, setEmailVerified] = useState(false); // Set true after real auth email verification
  const userStats = { score:742, streak:14, goals:6, progress:68 };

  const showToast = (msg, type="info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  const showModal = (title, body, actions) => setModal({ title, body, actions });
  const closeModal = () => setModal(null);

  const handleSignOut = () => {
    showModal(
      "Sign Out",
      "Are you sure you want to sign out of your Auro account?",
      [
        { label:"Cancel", style:"secondary", fn: closeModal },
        { label:"Sign Out", style:"destructive", fn: async () => {
          closeModal();
          try {
            await firebaseSignOut();
            // onAuthChange fires automatically → sets authState = "unauthenticated"
            setIsPremium(false);
            setScreen("landing");
            showToast("Signed out successfully.", "info");
          } catch (err) {
            showToast(friendlyAuthError(err), "error");
          }
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    showModal(
      "Delete Account",
      "This is permanent and cannot be undone. All your data, progress, and subscription will be erased immediately.",
      [
        { label:"Cancel", style:"secondary", fn: closeModal },
        { label:"Delete Permanently", style:"destructive", fn: async () => {
          closeModal();
          try {
            await firebaseDeleteAccount();
            // onAuthChange fires → authState = "unauthenticated"
            setIsPremium(false);
            setScreen("landing");
            showToast("Account deleted. We are sorry to see you go.", "error");
          } catch (err) {
            showToast(friendlyAuthError(err), "error");
          }
        }},
      ]
    );
  };

  const handleSettingsTap = (label) => {
    const routes = {
      "Edit Profile":"settings-profile",
      "Notifications":"settings-notifications",
      "Privacy":"settings-privacy",
      "AI Preferences":"settings-ai",
      "Appearance":"settings-appearance",
      "Manage Subscription":"nav-subscription",
      "Help & Support":"settings-help",
      "Rate Auro":"settings-rate",
    };
    const dest = routes[label];
    if (dest === "nav-subscription") { setScreen("nav-subscription"); return; }
    if (dest) setSubScreen(dest);
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authState === "loading") return <SplashLoader />;
  if (authState === "unauthenticated") {
    return (
      <AuthScreen
        onAuthenticated={(user, displayName) => {
          setFirebaseUser(user);
          setUserProfile({ name: displayName, email: user.email });
          setEditName(displayName);
          setEditEmail(user.email);
          // Only grant app access if Firebase confirms emailVerified
          if (user.emailVerified) {
            setEmailVerified(true);
            setAuthState("authenticated");
          } else {
            setEmailVerified(false);
            setAuthState("unverified"); // hold on verify screen
          }
        }}
      />
    );
  }

  if (authState === "unverified") {
    // Signed-in but email not verified — full-screen block, nothing else renders
    return (
      <VerificationGate
        email={firebaseUser?.email || userProfile.email}
        onVerified={() => {
          setEmailVerified(true);
          setAuthState("authenticated");
        }}
        onSignOut={async () => {
          try { await firebaseSignOut(); } catch (_) {}
          setAuthState("unauthenticated");
        }}
      />
    );
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${T.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${T.text};-webkit-font-smoothing:antialiased;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        button:active{opacity:0.8;transform:scale(0.97)!important;}
        input:focus{border-color:${T.gold}!important;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.dim};border-radius:2px}
      `}</style>

      {/* Toast notification */}
      {toast && (
        <div style={{ position:"fixed", bottom:92, left:"50%", transform:"translateX(-50%)", zIndex:500, animation:"toastIn 0.28s cubic-bezier(0.16,1,0.3,1)", pointerEvents:"none", maxWidth:340, width:"calc(100% - 40px)" }}>
          <div style={{ background: toast.type === "success" ? "#14532d" : toast.type === "error" ? "#450a0a" : T.card, border:`1px solid ${toast.type === "success" ? "#22c55e60" : toast.type === "error" ? "#f8717160" : T.border}`, borderRadius:14, padding:"12px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
            <span style={{ fontSize:16 }}>{toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}</span>
            <span style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.4 }}>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, zIndex:600, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }} onClick={closeModal}>
          <div style={{ width:"100%", maxWidth:480, background:T.surface, borderRadius:"22px 22px 0 0", padding:"28px 22px 36px", border:`1px solid ${T.border}`, animation:"modalIn 0.3s cubic-bezier(0.16,1,0.3,1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, borderRadius:2, background:T.border, margin:"0 auto 22px" }} />
            <h3 style={{ fontSize:18, fontWeight:900, color:T.text, marginBottom:10, fontFamily:"Georgia,serif" }}>{modal.title}</h3>
            <p style={{ fontSize:14, color:T.muted, lineHeight:1.6, marginBottom:24 }}>{modal.body}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {modal.actions.map((action, i) => (
                <button key={i} onClick={action.fn} style={{ width:"100%", padding:"14px", borderRadius:13, border: action.style === "secondary" ? `1px solid ${T.border}` : action.style === "destructive" ? "1px solid #f8717140" : "none", fontFamily:"inherit", background: action.style === "destructive" ? "#f8717115" : action.style === "secondary" ? "transparent" : T.gradPrimary, color: action.style === "destructive" ? "#f87171" : action.style === "secondary" ? T.muted : "#0a0800", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ minHeight:"100vh", background:T.gradHero, display:"flex", flexDirection:"column", justifyContent:"flex-start", alignItems:"center", paddingBottom:0 }}>

        {/* Main content */}
        <div style={{ width:"100%", maxWidth:480, flex:1, padding:"28px 16px 100px" }}>
          <div style={{ background:T.surface, borderRadius:26, padding:"28px 22px", border:`1px solid ${T.border}`, boxShadow:"0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)", position:"relative", overflow:"hidden" }}>
            {USE_ANALYSIS_V2 && (screen === "landing" || screen === "quiz") ? (
  <AnalysisV2
    onComplete={(legacyAnswers) => {
      setAnswers(legacyAnswers);
      setScreen("results");
    }}
    onExit={() => setScreen("landing")}
  />
) : (
  <>
    {screen === "landing" && <Landing onStart={start} />}
    {screen === "quiz" && questions[qIndex] && (
      <div>
        <QuestionCard
          key={questions[qIndex].id}
          question={questions[qIndex]}
          onAnswer={handleAnswer}
          progress={qIndex + 1}
          total={questions.length}
        />
        <button
          onClick={goBack}
          style={{
            marginTop:14,
            background:"none",
            border:"none",
            color:T.muted,
            fontSize:13,
            cursor:"pointer",
            fontFamily:"inherit",
            padding:"6px 0",
            fontWeight:600
          }}
        >
          ← Back
        </button>
      </div>
    )}
  </>
)}
              <div>
                <QuestionCard key={questions[qIndex].id} question={questions[qIndex]} onAnswer={handleAnswer} progress={qIndex+1} total={questions.length} />
                <button onClick={goBack} style={{ marginTop:14, background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", fontFamily:"inherit", padding:"6px 0", fontWeight:600 }}>← Back</button>
              </div>
            )}
            {screen === "results" && <Results answers={answers} onReset={() => setScreen("landing")} />}
            {screen === "nav-subscription" && <SubscriptionPage isPremium={isPremium} setIsPremium={setIsPremium} billingCycle={billingCycle} setBillingCycle={setBillingCycle} subLoading={subLoading} setSubLoading={setSubLoading} restoreLoading={restoreLoading} setRestoreLoading={setRestoreLoading} onToast={showToast} />}
            {screen === "nav-tracking" && (
              emailVerified
                ? <TrackingPage isPremium={isPremium} onUpgrade={() => setScreen("nav-subscription")} answers={answers} />
                : <EmailVerificationScreen email={userProfile.email} onResend={() => showToast("Verification email sent.", "success")} onVerified={async () => { const ok = await checkEmailVerified(); if (ok) { setEmailVerified(true); showToast("Email verified! Welcome to Auro.", "success"); } }} />
            )}
            {screen === "nav-chat" && (
              emailVerified
                ? <AIChatPage isPremium={isPremium} onUpgrade={() => setScreen("nav-subscription")} userProfile={userProfile} userStats={userStats} answers={answers} firebaseUid={firebaseUser?.uid} />
                : <EmailVerificationScreen email={userProfile.email} onResend={() => showToast("Verification email sent.", "success")} onVerified={async () => { const ok = await checkEmailVerified(); if (ok) { setEmailVerified(true); showToast("Email verified! Welcome to Auro.", "success"); } }} />
            )}
            {screen === "nav-account" && <AccountPage isPremium={isPremium} billingCycle={billingCycle} subScreen={subScreen} setSubScreen={setSubScreen} userProfile={userProfile} userStats={userStats} notifSettings={notifSettings} setNotifSettings={setNotifSettings} privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} aiSettings={aiSettings} setAiSettings={setAiSettings} editName={editName} setEditName={setEditName} editEmail={editEmail} setEditEmail={setEditEmail} setUserProfile={setUserProfile} onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} onToast={showToast} onUpgrade={() => setScreen("nav-subscription")} />}
          </div>
        </div>

        {/* Bottom nav bar */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, display:"flex", justifyContent:"center" }}>
          <div style={{ width:"100%", maxWidth:480, background:`${T.surface}ee`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-around", padding:"10px 8px 18px" }}>
            {NAV.map(tab => {
              const isActive = activeNav === tab.id;
              const accentCol = tab.id === "subscription" ? T.gold : tab.id === "chat" ? T.accent : T.primary;
              return (
                <button key={tab.id} onClick={() => handleNavTap(tab)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:"6px 12px", borderRadius:12, transition:"all 0.18s", opacity: isActive ? 1 : 0.6, transform: isActive ? "scale(1.08)" : "scale(1)" }}>
                  <div style={{ position:"relative" }}>
                    {tab.icon(isActive)}
                    {isActive && (
                      <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:accentCol, boxShadow:`0 0 6px ${accentCol}` }} />
                    )}
                  </div>
                  <span style={{ fontSize:10, fontWeight: isActive ? 800 : 600, color: isActive ? accentCol : T.muted, letterSpacing:0.3, lineHeight:1 }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
