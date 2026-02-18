/**
 * F4 기존 캐릭터 수정 — 캐릭터 선택 그리드
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";

export interface SelectedCharacter {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string | null;
  appearance: string | null;
  description: string | null;
}

interface CharacterSelectorProps {
  onSelect: (character: SelectedCharacter) => void;
  onCancel: () => void;
}

interface ApiCharacter {
  character_id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  avatar_url: string | null;
  appearance?: string | null;
}

export function CharacterSelector({ onSelect, onCancel }: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<ApiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/characters/my?limit=50");
        if (!res.ok) {
          setError("캐릭터 목록을 불러올 수 없습니다.");
          return;
        }
        const data = (await res.json()) as { characters?: ApiCharacter[] };
        if (!cancelled && data.characters) {
          setCharacters(data.characters);
        }
      } catch {
        if (!cancelled) setError("캐릭터 목록을 불러올 수 없습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (c: ApiCharacter) => {
    onSelect({
      id: c.character_id,
      name: c.name,
      displayName: c.display_name ?? c.name,
      avatarUrl: c.avatar_url,
      appearance: c.appearance ?? null,
      description: c.description ?? null,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-[#535862] dark:text-[#94969C]">
          캐릭터 목록 불러오는 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#E9EAEB] p-6 dark:border-[#333741]">
        <p className="text-sm text-red-500">{error}</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 text-sm text-[#41C7BD] hover:underline"
        >
          닫기
        </button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="rounded-xl border border-[#E9EAEB] p-8 text-center dark:border-[#333741]">
        <p className="mb-2 text-sm font-medium text-[#181D27] dark:text-white">
          아직 생성한 캐릭터가 없습니다
        </p>
        <p className="mb-4 text-xs text-[#535862] dark:text-[#94969C]">
          캐릭터를 먼저 만든 후 수정할 수 있어요
        </p>
        <Link
          to="/characters/create"
          className="inline-flex items-center rounded-lg bg-[#41C7BD] px-4 py-2 text-sm font-semibold text-white hover:bg-[#38b5ab]"
        >
          캐릭터 만들기
        </Link>
        <button
          type="button"
          onClick={onCancel}
          className="ml-3 text-sm text-[#535862] hover:underline dark:text-[#94969C]"
        >
          닫기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#181D27] dark:text-white">
          수정할 캐릭터를 선택하세요
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[#535862] hover:underline dark:text-[#94969C]"
        >
          닫기
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {characters.map((c) => (
          <button
            key={c.character_id}
            type="button"
            onClick={() => handleSelect(c)}
            className="flex flex-col overflow-hidden rounded-xl border border-[#E9EAEB] text-left transition-colors hover:border-[#41C7BD] hover:bg-[#F5F5F5] dark:border-[#333741] dark:hover:bg-[#1F242F]"
          >
            <div className="aspect-square w-full bg-[#F5F5F5] dark:bg-[#1F242F]">
              {c.avatar_url ? (
                <img
                  src={c.avatar_url}
                  alt={c.display_name ?? c.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#A4A7AE] dark:text-[#717680]">
                  <span className="text-2xl">?</span>
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-sm font-semibold text-[#181D27] dark:text-white">
                {c.display_name ?? c.name}
              </p>
              <p className="line-clamp-2 text-xs text-[#535862] dark:text-[#94969C]">
                {c.description || "설명 없음"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
