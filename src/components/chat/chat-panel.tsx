"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ai-multichat-history";

export function ChatPanel() {
  const { messages, sendMessage, status, error, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [],
  });
  const [draft, setDraft] = useState("");

  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || typeof window === "undefined") {
      return;
    }

    const storedHistory = window.localStorage.getItem(STORAGE_KEY);
    if (storedHistory) {
      try {
        const parsed: UIMessage[] = JSON.parse(storedHistory);
        setMessages(parsed);
      } catch (historyError) {
        console.warn("Failed to parse stored chat history", historyError);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    hydrated.current = true;
  }, [setMessages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!error) {
      return;
    }

    console.error(error);
  }, [error]);

  const isStreaming = status === "submitted" || status === "streaming";

  const statusText = useMemo(() => {
    if (error) {
      return "Something went wrong. Try sending your message again.";
    }

    if (isStreaming) {
      return "Thinking with OpenRouter...";
    }

    if (messages.length === 0) {
      return "Start the conversation by asking anything.";
    }

    return "You are chatting locally. History stays in your browser.";
  }, [error, isStreaming, messages.length]);

  const trimmedDraft = draft.trim();
  const disabled = isStreaming || trimmedDraft.length === 0;

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = draft.trim();
      if (!text) {
        return;
      }
      await sendMessage({ text });
      setDraft("");
    },
    [draft, sendMessage],
  );

  const handleClearHistory = () => {
    setMessages([]);
    setDraft("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  };

  return (
    <section className="flex h-full w-full flex-col gap-4 rounded-3xl border bg-card/80 p-6 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Copilot</h2>
          <p className="text-sm text-muted-foreground">Powered by Vercel AI SDK + OpenRouter</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          disabled={messages.length === 0}
        >
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 rounded-2xl border bg-background/80 p-4">
        <div className="flex flex-col gap-5">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>
                This chat never leaves your browser. Ask product questions, draft ideas, or
                brainstorm plans.
              </p>
            </div>
          ) : (
            messages.map((message) => <ChatBubble key={message.id} message={message} />)
          )}
        </div>
      </ScrollArea>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Textarea
          value={draft}
          onChange={handleInputChange}
          placeholder="Type your message and press Send..."
          aria-label="Message"
          minLength={1}
          rows={4}
        />
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{statusText}</span>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={disabled}>
              {isStreaming ? "Thinking..." : "Send"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm font-medium text-destructive">
            {error.message ?? "Unable to reach the model. Please try again."}
          </p>
        )}
      </form>
    </section>
  );
}

function ChatBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text =
    message.parts
      ?.map((part) => {
        if ("text" in part && typeof part.text === "string") {
          return part.text;
        }

        if ("toolName" in part && typeof part.toolName === "string") {
          return `[${part.type}: ${part.toolName}]`;
        }

        if ("url" in part && typeof part.url === "string") {
          return `[${part.type}: ${part.url}]`;
        }

        if ("title" in part && typeof part.title === "string") {
          return `[${part.type}: ${part.title}]`;
        }

        return `[${"type" in part ? part.type : "content"}]`;
      })
      .filter(Boolean)
      .join("\n\n") ?? "";

  return (
    <div className={cn("flex flex-col gap-1 text-sm leading-relaxed", isUser && "items-end")}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {isUser ? "You" : "AI"}
      </span>
      <div
        className={cn(
          "max-w-full rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground ring-1 ring-border",
        )}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

