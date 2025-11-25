import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage } from "ai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    system:
      "You are a helpful, friendly AI assistant. Be concise but thorough in your responses.",
  });

  return result.toUIMessageStreamResponse();
}
