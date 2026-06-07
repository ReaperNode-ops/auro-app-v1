import { useState, useEffect, useRef } from "react";
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
const ALL_OPTIONS = [
  { id:"freelance-developer", title:"Freelance Developer", summary:"Build apps and websites for clients remotely.", earnings:"$2k–$8k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"high", speed:"medium", tags:["coding/tech","active","remote","high-income","low-budget"] },
  { id:"no-code-developer", title:"No-Code Developer", summary:"Build apps and sites using Webflow or Bubble.", earnings:"$1k–$5k/mo", difficulty:"Beginner", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["coding/tech","active","remote","low-budget","technology"] },
  { id:"web-developer", title:"Web Developer", summary:"Design and build websites for businesses.", earnings:"$1.5k–$6k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"medium", speed:"medium", tags:["coding/tech","design/visual creativity","active","remote","low-budget"] },
  { id:"shopify-developer", title:"Shopify Developer", summary:"Build and customise Shopify stores for brands.", earnings:"$1.5k–$6k/mo", difficulty:"Intermediate", timeToFirst:"3–4 wks", upside:"medium", speed:"medium", tags:["coding/tech","active","remote","e-commerce","low-budget"] },
  { id:"ui-ux-designer", title:"UI/UX Designer", summary:"Design interfaces for apps and websites.", earnings:"$2k–$7k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"high", speed:"medium", tags:["design/visual creativity","active","remote","coding/tech","low-budget"] },
  { id:"graphic-designer", title:"Graphic Designer", summary:"Create branding and marketing visuals.", earnings:"$800–$4k/mo", difficulty:"Beginner", timeToFirst:"2–3 wks", upside:"medium", speed:"fast", tags:["design/visual creativity","art & design","active","remote","low-budget"] },
  { id:"motion-graphics", title:"Motion Graphics Designer", summary:"Create animated graphics for ads and video.", earnings:"$1.5k–$6k/mo", difficulty:"Intermediate", timeToFirst:"3–4 wks", upside:"high", speed:"medium", tags:["design/visual creativity","video/editing","active","remote","creative","low-budget"] },
  { id:"video-editor", title:"Video Editor", summary:"Edit YouTube videos, ads, and social content.", earnings:"$800–$4k/mo", difficulty:"Intermediate", timeToFirst:"1–2 wks", upside:"medium", speed:"fast", tags:["video/editing","active","remote","low-budget","creative"] },
  { id:"thumbnail-designer", title:"Thumbnail Designer", summary:"Design click-worthy thumbnails for YouTubers.", earnings:"$500–$2.5k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["design/visual creativity","active","remote","low-budget"] },
  { id:"short-form-editor", title:"Short-Form Video Editor", summary:"Edit TikToks, Reels, and YouTube Shorts.", earnings:"$600–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"medium", speed:"fast", tags:["video/editing","active","remote","low-budget","social media"] },
  { id:"seo-specialist", title:"SEO Specialist", summary:"Help businesses rank higher on Google.", earnings:"$1k–$5k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["marketing/growth","active","remote","low-budget","technology"] },
  { id:"email-marketer", title:"Email Marketer", summary:"Build and manage email campaigns.", earnings:"$800–$4k/mo", difficulty:"Beginner", timeToFirst:"2–3 wks", upside:"medium", speed:"fast", tags:["marketing/growth","writing/storytelling","active","remote","low-budget"] },
  { id:"copywriter", title:"Copywriter", summary:"Write persuasive copy for ads and emails.", earnings:"$1k–$6k/mo", difficulty:"Beginner", timeToFirst:"2–3 wks", upside:"high", speed:"fast", tags:["writing/storytelling","active","remote","low-budget","sales/persuasion"] },
  { id:"ghostwriter", title:"Ghostwriter", summary:"Write content under someone else's name.", earnings:"$1k–$8k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"high", speed:"medium", tags:["writing/storytelling","active","remote","no-budget","high-income"] },
  { id:"technical-writer", title:"Technical Writer", summary:"Write documentation for tech products.", earnings:"$1.5k–$6k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["writing/storytelling","coding/tech","active","remote","low-budget"] },
  { id:"content-strategist", title:"Content Strategist", summary:"Plan and oversee content for brands.", earnings:"$1.5k–$5k/mo", difficulty:"Intermediate", timeToFirst:"3–4 wks", upside:"medium", speed:"medium", tags:["marketing/growth","writing/storytelling","active","remote","low-budget"] },
  { id:"ai-automation", title:"AI Automation Consultant", summary:"Help businesses automate workflows with AI.", earnings:"$2k–$10k/mo", difficulty:"Intermediate", timeToFirst:"3–6 wks", upside:"high", speed:"medium", tags:["coding/tech","technology","active","remote","low-budget","ai"] },
  { id:"prompt-engineer", title:"Prompt Engineer", summary:"Design AI workflows and prompts for businesses.", earnings:"$1.5k–$6k/mo", difficulty:"Beginner", timeToFirst:"2–4 wks", upside:"high", speed:"fast", tags:["coding/tech","technology","active","remote","low-budget","ai"] },
  { id:"data-analyst", title:"Data Analyst", summary:"Analyse data and produce business insights.", earnings:"$2k–$6k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"medium", speed:"slow", tags:["finance/numbers","coding/tech","active","remote","low-budget","technology"] },
  { id:"cybersecurity", title:"Cybersecurity Analyst", summary:"Protect businesses from digital threats.", earnings:"$2.5k–$8k/mo", difficulty:"Advanced", timeToFirst:"2–4 mos", upside:"high", speed:"slow", tags:["coding/tech","technology","active","remote","low-budget"] },
  { id:"it-support", title:"IT Support Specialist", summary:"Provide technical support to businesses remotely.", earnings:"$1.2k–$3k/mo", difficulty:"Beginner", timeToFirst:"2–4 wks", upside:"low", speed:"fast", tags:["coding/tech","technology","active","remote","low-budget"] },
  { id:"youtube", title:"YouTuber", summary:"Build a channel and earn through ads and sponsors.", earnings:"$200–$15k/mo", difficulty:"Intermediate", timeToFirst:"3–6 mos", upside:"very-high", speed:"slow", tags:["passive","content","no-budget","long-term","video/editing"] },
  { id:"tiktok-creator", title:"TikTok / Reels Creator", summary:"Build a short-form audience and earn deals.", earnings:"$500–$10k/mo", difficulty:"Beginner", timeToFirst:"4–8 wks", upside:"very-high", speed:"medium", tags:["passive","content","no-budget","social media"] },
  { id:"twitch-streamer", title:"Twitch Streamer", summary:"Stream gaming or creative content for subs.", earnings:"$200–$8k/mo", difficulty:"Intermediate", timeToFirst:"2–4 mos", upside:"high", speed:"slow", tags:["gaming","content","no-budget","active","long-term"] },
  { id:"ugc-creator", title:"UGC Creator", summary:"Create authentic content for brands — no following needed.", earnings:"$500–$5k/mo", difficulty:"Beginner", timeToFirst:"2–4 wks", upside:"medium", speed:"fast", tags:["content","active","no-budget","social media","video/editing","fast"] },
  { id:"podcaster", title:"Podcaster", summary:"Build an audio audience and monetise with sponsors.", earnings:"$200–$5k/mo", difficulty:"Beginner", timeToFirst:"2–4 mos", upside:"medium", speed:"slow", tags:["content","passive","low-budget","writing/storytelling"] },
  { id:"newsletter", title:"Newsletter Business", summary:"Build a paid or sponsored email newsletter.", earnings:"$500–$10k/mo", difficulty:"Beginner", timeToFirst:"4–8 wks", upside:"high", speed:"medium", tags:["writing/storytelling","passive","no-budget","content"] },
  { id:"blogger", title:"SEO Blog", summary:"Build a blog that earns through ads and affiliates.", earnings:"$200–$5k/mo", difficulty:"Beginner", timeToFirst:"3–6 mos", upside:"medium", speed:"slow", tags:["writing/storytelling","passive","no-budget","long-term"] },
  { id:"affiliate-marketer", title:"Affiliate Marketer", summary:"Earn commissions recommending products.", earnings:"$200–$8k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"high", speed:"medium", tags:["passive","no-budget","marketing/growth","writing/storytelling","content"] },
  { id:"course-creator", title:"Online Course Creator", summary:"Package your knowledge and sell it repeatedly.", earnings:"$500–$20k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"very-high", speed:"medium", tags:["teaching/explaining","passive","no-budget","long-term","high-income"] },
  { id:"notion-templates", title:"Notion Template Seller", summary:"Create and sell Notion templates online.", earnings:"$200–$3k/mo", difficulty:"Beginner", timeToFirst:"2–3 wks", upside:"low", speed:"fast", tags:["design/visual creativity","passive","no-budget","fast","technology"] },
  { id:"print-on-demand", title:"Print-on-Demand Store", summary:"Design and sell custom merchandise with no inventory.", earnings:"$200–$3k/mo", difficulty:"Beginner", timeToFirst:"3–4 wks", upside:"low", speed:"medium", tags:["design/visual creativity","passive","no-budget","art & design","creative"] },
  { id:"etsy-seller", title:"Etsy Seller", summary:"Sell handmade or digital products on Etsy.", earnings:"$200–$5k/mo", difficulty:"Beginner", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["creative","passive","low-budget","design/visual creativity","e-commerce"] },
  { id:"dropshipping", title:"Dropshipping", summary:"Sell products online without holding inventory.", earnings:"$500–$8k/mo", difficulty:"Intermediate", timeToFirst:"4–6 wks", upside:"medium", speed:"medium", tags:["business & entrepreneurship","active","low-budget","technology","e-commerce"] },
  { id:"amazon-fba", title:"Amazon FBA Seller", summary:"Source products and sell via Amazon fulfilment.", earnings:"$500–$10k/mo", difficulty:"Advanced", timeToFirst:"6–10 wks", upside:"high", speed:"slow", tags:["business & entrepreneurship","active","high-budget","e-commerce","long-term"] },
  { id:"saas-founder", title:"SaaS Founder", summary:"Build a software product with monthly subscriptions.", earnings:"$0–$50k+/mo", difficulty:"Advanced", timeToFirst:"3–12 mos", upside:"very-high", speed:"slow", tags:["coding/tech","business & entrepreneurship","high-budget","long-term","high-income"] },
  { id:"virtual-assistant", title:"Virtual Assistant", summary:"Provide remote admin and support services.", earnings:"$600–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["active","remote","fast","no-budget","people","low-tech","organisation/admin"] },
  { id:"online-tutor", title:"Online Tutor", summary:"Teach subjects you know well via Zoom.", earnings:"$500–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["teaching/explaining","active","remote","fast","no-budget","people"] },
  { id:"bookkeeping", title:"Bookkeeper", summary:"Manage financial records for small businesses.", earnings:"$1k–$4k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["finance/numbers","active","remote","low-budget","business & entrepreneurship"] },
  { id:"sales-rep", title:"Remote Sales Rep", summary:"Sell products or services remotely on commission.", earnings:"$1.5k–$8k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"high", speed:"fast", tags:["sales/persuasion","active","remote","people","fast"] },
  { id:"remote-closer", title:"Remote Closer", summary:"Close high-ticket sales calls for coaches.", earnings:"$2k–$10k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"high", speed:"fast", tags:["sales/persuasion","active","remote","people","high-income"] },
  { id:"appointment-setter", title:"Appointment Setter", summary:"Book sales calls for coaches and businesses.", earnings:"$800–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"medium", speed:"fast", tags:["sales/persuasion","active","remote","people","fast","no-budget"] },
  { id:"lead-gen", title:"Lead Generation Specialist", summary:"Find and qualify customers for businesses.", earnings:"$800–$4k/mo", difficulty:"Beginner", timeToFirst:"2–3 wks", upside:"medium", speed:"fast", tags:["sales/persuasion","marketing/growth","active","remote","low-budget"] },
  { id:"recruiter", title:"Freelance Recruiter", summary:"Place candidates into jobs and earn fees.", earnings:"$1.5k–$8k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"high", speed:"medium", tags:["sales/persuasion","people","active","remote","no-budget"] },
  { id:"real-estate-agent", title:"Real Estate Agent", summary:"Help people buy and sell property on commission.", earnings:"$1k–$10k/mo", difficulty:"Intermediate", timeToFirst:"6–12 wks", upside:"high", speed:"slow", tags:["sales/persuasion","people","active","local","low-budget"] },
  { id:"insurance-agent", title:"Insurance Broker", summary:"Sell insurance and earn recurring commissions.", earnings:"$1k–$6k/mo", difficulty:"Intermediate", timeToFirst:"6–10 wks", upside:"medium", speed:"slow", tags:["sales/persuasion","finance/numbers","active","local","low-budget"] },
  { id:"event-planner", title:"Event Planner", summary:"Plan and coordinate events for clients.", earnings:"$800–$4k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"medium", speed:"medium", tags:["people","active","local","low-budget","organisation/admin"] },
  { id:"personal-trainer", title:"Personal Trainer", summary:"Train clients one-on-one in person or online.", earnings:"$1.5k–$6k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"medium", speed:"fast", tags:["fitness/health","active","people","health & fitness","low-budget"] },
  { id:"online-fitness-coach", title:"Online Fitness Coach", summary:"Coach clients remotely through personalised programmes.", earnings:"$1.5k–$8k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"high", speed:"fast", tags:["fitness/health","active","remote","no-budget","people","health & fitness"] },
  { id:"nutrition-coach", title:"Nutrition Coach", summary:"Help clients improve their diet and health.", earnings:"$1k–$4k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["fitness/health","active","remote","health & fitness","no-budget","people"] },
  { id:"yoga-instructor", title:"Yoga Instructor", summary:"Teach yoga in person, online, or on demand.", earnings:"$800–$3k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"medium", speed:"medium", tags:["fitness/health","active","people","health & fitness","low-budget"] },
  { id:"photographer", title:"Photographer", summary:"Shoot portraits, events, or products.", earnings:"$500–$5k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"medium", speed:"fast", tags:["photography","active","creative","local","low-budget"] },
  { id:"videographer", title:"Videographer", summary:"Film and produce video for businesses and events.", earnings:"$1k–$6k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"medium", speed:"fast", tags:["video/editing","photography","active","creative","local","low-budget"] },
  { id:"music-producer", title:"Music Producer", summary:"Produce beats and tracks for artists.", earnings:"$500–$5k/mo", difficulty:"Intermediate", timeToFirst:"3–6 wks", upside:"high", speed:"medium", tags:["music/audio","passive","creative","no-budget","music"] },
  { id:"dj", title:"DJ", summary:"Perform at events, clubs, and private functions.", earnings:"$500–$5k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"medium", speed:"medium", tags:["music/audio","active","creative","local","low-budget"] },
  { id:"illustrator", title:"Illustrator", summary:"Create illustrations for books, brands, and products.", earnings:"$800–$4k/mo", difficulty:"Intermediate", timeToFirst:"2–4 wks", upside:"medium", speed:"fast", tags:["design/visual creativity","art & design","creative","active","no-budget"] },
  { id:"voice-actor", title:"Voice Actor", summary:"Record voice-overs for ads, audiobooks, and videos.", earnings:"$500–$5k/mo", difficulty:"Beginner", timeToFirst:"3–5 wks", upside:"medium", speed:"medium", tags:["music/audio","active","remote","creative","low-budget"] },
  { id:"makeup-artist", title:"Makeup Artist", summary:"Provide makeup for weddings, events, and shoots.", earnings:"$500–$4k/mo", difficulty:"Beginner", timeToFirst:"2–4 wks", upside:"medium", speed:"fast", tags:["creative","active","local","people","low-budget","beauty"] },
  { id:"fashion-stylist", title:"Fashion Stylist", summary:"Style clients for shoots, events, and wardrobes.", earnings:"$500–$3k/mo", difficulty:"Beginner", timeToFirst:"3–5 wks", upside:"low", speed:"medium", tags:["fashion/style","creative","active","people","local","no-budget"] },
  { id:"tattoo-artist", title:"Tattoo Artist", summary:"Create custom tattoos in a studio.", earnings:"$1.5k–$8k/mo", difficulty:"Advanced", timeToFirst:"After apprenticeship", upside:"high", speed:"slow", tags:["creative","art & design","active","local","hands-on"] },
  { id:"barber", title:"Barber", summary:"Cut and style hair in a shop or mobile.", earnings:"$1.5k–$5k/mo", difficulty:"Intermediate", timeToFirst:"After qualification", upside:"medium", speed:"medium", tags:["hands-on","active","local","creative","people"] },
  { id:"hair-stylist", title:"Hair Stylist", summary:"Provide haircutting, colouring, and styling.", earnings:"$1.2k–$5k/mo", difficulty:"Intermediate", timeToFirst:"After qualification", upside:"medium", speed:"medium", tags:["hands-on","active","local","creative","people"] },
  { id:"electrician", title:"Electrician", summary:"Install and maintain electrical systems.", earnings:"$2k–$6k/mo", difficulty:"Advanced", timeToFirst:"After qualification", upside:"medium", speed:"slow", tags:["hands-on","local","trades","high-income","active"] },
  { id:"plumber", title:"Plumber", summary:"Install and repair plumbing systems.", earnings:"$2k–$6k/mo", difficulty:"Advanced", timeToFirst:"After qualification", upside:"medium", speed:"slow", tags:["hands-on","local","trades","high-income","active"] },
  { id:"carpenter", title:"Carpenter", summary:"Build and install wooden structures and furniture.", earnings:"$1.5k–$5k/mo", difficulty:"Intermediate", timeToFirst:"After training", upside:"medium", speed:"slow", tags:["hands-on","local","trades","active","creative"] },
  { id:"painter-decorator", title:"Painter and Decorator", summary:"Paint and decorate properties.", earnings:"$1.2k–$4k/mo", difficulty:"Beginner", timeToFirst:"1–3 wks", upside:"low", speed:"fast", tags:["hands-on","local","trades","active","low-budget","fast"] },
  { id:"mechanic", title:"Vehicle Mechanic", summary:"Service and repair cars and vans.", earnings:"$1.5k–$4k/mo", difficulty:"Intermediate", timeToFirst:"After training", upside:"medium", speed:"slow", tags:["hands-on","local","trades","active","technology"] },
  { id:"solar-installer", title:"Solar Panel Installer", summary:"Install solar panels and renewable energy systems.", earnings:"$2k–$6k/mo", difficulty:"Intermediate", timeToFirst:"After certification", upside:"high", speed:"slow", tags:["hands-on","local","trades","active","technology"] },
  { id:"locksmith", title:"Locksmith", summary:"Open locks and install security systems.", earnings:"$1.5k–$5k/mo", difficulty:"Beginner", timeToFirst:"3–6 wks", upside:"medium", speed:"medium", tags:["hands-on","local","trades","active","low-budget","fast"] },
  { id:"general-contractor", title:"General Contractor", summary:"Manage construction and renovation projects.", earnings:"$3k–$15k/mo", difficulty:"Advanced", timeToFirst:"4–8 wks", upside:"high", speed:"slow", tags:["hands-on","local","trades","active","high-income","management"] },
  { id:"delivery-driver", title:"Delivery Driver", summary:"Deliver food or packages flexibly.", earnings:"$800–$2.5k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["active","local","fast","no-budget","flexible","low-tech","vehicle"] },
  { id:"uber-driver", title:"Rideshare Driver", summary:"Drive passengers for Uber or Bolt.", earnings:"$1k–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["active","local","fast","flexible","low-tech","people","vehicle"] },
  { id:"reseller", title:"Reseller / Thrift Flipper", summary:"Buy items cheaply and resell for profit online.", earnings:"$300–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"medium", speed:"fast", tags:["active","flexible","low-budget","fast","local","business & entrepreneurship"] },
  { id:"airbnb-host", title:"Airbnb Host", summary:"Rent out a spare room or property.", earnings:"$500–$4k/mo", difficulty:"Beginner", timeToFirst:"2–4 wks", upside:"medium", speed:"medium", tags:["passive","local","spare room or property","low-budget","flexible"] },
  { id:"dog-walker", title:"Dog Walker / Pet Sitter", summary:"Walk dogs and care for pets locally.", earnings:"$500–$2.5k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["active","local","fast","no-budget","low-tech","animals & pets"] },
  { id:"car-detailer", title:"Car Detailer", summary:"Deep clean and detail vehicles.", earnings:"$800–$4k/mo", difficulty:"Beginner", timeToFirst:"1–3 wks", upside:"medium", speed:"fast", tags:["active","local","fast","low-budget","hands-on","vehicle"] },
  { id:"pressure-washing", title:"Pressure Washing Business", summary:"Clean driveways, patios, and commercial spaces.", earnings:"$500–$4k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"medium", speed:"fast", tags:["active","local","fast","low-budget","hands-on"] },
  { id:"window-cleaner", title:"Window Cleaner", summary:"Clean windows on regular recurring routes.", earnings:"$800–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"low", speed:"fast", tags:["active","local","fast","low-budget","hands-on"] },
  { id:"junk-removal", title:"Junk Removal / Man with a Van", summary:"Help people clear out unwanted items.", earnings:"$500–$3k/mo", difficulty:"Beginner", timeToFirst:"1–2 wks", upside:"medium", speed:"fast", tags:["active","local","fast","low-budget","hands-on","vehicle"] },
  { id:"stock-photos", title:"Stock Photography", summary:"Upload photos or clips and earn royalties.", earnings:"$100–$1.5k/mo", difficulty:"Beginner", timeToFirst:"3–6 wks", upside:"low", speed:"slow", tags:["photography","video/editing","passive","no-budget","creative"] },
  { id:"music-licensing", title:"Music Licensing", summary:"License original music for videos and ads.", earnings:"$200–$3k/mo", difficulty:"Intermediate", timeToFirst:"4–8 wks", upside:"medium", speed:"slow", tags:["music/audio","passive","no-budget","music","creative"] },
  { id:"creator-agency", title:"Creator Agency Owner", summary:"Manage content and social media for multiple clients.", earnings:"$2k–$15k/mo", difficulty:"Advanced", timeToFirst:"4–8 wks", upside:"very-high", speed:"medium", tags:["business & entrepreneurship","social media","active","remote","high-income","management"] },
  { id:"personal-brand", title:"Personal Brand Strategist", summary:"Help founders build their online presence.", earnings:"$1.5k–$8k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"high", speed:"medium", tags:["marketing/growth","writing/storytelling","social media","active","remote","no-budget"] },
  { id:"growth-operator", title:"Growth Operator", summary:"Run marketing and growth for startups.", earnings:"$2k–$8k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"high", speed:"medium", tags:["marketing/growth","business & entrepreneurship","active","remote","low-budget","technology"] },
  { id:"automation-specialist", title:"Automation Specialist", summary:"Build automated systems that save businesses time.", earnings:"$2k–$10k/mo", difficulty:"Intermediate", timeToFirst:"3–5 wks", upside:"high", speed:"medium", tags:["coding/tech","technology","active","remote","low-budget","ai"] },
];

const STEPS = {
  "freelance-developer":["Build 3 portfolio projects on GitHub","Create profiles on Upwork and Toptal","Raise rates as reviews build"],
  "no-code-developer":["Pick Webflow for sites or Bubble for apps","Complete their free certification","Build a free MVP for a local business"],
  "web-developer":["Learn HTML/CSS/JS or master Webflow","Build 3 sample sites in different niches","Pitch local businesses with outdated sites"],
  "shopify-developer":["Learn Shopify Liquid templating","Build 2 sample stores as portfolio","Join the Shopify Partner programme"],
  "ui-ux-designer":["Master Figma through free YouTube tutorials","Redesign 3 existing apps as portfolio","Pitch startups needing a designer"],
  "graphic-designer":["Build a portfolio of 10+ designs","Create profiles on Fiverr and 99designs","Niche into brand identity or social content"],
  "motion-graphics":["Learn After Effects through YouTube or Motion Array","Create 5 sample animations in different styles","Target marketing agencies needing motion work"],
  "video-editor":["Edit 3 sample videos in different styles","DM 20 creators offering a test edit","Convert happy clients to monthly packages"],
  "thumbnail-designer":["Redesign 10 existing thumbnails as portfolio","List on Fiverr and DM mid-size YouTubers","Offer monthly packages for regular creators"],
  "short-form-editor":["Edit 5 sample short-form videos","DM TikTok creators offering a free test edit","Package at $300–600/month for weekly content"],
  "seo-specialist":["Learn through Ahrefs Academy — free","Do a free SEO audit for a local business","Convert it into a paid monthly retainer"],
  "email-marketer":["Learn Klaviyo or Mailchimp through free courses","Build a sample campaign as portfolio","Pitch e-commerce brands underusing email"],
  "copywriter":["Study fundamentals — read Ogilvy on Advertising","Rewrite 5 ads or landing pages as portfolio","Pitch brands running paid ads"],
  "ghostwriter":["Write 10 sample LinkedIn posts in different voices","Pitch busy executives and founders","Offer a trial week before pitching a retainer"],
  "technical-writer":["Contribute to open source project documentation","Build portfolio of sample docs and API references","Target SaaS companies on LinkedIn"],
  "content-strategist":["Document a content strategy for a brand as portfolio","Pitch startups posting inconsistently","Package as a monthly retainer"],
  "ai-automation":["Get certified in Make.com and Zapier — free","Build 3 automation demos solving common problems","Pitch professional services and e-commerce brands"],
  "prompt-engineer":["Master prompting across Claude, GPT-4, and Midjourney","Document 10 use cases with results","Position on LinkedIn as an AI workflow consultant"],
  "data-analyst":["Learn SQL and Python through Kaggle — free","Build 3 portfolio projects on public datasets","Apply for analyst roles or pitch businesses"],
  "cybersecurity":["Study for CompTIA Security+ (3–4 months)","Practice on HackTheBox and TryHackMe","Apply for junior analyst or penetration testing roles"],
  "it-support":["Study for CompTIA A+ certification","Offer free support to build experience","Apply to remote help desk roles on LinkedIn"],
  "youtube":["Pick a niche you can talk about for years","Post one video per week for 3 months","Pitch sponsors once you hit 10k subscribers"],
  "tiktok-creator":["Post 1–2 videos daily in a niche for 30 days","Study analytics to see what performs","Pitch brands directly at 5k followers"],
  "twitch-streamer":["Stream 4–5 days per week for 3 months","Engage every viewer in chat aggressively","Apply for Twitch Affiliate at 50 avg viewers"],
  "ugc-creator":["Create 5 sample UGC videos for products you own","Build a simple portfolio on Notion","Pitch brands on Instagram or through Billo"],
  "podcaster":["Pick a niche, get a USB mic, record 5 episodes","Launch on Spotify for Podcasters — free","Pitch sponsors in your niche after 3 months"],
  "newsletter":["Launch on Beehiiv or Substack — free","Write 8 issues before promoting","Grow through social media and cross-promotions"],
  "blogger":["Pick a niche with good affiliate programmes","Publish 50+ articles on low-competition keywords","Monetise with Mediavine ads and affiliate links"],
  "affiliate-marketer":["Join Amazon Associates or ClickBank — free","Create useful content with your affiliate links","Drive traffic through SEO, TikTok, or Pinterest"],
  "course-creator":["Validate by asking 10 people if they would pay","Record modules with your phone and free editing tools","Launch to your network then drive traffic via social"],
  "notion-templates":["Build 3–5 templates solving productivity problems","List on Gumroad and Etsy","Post TikTok content showing the template in use"],
  "print-on-demand":["Open free accounts on Redbubble and Merch by Amazon","Upload 30+ designs in a consistent niche","Drive traffic via Pinterest or TikTok"],
  "etsy-seller":["Open an Etsy shop with 10–20 listings","Optimise titles and tags for Etsy search","Drive external traffic via Pinterest"],
  "dropshipping":["Research trending products on TikTok and AliExpress","Set up a Shopify trial store with DSers","Drive traffic via TikTok organic before paid ads"],
  "amazon-fba":["Research products using Jungle Scout or Helium 10","Source a test batch from Alibaba","Create an optimised listing and launch with PPC"],
  "saas-founder":["Identify a painful niche problem people pay to solve","Build an MVP using no-code or a co-founder","Launch to a small audience and iterate fast"],
  "virtual-assistant":["List services on Fiverr, Upwork, and VA groups","Offer a free trial week to your first client","Upsell additional services as you build trust"],
  "online-tutor":["List on Tutorful, Superprof, or MyTutor","Respond fast to enquiries","Build recurring weekly students for stable income"],
  "bookkeeping":["Get QuickBooks or Xero certified — free","List on Upwork targeting small business owners","Land 3–5 monthly clients for recurring income"],
  "sales-rep":["Highlight customer-facing experience on your CV","Apply for SDR roles at SaaS companies on LinkedIn","Study Challenger Sale and SPIN Selling frameworks"],
  "remote-closer":["Study closing frameworks — Cole Gordon on YouTube","Apply to remote closing roles on LinkedIn","Track close rate to negotiate higher commission"],
  "appointment-setter":["Apply to setter roles in Facebook groups and LinkedIn","Practice DM scripts with a mentor","Track your metrics — show rates and set rates"],
  "lead-gen":["Learn LinkedIn Sales Navigator and Apollo.io","Offer lead lists to 3 businesses as free trial","Package as monthly retainer delivering qualified leads"],
  "recruiter":["Pick a niche sector — tech, finance, or marketing","Connect with hiring managers on LinkedIn","Charge 15% of placed candidate annual salary"],
  "real-estate-agent":["Get licensed through ARLA or NAEA","Join an established agency to learn the ropes","Build locally — most agents grow through referrals"],
  "insurance-agent":["Get FCA authorised or join as appointed representative","Study life, health, or general insurance products","Build referral network with financial advisors"],
  "event-planner":["Plan a free event for a friend or charity as portfolio","List on wedding and event directories","Partner with venues for referral business"],
  "personal-trainer":["Get Level 3 PT qualification (REPs accredited)","Build first 5 clients through gym contacts","Transition to online coaching to scale beyond hourly"],
  "online-fitness-coach":["Define your niche — fat loss, muscle gain, sport","Post free valuable fitness content daily","DM followers offering a free discovery call"],
  "nutrition-coach":["Get Level 4 Nutrition or Precision Nutrition certified","Offer free consultations to first 5 clients","Package into monthly coaching retainers"],
  "yoga-instructor":["Complete a 200-hour RYT yoga teacher training","Offer free community classes to build a following","Launch an online membership for passive income"],
  "photographer":["Build a portfolio with discounted shoots for friends","List on Bark.com and wedding directories","Niche into real estate or product photography"],
  "videographer":["Build portfolio with 5 sample videos","Pitch local businesses for brand video content","Target weddings for reliable seasonal income"],
  "music-producer":["Upload best 20 beats to BeatStars with clear tags","Post beat-making content on TikTok and YouTube","Pitch catalogue to sync licensing platforms"],
  "dj":["Practice daily and record mixes as your portfolio","Offer to play smaller venues and private events","Build relationships with promoters and venues"],
  "illustrator":["Build portfolio of 20+ pieces with consistent style","List on 99designs and Dribbble for freelance work","Sell prints through your own Etsy shop"],
  "voice-actor":["Set up basic home studio — USB mic (~$150)","Record demos in commercial and narration styles","List on Voices.com, Voice123, and ACX"],
  "makeup-artist":["Complete a makeup artistry course and build your kit","Do free shoots with photographers for portfolio","List on wedding directories and promote on Instagram"],
  "fashion-stylist":["Style friends and family free to build portfolio","Offer sessions through Instagram and word of mouth","Partner with photographers for collaborative shoots"],
  "tattoo-artist":["Apprentice under an established artist","Build your flash sheet and post on Instagram","Build a waitlist once you have your own following"],
  "barber":["Complete Level 2 Barbering qualification","Work in a shop to build speed and clientele","Go mobile or rent a booth to maximise earnings"],
  "hair-stylist":["Complete NVQ Level 2/3 Hairdressing","Build Instagram portfolio with before/after photos","Move to self-employment or rent a chair"],
  "electrician":["Complete Level 3 Electrical Installation qualification","Apprentice under a qualified electrician","Register self-employed and build your client base"],
  "plumber":["Complete NVQ Level 2/3 in Plumbing and Heating","Get Gas Safe registered for gas work","Build local client base through Checkatrade"],
  "carpenter":["Complete a City and Guilds carpentry qualification","Build a photo portfolio of your work","Register on Checkatrade and build through referrals"],
  "painter-decorator":["Buy basic equipment (~$200)","Offer discounted first job for photos and reviews","List on Checkatrade and local Facebook groups"],
  "mechanic":["Complete IMI Level 3 Vehicle Maintenance","Work at a garage to build diagnostic skills","Go mobile — invest in a van and tools"],
  "solar-installer":["Complete MCS-approved solar installation course","Work with established installer for site experience","Get MCS accreditation and start quoting"],
  "locksmith":["Complete a locksmith training course (~$500)","Buy a starter kit of picks and blanks","Set up Google Business profile for local visibility"],
  "general-contractor":["Build experience working in a trade first","Get public liability insurance","Start with small jobs and scale as reputation grows"],
  "delivery-driver":["Sign up on Deliveroo, Uber Eats, and Amazon Flex","Work peak hours for best earnings","Track mileage carefully for tax deductions"],
  "uber-driver":["Apply for private hire licence through your local council","Register on Uber, Bolt, and Ola","Work peak times — mornings, evenings, weekends"],
  "reseller":["Start with items you already own to test the process","Source from charity shops and Facebook Marketplace","List with good photos on eBay, Vinted, and Depop"],
  "airbnb-host":["Create a listing with professional photos","Start with competitive pricing to build reviews","Automate check-in and cleaning for minimal effort"],
  "dog-walker":["Get DBS checked and register on Rover and Bark.com","Offer introductory walks at a discount","Build word of mouth through vets and pet shops"],
  "car-detailer":["Invest in starter detailing kit (~$200–$400)","Detail friends' cars free to build portfolio","List on Facebook Marketplace and build through referrals"],
  "pressure-washing":["Buy a commercial pressure washer (~$300–$600)","Knock on doors in affluent areas","Partner with commercial property managers for contracts"],
  "window-cleaner":["Buy basic kit — squeegees and extension pole (~$100)","Offer free first clean in residential areas","Build commercial contracts with offices and shops"],
  "junk-removal":["Get waste carrier licence from Environment Agency ($154)","List on AnyVan, TaskRabbit, and Facebook Marketplace","Resell valuable items to increase profit margin"],
  "stock-photos":["Create accounts on Shutterstock, Adobe Stock, and Alamy","Upload 100+ commercially useful images","Focus on business, lifestyle, and food content"],
  "music-licensing":["Upload tracks to BeatStars and DistroKid","Create SoundCloud profile with your best work","Post production content on TikTok to attract buyers"],
  "creator-agency":["Start as a freelancer and systematise your workflow","Hire a part-time editor or VA to handle delivery","Sign 3–5 retainer clients before scaling further"],
  "personal-brand":["Build your own personal brand as proof of concept","Pitch busy founders and executives on LinkedIn","Offer a trial month before pitching a retainer"],
  "growth-operator":["Build a track record in one channel first","Document results clearly — growth % and revenue driven","Pitch startups on a performance-based arrangement"],
  "automation-specialist":["Get certified in Make.com and Zapier — free","Build 5 automation templates solving common problems","Pitch professional services and e-commerce brands"],
};

// ── Adaptive questions ────────────────────────────────────────────────────────
const BASE_QUESTIONS = [

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


function getAdaptiveQuestions(answers) {
  return BASE_QUESTIONS.filter(q => !q.condition || q.condition(answers));
}

// ── Scoring engine ────────────────────────────────────────────────────────────
function scoreOptions(answers) {
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

function getArchetype(answers) {
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

// ── Utility ───────────────────────────────────────────────────────────────────
const diffColor = { "Beginner":"#34d399", "Intermediate": T.gold, "Advanced":"#f87171" };
const upsideLabel = { "low":"Low Upside","medium":"Solid","high":"High Upside","very-high":"🔥 Very High" };
const upsideColor = { "low":T.muted,"medium":T.accentB,"high":T.gold,"very-high":"#f87171" };

// ── Components ────────────────────────────────────────────────────────────────

function GlowOrb({ x, y, color, size = 300, opacity = 0.07 }) {
  return (
    <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, filter:"blur(80px)", opacity, pointerEvents:"none", zIndex:0 }} />
  );
}

function Badge({ children, color = T.primary }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:0.5, background: color+"1a", color, border:`1px solid ${color}44` }}>
      {children}
    </span>
  );
}

function Landing({ onStart }) {
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

function QuestionCard({ question, onAnswer, progress, total }) {
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

function ScoreCircle({ score }) {
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

function ResultCard({ rec, index, isBest, isFastest, isHighest }) {
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

function Results({ answers, onReset }) {
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
            {screen === "landing" && <Landing onStart={start} />}
            {screen === "quiz" && questions[qIndex] && (
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
