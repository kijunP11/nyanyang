/**
 * 채팅 입력 바
 * 텍스트 입력 + 지문/대사 퀵 버튼 + 전송 버튼
 */
import { useState } from "react";
import { Send, Plus } from "lucide-react";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;
    onSend(inputValue.trim());
    setInputValue("");
  };

  return (
    <div className="bg-[#232323] px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3f3f46] text-white hover:bg-[#52525b]"
          title="첨부"
        >
          <Plus className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#3f3f46] px-4 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지를 입력하세요..."
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#9ca3af] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => setInputValue((prev) => prev + "*지문*")}
            className="rounded-md px-2 py-1 text-xs text-[#9ca3af] hover:bg-white/10 hover:text-white"
          >
            *지문*
          </button>
          <button
            onClick={() => setInputValue((prev) => prev + '"대사"')}
            className="rounded-md px-2 py-1 text-xs text-[#9ca3af] hover:bg-white/10 hover:text-white"
          >
            "대사"
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || disabled}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#14b8a6] text-white hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
