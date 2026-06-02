export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    // Convert chat format → single prompt
    const prompt = messages
      .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n") + "\nAI:";

    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    const data = await response.json();

    // HF sometimes returns array OR error object
    if (!response.ok) {
      return res.status(500).json({
        error: data?.error || "HF API error",
        raw: data
      });
    }

    const output =
      Array.isArray(data) ? data[0]?.generated_text : data.generated_text;

    return res.status(200).json({
      response: output || "No response generated"
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
