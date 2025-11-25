"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getModelsByProvider, ModelInfo } from "@/types/models";
import { Vote, Sparkles, Zap, Settings2, Plus, X } from "lucide-react";
import { AddModelModal } from "./add-model-modal";

interface ModelSelectorProps {
  selectedModels: string[];
  availableModels: ModelInfo[];
  isVotingEnabled: boolean;
  onToggleModel: (modelId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onAddModel: (model: ModelInfo) => void;
  onRemoveModel: (modelId: string) => void;
  /** Render mode: 'mobile' for Sheet trigger only, 'desktop' for sidebar only, 'both' for default behavior */
  variant?: "mobile" | "desktop" | "both";
}

function ModelSelectorContent({
  selectedModels,
  availableModels,
  isVotingEnabled,
  onToggleModel,
  onSelectAll,
  onClearAll,
  onAddModel,
  onRemoveModel,
}: Omit<ModelSelectorProps, "variant">) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const modelsByProvider = getModelsByProvider(availableModels);
  const providers = Object.keys(modelsByProvider).sort();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Models</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{selectedModels.length} selected</span>
          {isVotingEnabled ? (
            <span className="flex items-center gap-1 text-primary">
              <Vote className="h-3 w-3" />
              Voting enabled
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Single model
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 p-4 border-b">
        <Button 
          className="w-full gap-2" 
          onClick={() => setIsSearchOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Models
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onSelectAll}
            disabled={selectedModels.length === availableModels.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onClearAll}
            disabled={selectedModels.length === 1}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Model list */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4 space-y-6">
          {providers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No models in your pool. Click "Add Models" to start.
            </div>
          ) : (
            providers.map((provider) => (
              <div key={provider}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {provider}
                </h3>
                <div className="space-y-2">
                  {modelsByProvider[provider].map((model) => {
                    const isSelected = selectedModels.includes(model.id);
                    const isLastSelected = isSelected && selectedModels.length === 1;

                    return (
                      <div
                        key={model.id}
                        className={`group relative flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <Checkbox
                          id={`model-${model.id}`}
                          checked={isSelected}
                          onCheckedChange={() => onToggleModel(model.id)}
                          disabled={isLastSelected}
                        />
                        <label
                          htmlFor={`model-${model.id}`}
                          className="flex-1 text-sm font-medium cursor-pointer truncate"
                          title={model.name}
                        >
                          {model.name}
                        </label>
                        
                        {/* Remove button - only show on hover and if not selected (or allow removing selected?) */}
                        {/* Requirement: "Allow removing models from pool via existing checkboxes" -> Wait. 
                            The checkboxes toggle SELECTION. Removing from POOL is different. 
                            Usually you'd have a trash icon or similar. 
                            "have a multi-select of multiple models that will be added to the sidebar as the pool of models"
                            "Allow removing models from pool via existing checkboxes" -> This might mean unchecking removes from pool? 
                            NO, standard pattern is:
                            - Sidebar shows POOL.
                            - Checkbox selects for current chat.
                            - Need a way to remove from pool.
                        */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveModel(model.id);
                          }}
                          disabled={isLastSelected && availableModels.length > 1} // Don't allow removing the last selected model if it's the only one? Or just ensure one model remains.
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove from pool</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {provider !== providers[providers.length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer info */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">
          {isVotingEnabled
            ? "Multiple models will generate responses and vote on the best one."
            : "Select multiple models to enable voting."}
        </p>
      </div>

      <AddModelModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        existingModelIds={availableModels.map(m => m.id)}
        onAddModel={onAddModel}
      />
    </div>
  );
}

export function ModelSelector({
  variant = "both",
  ...props
}: ModelSelectorProps) {
  const showMobile = variant === "mobile" || variant === "both";
  const showDesktop = variant === "desktop" || variant === "both";

  return (
    <>
      {/* Mobile Model Selector - Sheet trigger */}
      {showMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className={variant === "both" ? "lg:hidden" : ""}>
              <Settings2 className="h-5 w-5" />
              <span className="sr-only">Select models</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Model Selection</SheetTitle>
            </SheetHeader>
            <ModelSelectorContent {...props} />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {showDesktop && (
        <aside className="hidden lg:flex flex-col h-screen w-72 border-l bg-background overflow-hidden shrink-0 mr-4">
          <ModelSelectorContent {...props} />
        </aside>
      )}
    </>
  );
}
