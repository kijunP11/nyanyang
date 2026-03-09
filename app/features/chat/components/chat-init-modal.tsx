/**
 * 대화 설정 모달 — Figma 픽셀 퍼펙트 (906:8149)
 *
 * 캐릭터 상세 → "대화하기" 클릭 시 표시.
 * AI 모델 선택, 세션 이름, 시작 설정, 프롬프트 미리보기.
 */
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from "~/core/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/* ── 모델 데이터 (Figma 하드코딩) ── */

interface ChatModel {
  id: string;
  name: string;
  desc: string;
  badge: "HOT" | "권장" | "NEW" | null;
  cost: string;
}

const CHAT_MODELS: ChatModel[] = [
  {
    id: "gemini-2.5-pro-ivy",
    name: "Ivy(아이비) - Gemini 2.5 Pro",
    desc: "전개가 빠르고 표현이 풍부해요.",
    badge: "HOT",
    cost: "나냥젤리 10개",
  },
  {
    id: "gemini-2.5-pro-pine",
    name: "Pine(파인) - Gemini 2.5 Pro",
    desc: "감정이 섬세하고 부드럽게 반응해요.",
    badge: "HOT",
    cost: "나냥젤리 10개",
  },
  {
    id: "claude-sonnet-3.7",
    name: "Mint Plus(민트 플러스) - Claude Sonnet 3.7",
    desc: "더 적극적으로, 풍부하게 나 대신 서사를 만들어가요.",
    badge: "권장",
    cost: "나냥젤리 10개",
  },
  {
    id: "claude-sonnet-4",
    name: "Mint(민트) - Claude Sonnet 4",
    desc: "알아서 척척척, 나 대신 서사를 만들어가요.",
    badge: "NEW",
    cost: "나냥젤리 10개",
  },
  {
    id: "opus-cold",
    name: "Pine(파인) - Opus",
    desc: "차갑게 반응해서 관계를 쌓기가 한층 어려워요.",
    badge: null,
    cost: "나냥코인 10개",
  },
  {
    id: "opus-warm",
    name: "Pine(파인) - Opus",
    desc: "차갑게 반응해서 관계를 쌓기가 한층 어려워요.",
    badge: null,
    cost: "나냥젤리 10개",
  },
];

/* ── 뱃지 스타일 ── */

const BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  HOT: { bg: "#fee4e2", border: "#f04438", text: "#f04438" },
  "권장": { bg: "#d1fadf", border: "#12b76a", text: "#12b76a" },
  NEW: { bg: "#d1e9ff", border: "#2e90fa", text: "#2e90fa" },
  LOW: { bg: "#fef0c7", border: "#f79009", text: "#f79009" },
};

/* ── 인라인 SVG ── */

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="#414651"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 11.6667 6.66667"
      fill="none"
    >
      <path
        d="M0.833333 0.833333L5.83333 5.83333L10.8333 0.833333"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Props ── */

interface ChatInitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName: string;
  characterDescription: string;
  onStartChat: (model: string) => void;
  isLoading?: boolean;
  defaultSessionName?: string;
}

/* ── Component ── */

export function ChatInitModal({
  open,
  onOpenChange,
  characterName,
  characterDescription,
  onStartChat,
  isLoading,
  defaultSessionName = "",
}: ChatInitModalProps) {
  const [selectedModel, setSelectedModel] = useState<ChatModel>(CHAT_MODELS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [startSettingsOpen, setStartSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const startSettingsRef = useRef<HTMLDivElement>(null);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setSelectedModel(CHAT_MODELS[0]);
      setDropdownOpen(false);
      setSessionName(defaultSessionName);
      setStartSettingsOpen(false);
    }
  }, [open]);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (startSettingsRef.current && !startSettingsRef.current.contains(e.target as Node)) {
        setStartSettingsOpen(false);
      }
    }
    if (dropdownOpen || startSettingsOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen, startSettingsOpen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed top-[50%] left-[50%] z-50 flex max-h-[90vh] w-[400px] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-[8px] bg-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* ── 헤더 (고정) ── */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#d5d7da] p-[24px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)]">
            <span className="text-[20px] font-semibold leading-[30px] text-black">
              대화 설정
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="transition-opacity hover:opacity-70"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── 스크롤 영역 ── */}
          <div className="flex-1 overflow-y-auto px-[24px] pb-[24px]">
            {/* AI 모델 */}
            <div className="mt-[24px]">
              <label className="mb-[6px] block text-[20px] font-semibold leading-[30px] text-black">
                AI 모델
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* 드롭다운 트리거 */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex w-full items-center justify-between rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[10px] text-left shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:border-[#a4a7ae]"
                >
                  <div className="flex min-w-0 items-center gap-[8px]">
                    {selectedModel.badge && (
                      <span
                        className="shrink-0 rounded-[6px] border px-[8px] py-[4px] text-[12px] leading-[16px]"
                        style={{
                          backgroundColor: BADGE_STYLES[selectedModel.badge].bg,
                          borderColor: BADGE_STYLES[selectedModel.badge].border,
                          color: BADGE_STYLES[selectedModel.badge].text,
                        }}
                      >
                        {selectedModel.badge}
                      </span>
                    )}
                    <span className="truncate text-[16px] leading-[24px] text-[#181d27]">
                      {selectedModel.name}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={`shrink-0 text-[#717680] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* 선택된 모델 비용 칩 */}
                {!dropdownOpen && (
                  <div className="mt-[6px] flex items-center gap-[4px]">
                    <img
                      src="/icons/pawprint.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="shrink-0"
                    />
                    <span className="text-[14px] font-semibold leading-[20px] text-[#36c4b3]">
                      {selectedModel.cost}
                    </span>
                  </div>
                )}

                {/* 드롭다운 메뉴 */}
                {dropdownOpen && (
                  <div className="absolute left-[50%] top-[calc(100%+4px)] z-20 w-[360px] translate-x-[-50%] overflow-hidden rounded-[8px] border border-[#e9eaeb] bg-white shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]">
                    {CHAT_MODELS.map((model, idx) => (
                      <div key={model.id + idx}>
                        {idx > 0 && <div className="h-px bg-[#e9eaeb]" />}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModel(model);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full flex-col gap-[4px] px-[16px] py-[10px] text-left transition-colors hover:bg-[#f5f5f5] ${
                            selectedModel === model ? "bg-[#f9fafb]" : ""
                          }`}
                        >
                          {/* 뱃지 + 이름 */}
                          <div className="flex items-center gap-[6px]">
                            {model.badge && (
                              <span
                                className="rounded-[10px] border px-[8px] py-[1px] text-[12px] font-bold leading-[18px]"
                                style={{
                                  backgroundColor: BADGE_STYLES[model.badge].bg,
                                  borderColor: BADGE_STYLES[model.badge].border,
                                  color: BADGE_STYLES[model.badge].text,
                                }}
                              >
                                {model.badge}
                              </span>
                            )}
                            <span className="text-[14px] font-medium leading-[20px] text-[#181d27]">
                              {model.name}
                            </span>
                          </div>
                          {/* 설명 + 비용 */}
                          <div className="flex items-end justify-between gap-[8px]">
                            <span className="text-[12px] leading-[18px] text-[#414651]">
                              {model.desc}
                            </span>
                            <span className="flex shrink-0 items-center gap-[4px] rounded-[2px] border border-[#91e4d4] bg-[#e9faf7] px-[6px] py-[4px]">
                              <img
                                src="/icons/pawprint.svg"
                                alt=""
                                width={14}
                                height={14}
                                className="shrink-0"
                              />
                              <span className="whitespace-nowrap text-[12px] font-bold leading-[18px] text-[#36c4b3]">
                                {model.cost}
                              </span>
                            </span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 세션에서 사용할 이름 */}
            <div className="mt-[24px]">
              <label className="mb-[6px] block text-[20px] font-semibold leading-[30px] text-black">
                세션에서 사용할 이름
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[10px] text-[16px] leading-[24px] text-[#181d27] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#717680]"
              />
            </div>

            {/* 시작 설정 선택 */}
            <div className="mt-[24px]">
              <label className="mb-[6px] block text-[20px] font-semibold leading-[30px] text-black">
                시작 설정 선택
              </label>
              <div className="relative" ref={startSettingsRef}>
                <button
                  type="button"
                  onClick={() => setStartSettingsOpen(!startSettingsOpen)}
                  className="flex w-full items-center justify-between rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[10px] text-left shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:border-[#a4a7ae]"
                >
                  <span className="text-[16px] leading-[24px] text-[#717680]">
                    기본 시작 설정
                  </span>
                  <ChevronDownIcon
                    className={`shrink-0 text-[#717680] transition-transform ${startSettingsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {startSettingsOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-full overflow-hidden rounded-[8px] border border-[#e9eaeb] bg-white shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]">
                    <button
                      type="button"
                      onClick={() => setStartSettingsOpen(false)}
                      className="w-full px-[16px] py-[10px] text-left text-[14px] font-medium leading-[20px] text-[#181d27] hover:bg-[#f5f5f5]"
                    >
                      기본 시작 설정
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 프롬프트 미리보기 */}
            <div className="mt-[24px] overflow-y-auto rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] px-[14px] py-[10px]">
              <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-black">
                {characterDescription || `${characterName}의 상세 설명이 없습니다.`}
              </p>
            </div>
          </div>

          {/* ── 하단 액션바 (고정) ── */}
          <div className="flex shrink-0 gap-[12px] border-t border-[#d5d7da] p-[24px] shadow-[0px_-4px_16px_0px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex flex-1 items-center justify-center rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-80"
            >
              뒤로가기
            </button>
            <button
              type="button"
              onClick={() => onStartChat(selectedModel.id)}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "생성 중..." : "대화 시작"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
