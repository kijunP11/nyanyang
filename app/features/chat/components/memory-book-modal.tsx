/**
 * 메모리북 모달
 *
 * 기존 MemoryDrawer를 대체한다.
 * 탭: 요약(summary) / 사실(fact) / 사용자 노트(user_note)
 * 각 메모리 카드: 내용 미리보기, 중요도 표시, [수정]/[삭제] 버튼
 * 우측 상단: [새 메모리 추가] 버튼
 */
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";

import { MemoryCreateModal } from "./memory-create-modal";
import { MemoryEditModal } from "./memory-edit-modal";

interface Memory {
  memory_id: number;
  room_id: number;
  memory_type: string;
  content: string;
  importance: number;
  metadata: Record<string, unknown> | null;
  message_range_start: number | null;
  message_range_end: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MemoryBookModalProps {
  open: boolean;
  onClose: () => void;
  roomId: number;
}

const MEMORY_TABS = [
  { value: "summary", label: "요약" },
  { value: "fact", label: "사실" },
  { value: "user_note", label: "노트" },
] as const;

export function MemoryBookModal({ open, onClose, roomId }: MemoryBookModalProps) {
  const fetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [showCreate, setShowCreate] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  useEffect(() => {
    if (open) {
      fetcher.load(`/api/chat/memory?room_id=${roomId}`);
    }
  }, [open, roomId]);

  // 삭제 완료 시 목록 리로드 (race condition 방지)
  useEffect(() => {
    const data = deleteFetcher.data as { success?: boolean } | undefined;
    if (deleteFetcher.state === "idle" && data?.success) {
      fetcher.load(`/api/chat/memory?room_id=${roomId}`);
    }
  }, [deleteFetcher.state, deleteFetcher.data, roomId]);

  const data = fetcher.data as { memories?: Memory[] } | undefined;
  const memories: Memory[] = data?.memories ?? [];
  const isLoading = fetcher.state === "loading";

  const handleDelete = (memoryId: number) => {
    if (!confirm("이 메모리를 삭제하시겠습니까?")) return;

    deleteFetcher.submit(
      { memory_id: memoryId },
      {
        method: "DELETE",
        action: "/api/chat/memory",
        encType: "application/json",
      }
    );
  };

  const handleRefresh = () => {
    fetcher.load(`/api/chat/memory?room_id=${roomId}`);
  };

  const getFilteredMemories = (type: string) =>
    memories.filter((m) => m.memory_type === type);

  return (
    <>
      <Dialog open={open && !showCreate && !editingMemory} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                메모리북
              </DialogTitle>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1 rounded-lg bg-[#00c4af] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00b39e]"
              >
                <Plus className="h-3.5 w-3.5" />
                추가
              </button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="summary" className="mt-2">
            <TabsList className="w-full">
              {MEMORY_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                  {tab.label}
                  <span className="ml-1 text-xs text-[#A4A7AE]">
                    ({getFilteredMemories(tab.value).length})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {MEMORY_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00c4af] border-t-transparent" />
                  </div>
                ) : getFilteredMemories(tab.value).length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#A4A7AE] dark:text-[#717680]">
                    {tab.label} 메모리가 없습니다.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getFilteredMemories(tab.value).map((memory) => (
                      <MemoryCard
                        key={memory.memory_id}
                        memory={memory}
                        onEdit={() => setEditingMemory(memory)}
                        onDelete={() => handleDelete(memory.memory_id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      <MemoryCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        roomId={roomId}
        onSuccess={() => {
          setShowCreate(false);
          handleRefresh();
        }}
      />

      {editingMemory && (
        <MemoryEditModal
          open={!!editingMemory}
          onClose={() => setEditingMemory(null)}
          memory={editingMemory}
          onSuccess={() => {
            setEditingMemory(null);
            handleRefresh();
          }}
        />
      )}
    </>
  );
}

function MemoryCard({
  memory,
  onEdit,
  onDelete,
}: {
  memory: Memory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const importanceBadge =
    memory.importance >= 8
      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      : memory.importance >= 5
        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        : "bg-[#E0F7F5] text-[#00897B] dark:bg-[#00c4af]/10 dark:text-[#00c4af]";

  const dateStr = memory.created_at
    ? new Date(memory.created_at).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="rounded-lg border border-[#E9EAEB] p-3 dark:border-[#333741]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-sm text-[#414651] dark:text-[#D5D7DA]">
            {memory.content}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${importanceBadge}`}
            >
              중요도 {memory.importance}
            </span>
            <span className="text-[10px] text-[#A4A7AE] dark:text-[#717680]">
              {dateStr}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-[#717680] transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-[#717680] transition-colors hover:bg-[#F5F5F5] hover:text-red-500 dark:hover:bg-[#333741]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
