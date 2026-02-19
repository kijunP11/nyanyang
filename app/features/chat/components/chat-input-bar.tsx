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
    <div className="bg-gray-100 px-4 py-3 dark:bg-[#232323]">
      <div className="flex items-center gap-2">
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#3f3f46] dark:text-white dark:hover:bg-[#52525b]"
          title="첨부"
        >
          <Plus className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-200 px-4 py-2 dark:bg-[#3f3f46]">
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
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:opacity-50 dark:text-white dark:placeholder:text-[#9ca3af]"
          />
          <button
            onClick={() => setInputValue((prev) => prev + "*지문*")}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-300 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white"
          >
            *지문*
          </button>
          <button
            onClick={() => setInputValue((prev) => prev + '"대사"')}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-300 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white"
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
