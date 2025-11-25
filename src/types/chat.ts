// Simple message type for localStorage storage
export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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
