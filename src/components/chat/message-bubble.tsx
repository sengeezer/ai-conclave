"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, User, Vote, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { StoredMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: StoredMessage;
  onViewVotingResults?: () => void;
}

function getModelName(modelId: string): string {
  // Fallback: extract name from ID (e.g. "openai/gpt-4" -> "GPT-4")
  const parts = modelId.split("/");
  if (parts.length > 1) {
    return parts[1]
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return modelId;
}

export function MessageBubble({ message, onViewVotingResults }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasVotingResults = !isUser && message.votingResult;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-6 transition-colors",
        isUser ? "bg-transparent" : "bg-muted/30"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-emerald-600 text-white"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{isUser ? "You" : "Assistant"}</p>
          {hasVotingResults && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1.5 text-xs"
              onClick={onViewVotingResults}
            >
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="hidden sm:inline">Winner:</span>
              <Badge variant="secondary" className="h-5 text-xs px-1.5">
                {getModelName(message.votingResult!.winnerId)}
              </Badge>
              <Vote className="h-3 w-3 ml-1" />
              <span>{message.votingResult!.scores.length} models</span>
            </Button>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                pre: ({ children }) => (
                  <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code
                      className="rounded bg-zinc-800 dark:bg-zinc-700 px-1.5 py-0.5 text-sm font-mono text-zinc-100"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code className={cn(className, "text-zinc-100")} {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="text-foreground">{children}</p>
                ),
                li: ({ children }) => (
                  <li className="text-foreground">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-foreground">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-foreground">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-foreground">{children}</h3>
                ),
                strong: ({ children }) => (
                  <strong className="text-foreground font-semibold">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-primary hover:underline">{children}</a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
