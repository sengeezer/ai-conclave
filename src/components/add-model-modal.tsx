"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { ModelInfo, getProviderFromId, OpenRouterModel } from "@/types/models";

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingModelIds: string[];
  onAddModel: (model: ModelInfo) => void;
}

export function AddModelModal({
  isOpen,
  onClose,
  existingModelIds,
  onAddModel,
}: AddModelModalProps) {
  const [modelId, setModelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setModelId("");
    setError(null);
    onClose();
  };

  const handleAdd = async () => {
    const trimmedId = modelId.trim();
    
    if (!trimmedId) {
      setError("Please enter a model ID");
      return;
    }

    // Check if model already exists in the pool
    if (existingModelIds.includes(trimmedId)) {
      setError("This model is already in your pool");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/models");
      if (!response.ok) throw new Error("Failed to fetch models");
      
      const data = await response.json();
      const foundModel = data.models.find(
        (m: OpenRouterModel) => m.id.toLowerCase() === trimmedId.toLowerCase()
      );

      if (!foundModel) {
        setError("Model not found. Check the ID on OpenRouter.");
        setIsLoading(false);
        return;
      }

      const modelInfo: ModelInfo = {
        id: foundModel.id,
        name: foundModel.name,
        provider: getProviderFromId(foundModel.id),
        description: foundModel.description,
      };

      onAddModel(modelInfo);
      handleClose();
    } catch (err) {
      setError("Failed to validate model. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleAdd();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Model</DialogTitle>
          <DialogDescription>
            Enter an OpenRouter model ID to add it to your pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="e.g., openai/gpt-4o or anthropic/claude-3.5-sonnet"
              value={modelId}
              onChange={(e) => {
                setModelId(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Find model IDs at</span>
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              OpenRouter Models
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isLoading || !modelId.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Add Model"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
