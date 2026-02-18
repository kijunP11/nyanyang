/**
 * 댓글 입력 폼
 *
 * 최상위 댓글 / 답글 작성 모두 사용.
 * 이미지 첨부 시 base64 → /api/comments/upload-image → URL 받아서 submit.
 */
import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface CommentFormProps {
  characterId: number;
  parentId?: number | null;
  placeholder?: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  characterId,
  parentId = null,
  placeholder = "댓글을 입력하세요...",
  onSuccess,
  autoFocus = false,
}: CommentFormProps) {
  const fetcher = useFetcher();
  const uploadFetcher = useFetcher();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isSubmitting = fetcher.state === "submitting";
  const isUploading = uploadFetcher.state === "submitting";

  // 업로드 완료 시 URL 저장
  useEffect(() => {
    const data = uploadFetcher.data as { url?: string } | undefined;
    if (data?.url) {
      setImageUrl(data.url);
    }
  }, [uploadFetcher.data]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageUrl(null);

      uploadFetcher.submit(
        {
          file_data: dataUrl,
          file_name: file.name,
          file_type: file.type,
        },
        {
          method: "POST",
          action: "/api/comments/upload-image",
          encType: "application/json",
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl(null);
  };

  const handleSubmit = () => {
    if (!content.trim() && !imageUrl) return;

    fetcher.submit(
      {
        character_id: characterId,
        content: content.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
        ...(parentId != null ? { parent_id: parentId } : {}),
      },
      {
        method: "POST",
        action: "/api/comments/create",
        encType: "application/json",
      }
    );

    setContent("");
    setImagePreview(null);
    setImageUrl(null);
  };

  // create 성공 시 한 번만 onSuccess 호출 (목록 갱신)
  const prevStateRef = useRef(fetcher.state);
  useEffect(() => {
    const data = fetcher.data as { success?: boolean } | undefined;
    const wasSubmitting = prevStateRef.current === "submitting";
    if (wasSubmitting && fetcher.state === "idle" && data?.success) {
      onSuccess?.();
    }
    prevStateRef.current = fetcher.state;
  }, [fetcher.state, fetcher.data, onSuccess]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#E9EAEB] p-3 dark:border-[#333741]">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        className="w-full resize-none bg-transparent text-sm text-[#181D27] outline-none placeholder:text-[#A4A7AE] dark:text-white dark:placeholder:text-[#717680]"
        maxLength={1000}
      />

      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="첨부 이미지"
            className="max-h-32 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -right-1 -top-1 rounded-full bg-[#181D27] p-0.5 text-white"
          >
            <X className="h-3 w-3" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="cursor-pointer rounded-md p-1.5 text-[#717680] transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741]">
          <ImagePlus className="h-4 w-4" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            isUploading ||
            (!content.trim() && !imageUrl)
          }
          className="rounded-lg bg-[#00c4af] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "작성 중..." : "작성"}
        </button>
      </div>
    </div>
  );
}
