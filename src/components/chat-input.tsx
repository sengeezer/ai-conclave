"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-background px-4 py-4 md:px-6"
    >
      <div className="mx-auto flex max-w-3xl gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border bg-background px-4 py-3 pr-12 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-32 overflow-y-auto"
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || disabled}
            className="absolute bottom-2 right-2 h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
        Press Enter to send, Shift + Enter for new line
      </p>
    </form>
  );
}

