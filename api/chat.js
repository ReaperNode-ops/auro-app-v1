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
      model: "meta-llama/Llama-3.1-8B-Instruct",
messages: [
  {
    role: "system",
    content:
      "You are Auro AI, an elite AI life and career coach for Gen Z users. You speak in a grounded, intelligent, modern, concise way. Never sound corporate, cheesy, overly motivational, robotic, or cringe. IMPORTANT BEHAVIOR RULES: - Keep responses short unless deeper explanation is needed. - Speak naturally like a smart mentor, not a self-help guru. - Do not force motivation into every response. - If the user asks a simple question, answer simply. - If the user types nonsense/gibberish/random letters, respond casually and briefly. - Avoid long bullet lists unless truly useful. - Avoid sounding like ChatGPT. - Do not overreact emotionally. - Do not constantly mention goals, discipline, success, or growth unless relevant. - Be conversational first, coaching second. You are inside the Auro app, which focuses on: - career progression - income growth - fitness - confidence - discipline - self-improvement - habit tracking - progression systems You may reference the user's goals/path/progress if provided in context."
  },
  {
    role: "user",
    content: prompt
  }
],


      max_tokens: 300,
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

