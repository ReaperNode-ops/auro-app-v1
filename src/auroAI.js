export async function auroChat(messages) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();

    console.log("API response:", data);

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data.response;

  } catch (err) {
    console.error("Auro AI Error:", err);
    throw err;
  }
}
