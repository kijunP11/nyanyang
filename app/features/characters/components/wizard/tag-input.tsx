/**
 * Tag Input Component
 *
 * Reusable tag input with chips, suggestions, and max limit.
 */
import { useCallback, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { POPULAR_TAGS } from "../../lib/wizard-types";

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  maxTags?: number; // default 10
  suggestions?: readonly string[]; // 추천 태그 목록
  label?: string;
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  maxTags = 10,
  suggestions = POPULAR_TAGS,
  label = "태그",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onAdd(trimmed);
      setInputValue("");
    }
  }, [inputValue, tags, maxTags, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleSuggestionClick = useCallback(
    (tag: string) => {
      if (!tags.includes(tag) && tags.length < maxTags) {
        onAdd(tag);
      }
    },
    [tags, maxTags, onAdd]
  );

  // Filter suggestions to show only unused tags
  const availableSuggestions = suggestions.filter(
    (tag) => !tags.includes(tag)
  );

  const isMaxReached = tags.length >= maxTags;

  return (
    <div className="space-y-3">
      <Label className="text-gray-900 dark:text-white">{label}</Label>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isMaxReached ? `최대 ${maxTags}개` : "태그 입력 후 Enter"}
          disabled={isMaxReached}
          className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddTag}
          disabled={!inputValue.trim() || isMaxReached}
          className="border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100 dark:border-[#3f3f46] dark:text-[#9ca3af] dark:hover:bg-[#3f3f46] dark:hover:text-white"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-[#14b8a6]/20 text-[#14b8a6] hover:bg-[#14b8a6]/30"
            >
              #{tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-1 hover:text-white"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Suggested Tags */}
      {availableSuggestions.length > 0 && !isMaxReached && (
        <div className="space-y-2">
          <span className="text-xs text-[#6b7280]">추천 태그</span>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 8).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer border-[#3f3f46] text-[#9ca3af] hover:border-[#14b8a6] hover:text-[#14b8a6]"
                onClick={() => handleSuggestionClick(tag)}
              >
                +{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-[#6b7280]">
        {tags.length}/{maxTags}개 태그
      </p>
    </div>
  );
}
