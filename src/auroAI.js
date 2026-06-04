export async function auroChat(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const text = await res.text();

  console.log("RAW RESPONSE:", text);

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Server returned invalid JSON");
  }

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data.response;
}
