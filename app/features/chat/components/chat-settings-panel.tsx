/**
 * 채팅 설정 패널 (데스크톱 사이드바)
 * 크레딧, 이미지, 배경, 폰트, 응답 길이, 각종 토글
 */
import { Switch } from "~/core/components/ui/switch";
import { Slider } from "~/core/components/ui/slider";
import { X, Brain } from "lucide-react";
import type { RoomSettings } from "../hooks/use-room-settings";

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

interface ChatSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onUpdateSetting: (
    key: keyof RoomSettings,
    value: number | string | boolean | null
  ) => void;
  onOpenMemory: () => void;
  onOpenMaxOutput?: () => void;
  jellyBalance?: number;
}

function SettingRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#d1d5db]">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ChatSettingsPanel({
  open,
  onClose,
  settings,
  onUpdateSetting,
  onOpenMemory,
  onOpenMaxOutput,
  jellyBalance = 0,
}: ChatSettingsPanelProps) {
  if (!open) return null;

  const fontSizeIndex =
    FONT_SIZES.indexOf(settings.font_size) >= 0
      ? FONT_SIZES.indexOf(settings.font_size)
      : 2;

  return (
    <div className="w-80 overflow-y-auto border-l border-[#3f3f46] bg-[#1a1a1a] text-white">
      <div className="flex items-center justify-between border-b border-[#3f3f46] px-4 py-3">
        <h3 className="text-sm font-semibold">채팅 설정</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-white/10"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-lg bg-[#232323] p-3">
          <p className="text-xs text-[#9ca3af]">잔여 크레딧</p>
          <p className="text-lg font-bold text-[#14b8a6]">
            {jellyBalance.toLocaleString()} 젤리
          </p>
        </div>

        <SettingRow
          label="멀티 이미지"
          checked={settings.multi_image}
          onChange={(v) => onUpdateSetting("multi_image", v)}
        />

        <SettingRow
          label="배경 이미지"
          checked={settings.background_enabled}
          onChange={(v) => onUpdateSetting("background_enabled", v)}
        />

        <div>
          <p className="mb-2 text-sm text-[#d1d5db]">글씨 크기</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280]">가</span>
            <Slider
              value={[fontSizeIndex]}
              onValueChange={([idx]) =>
                onUpdateSetting("font_size", FONT_SIZES[idx] ?? 16)
              }
              min={0}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-base font-bold">가</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-[#d1d5db]">응답 길이</p>
          <Slider
            value={[settings.response_length]}
            onValueChange={([val]) => onUpdateSetting("response_length", val)}
            min={500}
            max={8000}
            step={500}
          />
          <p className="mt-1 text-xs text-[#6b7280]">
            {settings.response_length} tokens
          </p>
          {onOpenMaxOutput && (
            <button
              type="button"
              onClick={onOpenMaxOutput}
              className="mt-1 text-xs text-[#14b8a6] hover:underline"
            >
              응답 길이 조정 (모달)
            </button>
          )}
        </div>

        <SettingRow
          label="긍정 바이어스"
          checked={settings.positivity_bias}
          onChange={(v) => onUpdateSetting("positivity_bias", v)}
        />
        <SettingRow
          label="사칭 방지"
          checked={settings.anti_impersonation}
          onChange={(v) => onUpdateSetting("anti_impersonation", v)}
        />
        <SettingRow
          label="실시간 출력"
          checked={settings.realtime_output}
          onChange={(v) => onUpdateSetting("realtime_output", v)}
        />

        <button
          type="button"
          onClick={onOpenMemory}
          className="flex w-full items-center gap-2 rounded-lg border border-[#3f3f46] px-3 py-2 text-sm hover:bg-white/10"
        >
          <Brain className="h-4 w-4" />
          요약 관리
        </button>
      </div>
    </div>
  );
}
