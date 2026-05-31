// ── gemini.js ────────────────────────────────────────────────────────────────
// Auro AI · Minimal stable Gemini integration
// Place at: src/gemini.js

const MODEL = "gemini-2.0-flash";

const API_URL =
`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(userContext) {
const {
name,
score,
streak,
goals,
progress,
isPremium,
answers,
} = userContext;

const answersText =
answers && Object.keys(answers).length > 0
? Object.entries(answers)
.map(([k, v]) =>
`- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`
)
.join("\n")
: "(No quiz answers yet)";

return `
You are Auro AI Coach.

You are intelligent, grounded, practical, direct, and conversational.

Never invent fake scores, habits, statistics, or progress.
Only reference profile data explicitly provided below.

Avoid generic motivational clichés.
Answer the user's actual question directly.
Give realistic, useful advice.
Keep responses concise unless depth is requested.

USER PROFILE:
Name: ${name || "User"}
Auro Score: ${score ?? "N/A"}
Current Streak: ${streak ?? 0}
Goals: ${goals ?? 0}
Progress: ${progress ?? 0}%
Plan: ${isPremium ? "Premium" : "Free"}

QUIZ ANSWERS:
${answersText}
`.trim();
}

// ── Main Gemini function ─────────────────────────────────────────────────────

export async function geminiChat(
userMessage,
history = [],
userContext = {}
) {
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
throw new GeminiError(
"Missing Gemini API key.",
"missing_api_key"
);
}

console.log("Sending Gemini request:", userMessage);

const body = {
contents: [
{
role: "user",
parts: [
{
text:
buildSystemPrompt(userContext) +
"\n\nUser message:\n" +
userMessage,
},
],
},
],
};

let res;

try {
res = await fetch(`${API_URL}?key=${apiKey}`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(body),
});
} catch (networkErr) {
throw new GeminiError(
"Network error. Check your connection.",
"network_error"
);
}

if (!res.ok) {
let errBody = {};

```
try {
  errBody = await res.json();
} catch (_) {}

console.error("Gemini API Error:", errBody);

const status =
  errBody?.error?.status || res.status;

const message =
  errBody?.error?.message ||
  `HTTP ${res.status}`;

throw new GeminiError(
  `${message}`,
  status
);
```

}

const data = await res.json();

console.log("Gemini response:", data);

const text =
data?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
throw new GeminiError(
"Empty AI response.",
"empty_response"
);
}

return text.trim();
}

// ── Error class ──────────────────────────────────────────────────────────────

export class GeminiError extends Error {
constructor(message, code = "unknown") {
super(message);
this.name = "GeminiError";
this.code = code;
}
}
