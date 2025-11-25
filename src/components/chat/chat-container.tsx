"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
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

// Inner component that uses the chat hook - remounts when conversation changes
function ChatInstance({
  conversationId,
  initialMessages,
  pendingMessage,
  onMessagesChange,
  onPendingSent,
  onError,
}: {
  conversationId: string;
  initialMessages?: UIMessage[];
  pendingMessage?: string | null;
  onMessagesChange: (messages: UIMessage[]) => void;
  onPendingSent?: () => void;
  onError?: (error: Error) => void;
}) {
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
  } = useChat({
    id: conversationId,
    transport,
    messages: initialMessages,
    onError: (err) => {
      console.error("useChat error:", err);
      onError?.(err);
    },
  });

  // Send pending message on mount
  const hasSentPending = useRef(false);
  useEffect(() => {
    if (pendingMessage && !hasSentPending.current) {
      hasSentPending.current = true;
      console.log("Sending pending message:", pendingMessage);
      sendMessage({ text: pendingMessage });
      onPendingSent?.();
    }
  }, [pendingMessage, sendMessage, onPendingSent]);

  // Save messages when status becomes ready
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "ready" && status === "ready" && messages.length > 0) {
      onMessagesChange(messages);
    }
    prevStatusRef.current = status;
  }, [status, messages, onMessagesChange]);

  // Debug logging
  useEffect(() => {
    console.log("useChat state:", { status, error: error?.message, messageCount: messages.length, conversationId });
  }, [status, error, messages.length, conversationId]);

  const displayMessages = useMemo(
    () => messages.map(convertUIMessageToStored),
    [messages]
  );

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    (content: string) => {
      console.log("Sending message:", content);
      sendMessage({ text: content });
    },
    [sendMessage]
  );

  return (
    <>
      <ChatMessages messages={displayMessages} isLoading={isLoading} />
      {error && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          Error: {error.message}
        </div>
      )}
      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
      />
    </>
  );
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

  // Track pending message to send after conversation is created
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleNewChat = useCallback(() => {
    setPendingMessage(null);
    createConversation();
  }, [createConversation]);

  const handleMessagesChange = useCallback(
    (messages: UIMessage[]) => {
      if (activeConversationId) {
        const converted = messages.map(convertUIMessageToStored);
        updateConversationMessages(activeConversationId, converted);
      }
    },
    [activeConversationId, updateConversationMessages]
  );

  // Get initial messages for the current conversation
  const initialMessages = useMemo(() => {
    if (activeConversation && activeConversation.messages.length > 0) {
      return activeConversation.messages.map(convertStoredToUIMessage);
    }
    return undefined;
  }, [activeConversation]);

  const handleSubmit = useCallback(
    (content: string) => {
      if (!activeConversationId) {
        // Store message and create conversation
        setPendingMessage(content);
        createConversation();
      }
      // If conversation exists, ChatInstance handles it
    },
    [activeConversationId, createConversation]
  );


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

        {activeConversationId ? (
          <ChatInstance
            key={activeConversationId}
            conversationId={activeConversationId}
            initialMessages={initialMessages}
            pendingMessage={pendingMessage}
            onMessagesChange={handleMessagesChange}
            onPendingSent={() => setPendingMessage(null)}
          />
        ) : (
          <>
            <ChatMessages messages={[]} isLoading={false} />
            <ChatInput
              onSubmit={handleSubmit}
              isLoading={false}
              onStop={() => {}}
            />
          </>
        )}
      </main>
    </div>
  );
}
