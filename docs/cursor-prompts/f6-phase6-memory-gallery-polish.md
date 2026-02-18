# F6 채팅방 Phase 6: 메모리북 + 이미지 갤러리 + 폴리시

## 개요
메모리 CRUD 풀 관리(메모리북 모달), 채팅 이미지 전체화면 갤러리, 응답 길이 조정 모달을 추가하고 전체 마무리한다.

**전제조건**: Phase 1 (스키마 + 리팩토링), Phase 2 (채팅 개선) 완료

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `chat/components/memory-book-modal.tsx` | 생성 |
| 2 | `chat/components/memory-create-modal.tsx` | 생성 |
| 3 | `chat/components/memory-edit-modal.tsx` | 생성 |
| 4 | `chat/components/image-gallery-modal.tsx` | 생성 |
| 5 | `chat/components/max-output-modal.tsx` | 생성 |
| 6 | `chat/api/memory.tsx` | 수정 |
| 7 | `chat/screens/chat.tsx` | 수정 |
| 8 | `chat/components/message-bubble.tsx` | 수정 |

---

## 1. `chat/components/memory-book-modal.tsx` (생성)

메모리 관리 Dialog. 탭으로 요약/사실/사용자 노트를 분류하고, 카드별 편집/삭제를 지원한다.

```typescript
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

  // 메모리 목록 로드
  useEffect(() => {
    if (open) {
      fetcher.load(`/api/chat/memory?roomId=${roomId}`);
    }
  }, [open, roomId]);

  const memories: Memory[] = fetcher.data?.memories ?? [];
  const isLoading = fetcher.state === "loading";

  // 삭제 핸들러
  const handleDelete = (memoryId: number) => {
    if (!confirm("이 메모리를 삭제하시겠습니까?")) return;

    deleteFetcher.submit(
      { memoryId, roomId },
      {
        method: "DELETE",
        action: "/api/chat/memory",
        encType: "application/json",
      }
    );

    // optimistic: 목록에서 제거
    // (fetcher.data가 있으면 직접 필터링하는 대신 리로드)
    setTimeout(() => {
      fetcher.load(`/api/chat/memory?roomId=${roomId}`);
    }, 300);
  };

  // 새 메모리 생성/수정 후 새로고침
  const handleRefresh = () => {
    fetcher.load(`/api/chat/memory?roomId=${roomId}`);
  };

  // 탭별 메모리 필터링
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

      {/* 생성 모달 */}
      <MemoryCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        roomId={roomId}
        onSuccess={() => {
          setShowCreate(false);
          handleRefresh();
        }}
      />

      {/* 수정 모달 */}
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

/** 메모리 카드 서브컴포넌트 */
function MemoryCard({
  memory,
  onEdit,
  onDelete,
}: {
  memory: Memory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // 중요도 배지 색상
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
```

---

## 2. `chat/components/memory-create-modal.tsx` (생성)

새 메모리 생성 Dialog: content, type(select), importance(slider 1-10).

```typescript
/**
 * 메모리 생성 모달
 *
 * content: 자유 텍스트
 * type: summary | fact | user_note (select)
 * importance: 1-10 (Slider)
 */
import { useState } from "react";
import { useFetcher } from "react-router";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/core/components/ui/dialog";
import { Slider } from "~/core/components/ui/slider";

interface MemoryCreateModalProps {
  open: boolean;
  onClose: () => void;
  roomId: number;
  onSuccess: () => void;
}

const MEMORY_TYPES = [
  { value: "user_note", label: "사용자 노트" },
  { value: "fact", label: "사실" },
  { value: "summary", label: "요약" },
] as const;

export function MemoryCreateModal({
  open,
  onClose,
  roomId,
  onSuccess,
}: MemoryCreateModalProps) {
  const fetcher = useFetcher();

  const [content, setContent] = useState("");
  const [memoryType, setMemoryType] = useState<string>("user_note");
  const [importance, setImportance] = useState(5);

  const isSubmitting = fetcher.state === "submitting";

  const handleSubmit = () => {
    if (!content.trim()) return;

    fetcher.submit(
      {
        roomId,
        content: content.trim(),
        memoryType,
        importance,
      },
      {
        method: "POST",
        action: "/api/chat/memory",
        encType: "application/json",
      }
    );

    // 초기화 및 닫기
    setContent("");
    setMemoryType("user_note");
    setImportance(5);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 메모리 추가</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 유형 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              유형
            </label>
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
              className="w-full rounded-lg border border-[#E9EAEB] bg-white px-3 py-2 text-sm dark:border-[#333741] dark:bg-[#1F242F] dark:text-white"
            >
              {MEMORY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 내용 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="기억할 내용을 입력하세요..."
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-[#E9EAEB] bg-white px-3 py-2 text-sm outline-none focus:border-[#00c4af] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white"
            />
            <p className="mt-1 text-right text-xs text-[#A4A7AE]">
              {content.length}/500
            </p>
          </div>

          {/* 중요도 슬라이더 */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              <span>중요도</span>
              <span className="text-xs text-[#00c4af]">{importance}</span>
            </label>
            <Slider
              value={[importance]}
              onValueChange={([v]) => setImportance(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[#A4A7AE]">
              <span>낮음</span>
              <span>높음</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-semibold text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex-1 rounded-lg bg-[#00c4af] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 3. `chat/components/memory-edit-modal.tsx` (생성)

기존 메모리 수정 Dialog. 생성 모달과 유사하지만 기존 값으로 초기화.

```typescript
/**
 * 메모리 수정 모달
 */
import { useState } from "react";
import { useFetcher } from "react-router";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/core/components/ui/dialog";
import { Slider } from "~/core/components/ui/slider";

interface Memory {
  memory_id: number;
  room_id: number;
  memory_type: string;
  content: string;
  importance: number;
}

interface MemoryEditModalProps {
  open: boolean;
  onClose: () => void;
  memory: Memory;
  onSuccess: () => void;
}

const MEMORY_TYPES = [
  { value: "user_note", label: "사용자 노트" },
  { value: "fact", label: "사실" },
  { value: "summary", label: "요약" },
] as const;

export function MemoryEditModal({
  open,
  onClose,
  memory,
  onSuccess,
}: MemoryEditModalProps) {
  const fetcher = useFetcher();

  const [content, setContent] = useState(memory.content);
  const [memoryType, setMemoryType] = useState(memory.memory_type);
  const [importance, setImportance] = useState(memory.importance);

  const isSubmitting = fetcher.state === "submitting";

  const handleSubmit = () => {
    if (!content.trim()) return;

    fetcher.submit(
      {
        memoryId: memory.memory_id,
        roomId: memory.room_id,
        content: content.trim(),
        memoryType,
        importance,
      },
      {
        method: "PUT",
        action: "/api/chat/memory",
        encType: "application/json",
      }
    );

    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>메모리 수정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 유형 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              유형
            </label>
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
              className="w-full rounded-lg border border-[#E9EAEB] bg-white px-3 py-2 text-sm dark:border-[#333741] dark:bg-[#1F242F] dark:text-white"
            >
              {MEMORY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 내용 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-[#E9EAEB] bg-white px-3 py-2 text-sm outline-none focus:border-[#00c4af] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white"
            />
            <p className="mt-1 text-right text-xs text-[#A4A7AE]">
              {content.length}/500
            </p>
          </div>

          {/* 중요도 슬라이더 */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              <span>중요도</span>
              <span className="text-xs text-[#00c4af]">{importance}</span>
            </label>
            <Slider
              value={[importance]}
              onValueChange={([v]) => setImportance(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[#A4A7AE]">
              <span>낮음</span>
              <span>높음</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-semibold text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex-1 rounded-lg bg-[#00c4af] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. `chat/components/image-gallery-modal.tsx` (생성)

채팅 이미지 전체화면 뷰어. 스와이프로 이전/다음 이미지 이동. 줌(pinch-zoom은 네이티브 브라우저에 위임).

```typescript
/**
 * 이미지 갤러리 모달
 *
 * 채팅 메시지 내 이미지 클릭 시 전체화면 뷰어.
 * CSS scroll-snap 기반 스와이프.
 * 배경 클릭 또는 X 버튼으로 닫기.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryModalProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function ImageGalleryModal({
  images,
  initialIndex,
  open,
  onClose,
}: ImageGalleryModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // 초기 스크롤 위치 설정
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: initialIndex * scrollRef.current.clientWidth,
        behavior: "instant",
      });
      setActiveIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // 스크롤 이벤트
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  // 이전/다음
  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({
      left: index * (scrollRef.current?.clientWidth ?? 0),
      behavior: "smooth",
    });
  };

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) goTo(activeIndex - 1);
      if (e.key === "ArrowRight" && activeIndex < images.length - 1)
        goTo(activeIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, activeIndex, images.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* 카운터 */}
      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-sm">
        {activeIndex + 1} / {images.length}
      </div>

      {/* 이전 버튼 (데스크톱) */}
      {activeIndex > 0 && (
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-4 z-10 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* 다음 버튼 (데스크톱) */}
      {activeIndex < images.length - 1 && (
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-4 z-10 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 이미지 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center p-8"
          >
            <img
              src={src}
              alt={`이미지 ${i + 1}`}
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
```

---

## 5. `chat/components/max-output-modal.tsx` (생성)

응답 길이 조정 슬라이더 모달.

```typescript
/**
 * 최대 출력 조정 모달
 *
 * 슬라이더로 max_output_tokens 설정.
 * 범위: 500 ~ 4000, 기본값: 2000
 */
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/core/components/ui/dialog";
import { Slider } from "~/core/components/ui/slider";

interface MaxOutputModalProps {
  open: boolean;
  onClose: () => void;
  currentValue: number;
  onSave: (value: number) => void;
}

const PRESETS = [
  { value: 500, label: "짧게" },
  { value: 1000, label: "보통" },
  { value: 2000, label: "길게" },
  { value: 4000, label: "최대" },
];

export function MaxOutputModal({
  open,
  onClose,
  currentValue,
  onSave,
}: MaxOutputModalProps) {
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  // 가장 가까운 프리셋 라벨 찾기
  const closestPreset = PRESETS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>응답 길이 조정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="text-center">
            <span className="text-3xl font-bold text-[#00c4af]">{value}</span>
            <p className="mt-1 text-sm text-[#717680] dark:text-[#94969C]">
              최대 토큰 ({closestPreset.label})
            </p>
          </div>

          <Slider
            value={[value]}
            onValueChange={([v]) => setValue(v)}
            min={500}
            max={4000}
            step={100}
            className="w-full"
          />

          <div className="flex justify-between text-[10px] text-[#A4A7AE]">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue(p.value)}
                className={`rounded-full px-2 py-0.5 transition-colors ${
                  value === p.value
                    ? "bg-[#00c4af]/10 text-[#00c4af]"
                    : "hover:text-[#00c4af]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-[#A4A7AE] dark:text-[#717680]">
            값이 클수록 AI가 더 긴 응답을 생성합니다. 토큰이 많을수록 젤리 소비량도 증가합니다.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-semibold text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-[#00c4af] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e]"
          >
            적용
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. `chat/api/memory.tsx` (수정)

기존 GET(목록) + DELETE(삭제) 핸들러에 POST(생성) + PUT(수정)을 추가한다.

**기존 action 함수에 method 분기 추가:**

```typescript
// --- 기존 DELETE 핸들러 아래에 추가 ---

// POST: 메모리 생성
if (request.method === "POST") {
  const body = await request.json();
  const { roomId, content, memoryType, importance } = body;

  if (!roomId || !content) {
    return data({ error: "Missing required fields" }, { status: 400, headers });
  }

  const db = drizzle;

  const [newMemory] = await db
    .insert(roomMemories)
    .values({
      room_id: roomId,
      memory_type: memoryType || "user_note",
      content: content.trim(),
      importance: importance ?? 5,
      metadata: { created_by: "user" },
    })
    .returning();

  return data({ success: true, memory: newMemory }, { headers });
}

// PUT: 메모리 수정
if (request.method === "PUT") {
  const body = await request.json();
  const { memoryId, roomId, content, memoryType, importance } = body;

  if (!memoryId || !content) {
    return data({ error: "Missing required fields" }, { status: 400, headers });
  }

  const db = drizzle;

  const [updated] = await db
    .update(roomMemories)
    .set({
      content: content.trim(),
      memory_type: memoryType,
      importance: importance ?? 5,
    })
    .where(eq(roomMemories.memory_id, memoryId))
    .returning();

  if (!updated) {
    return data({ error: "Memory not found" }, { status: 404, headers });
  }

  return data({ success: true, memory: updated }, { headers });
}
```

**필요한 import 추가** (없으면):
```typescript
import { roomMemories } from "../schema";
```

---

## 7. `chat/screens/chat.tsx` (수정)

기존 MemoryDrawer를 MemoryBookModal로 교체하고, 이미지 갤러리 + 최대 출력 모달을 통합한다.

### 7-1. 메모리북 교체

**변경할 import:**
```typescript
// 기존 삭제:
// import { MemoryDrawer } from "../components/memory-drawer";

// 새로 추가:
import { MemoryBookModal } from "../components/memory-book-modal";
```

**상태 변경:**
```typescript
// 기존 삭제: const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
// 새로 추가:
const [showMemoryBook, setShowMemoryBook] = useState(false);
```

**JSX 변경:**
- 기존 `<MemoryDrawer>` → `<MemoryBookModal>` 교체
- 메모리 버튼의 onClick: `setShowMemoryBook(true)`

```tsx
<MemoryBookModal
  open={showMemoryBook}
  onClose={() => setShowMemoryBook(false)}
  roomId={Number(roomId)}
/>
```

### 7-2. 이미지 갤러리 통합

**추가 import:**
```typescript
import { ImageGalleryModal } from "../components/image-gallery-modal";
```

**추가 상태:**
```typescript
const [galleryImages, setGalleryImages] = useState<string[]>([]);
const [galleryIndex, setGalleryIndex] = useState(0);
const [showGallery, setShowGallery] = useState(false);
```

**이미지 클릭 핸들러** (message-bubble에 전달):
```typescript
const handleImageClick = (imageUrl: string) => {
  // 모든 메시지에서 이미지 URL 수집
  const allImages = messageList
    .map((msg) => extractImagesFromContent(msg.content))
    .flat()
    .filter(Boolean);

  const index = allImages.indexOf(imageUrl);
  setGalleryImages(allImages);
  setGalleryIndex(index >= 0 ? index : 0);
  setShowGallery(true);
};
```

**헬퍼 함수** (파일 내 또는 별도 유틸):
```typescript
/** 마크다운 컨텐츠에서 이미지 URL 추출 */
function extractImagesFromContent(content: string): string[] {
  const regex = /!\[.*?\]\((.*?)\)/g;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}
```

**JSX에 갤러리 모달 추가:**
```tsx
<ImageGalleryModal
  images={galleryImages}
  initialIndex={galleryIndex}
  open={showGallery}
  onClose={() => setShowGallery(false)}
/>
```

### 7-3. 최대 출력 모달 통합

**추가 import:**
```typescript
import { MaxOutputModal } from "../components/max-output-modal";
```

**추가 상태:**
```typescript
const [showMaxOutput, setShowMaxOutput] = useState(false);
const [maxOutputTokens, setMaxOutputTokens] = useState(2000);
```

**JSX에 모달 추가:**
```tsx
<MaxOutputModal
  open={showMaxOutput}
  onClose={() => setShowMaxOutput(false)}
  currentValue={maxOutputTokens}
  onSave={(value) => {
    setMaxOutputTokens(value);
    // room settings에도 저장 (Phase 3의 useRoomSettings 사용)
  }}
/>
```

**API 호출 시 maxOutputTokens 전달:**
- `handleSend` / `handleRegenerate` 시 body에 `max_output_tokens: maxOutputTokens` 추가

---

## 8. `chat/components/message-bubble.tsx` (수정)

메시지 버블 내 이미지 클릭 시 갤러리 오픈 핸들러를 연결한다.

**props에 추가:**
```typescript
interface MessageBubbleProps {
  // ... 기존 props
  onImageClick?: (imageUrl: string) => void;
}
```

**ReactMarkdown의 img 렌더러에 클릭 핸들러 추가:**

```tsx
// ReactMarkdown components prop에서 img를 커스텀 렌더링
components={{
  img: ({ src, alt, ...props }) => (
    <img
      {...props}
      src={src}
      alt={alt ?? ""}
      className="my-2 max-h-64 cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-80"
      onClick={() => src && onImageClick?.(src)}
    />
  ),
  // ... 기존 다른 커스텀 렌더러
}}
```

---

## 참고 파일 (읽기 전용 - 수정하지 않음)

| 파일 | 용도 |
|------|------|
| `chat/lib/memory-manager.server.ts` | getRoomMemories() 함수 구조 |
| `chat/schema.ts` | roomMemories 테이블 스키마 |
| `core/components/ui/dialog.tsx` | shadcn Dialog 패턴 |
| `core/components/ui/slider.tsx` | shadcn Slider (Phase 3에서 추가) |
| `core/components/ui/tabs.tsx` | shadcn Tabs |

## 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] 메모리 버튼 클릭 → 메모리북 모달 열림
- [ ] 탭 전환 → 요약/사실/노트 각각 필터링 표시
- [ ] [추가] → 새 메모리 생성 모달 → 작성 → 목록에 반영
- [ ] 메모리 카드 [수정] → 수정 모달 → 저장 → 내용 반영
- [ ] 메모리 카드 [삭제] → 확인 → 목록에서 제거
- [ ] 채팅 메시지 내 이미지 클릭 → 갤러리 모달 (전체화면)
- [ ] 갤러리에서 스와이프/화살표 키 → 이전/다음 이미지
- [ ] ESC 키 → 갤러리 닫기
- [ ] 최대 출력 모달 → 슬라이더 조정 → 적용 → API에 반영
- [ ] 프리셋 버튼 (짧게/보통/길게/최대) 클릭 → 값 변경
