/**
 * 채팅 헤더 바 — Figma 픽셀 퍼펙트 (906:16273)
 * "캐릭터명 >" + 3-dot 메뉴
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ModelSelector, type AIModel } from "./model-selector";
import { JellyDisplay } from "./jelly-display";

/* ── Figma 인라인 SVG (Untitled UI) ── */

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 5.33333 9.33333" fill="none">
      <path
        d="M0.666667 8.66667L4.66667 4.66667L0.666667 0.666667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreVerticalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 4 18" fill="none">
      <path d="M2 10C2.55228 10 3 9.55228 3 9C3 8.44772 2.55228 8 2 8C1.44772 8 1 8.44772 1 9C1 9.55228 1.44772 10 2 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 3C2.55228 3 3 2.55228 3 2C3 1.44772 2.55228 1 2 1C1.44772 1 1 1.44772 1 2C1 2.55228 1.44772 3 2 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17C2.55228 17 3 16.5523 3 16C3 15.4477 2.55228 15 2 15C1.44772 15 1 15.4477 1 16C1 16.5523 1.44772 17 2 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── 메뉴 아이콘 (Figma Untitled UI) ── */

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="13.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="6.5" cy="12.5" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PanelRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4 4 4 0 0 0 3 3.87V17a5 5 0 0 0 10 0v-2.13A4 4 0 0 0 20 11a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Types ── */

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
    <div className="relative flex items-center justify-between border-b border-[#d5d7da] bg-white px-[24px] py-[17px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.07)]">
      {/* 좌측: 캐릭터 이름 + > */}
      <div className="flex items-center gap-[4px]">
        <span className="text-[20px] font-semibold leading-[30px] text-black">
          {character.display_name ?? roomTitle}
        </span>
        <span className="text-[#717680]">
          <ChevronRightIcon />
        </span>
      </div>

      {/* 우측: 더보기 메뉴 */}
      <div className="flex items-center gap-[8px]">
        {onJellyClick != null && (
          <JellyDisplay
            balance={jellyBalance ?? 0}
            isLow={jellyIsLow ?? false}
            isDepleted={jellyIsDepleted ?? false}
            onClick={onJellyClick}
          />
        )}
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center justify-center text-[#181d27] transition-opacity hover:opacity-70"
        >
          <MoreVerticalIcon />
        </button>
      </div>

      {/* 메뉴 드롭다운 */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-[24px] top-full z-50 mt-[4px] w-[220px] overflow-hidden rounded-[8px] border border-[#e9eaeb] bg-white shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
        >
          {/* AI 모델 */}
          <div className="border-b border-[#e9eaeb] px-[12px] py-[8px]">
            <p className="mb-[4px] text-[12px] leading-[18px] text-[#717680]">AI 모델</p>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={(model) => {
                onModelChange(model);
                setShowMenu(false);
              }}
            />
          </div>

          {/* 메뉴 아이템 */}
          <div className="py-[4px]">
            {onConversationSettingsClick && (
              <button
                type="button"
                onClick={() => {
                  onConversationSettingsClick();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-[8px] px-[16px] py-[10px] text-[14px] font-medium leading-[20px] text-[#414651] hover:bg-[#f5f5f5]"
              >
                <SettingsIcon />
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
                className="flex w-full items-center gap-[8px] px-[16px] py-[10px] text-[14px] font-medium leading-[20px] text-[#414651] hover:bg-[#f5f5f5]"
              >
                <PaletteIcon />
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
                className="flex w-full items-center gap-[8px] px-[16px] py-[10px] text-[14px] font-medium leading-[20px] text-[#414651] hover:bg-[#f5f5f5]"
              >
                <PanelRightIcon />
                설정 패널
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onMemoryClick();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-[8px] px-[16px] py-[10px] text-[14px] font-medium leading-[20px] text-[#414651] hover:bg-[#f5f5f5]"
            >
              <BrainIcon />
              메모리 관리
            </button>
          </div>

          {/* 분기 */}
          {branches.length > 1 && (
            <div className="border-t border-[#e9eaeb] px-[12px] py-[8px]">
              <p className="mb-[4px] text-[12px] leading-[18px] text-[#717680]">대화 분기</p>
              {branches.map((branch) => (
                <button
                  key={branch.branch_name}
                  onClick={() => {
                    onSwitchBranch(branch.branch_name);
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[4px] px-[8px] py-[6px] text-[14px] ${
                    branch.is_active
                      ? "bg-[#36c4b3]/10 font-semibold text-[#36c4b3]"
                      : "text-[#414651] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <span>{branch.branch_name}</span>
                  <span className="text-[12px] text-[#717680]">{branch.message_count}개</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
