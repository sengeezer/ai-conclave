import type { VotingResult, ModelInfo } from "./models";

// Simple message type for localStorage storage
export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  votingResult?: VotingResult; // Only present for multi-model responses
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatStore {
  conversations: ChatConversation[];
  activeConversationId: string | null;
}

// Separate store for model selection (to keep it independent of chat history)
export interface ModelSelectionStore {
  selectedModels: string[];
  // Cache model info so we can display names without re-fetching
  knownModels?: ModelInfo[];
}
