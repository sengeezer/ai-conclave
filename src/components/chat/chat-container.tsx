"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useChat, UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { Sidebar } from "./sidebar";
import { useChatHistory } from "@/hooks/use-chat-history";
import type { StoredMessage } from "@/types/chat";

// Convert UIMessage to StoredMessage format for localStorage
function convertUIMessageToStored(uiMessage: UIMessage): StoredMessage {
  const textContent = uiMessage.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

  return {
    id: uiMessage.id,
    role: uiMessage.role as "user" | "assistant",
    content: textContent,
  };
}

// Convert StoredMessage to UIMessage format for useChat
function convertStoredToUIMessage(message: StoredMessage): UIMessage {
  return {
    id: message.id,
    role: message.role as "user" | "assistant",
    parts: [{ type: "text", text: message.content }],
  };
}

export function ChatContainer() {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    isLoaded,
    createConversation,
    setActiveConversation,
    updateConversationMessages,
    deleteConversation,
  } = useChatHistory();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    []
  );

  const initialMessages = useMemo(
    () => activeConversation?.messages.map(convertStoredToUIMessage) ?? [],
    [activeConversation?.id] // Only recalculate when conversation changes
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    id: activeConversationId || undefined,
    transport,
    messages: initialMessages,
  });

  // Sync messages from active conversation to useChat when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages.map(convertStoredToUIMessage));
    } else {
      setMessages([]);
    }
  }, [activeConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save messages back to localStorage when they change
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const convertedMessages = messages.map(convertUIMessageToStored);
      updateConversationMessages(activeConversationId, convertedMessages);
    }
  }, [messages, activeConversationId, updateConversationMessages]);

  const handleNewChat = useCallback(() => {
    createConversation();
  }, [createConversation]);

  const handleSubmit = useCallback(
    async (content: string) => {
      let conversationId = activeConversationId;

      // Create a new conversation if none is active
      if (!conversationId) {
        conversationId = createConversation();
      }

      sendMessage({ text: content });
    },
    [activeConversationId, createConversation, sendMessage]
  );

  // Convert UIMessages to StoredMessage format for display
  const displayMessages: StoredMessage[] = useMemo(
    () => messages.map(convertUIMessageToStored),
    [messages]
  );

  const isLoading = status === "streaming" || status === "submitted";

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-4 py-3 border-b md:hidden">
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={deleteConversation}
          />
          <h1 className="font-semibold truncate">
            {activeConversation?.title || "New Chat"}
          </h1>
        </header>

        <ChatMessages messages={displayMessages} isLoading={isLoading} />
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={stop}
        />
      </main>
    </div>
  );
}
