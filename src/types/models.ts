// Available models for multi-model voting
export const AVAILABLE_MODELS = [
  // Google
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", provider: "Google" },
  
  // Anthropic
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-opus-4.1", name: "Claude Opus 4.1", provider: "Anthropic" },
  
  // OpenAI
  { id: "openai/gpt-5.1", name: "GPT-5.1", provider: "OpenAI" },
  { id: "openai/gpt-5.1-chat", name: "GPT-5.1 Chat", provider: "OpenAI" },
  { id: "openai/gpt-5.1-codex", name: "GPT-5.1 Codex", provider: "OpenAI" },
  
  // X-AI
  { id: "x-ai/grok-4.1-fast", name: "Grok 4.1 Fast", provider: "X-AI" },
  { id: "x-ai/grok-4.1-fast:free", name: "Grok 4.1 Fast (Free)", provider: "X-AI" },
  { id: "x-ai/grok-code-fast-1", name: "Grok Code Fast 1", provider: "X-AI" },
  { id: "x-ai/grok-4", name: "Grok 4", provider: "X-AI" },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
};

// Response from a single model
export type ModelResponse = {
  modelId: string;
  content: string;
  error?: string;
};

// Vote from a single model
export type Vote = {
  voterId: string; // The model that cast the vote
  firstChoice: string; // Model ID that got 2 points
  secondChoice: string; // Model ID that got 1 point
};

// Score for a model's response
export type ModelScore = {
  modelId: string;
  content: string;
  score: number;
  votesReceived: Vote[];
};

// Complete voting result
export type VotingResult = {
  responses: ModelResponse[];
  votes: Vote[];
  scores: ModelScore[];
  winnerId: string;
  winnerContent: string;
};

// Group models by provider for UI display
export function getModelsByProvider(): Record<string, ModelInfo[]> {
  const grouped: Record<string, ModelInfo[]> = {};
  
  for (const model of AVAILABLE_MODELS) {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push(model);
  }
  
  return grouped;
}

