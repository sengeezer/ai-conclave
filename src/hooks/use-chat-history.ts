"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChatConversation, ChatStore, StoredMessage } from "@/types/chat";
import {
  getStoredChats,
  saveChats,
  createNewConversation,
  generateTitleFromMessage,
} from "@/lib/storage";

export function useChatHistory() {
  const [store, setStore] = useState<ChatStore>({
    conversations: [],
    activeConversationId: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getStoredChats();
    setStore(stored);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever store changes
  useEffect(() => {
    if (isLoaded) {
      saveChats(store);
    }
  }, [store, isLoaded]);

  const activeConversation = store.conversations.find(
    (c) => c.id === store.activeConversationId
  );

  const createConversation = useCallback(() => {
    const newConversation = createNewConversation();
    setStore((prev) => ({
      conversations: [newConversation, ...prev.conversations],
      activeConversationId: newConversation.id,
    }));
    return newConversation.id;
  }, []);

  const setActiveConversation = useCallback((id: string | null) => {
    setStore((prev) => ({
      ...prev,
      activeConversationId: id,
    }));
  }, []);

  const updateConversationMessages = useCallback(
    (conversationId: string, messages: StoredMessage[]) => {
      setStore((prev) => {
        const conversation = prev.conversations.find(
          (c) => c.id === conversationId
        );
        if (!conversation) return prev;

        const shouldUpdateTitle =
          conversation.title === "New Chat" &&
          messages.length > 0 &&
          messages[0].role === "user";

        const updatedConversation: ChatConversation = {
          ...conversation,
          messages,
          updatedAt: Date.now(),
          title: shouldUpdateTitle
            ? generateTitleFromMessage(messages[0].content)
            : conversation.title,
        };

        return {
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conversationId ? updatedConversation : c
          ),
        };
      });
    },
    []
  );

  const deleteConversation = useCallback((id: string) => {
    setStore((prev) => {
      const newConversations = prev.conversations.filter((c) => c.id !== id);
      const newActiveId =
        prev.activeConversationId === id
          ? newConversations[0]?.id || null
          : prev.activeConversationId;

      return {
        conversations: newConversations,
        activeConversationId: newActiveId,
      };
    });
  }, []);

  const clearAllConversations = useCallback(() => {
    setStore({
      conversations: [],
      activeConversationId: null,
    });
  }, []);

  return {
    conversations: store.conversations,
    activeConversation,
    activeConversationId: store.activeConversationId,
    isLoaded,
    createConversation,
    setActiveConversation,
    updateConversationMessages,
    deleteConversation,
    clearAllConversations,
  };
}
