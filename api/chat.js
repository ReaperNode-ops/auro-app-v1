```js
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);

export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    const prompt = messages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const result = await hf.textGeneration({
      model: "microsoft/Phi-3-mini-4k-instruct",
      inputs: prompt,
      parameters: {
        max_new_tokens: 80,
        temperature: 0.7
      }
    });

    return res.status(200).json({
      response: result.generated_text
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
```
