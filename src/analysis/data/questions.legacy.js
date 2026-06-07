export const BASE_QUESTIONS = [

  // ── Core profile ────────────────────────────────────────────────────────────
  {
    id:"age", text:"What is your current age range?",
    type:"select",
    options:["Under 18","18–24","25–34","35–44","45–54","55+"]
  },
  {
    id:"location", text:"Which region are you currently based in?",
    type:"select",
    options:["United States","United Kingdom","Canada","Australia / NZ","Western Europe","Eastern Europe","Asia","Middle East","Africa","Latin America","Other"]
  },
  {
    id:"situation", text:"Which best describes your current professional situation?",
    type:"select",
    options:["Employed full-time","Employed part-time","Full-time student","Unemployed / between roles","Self-employed or freelancing","Running an existing business","Retired"]
  },
  {
    id:"goal", text:"What is your primary income objective at this stage?",
    type:"select",
    options:["Generate income immediately — urgency is high","Supplement my current income with a meaningful side stream","Transition fully away from traditional employment","Build scalable, long-term wealth","Explore options before committing to a direction"]
  },
  {
    id:"timeframe", text:"What is your target timeframe to begin generating revenue?",
    type:"select",
    options:["Within the next 7 days","Within 30 days","1 to 3 months","3 to 6 months","6 to 12 months","No specific deadline — focused on long-term results"]
  },
  {
    id:"hours", text:"How many hours per week can you realistically dedicate to this?",
    type:"select",
    options:["1–5 hours","5–10 hours","10–20 hours","20–40 hours","Full-time commitment (40+ hours)"]
  },

  // ── Skills & interests ──────────────────────────────────────────────────────
  {
    id:"skills", text:"Which of the following represent your strongest existing skill sets?",
    type:"multiselect",
    options:["Writing / content creation","Design / visual creativity","Software development / engineering","Sales / business development","Teaching / coaching / mentoring","Marketing / growth strategy","Social media management","Video production / editing","Music / audio production","Photography","Fitness / health & wellness","Finance / accounting / analysis","Skilled trades / hands-on work","Operations / administration","None of the above — starting fresh"]
  },
  {
    id:"interests", text:"Which industries or subject areas genuinely engage you?",
    type:"multiselect",
    options:["Fashion / lifestyle","Health & fitness","Food & hospitality","Travel & experiences","Finance & investing","Gaming & esports","Music & entertainment","Sports & athletics","Art & design","Business & entrepreneurship","Technology & AI","Animals & pet care","Beauty & cosmetics","Personal development & mindset"]
  },

  // ── Work style ──────────────────────────────────────────────────────────────
  {
    id:"income_type", text:"Which income model best aligns with your preferred working style?",
    type:"select",
    options:["Active income — compensated directly for the work I do","Passive income — build systems that generate revenue without constant input","Hybrid — active income short-term, transitioning to passive over time"]
  },
  {
    id:"location_pref", text:"What is your preferred working environment?",
    type:"select",
    options:["Fully remote — location-independent work only","Local or in-person — comfortable working within my area","Flexible — open to both remote and local opportunities"]
  },
  {
    id:"people", text:"How would you characterise your preference for client or customer interaction?",
    type:"select",
    options:["High — I thrive in client-facing and interpersonal environments","Moderate — comfortable with it but I do not actively seek it","Low — I strongly prefer independent, behind-the-scenes work"]
  },
  {
    id:"tech", text:"How would you assess your current level of technical proficiency?",
    type:"select",
    options:["Advanced — I build software, systems, or technical products","Proficient — I learn new tools quickly and work comfortably with technology","Intermediate — I manage standard digital tools without difficulty","Basic — I prefer straightforward, non-technical workflows"]
  },
  {
    id:"risk", text:"How do you approach financial and professional risk?",
    type:"select",
    options:["Conservative — I prioritise stability and predictable outcomes","Moderate — comfortable with calculated, well-reasoned risk","Aggressive — I accept significant risk in pursuit of high reward"]
  },
  {
    id:"budget", text:"What capital are you prepared to invest to launch this income stream?",
    type:"select",
    options:["$0 — I require a zero-cost starting point","Under $100","$100 to $500","$500 to $2,000","$2,000 to $10,000","$10,000+"]
  },
  {
    id:"scale_ambition", text:"What does a successful outcome look like for you within 12 months?",
    type:"select",
    options:["$500/month — a meaningful supplemental income","$1,000–$3,000/month — a substantial secondary stream","$3,000–$7,000/month — equivalent to a full-time salary","$10,000+/month — building toward financial independence","No fixed target — focused on learning and long-term positioning"]
  },

  // ── Conditional branches ────────────────────────────────────────────────────
  {
    id:"content_comfort",
    text:"How comfortable are you with personal visibility — creating content, being on camera, or building a public presence?",
    type:"select",
    options:["Very comfortable — I actively enjoy being a public-facing creator","Open to it — willing to develop this with practice","Not comfortable — I prefer working entirely behind the scenes"],
    condition: a => a.income_type && !a.income_type.startsWith("Active")
  },
  {
    id:"has_vehicle",
    text:"Do you have reliable access to a personal vehicle?",
    type:"select",
    options:["Yes — car or van","Yes — motorbike or bicycle","No — I do not have access to a vehicle"],
    condition: a => a.location_pref && !a.location_pref.startsWith("Fully remote")
  },
  {
    id:"existing_audience",
    text:"Do you currently have an established online audience or professional network?",
    type:"select",
    options:["Yes — a significant audience (10,000+ followers or a strong professional network)","Yes — a small but engaged following (1,000–10,000)","Early stage — fewer than 1,000 followers","No online presence currently"],
    condition: a => a.income_type && !a.income_type.startsWith("Active")
  },
  {
    id:"employment_type",
    text:"Are you looking to supplement your existing income, or replace it entirely?",
    type:"select",
    options:["Supplement only — I intend to keep my current position","Replace eventually — building toward a full exit in 6–12 months","Replace immediately — I need to leave as soon as possible"],
    condition: a => a.situation && a.situation.startsWith("Employed")
  },
  {
    id:"urgency_reason",
    text:"What is the primary driver behind needing income quickly?",
    type:"select",
    options:["Immediate financial pressure or outstanding debt","Recently lost a position or income source","Relocating and establishing myself in a new place","A personal milestone requiring additional income","Strong personal motivation — I simply want to move fast"],
    condition: a => a.timeframe && (a.timeframe.includes("7 days") || a.timeframe.includes("30 days"))
  },
  {
    id:"student_field",
    text:"What is your primary field of study?",
    type:"select",
    options:["Business, economics, or finance","Technology, computing, or engineering","Arts, humanities, or media","Health, medicine, or life sciences","Law or social sciences","Sports, physical education, or health sciences","Other"],
    condition: a => a.situation === "Full-time student"
  },

  // ── Skill-specific deep branches ────────────────────────────────────────────
  {
    id:"fitness_direction",
    text:"Within fitness and wellness, which direction aligns most with your strengths?",
    type:"select",
    options:["In-person personal training and coaching","Online coaching programmes and digital content","Specialist practice (nutrition, physiotherapy, yoga, rehabilitation)","Group fitness instruction"],
    condition: a => (a.skills||[]).some(s => s.includes("Fitness") || s.includes("wellness"))
  },
  {
    id:"fitness_experience",
    text:"Do you currently hold any relevant fitness or health qualifications?",
    type:"select",
    options:["Yes — fully qualified and certified","Partially — some credentials, not a full qualification","No — would need to pursue certification first","No formal credentials, but significant practical experience"],
    condition: a => (a.skills||[]).some(s => s.includes("Fitness") || s.includes("wellness"))
  },
  {
    id:"coding_direction",
    text:"Within technology and software, which direction best matches your aspirations?",
    type:"select",
    options:["Freelancing — providing development services to clients","Building my own product or SaaS business","Securing a well-paid remote employment role","Consulting and technical advisory work"],
    condition: a => (a.skills||[]).some(s => s.includes("development") || s.includes("engineering"))
  },
  {
    id:"coding_stack",
    text:"Which best describes your current technical focus or experience?",
    type:"select",
    options:["Full-stack or back-end development","Front-end / UI development","No-code or low-code platforms","Data science or machine learning","DevOps, cloud, or infrastructure","AI and automation tooling"],
    condition: a => (a.skills||[]).some(s => s.includes("development") || s.includes("engineering"))
  },
  {
    id:"writing_direction",
    text:"Within writing and content, which area most closely matches your strengths?",
    type:"select",
    options:["Persuasive copywriting and direct response marketing","Long-form editorial, journalism, or blogging","Ghostwriting for executives or thought leaders","Technical documentation and SaaS product content","Social media and short-form content","Scripts, storytelling, or creative writing"],
    condition: a => (a.skills||[]).some(s => s.includes("Writing") || s.includes("content creation"))
  },
  {
    id:"sales_direction",
    text:"Within sales and business development, which environment suits you best?",
    type:"select",
    options:["High-ticket closing — large-value consultative deals","Outbound prospecting and lead generation","Account management and long-term client retention","Building and leading a sales team","Commission-only remote sales roles"],
    condition: a => (a.skills||[]).some(s => s.includes("Sales") || s.includes("business development"))
  },
  {
    id:"design_direction",
    text:"Within design, which discipline is your strongest?",
    type:"select",
    options:["Brand identity and visual design","UI/UX and product design","Motion graphics and animation","Social media and content design","Illustration and digital art","Print and packaging design"],
    condition: a => (a.skills||[]).some(s => s.includes("Design") || s.includes("visual creativity"))
  },
  {
    id:"video_direction",
    text:"Within video production and editing, where do you specialise?",
    type:"select",
    options:["Long-form YouTube content editing","Short-form social media content (TikTok, Reels, Shorts)","Corporate and brand video production","Motion graphics and visual effects","Live streaming and broadcast"],
    condition: a => (a.skills||[]).some(s => s.includes("Video") || s.includes("editing"))
  },
  {
    id:"trades_type",
    text:"Which trade or skilled discipline best represents your background?",
    type:"select",
    options:["Electrical installation","Plumbing and heating","Carpentry and joinery","Painting and decorating","Vehicle mechanics","Construction and contracting","Beauty services (barbering, hair, makeup)","Tattooing or body art","Other skilled trade"],
    condition: a => (a.skills||[]).some(s => s.includes("trades") || s.includes("hands-on"))
  },
];

export function getAdaptiveQuestions(answers) {
  return BASE_QUESTIONS.filter(q => !q.condition || q.condition(answers));
}
