import type { ChatConversation, ChatStore } from "@/types/chat";

const STORAGE_KEY = "ai-multichat-store";

export function getStoredChats(): ChatStore {
  if (typeof window === "undefined") {
    return { conversations: [], activeConversationId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load chat history:", error);
  }

  return { conversations: [], activeConversationId: null };
}

export function saveChats(store: ChatStore): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createNewConversation(id?: string): ChatConversation {
  const now = Date.now();
  return {
    id: id || generateId(),
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function generateTitleFromMessage(message: string): string {
  const cleaned = message.trim().slice(0, 50);
  return cleaned.length < message.trim().length ? `${cleaned}...` : cleaned;
}

