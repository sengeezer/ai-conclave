"use client";

import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-6 md:px-6",
        isUser ? "bg-background" : "bg-muted/50"
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="mb-2 ml-4 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 ml-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              code: ({ className, children }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                    {children}
                  </code>
                ) : (
                  <code className="block rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

