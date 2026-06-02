export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: req.body.message,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    res.status(200).json({
      reply: data?.[0]?.generated_text || "No response",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
