/**
 * 룸 설정 훅
 * 설정 로드/저장, 로컬 상태 관리
 */
import { useState, useEffect, useCallback } from "react";

export interface RoomSettings {
  font_size: number;
  background_image_url: string | null;
  background_enabled: boolean;
  character_nickname: string | null;
  multi_image: boolean;
  response_length: number;
  positivity_bias: boolean;
  anti_impersonation: boolean;
  realtime_output: boolean;
}

const DEFAULT_SETTINGS: RoomSettings = {
  font_size: 16,
  background_image_url: null,
  background_enabled: true,
  character_nickname: null,
  multi_image: false,
  response_length: 2000,
  positivity_bias: false,
  anti_impersonation: true,
  realtime_output: true,
};

function normalizeSettings(raw: Record<string, unknown> | null): RoomSettings {
  if (!raw) return DEFAULT_SETTINGS;
  return {
    font_size: typeof raw.font_size === "number" ? raw.font_size : 16,
    background_image_url:
      raw.background_image_url == null ? null : String(raw.background_image_url),
    background_enabled:
      typeof raw.background_enabled === "boolean"
        ? raw.background_enabled
        : Number(raw.background_enabled) === 1,
    character_nickname:
      raw.character_nickname == null ? null : String(raw.character_nickname),
    multi_image:
      typeof raw.multi_image === "boolean"
        ? raw.multi_image
        : Number(raw.multi_image) === 1,
    response_length:
      typeof raw.response_length === "number" ? raw.response_length : 2000,
    positivity_bias:
      typeof raw.positivity_bias === "boolean"
        ? raw.positivity_bias
        : Number(raw.positivity_bias) === 1,
    anti_impersonation:
      typeof raw.anti_impersonation === "boolean"
        ? raw.anti_impersonation
        : Number(raw.anti_impersonation) === 1,
    realtime_output:
      typeof raw.realtime_output === "boolean"
        ? raw.realtime_output
        : Number(raw.realtime_output) === 1,
  };
}

export function useRoomSettings(roomId: number) {
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }
    fetch(`/api/chat/room-settings?room_id=${roomId}`)
      .then((res) => res.json())
      .then((data: { settings?: Record<string, unknown> }) => {
        if (data.settings) setSettings(normalizeSettings(data.settings));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [roomId]);

  const updateSetting = useCallback(
    async <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        const payload: Record<string, unknown> = { room_id: roomId, [key]: value };
        await fetch("/api/chat/room-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Failed to save setting:", error);
      }
    },
    [roomId]
  );

  const updateMultiple = useCallback(
    async (updates: Partial<RoomSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
      try {
        await fetch("/api/chat/room-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomId, ...updates }),
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },
    [roomId]
  );

  return { settings, isLoading, updateSetting, updateMultiple };
}
