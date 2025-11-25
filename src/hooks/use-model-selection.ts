"use client";

import { useState, useEffect, useCallback } from "react";
import type { ModelSelectionStore } from "@/types/chat";
import { AVAILABLE_MODELS } from "@/types/models";

const MODEL_SELECTION_KEY = "ai_chat_model_selection";
const DEFAULT_MODEL = "openai/gpt-5.1";

function getStoredSelection(): ModelSelectionStore {
  if (typeof window === "undefined") {
    return { selectedModels: [DEFAULT_MODEL] };
  }
  
  const stored = localStorage.getItem(MODEL_SELECTION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate that stored models still exist in available models
      const validModels = parsed.selectedModels.filter((id: string) =>
        AVAILABLE_MODELS.some((m) => m.id === id)
      );
      return { selectedModels: validModels.length > 0 ? validModels : [DEFAULT_MODEL] };
    } catch {
      return { selectedModels: [DEFAULT_MODEL] };
    }
  }
  return { selectedModels: [DEFAULT_MODEL] };
}

function saveSelection(store: ModelSelectionStore) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(MODEL_SELECTION_KEY, JSON.stringify(store));
}

export function useModelSelection() {
  const [selectedModels, setSelectedModels] = useState<string[]>([DEFAULT_MODEL]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getStoredSelection();
    setSelectedModels(stored.selectedModels);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (isLoaded) {
      saveSelection({ selectedModels });
    }
  }, [selectedModels, isLoaded]);

  const toggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        // Don't allow deselecting the last model
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((id) => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedModels(AVAILABLE_MODELS.map((m) => m.id));
  }, []);

  const clearAll = useCallback(() => {
    // Keep at least one model selected
    setSelectedModels([DEFAULT_MODEL]);
  }, []);

  const isModelSelected = useCallback(
    (modelId: string) => selectedModels.includes(modelId),
    [selectedModels]
  );

  const isVotingEnabled = selectedModels.length > 1;

  return {
    selectedModels,
    isLoaded,
    isVotingEnabled,
    toggleModel,
    selectAll,
    clearAll,
    isModelSelected,
  };
}

