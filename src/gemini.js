const MODEL = "gemini-2.0-flash";

const API_URL =
`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function buildSystemPrompt(userContext) {
const { name, score, streak, goals, progress, isPremium, answers } = userContext;

const answersText =
answers && Object.keys(answers).length > 0
? Object.entries(answers)
.map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
.join("\n")
: "(No quiz answers yet)";

return `
You are Auro AI Coach — a grounded, direct, practical advisor.

USER:
Name: ${name || "User"}
Score: ${score ?? "N/A"}
Streak: ${streak ?? 0}
Goals: ${goals ?? 0}
Progress: ${progress ?? 0}%
Plan: ${isPremium ? "Premium" : "Free"}

QUIZ:
${answersText}

RULES:

* Be direct and useful
* No fake stats or promises
* No fluff
* Keep it concise
  `.trim();
  }

export async function geminiChat(userMessage, history = [], userContext = {}) {
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
throw new Error("Missing API key");
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
} catch (err) {
throw new Error("Network error");
}

if (!res.ok) {
let errBody = {};
try {
errBody = await res.json();
} catch (_) {}

```
console.error("Gemini API Error:", errBody);

throw new Error(
  errBody?.error?.message || `HTTP ${res.status}`
);
```

}

const data = await res.json();

const text =
data?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
throw new Error("Empty response");
}

return text.trim();
}
