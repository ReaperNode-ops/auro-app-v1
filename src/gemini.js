const MODEL = "gemini-2.0-flash";

const API_URL =
`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class GeminiError extends Error {
constructor(message, code = "unknown") {
super(message);
this.name = "GeminiError";
this.code = code;
}
}

function buildSystemPrompt(userContext = {}) {
return `You are Auro AI Coach. Be direct, practical, and concise.`;
}

export async function geminiChat(
userMessage,
history = [],
userContext = {}
) {
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
throw new GeminiError(
"Missing API key",
"missing_api_key"
);
}

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

const res = await fetch(`${API_URL}?key=${apiKey}`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(body),
});

if (!res.ok) {
const err = await res.json().catch(() => ({}));

```
throw new GeminiError(
  err?.error?.message || `HTTP ${res.status}`,
  res.status
);
```

}

const data = await res.json();

const text =
data?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
throw new GeminiError(
"Empty response",
"empty_response"
);
}

return text.trim();
}

const STORAGE_KEY_PREFIX = "auro_chat_usage_";

function todayKey(uid) {
const d = new Date();

const dateStr =
`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

return `${STORAGE_KEY_PREFIX}${uid ?? "anon"}_${dateStr}`;
}

export function getDailyUsage(uid) {
try {
const raw = localStorage.getItem(todayKey(uid));

```
return raw ? parseInt(raw, 10) : 0;
```

} catch {
return 0;
}
}

export function incrementDailyUsage(uid) {
try {
const key = todayKey(uid);

```
const current = getDailyUsage(uid);

localStorage.setItem(
  key,
  String(current + 1)
);

return current + 1;
```

} catch {
return 0;
}
}

export function clearDailyUsage(uid) {
try {
localStorage.removeItem(todayKey(uid));
} catch {}
}
