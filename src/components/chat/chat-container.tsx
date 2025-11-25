"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { Sidebar } from "./sidebar";
import { ModelSelector } from "@/components/model-selector";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useModelSelection } from "@/hooks/use-model-selection";
import type { StoredMessage } from "@/types/chat";
import type { VotingResult } from "@/types/models";

// Convert UIMessage to StoredMessage format for localStorage
function convertUIMessageToStored(uiMessage: UIMessage, votingResult?: VotingResult): StoredMessage {
  const textContent = uiMessage.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

  return {
    id: uiMessage.id,
    role: uiMessage.role as "user" | "assistant",
    content: textContent,
    votingResult,
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

// Single model chat instance using streaming
function SingleModelChatInstance({
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
  onMessagesChange: (messages: StoredMessage[]) => void;
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
      onMessagesChange(messages.map((m) => convertUIMessageToStored(m)));
    }
    prevStatusRef.current = status;
  }, [status, messages, onMessagesChange]);

  const displayMessages = useMemo(
    () => messages.map((m) => convertUIMessageToStored(m)),
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

// Multi-model chat instance with voting
function MultiModelChatInstance({
  conversationId,
  initialStoredMessages,
  pendingMessage,
  selectedModels,
  onMessagesChange,
  onPendingSent,
}: {
  conversationId: string;
  initialStoredMessages: StoredMessage[];
  pendingMessage?: string | null;
  selectedModels: string[];
  onMessagesChange: (messages: StoredMessage[]) => void;
  onPendingSent?: () => void;
}) {
  const [messages, setMessages] = useState<StoredMessage[]>(initialStoredMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Send pending message on mount
  const hasSentPending = useRef(false);
  useEffect(() => {
    if (pendingMessage && !hasSentPending.current) {
      hasSentPending.current = true;
      handleSubmit(pendingMessage);
      onPendingSent?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage]);

  const handleSubmit = useCallback(
    async (content: string) => {
      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMessage: StoredMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Prepare messages for API
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat/multi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            models: selectedModels,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const result: VotingResult = await response.json();

        // Add assistant message with voting result
        const assistantMessage: StoredMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.winnerContent,
          votingResult: result,
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        onMessagesChange(finalMessages);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled
          return;
        }
        console.error("Multi-model chat error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, selectedModels, onMessagesChange]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return (
    <>
      <ChatMessages messages={messages} isLoading={isLoading} />
      {error && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          Error: {error}
        </div>
      )}
      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={handleStop}
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

  const {
    selectedModels,
    isLoaded: modelsLoaded,
    isVotingEnabled,
    toggleModel,
    selectAll,
    clearAll,
  } = useModelSelection();

  // Track pending message to send after conversation is created
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleNewChat = useCallback(() => {
    setPendingMessage(null);
    createConversation();
  }, [createConversation]);

  const handleMessagesChange = useCallback(
    (messages: StoredMessage[]) => {
      if (activeConversationId) {
        updateConversationMessages(activeConversationId, messages);
      }
    },
    [activeConversationId, updateConversationMessages]
  );

  // Get initial messages for the current conversation (as UIMessage for single-model)
  const initialUIMessages = useMemo(() => {
    if (activeConversation && activeConversation.messages.length > 0) {
      return activeConversation.messages.map(convertStoredToUIMessage);
    }
    return undefined;
  }, [activeConversation]);

  // Get initial messages as StoredMessage for multi-model
  const initialStoredMessages = useMemo(() => {
    return activeConversation?.messages || [];
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

  if (!isLoaded || !modelsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar - chat history (desktop only) */}
      <Sidebar
        variant="desktop"
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile/Tablet header - shows below lg breakpoint (< 1024px) */}
        <header className="flex items-center gap-2 px-4 py-3 border-b lg:hidden">
          {/* Left: Chat history sidebar trigger (only shows below md/768px) */}
          <div className="md:hidden">
            <Sidebar
              variant="mobile"
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversation}
              onNewChat={handleNewChat}
              onDeleteConversation={deleteConversation}
            />
          </div>
          
          {/* Center: Title */}
          <h1 className="flex-1 font-semibold truncate">
            {activeConversation?.title || "New Chat"}
          </h1>
          
          {/* Right: Model selector trigger (shows when right sidebar hidden) */}
          <ModelSelector
            variant="mobile"
            selectedModels={selectedModels}
            isVotingEnabled={isVotingEnabled}
            onToggleModel={toggleModel}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />
        </header>

        {activeConversationId ? (
          isVotingEnabled ? (
            <MultiModelChatInstance
              key={`multi-${activeConversationId}`}
              conversationId={activeConversationId}
              initialStoredMessages={initialStoredMessages}
              pendingMessage={pendingMessage}
              selectedModels={selectedModels}
              onMessagesChange={handleMessagesChange}
              onPendingSent={() => setPendingMessage(null)}
            />
          ) : (
            <SingleModelChatInstance
              key={`single-${activeConversationId}`}
              conversationId={activeConversationId}
              initialMessages={initialUIMessages}
              pendingMessage={pendingMessage}
              onMessagesChange={handleMessagesChange}
              onPendingSent={() => setPendingMessage(null)}
            />
          )
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

      {/* Right sidebar - model selection (desktop only) */}
      <ModelSelector
        variant="desktop"
        selectedModels={selectedModels}
        isVotingEnabled={isVotingEnabled}
        onToggleModel={toggleModel}
        onSelectAll={selectAll}
        onClearAll={clearAll}
      />
    </div>
  );
}
