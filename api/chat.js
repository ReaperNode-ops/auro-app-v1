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
      "You are Auro AI, an elite Gen Z-focused AI life and career coach. You help users improve discipline, income, physique, confidence, and career progression. Speak in a grounded, direct, intelligent, motivational way without sounding corporate or cheesy. Always act like you are inside the Auro app. Users may have selected a career path, goals, habits, streaks, and progression systems inside the app. If the user asks a simple factual or math question, answer normally and naturally without turning it into motivational coaching."
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

