"use client";

import { useState, useEffect, useCallback } from "react";
import type { ModelSelectionStore } from "@/types/chat";
import { ModelInfo, OpenRouterModel, getProviderFromId, AVAILABLE_MODELS } from "@/types/models";

const MODEL_SELECTION_KEY = "ai_chat_model_selection";
// Use the predefined available models as the pool
const DEFAULT_MODELS: ModelInfo[] = AVAILABLE_MODELS;
// Only these 3 models are selected by default for chatting
const DEFAULT_SELECTED_IDS: string[] = [
  "openai/gpt-5.1",
  "google/gemini-2.5-pro",
  "anthropic/claude-sonnet-4.5",
];

function getStoredSelection(): ModelSelectionStore {
  if (typeof window === "undefined") {
    return { selectedModels: DEFAULT_SELECTED_IDS, knownModels: DEFAULT_MODELS };
  }
  
  const stored = localStorage.getItem(MODEL_SELECTION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Migration: If knownModels missing, use defaults or empty
      if (!parsed.knownModels) {
        return { 
          selectedModels: parsed.selectedModels || DEFAULT_SELECTED_IDS,
          knownModels: DEFAULT_MODELS 
        };
      }
      return parsed;
    } catch {
      return { selectedModels: DEFAULT_SELECTED_IDS, knownModels: DEFAULT_MODELS };
    }
  }
  return { selectedModels: DEFAULT_SELECTED_IDS, knownModels: DEFAULT_MODELS };
}

function saveSelection(store: ModelSelectionStore) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(MODEL_SELECTION_KEY, JSON.stringify(store));
}

export function useModelSelection() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [knownModels, setKnownModels] = useState<ModelInfo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getStoredSelection();
    setSelectedModels(stored.selectedModels);
    setKnownModels(stored.knownModels || []);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (isLoaded) {
      saveSelection({ selectedModels, knownModels });
    }
  }, [selectedModels, knownModels, isLoaded]);

  // Fetch full model list to update knownModels with latest details (names, etc)
  useEffect(() => {
    if (!isLoaded) return;

    const updateModels = async () => {
      try {
        const response = await fetch("/api/models");
        if (response.ok) {
          const data = await response.json();
          const apiModels: OpenRouterModel[] = data.models;
          
          setKnownModels(prev => {
            const updated = [...prev];
            let changed = false;
            
            // Update existing known models with latest info from API
            updated.forEach((known, index) => {
              const found = apiModels.find(m => m.id === known.id);
              if (found) {
                if (found.name !== known.name || found.description !== known.description) {
                  updated[index] = {
                    ...known,
                    name: found.name,
                    provider: getProviderFromId(found.id),
                    description: found.description
                  };
                  changed = true;
                }
              }
            });

            // Restore any selected models that might be missing from knownModels (migration)
            selectedModels.forEach(selectedId => {
              if (!updated.some(k => k.id === selectedId)) {
                const found = apiModels.find(m => m.id === selectedId);
                if (found) {
                  updated.push({
                    id: found.id,
                    name: found.name,
                    provider: getProviderFromId(found.id),
                    description: found.description
                  });
                  changed = true;
                }
              }
            });
            
            return changed ? updated : prev;
          });
        }
      } catch (err) {
        console.error("Failed to update model info", err);
      }
    };

    // Debounce/delay update to avoid contention on mount
    const timer = setTimeout(updateModels, 1000);
    return () => clearTimeout(timer);
  }, [isLoaded, selectedModels]); // Added selectedModels dependency to ensure we capture latest selection during migration check

  const toggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      // Don't allow deselecting the last model
      if (prev.includes(modelId) && prev.length === 1) {
        return prev;
      }
      
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    // Select all KNOWN models in the pool
    setSelectedModels(knownModels.map((m) => m.id));
  }, [knownModels]);

  const clearAll = useCallback(() => {
    // Keep at least one model selected (the first one in the pool)
    if (knownModels.length > 0) {
      setSelectedModels([knownModels[0].id]);
    }
  }, [knownModels]);

  const updateModelPool = useCallback((newSelectionIds: string[]) => {
    // This is called when the modal saves
    // We need to ensure we have the info for these models.
    // However, the modal usually just gives us IDs? 
    // Wait, the modal has the info. Ideally the modal passes the full info.
    // But if we only get IDs, we rely on the API fetch or what we have.
    
    // For now, assume the caller (ModelSelector) will handle fetching info or 
    // we assume they are already in knownModels if we are just toggling.
    // But for ADDING new models from modal, we need their info.
    
    // Let's change the signature to accept ModelInfo[] for adding
  }, []);

  const addModelsToPool = useCallback((modelsToAdd: ModelInfo[]) => {
    setKnownModels(prev => {
      const newModels = [...prev];
      modelsToAdd.forEach(m => {
        if (!newModels.some(existing => existing.id === m.id)) {
          newModels.push(m);
        }
      });
      return newModels;
    });
    
    // Auto-select the newly added models? The requirement says:
    // "have a multi-select of multiple models that will be added to the sidebar as the pool of models"
    // It doesn't explicitly say they must be selected for chatting immediately, but usually yes.
    // Let's select them.
    setSelectedModels(prev => {
      const next = [...prev];
      modelsToAdd.forEach(m => {
        if (!next.includes(m.id)) {
          next.push(m.id);
        }
      });
      return next;
    });
  }, []);

  const addModelToPool = useCallback((model: ModelInfo) => {
    setKnownModels(prev => {
      if (prev.some(existing => existing.id === model.id)) {
        return prev;
      }
      return [...prev, model];
    });
    
    // Auto-select the newly added model
    setSelectedModels(prev => {
      if (prev.includes(model.id)) {
        return prev;
      }
      return [...prev, model.id];
    });
  }, []);

  const removeModelFromPool = useCallback((modelId: string) => {
    setSelectedModels(prev => {
      if (prev.length <= 1 && prev.includes(modelId)) return prev; // Don't empty selection
      return prev.filter(id => id !== modelId);
    });
    setKnownModels(prev => {
      // Don't remove from known models if it's the last one?
      // Actually, if we remove from pool, we remove from knownModels.
      if (prev.length <= 1) return prev;
      return prev.filter(m => m.id !== modelId);
    });
  }, []);

  const isModelSelected = useCallback(
    (modelId: string) => selectedModels.includes(modelId),
    [selectedModels]
  );

  const isVotingEnabled = selectedModels.length > 1;

  // Derived list of selected model infos for UI
  const selectedModelInfos = knownModels.filter(m => selectedModels.includes(m.id));
  
  // The full pool of models available in the sidebar (to show in the list)
  // The sidebar shows the POOL. The checkboxes in the sidebar toggle SELECTION within the pool.
  // Wait, the requirements say: "have a multi-select of multiple models that will be added to the sidebar as the pool of models"
  // So the sidebar shows the POOL.
  // "the selected pool of models will be stored in localstorage too"
  // "if we have a selected set of models and click the model selector modal, the ones that are currently in the pool will be pre-selected"

  return {
    selectedModels,
    availableModels: knownModels, // The pool
    isLoaded,
    isVotingEnabled,
    toggleModel, // Toggles selection within the pool
    selectAll,
    clearAll,
    isModelSelected,
    addModelsToPool,
    addModelToPool,
    removeModelFromPool
  };
}
