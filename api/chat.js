export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages array"
      });
    }

    // Build prompt
    const prompt = messages
      .map(m =>
        `${m.role === "user" ? "User" : "AI"}: ${
          m.content || m.text || ""
        }`
      )
      .join("\n") + "\nAI:";

    console.log("Prompt:", prompt);

    const response = await fetch(
  "https://router.huggingface.co/hf-inference/models/google/flan-t5-large",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 100
      }
    })
  }
);

    const data = await response.json();

    console.log("HF response:", data);

    // Handle HF errors
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "HF API failed",
        raw: data
      });
    }

    // HF usually returns array
    let output = "";

    if (Array.isArray(data)) {
      output = data[0]?.generated_text || "";
    } else {
      output = data.generated_text || "";
    }

    return res.status(200).json({
      response: output || "No response generated"
    });

  } catch (err) {
    console.error("API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Server error"
    });
  }
}
