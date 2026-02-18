/**
 * 대화 커스터마이징 모달
 * 캐릭터 닉네임, 글씨 크기(6단계), 배경 이미지, [적용하기]
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";
import { Slider } from "~/core/components/ui/slider";
import { ImagePlus } from "lucide-react";

interface CustomizingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterNickname: string | null;
  fontSize: number;
  backgroundImageUrl: string | null;
  onApply: (settings: {
    character_nickname: string | null;
    font_size: number;
    background_image_url: string | null;
  }) => void;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

export function CustomizingModal({
  open,
  onOpenChange,
  characterNickname,
  fontSize,
  backgroundImageUrl,
  onApply,
}: CustomizingModalProps) {
  const [nickname, setNickname] = useState(characterNickname || "");
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [bgUrl, setBgUrl] = useState<string | null>(backgroundImageUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setNickname(characterNickname || "");
      setCurrentFontSize(fontSize);
      setBgUrl(backgroundImageUrl);
    }
  }, [open, characterNickname, fontSize, backgroundImageUrl]);

  const fontSizeIndex =
    FONT_SIZES.indexOf(currentFontSize) >= 0
      ? FONT_SIZES.indexOf(currentFontSize)
      : 2;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("최대 5MB까지 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setUploading(false);
    };
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch("/api/chat/upload-background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) setBgUrl(data.url);
        else if (data.error) alert("배경 이미지 업로드에 실패했습니다.");
      } catch {
        alert("배경 이미지 업로드에 실패했습니다.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    onApply({
      character_nickname: nickname.trim() || null,
      font_size: currentFontSize,
      background_image_url: bgUrl,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#181D27]">
        <DialogHeader>
          <DialogTitle>대화 커스터마이징</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">캐릭터명</p>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="캐릭터명을 입력해주세요!"
            className="w-full rounded-lg border border-[#E9EAEB] bg-transparent px-4 py-3 text-sm dark:border-[#333741] dark:text-white"
          />
          <p className="mt-1 text-xs text-[#9ca3af]">
            내가 입력한 채팅방입니다!
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">채팅방 글씨 크기</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9ca3af]">가</span>
            <Slider
              value={[fontSizeIndex]}
              onValueChange={([idx]) =>
                setCurrentFontSize(FONT_SIZES[idx] ?? 16)
              }
              min={0}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-lg font-bold text-[#181D27] dark:text-white">
              가
            </span>
          </div>
          <p className="mt-1 text-center text-xs text-[#9ca3af]">
            {currentFontSize}px
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">대화 배경 설정</p>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-[#E9EAEB] bg-[#FAFAFA] p-6 dark:border-[#333741] dark:bg-[#1F242F]">
            {bgUrl ? (
              <img
                src={bgUrl}
                alt="배경"
                className="h-32 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-lg bg-[#E9EAEB] dark:bg-[#333741]">
                <ImagePlus className="h-10 w-10 text-[#9ca3af]" />
              </div>
            )}
            <label className="cursor-pointer rounded-lg border border-[#E9EAEB] px-4 py-2 text-sm text-[#535862] hover:bg-[#F5F5F5] dark:border-[#333741] dark:text-[#94969C]">
              {uploading ? "업로드 중..." : "컴퓨터에서 업로드 하기"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-[#14b8a6]">
              * 최대 5MB까지 업로드 가능합니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleApply}
            className="w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
