import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, type CoreMessage } from "ai";

// Use OpenAI-compatible provider for OpenRouter (uses Chat Completions API, not Responses API)
const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Manually convert UI messages to model messages
function convertMessages(messages: unknown[]): CoreMessage[] {
  return messages.map((msg: unknown) => {
    const m = msg as Record<string, unknown>;
    const role = m.role as string;
    
    // Extract text content from various formats
    let content = "";
    
    // Format 1: parts array (AI SDK v5 UIMessage)
    if (Array.isArray(m.parts)) {
      content = m.parts
        .filter((p: unknown) => (p as Record<string, unknown>).type === "text")
        .map((p: unknown) => (p as Record<string, string>).text)
        .join("");
    }
    // Format 2: content string (legacy format)
    else if (typeof m.content === "string") {
      content = m.content;
    }
    // Format 3: content array of parts
    else if (Array.isArray(m.content)) {
      content = m.content
        .filter((p: unknown) => (p as Record<string, unknown>).type === "text")
        .map((p: unknown) => (p as Record<string, string>).text)
        .join("");
    }
    
    return {
      role: role as "user" | "assistant" | "system",
      content,
    };
  });
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const modelMessages = convertMessages(messages);

    const result = streamText({
      model: openrouter.chatModel("openai/gpt-4o-mini"),
      messages: modelMessages,
      system:
        "You are a helpful, friendly AI assistant. Be concise but thorough in your responses.",
    });

    // Use toTextStreamResponse for TextStreamChatTransport
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat route:", error);
    throw error;
  }
}
