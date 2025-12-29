import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

export async function askAI({ transcript, question }) {
  const response = await client.chat.completions.create({
    model: "meta-llama/llama-3.2-3b-instruct",
    messages: [
      {
        role: "system",
        content: `
        You are an intelligent assistant helping a user understand a video.
        Use the transcript as your primary source.
        If the transcript does not contain enough information,
        you may infer logically but do not hallucinate.
        Do not mention the transcript itself use the video instead.
        `.trim()
      },
      {
        role: "user",
        content: `Transcript:\n${transcript}\n\nQuestion:\n${question}`
      }
    ],
    temperature: 0.3,
    max_tokens: 600
  });

  return response.choices[0].message.content;
}
