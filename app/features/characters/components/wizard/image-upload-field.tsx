/**
 * Image Upload Field Component
 *
 * Reusable image upload with drag & drop, preview, and base64 output.
 */
import { useCallback, useRef, useState } from "react";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";

import { Label } from "~/core/components/ui/label";

interface ImageUploadFieldProps {
  label: string;
  value: string | null; // 현재 URL (base64 or http)
  onChange: (dataUrl: string) => void; // base64 data URL 전달
  onRemove: () => void;
  aspectRatio?: "square" | "banner"; // square=원형, banner=16:9
}

export function ImageUploadField({
  label,
  value,
  onChange,
  onRemove,
  aspectRatio = "square",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB를 초과할 수 없습니다");
        return;
      }

      // Read as base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onRemove]
  );

  // Container class based on aspect ratio
  const containerClass =
    aspectRatio === "banner"
      ? "h-32 w-full rounded-lg"
      : "h-32 w-32 rounded-full";

  return (
    <div className="space-y-2">
      <Label className="text-gray-900 dark:text-white">{label}</Label>
      <div
        className={`relative ${containerClass} border-2 border-dashed transition-colors ${
          isDragging
            ? "border-[#14b8a6] bg-gray-100 dark:bg-[#2a2a2a]"
            : "border-gray-300 bg-gray-100 dark:border-[#3f3f46] dark:bg-[#232323]"
        } flex cursor-pointer items-center justify-center overflow-hidden hover:border-gray-400 dark:hover:border-[#6b7280]`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-[#9ca3af]">
            {aspectRatio === "banner" ? (
              <ImageIcon className="h-8 w-8" />
            ) : (
              <UploadIcon className="h-6 w-6" />
            )}
            <span className="text-xs">클릭 또는 드래그</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <p className="text-xs text-[#6b7280]">최대 5MB, 이미지 파일만</p>
    </div>
  );
}
