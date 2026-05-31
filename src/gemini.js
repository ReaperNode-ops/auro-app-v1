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

export async function geminiChat(userMessage, history = [], userContext = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError("Missing API key", "missing_api_key");
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new GeminiError(
      err?.error?.message || `HTTP ${res.status}`,
      res.status
    );
  }

  const data = await res.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new GeminiError("Empty response", "empty_response");
  }

  return text.trim();
}
