const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

async function askAIService({ transcript, question, history }) {
  const safeHistory = Array.isArray(history) ? history.slice(-8) : [];

  const messages = [
    {
      role: "system",
      content: `
You are an AI tutor helping students understand a video.
Use the transcript as reference, but you may use general knowledge.
If transcript is incomplete, answer cautiously.
Do not hallucinate facts.Do not explicitely mention word transcript you may use video but not transcript.
      `.trim()
    },
    ...safeHistory,
    {
      role: "user",
      content: `
Transcript:
${transcript || "(Transcript still processing)"}

Question:
${question}
      `.trim()
    }
  ];

  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL || "mistralai/mistral-7b-instruct:free",
    messages,
    temperature: 0.3,
    max_tokens: 500
  });

  return completion.choices[0].message.content;
}

module.exports = { askAIService };
