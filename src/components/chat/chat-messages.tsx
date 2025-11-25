"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { VotingResultsModal } from "@/components/voting-results-modal";
import { Loader2, MessageSquare, Vote } from "lucide-react";
import type { StoredMessage } from "@/types/chat";
import type { VotingResult } from "@/types/models";

interface ChatMessagesProps {
  messages: StoredMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedVotingResult, setSelectedVotingResult] = useState<VotingResult | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Start a conversation
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Send a message to begin chatting with the AI assistant. Your
              conversations are stored locally.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Vote className="h-4 w-4" />
            <span>Select multiple models for AI voting</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onViewVotingResults={
                message.votingResult
                  ? () => setSelectedVotingResult(message.votingResult!)
                  : undefined
              }
            />
          ))}
          {isLoading && (
            <div className="flex gap-3 px-4 py-6 bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Assistant</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Querying models and collecting votes...
                </p>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Voting Results Modal */}
      {selectedVotingResult && (
        <VotingResultsModal
          isOpen={true}
          onClose={() => setSelectedVotingResult(null)}
          votingResult={selectedVotingResult}
        />
      )}
    </>
  );
}
