"use client";

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
import { getModelsByProvider, AVAILABLE_MODELS } from "@/types/models";
import { Vote, Sparkles, Zap, Settings2 } from "lucide-react";

interface ModelSelectorProps {
  selectedModels: string[];
  isVotingEnabled: boolean;
  onToggleModel: (modelId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  /** Render mode: 'mobile' for Sheet trigger only, 'desktop' for sidebar only, 'both' for default behavior */
  variant?: "mobile" | "desktop" | "both";
}

function ModelSelectorContent({
  selectedModels,
  isVotingEnabled,
  onToggleModel,
  onSelectAll,
  onClearAll,
}: Omit<ModelSelectorProps, "variant">) {
  const modelsByProvider = getModelsByProvider();
  const providers = Object.keys(modelsByProvider);

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
      <div className="flex gap-2 p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onSelectAll}
          disabled={selectedModels.length === AVAILABLE_MODELS.length}
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

      {/* Model list */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4 space-y-6">
          {providers.map((provider) => (
            <div key={provider}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {provider}
              </h3>
              <div className="space-y-2">
                {modelsByProvider[provider].map((model) => {
                  const isSelected = selectedModels.includes(model.id);
                  const isLastSelected = isSelected && selectedModels.length === 1;

                  return (
                    <label
                      key={model.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted border border-transparent"
                      } ${isLastSelected ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleModel(model.id)}
                        disabled={isLastSelected}
                      />
                      <span className="text-sm font-medium">{model.name}</span>
                    </label>
                  );
                })}
              </div>
              {provider !== providers[providers.length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
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
        <aside className="hidden lg:flex flex-col h-screen w-72 border-l bg-background overflow-hidden shrink-0">
          <ModelSelectorContent {...props} />
        </aside>
      )}
    </>
  );
}

