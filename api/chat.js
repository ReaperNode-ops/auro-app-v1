
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);

export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    const prompt = messages
      .map((m) => m.role + ": " + m.content)
      .join("\n");

    console.log("PROMPT:", prompt);

    const result = await hf.chatCompletion({
      model: "microsoft/Phi-3-mini-4k-instruct",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 80,
      temperature: 0.7
    });

    console.log("HF RESULT:", result);

    return res.status(200).json({
      response:
        result.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("FULL ERROR:", err);

    return res.status(500).json({
      error: err.message || "Server error"
    });
  }
}
