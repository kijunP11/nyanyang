/**
 * Chat Input Component
 * 
 * Input area with action buttons (*지문*, "대사") and send button
 */
import { Send } from "lucide-react";
import { useState } from "react";

import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string, type: "action" | "dialogue") => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [inputType, setInputType] = useState<"action" | "dialogue">("dialogue");

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim(), inputType);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-4xl">
        {/* Action Type Buttons */}
        <div className="mb-2 flex gap-2">
          <Button
            variant={inputType === "action" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputType("action")}
            className="h-8 text-xs"
          >
            *지문*
          </Button>
          <Button
            variant={inputType === "dialogue" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputType("dialogue")}
            className="h-8 text-xs"
          >
            "대사"
          </Button>
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              inputType === "action"
                ? "*행동을 설명하세요*"
                : '"대사를 입력하세요"'
            }
            className="min-h-[100px] resize-none"
            disabled={disabled}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="h-[100px] w-[100px] bg-[#41C7BD] hover:bg-[#41C7BD]/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

