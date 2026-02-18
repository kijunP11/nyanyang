/**
 * 채팅 헤더 바
 * 뒤로가기, 캐릭터 아바타/이름, 모델 배지, 메뉴(모델선택, 메모리, 브랜치)
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Brain, Menu, Settings, Palette, PanelRight } from "lucide-react";
import { ModelSelector, type AIModel } from "./model-selector";
import { JellyDisplay } from "./jelly-display";

interface BranchInfo {
  branch_name: string;
  message_count: number;
  is_active: boolean;
}

interface CharacterInfo {
  display_name: string | null;
  avatar_url: string | null;
  recommended_model: string | null;
}

interface ChatHeaderBarProps {
  character: CharacterInfo;
  roomTitle: string;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onMemoryClick: () => void;
  branches: BranchInfo[];
  onSwitchBranch: (branchName: string) => void;
  onConversationSettingsClick?: () => void;
  onCustomizingClick?: () => void;
  onSettingsPanelClick?: () => void;
  jellyBalance?: number;
  jellyIsLow?: boolean;
  jellyIsDepleted?: boolean;
  onJellyClick?: () => void;
}

export function ChatHeaderBar({
  character,
  roomTitle,
  selectedModel,
  onModelChange,
  onMemoryClick,
  branches,
  onSwitchBranch,
  onConversationSettingsClick,
  onCustomizingClick,
  onSettingsPanelClick,
  jellyBalance,
  jellyIsLow,
  jellyIsDepleted,
  onJellyClick,
}: ChatHeaderBarProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative flex items-center justify-between bg-[#232323]/90 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.display_name ?? undefined}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3f3f46]">
            <span className="text-lg font-semibold text-white">
              {(character.display_name ?? "?")[0]}
            </span>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-white">{character.display_name}</h2>
          <p className="text-sm text-[#9ca3af]">{roomTitle || "알수없음"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onJellyClick != null && (
          <JellyDisplay
            balance={jellyBalance ?? 0}
            isLow={jellyIsLow ?? false}
            isDepleted={jellyIsDepleted ?? false}
            onClick={onJellyClick}
          />
        )}
        <span className="rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white">
          {selectedModel.toUpperCase().replace("GEMINI-", "").replace("-", " ")}
          {character.recommended_model === selectedModel && (
            <span className="ml-1 text-[10px] opacity-80">권장</span>
          )}
        </span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-4 top-full z-50 mt-2 w-56 rounded-lg bg-[#232323] p-2 shadow-lg"
        >
          <div className="mb-2 border-b border-[#3f3f46] pb-2">
            <p className="px-3 py-1 text-xs text-[#9ca3af]">AI 모델</p>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={(model) => {
                onModelChange(model);
                setShowMenu(false);
              }}
            />
          </div>

          {onConversationSettingsClick && (
            <button
              type="button"
              onClick={() => {
                onConversationSettingsClick();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
              대화 설정
            </button>
          )}
          {onCustomizingClick && (
            <button
              type="button"
              onClick={() => {
                onCustomizingClick();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              <Palette className="h-4 w-4" />
              커스터마이징
            </button>
          )}
          {onSettingsPanelClick && (
            <button
              type="button"
              onClick={() => {
                onSettingsPanelClick();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              <PanelRight className="h-4 w-4" />
              설정 패널
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onMemoryClick();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <Brain className="h-4 w-4" />
            메모리 관리
          </button>

          {branches.length > 1 && (
            <div className="mt-2 border-t border-[#3f3f46] pt-2">
              <p className="px-3 py-1 text-xs text-[#9ca3af]">대화 분기</p>
              {branches.map((branch) => (
                <button
                  key={branch.branch_name}
                  onClick={() => {
                    onSwitchBranch(branch.branch_name);
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                    branch.is_active
                      ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <span>{branch.branch_name}</span>
                  <span className="text-xs text-[#9ca3af]">{branch.message_count}개</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
