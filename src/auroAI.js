export async function auroChat(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "AI request failed");
  }

  return data.response;
}
