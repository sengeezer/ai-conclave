import { Chat, Message } from "@/types/chat";

const STORAGE_KEY = "ai-chat-history";

export function getChats(): Chat[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const chats = JSON.parse(stored);
    // Convert date strings back to Date objects
    return chats.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })),
    }));
  } catch (error) {
    console.error("Error loading chats:", error);
    return [];
  }
}

export function saveChats(chats: Chat[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Error saving chats:", error);
  }
}

export function createChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateChat(chatId: string, updates: Partial<Chat>): void {
  const chats = getChats();
  const index = chats.findIndex((c) => c.id === chatId);
  
  if (index !== -1) {
    chats[index] = {
      ...chats[index],
      ...updates,
      updatedAt: new Date(),
    };
    saveChats(chats);
  }
}

export function deleteChat(chatId: string): void {
  const chats = getChats();
  const filtered = chats.filter((c) => c.id !== chatId);
  saveChats(filtered);
}

export function addMessageToChat(chatId: string, message: Message): void {
  const chats = getChats();
  const chat = chats.find((c) => c.id === chatId);
  
  if (chat) {
    chat.messages.push(message);
    chat.updatedAt = new Date();
    
    // Auto-generate title from first user message
    if (chat.messages.length === 1 && message.role === "user") {
      chat.title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
    }
    
    saveChats(chats);
  }
}

