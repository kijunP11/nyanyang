/**
 * Memory Drawer Component
 *
 * Displays conversation memories (summaries) in a drawer/sheet.
 * Allows users to view and delete memories.
 */

import { Brain, Trash2, Calendar } from "lucide-react";
import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/core/components/ui/sheet";
import { Button } from "~/core/components/ui/button";
import { Badge } from "~/core/components/ui/badge";

interface Memory {
  memory_id: number;
  memory_type: string;
  content: string;
  importance: number;
  message_range_start: number | null;
  message_range_end: number | null;
  created_at: Date | string;
  metadata: any;
}

interface MemoryDrawerProps {
  roomId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Memory Drawer Component
 */
export default function MemoryDrawer({
  roomId,
  open,
  onOpenChange,
}: MemoryDrawerProps) {
  const fetcher = useFetcher();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load memories when drawer opens
  useEffect(() => {
    if (open && roomId) {
      loadMemories();
    }
  }, [open, roomId]);

  // Handle delete response
  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("메모리가 삭제되었습니다");
      // Reload memories
      loadMemories();
      setDeletingId(null);
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
      setDeletingId(null);
    }
  }, [fetcher.data]);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/memory?room_id=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to show only summary type memories for now
        const summaries = data.memories.filter(
          (m: Memory) => m.memory_type === "summary"
        );
        setMemories(summaries);
      } else {
        toast.error("메모리를 불러오는데 실패했습니다");
      }
    } catch (err) {
      console.error("Error loading memories:", err);
      toast.error("메모리를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (memoryId: number) => {
    if (!confirm("이 메모리를 삭제하시겠습니까?")) {
      return;
    }

    setDeletingId(memoryId);
    fetcher.submit(
      { memory_id: memoryId },
      {
        method: "DELETE",
        action: "/api/chat/memory",
        encType: "application/json",
      }
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImportanceStars = (importance: number) => {
    const stars = Math.min(10, Math.max(1, importance));
    return "⭐".repeat(Math.floor(stars / 2));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            메모리
          </SheetTitle>
          <SheetDescription>
            AI가 기억하고 있는 대화 요약입니다
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">
                아직 생성된 요약이 없습니다
              </p>
              <p className="text-sm text-muted-foreground">
                20개 이상의 메시지가 쌓이면 자동으로 요약이 생성됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div
                  key={memory.memory_id}
                  className="bg-card rounded-lg border p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          요약
                        </Badge>
                        {memory.message_range_start &&
                          memory.message_range_end && (
                            <span className="text-xs text-muted-foreground">
                              메시지 {memory.message_range_start}-
                              {memory.message_range_end}
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(memory.created_at)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(memory.memory_id)}
                      disabled={deletingId === memory.memory_id}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {memory.content}
                  </div>

                  {/* Importance */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>중요도:</span>
                    <span>{getImportanceStars(memory.importance)}</span>
                    <span>({memory.importance}/10)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

