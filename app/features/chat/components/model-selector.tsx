/**
 * AI Model Selector Component
 * 
 * Allows users to select AI model (Gemini, Claude, Opus, etc.)
 */
import { Check } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";

export type AIModel = "gemini-2.5-pro" | "claude-sonnet" | "opus" | "custom";

export interface ModelOption {
  id: AIModel;
  name: string;
  recommended?: boolean;
  available?: boolean;
}

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  availableModels?: ModelOption[];
}

const defaultModels: ModelOption[] = [
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", recommended: true },
  { id: "claude-sonnet", name: "Claude Sonnet", recommended: true },
  { id: "opus", name: "Opus" },
];

export function ModelSelector({
  selectedModel,
  onModelChange,
  availableModels = defaultModels,
}: ModelSelectorProps) {
  const selectedModelName =
    availableModels.find((m) => m.id === selectedModel)?.name || selectedModel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {selectedModelName}
          {availableModels.find((m) => m.id === selectedModel)?.recommended && (
            <span className="ml-2 text-xs text-[#41C7BD]">권장</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>AI 모델 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            disabled={model.available === false}
            className="flex items-center justify-between"
          >
            <span>{model.name}</span>
            {selectedModel === model.id && (
              <Check className="ml-2 h-4 w-4" />
            )}
            {model.recommended && (
              <span className="ml-2 text-xs text-[#41C7BD]">권장</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


