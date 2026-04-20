// OpenRouter model from API
export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

// Simplified model info for UI display
export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  description?: string;
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
