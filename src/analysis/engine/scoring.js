import { ALL_OPTIONS } from "../data/paths.js";
export function scoreOptions(answers) {
  const skills = (answers.skills || []).map(s => s.toLowerCase());
  const interests = (answers.interests || []).map(i => i.toLowerCase());
  const budget = answers.budget || "";
  const incomeType = answers.income_type || "";
  const tech = answers.tech || "";
  const timeframe = answers.timeframe || "";
  const locationPref = answers.location_pref || "";
  const risk = answers.risk || "";
  const people = answers.people || "";
  const hasVehicle = answers.has_vehicle || "";
  const contentComfort = answers.content_comfort || "";
  const goal = answers.goal || "";
  const fitnessDir = answers.fitness_direction || "";
  const codingDir = answers.coding_direction || "";

  const isZeroBudget = budget.startsWith("$0");
  const isLowBudget = isZeroBudget || budget.includes("Under $100") || budget.includes("$100 to $500");
  const wantsPassive = incomeType.startsWith("Passive") || incomeType.startsWith("Hybrid");
  const wantsActive = incomeType.startsWith("Active");
  const isLowTech = tech.startsWith("Basic") || tech.startsWith("Intermediate");
  const isHighTech = tech.startsWith("Advanced");
  const needsFast = timeframe.includes("7 days") || timeframe.includes("30 days") || timeframe.includes("1 to 3");
  const wantsRemote = locationPref.startsWith("Fully remote");
  const localOk = !locationPref.startsWith("Fully remote");
  const highRisk = risk.startsWith("Aggressive");
  const avoidsPeople = people.startsWith("Low");
  const likesPeople = people.startsWith("High") || people.startsWith("Moderate");
  const noVehicle = hasVehicle.startsWith("No");
  const wantsContent = contentComfort && contentComfort.startsWith("Very");
  const wantsWealth = goal.includes("long-term") || goal.includes("scalable") || goal.includes("wealth");

  return ALL_OPTIONS.map(opt => {
    let score = 40;
    const tags = opt.tags.map(t => t.toLowerCase());

    // Skill matches
    skills.forEach(skill => {
      const key = skill.split("/")[0].trim();
      if (tags.some(t => t.includes(key) || key.includes(t.split("/")[0]))) score += 30;
    });

    // Interest matches
    interests.forEach(interest => {
      const key = interest.split("/")[0].trim().replace(" & "," ").toLowerCase();
      if (tags.some(t => t.includes(key) || key.includes(t.replace(" & "," ")))) score += 18;
    });

    // Strong direct skill→option bonuses
    const rawSkills = answers.skills || [];
    if (rawSkills.some(s => s.includes("Fitness") || s.includes("wellness"))) {
      if (["personal-trainer","online-fitness-coach","nutrition-coach","yoga-instructor"].includes(opt.id)) score += 50;
      if (fitnessDir.includes("Online coaching") && opt.id === "online-fitness-coach") score += 20;
      if (fitnessDir.includes("In-person") && opt.id === "personal-trainer") score += 20;
    }
    if (rawSkills.some(s => s.includes("development") || s.includes("engineering"))) {
      if (["freelance-developer","no-code-developer","web-developer","shopify-developer","ai-automation","automation-specialist","saas-founder"].includes(opt.id)) score += 35;
      if (codingDir.startsWith("Freelancing") && ["freelance-developer","web-developer"].includes(opt.id)) score += 20;
      if (codingDir.includes("product") && opt.id === "saas-founder") score += 30;
    }
    if (rawSkills.some(s => s.includes("Writing") || s.includes("content creation"))) {
      if (["copywriter","ghostwriter","blogger","newsletter","technical-writer","content-strategist"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Design") || s.includes("visual creativity"))) {
      if (["graphic-designer","ui-ux-designer","motion-graphics","thumbnail-designer","illustrator","print-on-demand"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Video") || s.includes("editing"))) {
      if (["video-editor","short-form-editor","youtube","videographer","ugc-creator"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Music") || s.includes("audio"))) {
      if (["music-producer","dj","voice-actor","music-licensing"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Photography"))) {
      if (["photographer","videographer","stock-photos"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Sales") || s.includes("business development"))) {
      if (["sales-rep","remote-closer","appointment-setter","recruiter","lead-gen"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Marketing") || s.includes("growth"))) {
      if (["seo-specialist","email-marketer","content-strategist","growth-operator","personal-brand","affiliate-marketer"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Teaching") || s.includes("coaching") || s.includes("mentoring"))) {
      if (["online-tutor","course-creator","online-fitness-coach","nutrition-coach"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("Finance") || s.includes("accounting") || s.includes("analysis"))) {
      if (["bookkeeping","data-analyst","real-estate-agent","insurance-agent"].includes(opt.id)) score += 35;
    }
    if (rawSkills.some(s => s.includes("trades") || s.includes("Hands-on") || s.includes("hands-on"))) {
      if (["electrician","plumber","carpenter","painter-decorator","mechanic","locksmith","general-contractor","solar-installer","barber","hair-stylist","tattoo-artist"].includes(opt.id)) score += 35;
    }

    // Budget
    if (isZeroBudget) {
      if (tags.includes("no-budget")) score += 20;
      if (tags.includes("high-budget")) score -= 55;
    }
    if (isLowBudget && tags.includes("low-budget")) score += 12;

    // Income type
    if (wantsPassive && tags.includes("passive")) score += 35;
    if (wantsActive && tags.includes("active")) score += 28;
    if (wantsPassive && !tags.includes("passive") && tags.includes("active")) score -= 12;

    // Speed
    if (needsFast && tags.includes("fast")) score += 28;
    if (needsFast && opt.difficulty === "Beginner") score += 12;
    if (needsFast && tags.includes("long-term")) score -= 28;

    // Tech
    if (isHighTech && tags.includes("coding/tech")) score += 22;
    if (isLowTech && opt.difficulty === "Advanced") score -= 32;
    if (isLowTech && tags.includes("coding/tech")) score -= 22;

    // Location
    if (wantsRemote && tags.includes("local") && !tags.includes("remote")) score -= 38;
    if (wantsRemote && tags.includes("remote")) score += 22;
    if (wantsRemote && tags.includes("trades")) score -= 38;
    if (localOk && tags.includes("local")) score += 10;

    // Vehicle
    if (noVehicle && tags.includes("vehicle")) score -= 50;

    // People
    if (avoidsPeople && tags.includes("people")) score -= 22;
    if (likesPeople && tags.includes("people")) score += 14;

    // Risk
    if (!highRisk && ["amazon-fba","saas-founder"].includes(opt.id)) score -= 18;
    if (highRisk && tags.includes("high-income")) score += 18;

    // Long-term wealth
    if (wantsWealth && tags.includes("passive")) score += 14;
    if (wantsWealth && tags.includes("high-income")) score += 14;

    // Content
    if (wantsContent && ["youtube","tiktok-creator","ugc-creator"].includes(opt.id)) score += 22;
    if (!wantsContent && ["youtube","tiktok-creator"].includes(opt.id)) score -= 22;

    return { ...opt, score };
  }).sort((a, b) => b.score - a.score);
}
