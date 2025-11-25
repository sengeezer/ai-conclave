import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, type CoreMessage } from "ai";
import type { ModelResponse, Vote, ModelScore, VotingResult } from "@/types/models";

// Use OpenAI-compatible provider for OpenRouter
const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Convert UI messages to model messages
function convertMessages(messages: unknown[]): CoreMessage[] {
  return messages.map((msg: unknown) => {
    const m = msg as Record<string, unknown>;
    const role = m.role as string;

    let content = "";

    if (Array.isArray(m.parts)) {
      content = m.parts
        .filter((p: unknown) => (p as Record<string, unknown>).type === "text")
        .map((p: unknown) => (p as Record<string, string>).text)
        .join("");
    } else if (typeof m.content === "string") {
      content = m.content;
    } else if (Array.isArray(m.content)) {
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

// Get the last user message for voting context
function getLastUserMessage(messages: CoreMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i].content as string;
    }
  }
  return "";
}

// Query a single model for a response
async function queryModel(
  modelId: string,
  messages: CoreMessage[]
): Promise<ModelResponse> {
  try {
    const result = await generateText({
      model: openrouter.chatModel(modelId),
      messages,
      system:
        "You are a helpful, friendly AI assistant. Be concise but thorough in your responses.",
    });

    return {
      modelId,
      content: result.text,
    };
  } catch (error) {
    console.error(`Error querying model ${modelId}:`, error);
    return {
      modelId,
      content: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Generate voting prompt for a model
function createVotingPrompt(
  originalPrompt: string,
  responses: ModelResponse[],
  voterModelId: string
): string {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const otherResponses = responses.filter((r) => r.modelId !== voterModelId && !r.error);

  if (otherResponses.length < 2) {
    // Not enough responses to vote on
    return "";
  }

  let prompt = `You are judging AI responses to this user prompt: "${originalPrompt}"\n\n`;
  prompt += "Here are the responses (labeled with letters):\n\n";

  otherResponses.forEach((response, index) => {
    prompt += `${labels[index]}: ${response.content}\n\n`;
  });

  prompt += `Vote for the TWO best responses. You must pick exactly two different options.\n`;
  prompt += `Output ONLY in this exact format (nothing else):\n`;
  prompt += `1st: [letter]\n`;
  prompt += `2nd: [letter]`;

  return prompt;
}

// Parse voting response to extract choices
function parseVotingResponse(
  response: string,
  responses: ModelResponse[],
  voterModelId: string
): { first: string | null; second: string | null } {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const otherResponses = responses.filter((r) => r.modelId !== voterModelId && !r.error);

  // Create mapping from letter to model ID
  const letterToModelId: Record<string, string> = {};
  otherResponses.forEach((r, index) => {
    letterToModelId[labels[index]] = r.modelId;
  });

  // Parse the response
  const firstMatch = response.match(/1st:\s*([A-Z])/i);
  const secondMatch = response.match(/2nd:\s*([A-Z])/i);

  const firstLetter = firstMatch?.[1]?.toUpperCase();
  const secondLetter = secondMatch?.[1]?.toUpperCase();

  return {
    first: firstLetter ? letterToModelId[firstLetter] || null : null,
    second: secondLetter ? letterToModelId[secondLetter] || null : null,
  };
}

// Have a model vote on responses
async function getModelVote(
  voterModelId: string,
  originalPrompt: string,
  responses: ModelResponse[]
): Promise<Vote | null> {
  const votingPrompt = createVotingPrompt(originalPrompt, responses, voterModelId);

  if (!votingPrompt) {
    return null; // Not enough responses to vote on
  }

  try {
    const result = await generateText({
      model: openrouter.chatModel(voterModelId),
      messages: [{ role: "user", content: votingPrompt }],
    });

    const parsed = parseVotingResponse(result.text, responses, voterModelId);

    if (parsed.first && parsed.second && parsed.first !== parsed.second) {
      return {
        voterId: voterModelId,
        firstChoice: parsed.first,
        secondChoice: parsed.second,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting vote from ${voterModelId}:`, error);
    return null;
  }
}

// Calculate scores from votes
function calculateScores(
  responses: ModelResponse[],
  votes: Vote[]
): ModelScore[] {
  const scores: Record<string, ModelScore> = {};

  // Initialize scores for all responses
  for (const response of responses) {
    if (!response.error) {
      scores[response.modelId] = {
        modelId: response.modelId,
        content: response.content,
        score: 0,
        votesReceived: [],
      };
    }
  }

  // Tally votes
  for (const vote of votes) {
    if (scores[vote.firstChoice]) {
      scores[vote.firstChoice].score += 2;
      scores[vote.firstChoice].votesReceived.push(vote);
    }
    if (scores[vote.secondChoice]) {
      scores[vote.secondChoice].score += 1;
      scores[vote.secondChoice].votesReceived.push(vote);
    }
  }

  // Sort by score descending
  return Object.values(scores).sort((a, b) => b.score - a.score);
}

export async function POST(req: Request) {
  try {
    const { messages, models } = await req.json();

    if (!models || models.length === 0) {
      return Response.json({ error: "No models specified" }, { status: 400 });
    }

    const modelMessages = convertMessages(messages);
    const lastUserMessage = getLastUserMessage(modelMessages);

    // Single model - no voting, just return the response
    if (models.length === 1) {
      const response = await queryModel(models[0], modelMessages);
      
      if (response.error) {
        return Response.json({ error: response.error }, { status: 500 });
      }

      const result: VotingResult = {
        responses: [response],
        votes: [],
        scores: [{
          modelId: response.modelId,
          content: response.content,
          score: 0,
          votesReceived: [],
        }],
        winnerId: response.modelId,
        winnerContent: response.content,
      };

      return Response.json(result);
    }

    // Multiple models - query all in parallel
    console.log(`Querying ${models.length} models in parallel...`);
    const responses = await Promise.all(
      models.map((modelId: string) => queryModel(modelId, modelMessages))
    );

    // Filter out failed responses
    const successfulResponses = responses.filter((r) => !r.error);

    if (successfulResponses.length === 0) {
      return Response.json(
        { error: "All models failed to respond" },
        { status: 500 }
      );
    }

    // If only one successful response, no voting needed
    if (successfulResponses.length === 1) {
      const result: VotingResult = {
        responses,
        votes: [],
        scores: [{
          modelId: successfulResponses[0].modelId,
          content: successfulResponses[0].content,
          score: 0,
          votesReceived: [],
        }],
        winnerId: successfulResponses[0].modelId,
        winnerContent: successfulResponses[0].content,
      };

      return Response.json(result);
    }

    // Voting phase - each model votes on others
    console.log("Starting voting phase...");
    const votePromises = successfulResponses.map((response) =>
      getModelVote(response.modelId, lastUserMessage, successfulResponses)
    );

    const voteResults = await Promise.all(votePromises);
    const votes = voteResults.filter((v): v is Vote => v !== null);

    // Calculate scores
    const scores = calculateScores(successfulResponses, votes);

    // Winner is the first in sorted scores (highest score)
    // In case of tie, first to reach that score wins (order preserved)
    const winner = scores[0];

    const result: VotingResult = {
      responses,
      votes,
      scores,
      winnerId: winner.modelId,
      winnerContent: winner.content,
    };

    console.log(`Voting complete. Winner: ${winner.modelId} with ${winner.score} points`);

    return Response.json(result);
  } catch (error) {
    console.error("Error in multi-model chat:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

