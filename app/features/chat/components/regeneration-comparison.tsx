/**
 * 재생성 비교 뷰
 * 이전 응답 vs 새 응답, [새 응답 유지] / [이전으로 되돌리기]
 */
import ReactMarkdown from "react-markdown";

interface RegenerationComparisonProps {
  previousContent: string;
  newContent: string;
  onKeepNew: () => void;
  onRevert: () => void;
}

export function RegenerationComparison({
  previousContent,
  newContent,
  onKeepNew,
  onRevert,
}: RegenerationComparisonProps) {
  return (
    <div className="mx-4 my-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-[#3f3f46] dark:bg-[#1a1a1a]">
      <p className="mb-3 text-xs font-semibold text-[#14b8a6]">재생성 비교</p>

      <div className="mb-3">
        <p className="mb-1 text-xs text-gray-500 dark:text-[#6b7280]">이전 응답</p>
        <div className="rounded-lg bg-gray-200 p-3 text-sm text-gray-600 line-through opacity-60 dark:bg-[#2f3032] dark:text-[#9ca3af]">
          {previousContent.substring(0, 300)}
          {previousContent.length > 300 ? "..." : ""}
        </div>
      </div>

      <div className="mb-3">
        <p className="mb-1 text-xs text-[#14b8a6]">새 응답</p>
        <div className="rounded-lg bg-gray-200 p-3 text-sm text-gray-900 dark:bg-[#2f3032] dark:text-white">
          <ReactMarkdown
            components={{
              p: (props) => <p className="mb-2 last:mb-0" {...props} />,
            }}
          >
            {`${newContent.substring(0, 300)}${newContent.length > 300 ? "..." : ""}`}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRevert}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-[#3f3f46] dark:text-[#9ca3af] dark:hover:bg-white/10"
        >
          이전으로 되돌리기
        </button>
        <button
          onClick={onKeepNew}
          className="rounded-lg bg-[#14b8a6] px-3 py-1.5 text-xs text-white hover:bg-[#0d9488]"
        >
          새 응답 유지
        </button>
      </div>
    </div>
  );
}
