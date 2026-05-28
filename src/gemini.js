// ── gemini.js ──────────────────────────────────────────────────────────────────
// Auro · Gemini 2.0 Flash client
// Place at: src/gemini.js
//
// Requires VITE_GEMINI_API_KEY in your .env file:
//   VITE_GEMINI_API_KEY=your_key_here
//
// Get a key at: https://aistudio.google.com/app/apikey
 
const MODEL   = "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
 
// ── System prompt builder ──────────────────────────────────────────────────────
// Injects user context so Gemini can give personalised advice.
function buildSystemPrompt(userContext) {
  const { name, score, streak, goals, progress, isPremium, answers } = userContext;
 
  const answersText = answers && Object.keys(answers).length > 0
    ? Object.entries(answers)
        .map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n")
    : "  (quiz not yet completed)";
 
  return `You are Auro AI Coach — a sharp, direct, encouraging income and career advisor built into the Auro app.
 
USER PROFILE:
  Name: ${name || "User"}
  Auro Score: ${score ?? "N/A"}
  Current Streak: ${streak ?? 0} days
  Active Goals: ${goals ?? 0}
  Overall Progress: ${progress ?? 0}%
  Plan: ${isPremium ? "Premium" : "Free"}
 
QUIZ ANSWERS (income preferences and situation):
${answersText}
 
INSTRUCTIONS:
- Keep responses under 120 words unless the user explicitly asks for detail.
- Be direct, specific, and actionable — no filler phrases.
- Reference the user's actual profile data when relevant.
- Do not mention being an AI or that you are powered by Google.
- Do not use markdown headers or bullet lists in responses; write in natural prose.
- If the user seems stuck, give ONE concrete next step.
- Match the user's energy — if they're motivated, push harder; if they're struggling, be grounded.
- Never make up specific financial figures or guarantees.`.trim();
}
 
// ── Main chat function ─────────────────────────────────────────────────────────
/**
 * Send a message to Gemini 2.0 Flash and return the text response.
 *
 * @param {string}   userMessage   - The user's current message
 * @param {Array}    history       - Prior turns: [{ role:"user"|"model", text:"..." }]
 * @param {Object}   userContext   - { name, score, streak, goals, progress, isPremium, answers }
 * @returns {Promise<string>}      - Gemini's response text
 */
export async function geminiChat(userMessage, history = [], userContext = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      "VITE_GEMINI_API_KEY is not set. Add it to your .env file.",
      "missing_api_key"
    );
  }
 
  // Build conversation turns for the API
  // Gemini wants roles "user" and "model" (not "assistant")
  const contents = [
    // Inject system context as the first user turn (Gemini 2.0 Flash supports
    // a system_instruction field but this approach works universally)
    ...history.map(turn => ({
      role: turn.role === "ai" ? "model" : "user",
      parts: [{ text: turn.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];
 
  const body = {
    system_instruction: {
      parts: [{ text: buildSystemPrompt(userContext) }],
    },
    contents,
    generationConfig: {
      temperature:      0.85,
      maxOutputTokens:  300,   // ~120 words — enforces concise replies
      topP:             0.9,
      topK:             40,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };
 
  let res;
  try {
    res = await fetch(`${API_URL}?key=${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new GeminiError("Network error — check your connection.", "network_error");
  }
 
  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); } catch (_) { errBody = {}; }
    const status  = res.status;
    const message = errBody?.error?.message ?? `HTTP ${status}`;
    const code    = errBody?.error?.status  ?? String(status);
    throw new GeminiError(friendlyGeminiError(status, code, message), code);
  }
 
  const data = await res.json();
 
  // Extract text from response
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new GeminiError("No response received from AI.", "no_candidate");
  }
 
  // Check finish reason — SAFETY means content was blocked
  if (candidate.finishReason === "SAFETY") {
    throw new GeminiError("That message was flagged by safety filters. Please rephrase.", "safety_block");
  }
 
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiError("AI returned an empty response. Please try again.", "empty_response");
  }
 
  return text.trim();
}
 
// ── Custom error class ─────────────────────────────────────────────────────────
export class GeminiError extends Error {
  constructor(message, code = "unknown") {
    super(message);
    this.name  = "GeminiError";
    this.code  = code;
  }
}
 
// ── Error → human message ──────────────────────────────────────────────────────
function friendlyGeminiError(status, code, rawMessage) {
  if (status === 400) return "Invalid request — please try rephrasing.";
  if (status === 401 || status === 403) return "Invalid API key. Check VITE_GEMINI_API_KEY in your .env file.";
  if (status === 429) return "AI is busy right now — please wait a moment and try again.";
  if (status === 500 || status === 503) return "Google AI service is temporarily unavailable. Try again shortly.";
  if (code === "RESOURCE_EXHAUSTED") return "API quota reached. Check your Gemini usage at aistudio.google.com.";
  return `AI error (${status}). Please try again.`;
}
 
// ── Daily usage helpers (localStorage, keyed by date + uid) ───────────────────
// Survives page refresh. Resets automatically on a new calendar day.
 
const STORAGE_KEY_PREFIX = "auro_chat_usage_";
 
function todayKey(uid) {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return `${STORAGE_KEY_PREFIX}${uid ?? "anon"}_${dateStr}`;
}
 
export function getDailyUsage(uid) {
  try {
    const raw = localStorage.getItem(todayKey(uid));
    return raw ? parseInt(raw, 10) : 0;
  } catch (_) {
    return 0; // localStorage blocked (private mode etc.)
  }
}
 
export function incrementDailyUsage(uid) {
  try {
    const key     = todayKey(uid);
    const current = getDailyUsage(uid);
    localStorage.setItem(key, String(current + 1));
    return current + 1;
  } catch (_) {
    return 0;
  }
}
 
export function clearDailyUsage(uid) {
  try {
    localStorage.removeItem(todayKey(uid));
  } catch (_) {}
}
