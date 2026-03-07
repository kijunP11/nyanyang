import type { Route } from "./+types/create-content";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { data, redirect, useNavigate, useNavigation } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { WizardProvider, useWizard } from "../lib/wizard-context";
import type { CharacterFormData, ExampleDialogue } from "../lib/wizard-types";

export const meta: Route.MetaFunction = () => [
  { title: `새 컨텐츠 만들기 | ${import.meta.env.VITE_APP_NAME}` },
];

/* ─── SVG Icons ─── */
function ChevronLeftIcon({ stroke = "#414651" }: { stroke?: string }) {
  return (
    <svg width="7" height="12" viewBox="0 0 6.67 11.67" fill="none">
      <path d="M5.835 10.835L0.835 5.835L5.835 0.835" stroke={stroke} strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightIcon({ stroke = "white" }: { stroke?: string }) {
  return (
    <svg width="7" height="12" viewBox="0 0 6.67 11.67" fill="none">
      <path d="M0.835 10.835L5.835 5.835L0.835 0.835" stroke={stroke} strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
      <path d="M1 1L7 7L13 1" stroke="#181D27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronUpIcon() {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
      <path d="M1 7L7 1L13 7" stroke="#181D27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HelpCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M8.09 8C8.3251 7.33167 8.78915 6.76811 9.39995 6.40913C10.0108 6.05016 10.7289 5.91894 11.4272 6.03871C12.1255 6.15849 12.7588 6.52152 13.2151 7.06353C13.6713 7.60553 13.9211 8.29152 13.92 9C13.92 11 10.92 12 10.92 12M11 16H11.01M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z" stroke="#A4A7AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XCloseRedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 11.6667 11.6667" fill="none">
      <path d="M10.8333 0.833333L0.833333 10.8333M0.833333 0.833333L10.8333 10.8333" stroke="#D92D20" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XCloseBadgeIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 7.5 7.5" fill="none">
      <path d="M6.75 0.75L0.75 6.75M0.75 0.75L6.75 6.75" stroke="#717680" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XCloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6L18 18" stroke="#181D27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 15.0033 16.67" fill="none">
      <path d="M14.1683 15.835V14.1683C14.1683 13.2843 13.8171 12.4364 13.192 11.8113C12.5669 11.1862 11.7191 10.835 10.835 10.835H4.16833C3.28428 10.835 2.43643 11.1862 1.81131 11.8113C1.18619 12.4364 0.835 13.2843 0.835 14.1683V15.835M10.835 4.16833C10.835 6.00928 9.34262 7.50167 7.50167 7.50167C5.66072 7.50167 4.16833 6.00928 4.16833 4.16833C4.16833 2.32738 5.66072 0.835 7.50167 0.835C9.34262 0.835 10.835 2.32738 10.835 4.16833Z" stroke="#717680" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MessageCircleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16.67 16.67" fill="none">
      <path d="M15.835 7.91836C15.8379 9.01825 15.5809 10.1033 15.085 11.085C14.497 12.2615 13.5931 13.251 12.4746 13.9428C11.356 14.6345 10.0669 15.0012 8.75169 15.0017C7.6518 15.0046 6.56679 14.7476 5.58502 14.2517L0.835023 15.835L2.41836 11.085C1.92247 10.1033 1.66549 9.01825 1.66836 7.91836C1.66886 6.60315 2.03553 5.31407 2.72729 4.19548C3.41904 3.0769 4.40857 2.173 5.58502 1.58502C6.56679 1.08913 7.6518 0.832156 8.75169 0.835024H9.16836C10.9053 0.93085 12.5459 1.66399 13.776 2.89407C15.0061 4.12415 15.7392 5.76473 15.835 7.50169V7.91836Z" stroke="#717680" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 13.3367 13.3367" fill="none">
      <path d="M6.66833 0.835V12.5017M0.835 6.66833H12.5017" stroke="#414651" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg width="14" height="2" viewBox="0 0 13.3367 1.67" fill="none">
      <path d="M0.835 0.835H12.5017" stroke="#414651" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 17 18.6667" fill="none">
      <path d="M1 4.33333H2.66667M2.66667 4.33333H16M2.66667 4.33333V16C2.66667 16.442 2.84226 16.8659 3.15482 17.1785C3.46738 17.4911 3.89131 17.6667 4.33333 17.6667H12.6667C13.1087 17.6667 13.5326 17.4911 13.8452 17.1785C14.1577 16.8659 14.3333 16.442 14.3333 16V4.33333H2.66667ZM5.16667 4.33333V2.66667C5.16667 2.22464 5.34226 1.80072 5.65482 1.48816C5.96738 1.17559 6.39131 1 6.83333 1H10.1667C10.6087 1 11.0326 1.17559 11.3452 1.48816C11.6577 1.80072 11.8333 2.22464 11.8333 2.66667V4.33333M6.83333 8.5V13.5M10.1667 8.5V13.5" stroke="#717680" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 17 16.2678" fill="none">
      <path d="M8.50002 15.2678H16M12.25 1.51777C12.5815 1.18625 13.0312 1 13.5 1C13.7322 1 13.962 1.04572 14.1765 1.13456C14.391 1.2234 14.5859 1.35361 14.75 1.51777C14.9142 1.68192 15.0444 1.8768 15.1332 2.09127C15.2221 2.30575 15.2678 2.53562 15.2678 2.76777C15.2678 2.99991 15.2221 3.22979 15.1332 3.44426C15.0444 3.65874 14.9142 3.85361 14.75 4.01777L4.33335 14.4344L1.00002 15.2678L1.83335 11.9344L12.25 1.51777Z" stroke="#717680" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MoreVerticalIcon() {
  return (
    <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
      <circle cx="2" cy="2" r="1" fill="#717680" />
      <circle cx="2" cy="8" r="1" fill="#717680" />
      <circle cx="2" cy="14" r="1" fill="#717680" />
    </svg>
  );
}
function ImageFileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <rect x="0.5" y="0.5" width="14" height="14" rx="1.5" stroke="#717680" strokeWidth="1.33" />
      <circle cx="4.5" cy="4.5" r="1.5" stroke="#717680" strokeWidth="1.33" />
      <polyline points="14.5 9.5 10.5 5.5 1.5 14.5" stroke="#717680" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M17.367 3.842a4.583 4.583 0 0 0-6.484 0L10 4.725l-.883-.883a4.584 4.584 0 1 0-6.484 6.483l.884.883L10 17.692l6.483-6.484.884-.883a4.583 4.583 0 0 0 0-6.483Z" stroke="#414651" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlaceholderSilhouette({ w = 125, h = 159 }: { w?: number; h?: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 125 159" fill="none">
      <path d="M125 132.477C109.414 148.82 87.4376 159 63.0834 159C38.7291 159 15.6466 148.298 0 131.229L42.9363 116.006L43.1972 105.137C37.9281 105.553 35.6887 104.853 34.7364 104.189C34.2935 103.88 34.4293 103.198 34.9556 103.079C38.2584 102.333 39.186 99.9383 39.186 99.9383C28.1664 103.207 23.2492 97.0399 22.0207 95.1164C21.8339 94.8244 21.9281 94.4428 22.2229 94.2635C26.4934 91.6649 26.2202 89.2006 26.2202 89.2006C19.2442 89.6116 16.7748 88.5811 15.9723 88.0357C15.784 87.9075 15.7932 87.6294 15.9892 87.5181C20.1702 85.1327 19.9973 82.0427 19.9973 82.0427C17.4986 84.2768 15.6127 84.629 14.6434 84.6182C14.3641 84.6151 14.2375 84.2613 14.452 84.0821C19.7581 79.6001 18.7025 76.745 18.7025 76.745C13.5214 67.2757 12.5089 60.8501 13.6341 50.9282C14.7592 41.0079 21.5176 26.6905 25.7958 18.5747C30.0755 10.4573 34.3552 6.96257 44.8285 2.67833C52.7058 -0.54297 58.0366 1.40062 60.1927 2.56245C60.8687 2.92552 61.6897 2.89927 62.3287 2.47285C69.9575 -2.63951 78.6034 0.822795 88.072 6.96257C97.9819 13.3882 108.653 35.4274 110.596 40.5861C112.539 45.7433 112.96 47.6884 113.382 58.0027C113.804 68.317 109.806 71.6712 108.004 75.0547C106.683 77.5313 108.477 81.8867 109.529 84.0373C109.801 84.5935 109.25 85.2038 108.674 84.9751C106.199 83.9894 103.836 81.1976 103.836 81.1976C103.084 83.5012 106.19 87.5444 107.555 89.1713C107.863 89.5374 107.711 90.1044 107.258 90.2558C102.911 91.7236 98.1486 88.9194 98.1486 88.9194C97.4248 90.3238 100.373 94.5664 101.559 96.1793C101.867 96.5965 101.882 97.165 101.592 97.5945C98.0066 102.926 86.3419 100.858 86.7184 101.826C87.0163 102.594 89.532 103.714 90.7451 104.216C91.0445 104.341 91.0862 104.76 90.8068 104.927C87.95 106.64 81.2009 105.378 81.2009 105.378V116.281L124.997 132.479L125 132.477Z" fill="#C6C6C6" />
    </svg>
  );
}

/* ─── Constants ─── */
const TAB_LABELS = ["캐릭터 설정", "프롬프트", "인트로", "키워드북", "캐릭터 상세", "이미지 추가"];
function getPageNumber(tab: number): number {
  if (tab <= 1) return 1;
  if (tab <= 3) return 2;
  if (tab === 4) return 3;
  return 4;
}

const GENRE_OPTIONS = [
  { value: "romance", label: "로맨스" },
  { value: "rofan", label: "로판" },
  { value: "sf_fantasy", label: "SF/판타지" },
  { value: "daily_modern", label: "일상/현대" },
  { value: "martial_arts", label: "무협" },
  { value: "period", label: "시대" },
  { value: "bl", label: "BL" },
  { value: "gl", label: "GL" },
  { value: "secondary", label: "2차 창작" },
  { value: "utility", label: "유틸리티" },
  { value: "other", label: "기타" },
];
const TARGET_OPTIONS = [
  { value: "male", label: "남성향" },
  { value: "female", label: "여성향" },
  { value: "all", label: "전체" },
];
interface ModelOption {
  id: string;
  badge: "HOT" | "권장" | "NEW" | "일반";
  name: string;
  coinCost?: number;
}
const MODEL_OPTIONS: ModelOption[] = [
  { id: "ivy", badge: "HOT", name: "Ivy(아이비) - Gemini 2.5 Pro" },
  { id: "pine-gemini", badge: "HOT", name: "Pine(파인) - Gemini 2.5 Pro", coinCost: 10 },
  { id: "mint-plus", badge: "권장", name: "Mint Plus(민트 플러스) - Claude Sonnet 3.7", coinCost: 10 },
  { id: "mint", badge: "NEW", name: "Mint(민트) - Claude Sonnet 4", coinCost: 10 },
  { id: "pine-opus", badge: "일반", name: "Pine(파인) - Opus", coinCost: 10 },
];
const AGE_OPTIONS = [
  { value: "everyone", label: "미성년자도 가능" },
  { value: "adult", label: "성인만" },
];
const VISIBILITY_OPTIONS = [
  { value: "public", label: "공개" },
  { value: "private", label: "비공개" },
];
const BADGE_STYLES: Record<string, string> = {
  HOT: "bg-[#fee4e2] border-[#f04438] text-[#f04438]",
  "권장": "bg-[#e9faf7] border-[#36c4b3] text-[#28a393]",
  NEW: "bg-[#e9faf7] border-[#36c4b3] text-[#28a393]",
  "일반": "bg-[#f5f5f5] border-[#d5d7da] text-[#717680]",
};

/* ─── Common UI Helpers ─── */
function SectionTitle({ label, required, description, children }: {
  label: string;
  required?: boolean;
  description?: string | string[];
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-[18px] font-semibold leading-[28px] text-[#414651] dark:text-[#CECFD2]">
          {label}
          {required && <span className="text-[#f04438]"> *</span>}
        </h3>
        {description && (
          <p className="mt-[6px] text-[14px] font-medium leading-[20px] text-[#717680] dark:text-[#9ca3af]">
            {Array.isArray(description)
              ? description.map((d, i) => (
                  <span key={i}>
                    {d}
                    {i < description.length - 1 && <br />}
                  </span>
                ))
              : description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function FormInput({ value, onChange, maxLength, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        className="h-[44px] w-full rounded-[8px] border border-[#d5d7da] px-[14px] text-[14px] font-normal text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#a4a7ae] focus:border-[#535862] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white dark:placeholder:text-[#555] dark:focus:border-[#94969C]"
      />
      {maxLength !== undefined && (
        <p className="mt-[6px] text-right text-[14px] text-[#535862] dark:text-[#94969C]">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function FormTextarea({ value, onChange, maxLength, placeholder, height = "h-[120px]" }: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  height?: string;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        className={`${height} w-full resize-none rounded-[8px] border border-[#d5d7da] px-[14px] py-[10px] text-[14px] font-normal text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#a4a7ae] focus:border-[#535862] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white dark:placeholder:text-[#555] dark:focus:border-[#94969C]`}
      />
      {maxLength !== undefined && (
        <p className="mt-[6px] text-right text-[14px] text-[#535862] dark:text-[#94969C]">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function FormSelect({ value, onChange, options, placeholder, renderOption, renderValue }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  renderOption?: (opt: { value: string; label: string }, isSelected: boolean) => ReactNode;
  renderValue?: (opt: { value: string; label: string } | undefined) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-[44px] w-full items-center justify-between rounded-[8px] border border-[#d5d7da] bg-white px-[14px] text-left text-[14px] font-medium shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none dark:border-[#333741] dark:bg-[#1F242F] ${isOpen ? "rounded-b-none border-b-0" : ""}`}
      >
        <span className={selected ? "text-[#414651] dark:text-[#CECFD2]" : "text-[#a4a7ae]"}>
          {renderValue ? renderValue(selected) : selected?.label || placeholder}
        </span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 max-h-[484px] overflow-y-auto rounded-b-[8px] border border-t-0 border-[#e9eaeb] bg-white shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)] dark:border-[#333741] dark:bg-[#1F242F]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="flex w-full items-center px-[16px] py-[10px] text-left text-[14px] font-medium text-[#414651] hover:bg-[#fafafa] dark:text-[#CECFD2] dark:hover:bg-[#333741]"
            >
              {renderOption ? renderOption(opt, opt.value === value) : opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AutoGenButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[8px] bg-[#e9faf7] px-[14px] py-[8px] text-[14px] font-semibold text-[#28a393]"
    >
      전체 자동 생성
    </button>
  );
}

/* ─── Tab 1: 캐릭터 설정 ─── */
function CharacterSetupTab() {
  const { state, dispatch } = useWizard();
  const { formData } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({ type: "UPDATE_FIELD", payload: { field: "avatar_url", value: reader.result as string } });
    };
    reader.readAsDataURL(file);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || formData.tags.length >= 10) return;
    if (!formData.tags.includes(tag)) {
      dispatch({ type: "UPDATE_FIELD", payload: { field: "tags", value: [...formData.tags, tag] } });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    dispatch({ type: "UPDATE_FIELD", payload: { field: "tags", value: formData.tags.filter((t) => t !== tag) } });
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* 캐릭터 이미지 */}
      <div className="flex flex-col gap-[4px]">
        <SectionTitle label="캐릭터 이미지" required description="이미지를 등록해주세요. 부적절한 이미지는 제한될 수 있어요." />
        <div className="mt-[8px] flex items-start gap-[20px]">
          <div className="relative h-[140px] w-[140px] flex-shrink-0 overflow-hidden rounded-[8px] bg-[#ededed] dark:bg-[#333741]">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PlaceholderSilhouette w={80} h={100} />
              </div>
            )}
            <span className="absolute bottom-[8px] left-[8px] rounded-[6px] bg-[rgba(0,0,0,0.8)] px-[8px] py-[4px] text-[12px] font-semibold text-white">
              3:4
            </span>
          </div>
          <div className="flex flex-col gap-[12px]">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex gap-[12px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[8px] border border-[#d5d7da] bg-white px-[16px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
              >
                업로드하기
              </button>
              <button
                type="button"
                className="rounded-[8px] border border-[#d5d7da] bg-white px-[16px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
              >
                편집
              </button>
            </div>
            <p className="text-[14px] leading-[20px] text-[#414651] dark:text-[#CECFD2]">
              PNG, JPG, WebP 이미지 파일만 올릴 수 있어요.용량은 00mb이하, 3:4 비율을 권장해요.
            </p>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-[#d9d9d9] dark:bg-[#333741]" />

      {/* 캐릭터 이름 */}
      <div className="flex flex-col gap-[4px]">
        <SectionTitle label="캐릭터 이름" required />
        <div className="flex flex-col gap-[6px]">
          <div className="flex flex-col gap-[8px]">
            <p className="text-[14px] font-medium leading-[20px] text-[#717680] dark:text-[#9ca3af]">
              2~12자 이내로 입력해주세요. 특수문자, 이모지 제외
            </p>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", payload: { field: "name", value: e.target.value.slice(0, 12) } })}
              placeholder="캐릭터 이름을 입력해주세요"
              className="h-[44px] w-full rounded-[8px] border border-[#d5d7da] px-[14px] text-[16px] font-normal text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#717680] focus:border-[#535862] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white dark:placeholder:text-[#555] dark:focus:border-[#94969C]"
            />
          </div>
          <p className="text-right text-[14px] text-[#535862] dark:text-[#94969C]">
            {formData.name.length}/12
          </p>
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-[#d9d9d9] dark:bg-[#333741]" />

      {/* 한줄 소개 */}
      <div className="flex flex-col gap-[4px]">
        <SectionTitle label="한줄 소개" required />
        <div className="flex flex-col gap-[6px]">
          <div className="flex flex-col gap-[8px]">
            <p className="text-[14px] font-medium leading-[20px] text-[#717680] dark:text-[#9ca3af]">
              30자 이내로 입력해주세요.
            </p>
            <textarea
              value={formData.tagline}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", payload: { field: "tagline", value: e.target.value.slice(0, 30) } })}
              placeholder="캐릭터를 소개해주세요"
              className="h-[88px] w-full resize-none rounded-[8px] border border-[#d5d7da] px-[14px] py-[10px] text-[16px] font-normal text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#717680] focus:border-[#535862] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white dark:placeholder:text-[#555] dark:focus:border-[#94969C]"
            />
          </div>
          <p className="text-right text-[14px] text-[#535862] dark:text-[#94969C]">
            {formData.tagline.length}/30
          </p>
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-[#d9d9d9] dark:bg-[#333741]" />

      {/* 태그 */}
      <div className="flex flex-col gap-[4px]">
        <SectionTitle label="태그" required />
        <div className="flex flex-col gap-[6px]">
          <div className="flex flex-col gap-[8px]">
            <p className="text-[14px] font-medium leading-[20px] text-[#717680] dark:text-[#9ca3af]">
              내 컨텐츠를 찾기 쉽도록 태그를 추가해주세요
            </p>
            <div className="flex gap-[8px]">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="태그 추가"
                className="h-[44px] flex-1 rounded-[8px] border border-[#d5d7da] px-[14px] text-[16px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#717680] focus:border-[#535862] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white dark:placeholder:text-[#555] dark:focus:border-[#94969C]"
              />
            </div>
          </div>
          <p className="text-[14px] text-[#535862] dark:text-[#94969C]">
            {formData.tags.length}/10 태그 선택됨
          </p>
        </div>
        {formData.tags.length > 0 && (
          <div className="mt-[4px] flex flex-wrap gap-[6px]">
            {formData.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-[4px] rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] text-[#535862] dark:border-[#333741] dark:bg-[#333741] dark:text-[#94969C]">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}><XCloseBadgeIcon /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 경고 바 */}
      <div className="flex items-center gap-[8px] rounded-[8px] bg-[#f5f5f5] px-[14px] py-[10px] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:bg-[#333741]">
        <div className="flex-shrink-0"><HelpCircleIcon /></div>
        <p className="flex-1 text-[16px] leading-[24px] text-[#717680] dark:text-[#9ca3af]">
          폭력, 혐오, 성적묘사 등의 표현 및 이미지는 규정에 따라 영구적으로 제재될 수 있어요
        </p>
      </div>
    </div>
  );
}

/* ─── Tab 2: 프롬프트 ─── */
function PromptTab() {
  const { state, dispatch } = useWizard();
  const { formData } = state;

  const addExampleDialogue = () => {
    if (formData.example_dialogues.length >= 3) return;
    dispatch({
      type: "ADD_EXAMPLE_DIALOGUE",
      payload: { id: crypto.randomUUID(), user: "", character: "" },
    });
  };

  const removeExampleDialogue = (id: string) => {
    dispatch({ type: "REMOVE_EXAMPLE_DIALOGUE", payload: id });
  };

  return (
    <div className="space-y-[24px]">
      {/* 프롬프트 */}
      <div>
        <SectionTitle label="프롬프트" required description="캐릭터의 행동과 성격을 정의하는 프롬프트를 작성해 주세요." />
        <div className="mt-[8px]">
          <FormTextarea
            value={formData.system_prompt}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "system_prompt", value: v } })}
            maxLength={7000}
            placeholder="프롬프트를 입력해주세요"
          />
        </div>
      </div>

      {/* 스토리 설정 및 정보 */}
      <div>
        <SectionTitle label="스토리 설정 및 정보" required description="스토리의 배경과 세계관을 설명해 주세요." />
        <div className="mt-[8px]">
          <FormInput
            value={formData.description}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "description", value: v } })}
            maxLength={3000}
            placeholder="스토리 설정 및 정보를 입력해주세요"
          />
        </div>
      </div>

      {/* 고급 설정: 추천 답변 */}
      <div>
        <div className="flex items-center gap-[8px]">
          <AutoGenButton />
          <button
            type="button"
            onClick={addExampleDialogue}
            className="rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
          >
            예시 추가
          </button>
        </div>

        {formData.example_dialogues.map((dialogue, idx) => (
          <div key={dialogue.id} className="mt-[16px] overflow-hidden rounded-[8px] border border-[#e9eaeb] shadow-[0px_1px_2px_rgba(10,13,18,0.06),0px_1px_3px_rgba(10,13,18,0.1)] dark:border-[#333741]">
            <div className="flex items-center justify-between border-b border-[#e9eaeb] bg-[#fafafa] px-[20px] py-[12px] dark:border-[#333741] dark:bg-[#0D1117]">
              <span className="text-[14px] font-semibold text-[#414651] dark:text-[#CECFD2]">추천 답변 {idx + 1}</span>
              <button type="button" onClick={() => removeExampleDialogue(dialogue.id)}>
                <XCloseRedIcon />
              </button>
            </div>
            <div className="space-y-[16px] bg-[#fafafa] p-[20px] dark:bg-[#0D1117]">
              <div>
                <div className="mb-[6px] flex items-center gap-[6px]">
                  <UserIcon />
                  <span className="text-[14px] font-medium text-[#717680] dark:text-[#9ca3af]">사용자</span>
                </div>
                <FormInput
                  value={dialogue.user}
                  onChange={(v) => dispatch({ type: "UPDATE_EXAMPLE_DIALOGUE", payload: { id: dialogue.id, data: { user: v } } })}
                  maxLength={500}
                  placeholder="사용자 메시지를 입력해주세요"
                />
              </div>
              <div>
                <div className="mb-[6px] flex items-center gap-[6px]">
                  <MessageCircleIcon />
                  <span className="text-[14px] font-medium text-[#717680] dark:text-[#9ca3af]">캐릭터</span>
                </div>
                <FormInput
                  value={dialogue.character}
                  onChange={(v) => dispatch({ type: "UPDATE_EXAMPLE_DIALOGUE", payload: { id: dialogue.id, data: { character: v } } })}
                  maxLength={500}
                  placeholder="캐릭터 응답을 입력해주세요"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab 3: 인트로 ─── */
function IntroTab() {
  const { state, dispatch } = useWizard();
  const { formData } = state;
  const [suggestions, setSuggestions] = useState<string[]>(
    formData.example_dialogues.length > 0
      ? formData.example_dialogues.slice(0, 3).map((d) => d.user)
      : []
  );

  const addSuggestion = () => {
    if (suggestions.length >= 3) return;
    setSuggestions([...suggestions, ""]);
  };

  const removeSuggestion = () => {
    if (suggestions.length <= 0) return;
    setSuggestions(suggestions.slice(0, -1));
  };

  const updateSuggestion = (idx: number, v: string) => {
    const next = [...suggestions];
    next[idx] = v.slice(0, 200);
    setSuggestions(next);
  };

  return (
    <div className="space-y-[24px]">
      {/* 프롤로그 */}
      <div>
        <SectionTitle label="프롤로그" required description="스토리의 프롤로그를 작성해 주세요">
          <AutoGenButton />
        </SectionTitle>
        <div className="mt-[8px]">
          <FormTextarea
            value={formData.greeting_message}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "greeting_message", value: v } })}
            maxLength={1000}
            placeholder="프롤로그를 입력해주세요"
          />
        </div>
      </div>

      {/* 시작설정 이름 */}
      <div>
        <SectionTitle label="시작설정 이름" required description="시작설정의 이름을 작성해 주세요" />
        <div className="mt-[8px]">
          <FormInput
            value={formData.relationship}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "relationship", value: v } })}
            maxLength={12}
            placeholder="시작설정 이름을 입력해주세요"
          />
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-[#d9d9d9] dark:bg-[#333741]" />

      {/* 고급 설정 */}
      <div>
        <SectionTitle
          label="고급 설정"
          description="AI가 기억하지 않는, 사용자에게만 보이는 가이드 메시지를 추가해 플레이 방법을 안내해보세요."
        />
        <div className="mt-[8px]">
          <FormTextarea
            value={formData.world_setting}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "world_setting", value: v } })}
            maxLength={500}
            placeholder="가이드 메시지를 입력해주세요"
          />
        </div>
      </div>

      {/* 추천 답변 */}
      <div>
        <SectionTitle label="추천 답변" description="사용자들에게 첫 답변을 최대 3개 추천해 보세요." />
        <div className="mt-[12px] space-y-[8px]">
          {suggestions.map((s, idx) => (
            <FormInput
              key={idx}
              value={s}
              onChange={(v) => updateSuggestion(idx, v)}
              maxLength={200}
              placeholder={`추천 답변 ${idx + 1}`}
            />
          ))}
        </div>
        <div className="mt-[12px] flex gap-[8px]">
          {suggestions.length < 3 && (
            <button
              type="button"
              onClick={addSuggestion}
              className="flex items-center gap-[6px] rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
            >
              <PlusIcon /> 추천 답변 추가
            </button>
          )}
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={removeSuggestion}
              className="flex items-center gap-[6px] rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
            >
              <MinusIcon /> 추천 답변 제거
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 4: 키워드북 ─── */
interface KeywordNote {
  id: string;
  title: string;
  info: string;
  keywords: string[];
  targets: string[];
  isExpanded: boolean;
}

function KeywordbookTab() {
  const [notes, setNotes] = useState<KeywordNote[]>([]);
  const [keywordInputs, setKeywordInputs] = useState<Record<string, string>>({});

  const addNote = () => {
    const newNote: KeywordNote = {
      id: crypto.randomUUID(),
      title: `키워드 노트 ${notes.length + 1}`,
      info: "",
      keywords: [],
      targets: [],
      isExpanded: true,
    };
    setNotes([...notes, newNote]);
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const toggleNote = (id: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, isExpanded: !n.isExpanded } : n)));
  };

  const updateNote = (id: string, field: keyof KeywordNote, value: unknown) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  };

  const addKeyword = (noteId: string) => {
    const input = keywordInputs[noteId]?.trim();
    if (!input) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.keywords.length >= 5) return;
    if (!note.keywords.includes(input)) {
      updateNote(noteId, "keywords", [...note.keywords, input]);
    }
    setKeywordInputs({ ...keywordInputs, [noteId]: "" });
  };

  return (
    <div className="space-y-[16px]">
      {notes.map((note) => (
        <div key={note.id} className="rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] dark:border-[#333741] dark:bg-[#1F242F]">
          {/* Header */}
          <div className="flex items-center justify-between p-[20px]">
            <span className="text-[18px] font-semibold text-[#414651] dark:text-[#CECFD2]">{note.title}</span>
            <div className="flex items-center gap-[12px]">
              <button type="button"><EditIcon /></button>
              <button type="button" onClick={() => removeNote(note.id)}><TrashIcon /></button>
              <button type="button" onClick={() => toggleNote(note.id)}>
                {note.isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
            </div>
          </div>

          {note.isExpanded && (
            <div className="space-y-[20px] border-t border-[#d5d7da] p-[20px] dark:border-[#333741]">
              {/* 정보 */}
              <div>
                <SectionTitle label="정보" required description="스토리가 불러올 추가 정보를 입력해주세요" />
                <div className="mt-[8px]">
                  <FormTextarea
                    value={note.info}
                    onChange={(v) => updateNote(note.id, "info", v)}
                    maxLength={500}
                    placeholder="정보를 입력해주세요"
                  />
                </div>
              </div>

              {/* 키워드 */}
              <div>
                <SectionTitle label="키워드" required description="정보를 불러올 키워드를 입력해 주세요. 단어 입력 후 엔터를 눌러주세요.(최대 5개)" />
                <div className="mt-[8px]">
                  <input
                    type="text"
                    value={keywordInputs[note.id] || ""}
                    onChange={(e) => setKeywordInputs({ ...keywordInputs, [note.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(note.id); } }}
                    placeholder="키워드를 입력해주세요"
                    className="h-[44px] w-full rounded-[8px] border border-[#d5d7da] bg-white px-[14px] text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] outline-none placeholder:text-[#a4a7ae] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white dark:placeholder:text-[#555]"
                  />
                  <p className="mt-[6px] text-right text-[14px] text-[#535862] dark:text-[#94969C]">{note.keywords.length}/5</p>
                </div>
                {note.keywords.length > 0 && (
                  <div className="mt-[8px] flex flex-wrap gap-[6px]">
                    {note.keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-[4px] rounded-[16px] bg-[#f5f5f5] border border-[#d5d7da] px-[10px] py-[4px] text-[12px] text-[#535862] dark:border-[#333741] dark:bg-[#333741] dark:text-[#94969C]">
                        {kw}
                        <button type="button" onClick={() => updateNote(note.id, "keywords", note.keywords.filter((k) => k !== kw))}>
                          <XCloseBadgeIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 키워드북 적용 대상 */}
              <div>
                <SectionTitle label="키워드북 적용 대상" required description="전체 또는 개별 적용이 가능합니다." />
                <div className="mt-[8px]">
                  <FormSelect
                    value={note.targets.length > 0 ? note.targets[0] : ""}
                    onChange={(v) => updateNote(note.id, "targets", [v])}
                    options={[
                      { value: "all", label: "전체" },
                      { value: "intro", label: "인트로" },
                      { value: "prompt", label: "프롬프트" },
                    ]}
                    placeholder="적용 대상을 선택해주세요"
                  />
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-[8px] bg-[#36c4b3] px-[18px] py-[10px] text-[14px] font-semibold text-white"
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 키워드 노트 추가 */}
      <button
        type="button"
        onClick={addNote}
        className="flex w-full items-center justify-center gap-[6px] rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
      >
        <PlusIcon /> 키워드 노트 추가
      </button>
    </div>
  );
}

/* ─── Tab 5: 캐릭터 상세 ─── */
function CharacterDetailTab() {
  const { state, dispatch } = useWizard();
  const { formData } = state;
  const [selectedModel, setSelectedModel] = useState("ivy");

  return (
    <div className="space-y-[24px]">
      {/* 상세 설명 */}
      <div>
        <SectionTitle label="상세 설명" required description="스토리에 대한 구체적인 설명을 입력해 주세요">
          <AutoGenButton />
        </SectionTitle>
        <div className="mt-[8px]">
          <FormTextarea
            value={formData.personality}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "personality", value: v } })}
            maxLength={1000}
            placeholder="스토리의 성격이나 서사, 과거 사건 등 상세한 내용을 작성해 주세요."
          />
        </div>
      </div>

      {/* 장르 설정 */}
      <div>
        <SectionTitle label="장르 설정" required description="스토리에 맞는 장르를 선택해주세요" />
        <div className="mt-[8px]">
          <FormSelect
            value={formData.category}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "category", value: v } })}
            options={GENRE_OPTIONS}
            placeholder="장르를 선택해주세요"
          />
        </div>
      </div>

      {/* 타겟 설정 */}
      <div>
        <SectionTitle
          label="타겟 설정"
          required
          description={["스토리의 주 소비층을 선택해주세요.", "선택된 타겟에 따라 다른 사용자에게 추천돼요."]}
        />
        <div className="mt-[8px]">
          <FormSelect
            value={formData.gender}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "gender", value: v } })}
            options={TARGET_OPTIONS}
            placeholder="장르를 선택해주세요"
          />
        </div>
      </div>

      {/* 권장 모드 */}
      <div>
        <SectionTitle label="권장 모드" required />
        <div className="mt-[8px]">
          <FormSelect
            value={selectedModel}
            onChange={setSelectedModel}
            options={MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.name }))}
            placeholder="모드를 선택해주세요"
            renderValue={(opt) => {
              const model = MODEL_OPTIONS.find((m) => m.id === opt?.value);
              if (!model) return <span className="text-[#a4a7ae]">모드를 선택해주세요</span>;
              return (
                <span className="flex items-center gap-[8px]">
                  <span className={`rounded-[6px] border px-[8px] py-[4px] text-[12px] font-semibold ${BADGE_STYLES[model.badge]}`}>
                    {model.badge}
                  </span>
                  <span className="text-[14px] font-medium text-[#414651] dark:text-[#CECFD2]">{model.name}</span>
                </span>
              );
            }}
            renderOption={(opt) => {
              const model = MODEL_OPTIONS.find((m) => m.id === opt.value);
              if (!model) return opt.label;
              return (
                <span className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-[8px]">
                    <span className={`rounded-[6px] border px-[8px] py-[4px] text-[12px] font-semibold ${BADGE_STYLES[model.badge]}`}>
                      {model.badge}
                    </span>
                    <span className="text-[14px] font-medium text-[#414651] dark:text-[#CECFD2]">{model.name}</span>
                  </span>
                  {model.coinCost && (
                    <span className="text-[14px] text-[#535862]">🟠 나냥코인 {model.coinCost}개</span>
                  )}
                </span>
              );
            }}
          />
        </div>
      </div>

      {/* 이용자 층 설정 */}
      <div>
        <SectionTitle
          label="이용자 층 설정"
          required
          description={["이용자 층은 한번 설정하면 변경할 수 없어요.", "민감한 스토리는 운영자에 의해 상태가 변경될 수 있어요."]}
        />
        <div className="mt-[8px]">
          <FormSelect
            value={formData.age_rating}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "age_rating", value: v } })}
            options={AGE_OPTIONS}
            placeholder="이용자 층을 선택해주세요"
          />
        </div>
      </div>

      {/* 공개 여부 */}
      <div>
        <SectionTitle label="공개 여부" required description="공개 여부를 선택해주세요" />
        <div className="mt-[8px]">
          <FormSelect
            value={formData.is_public ? "public" : "private"}
            onChange={(v) => dispatch({ type: "UPDATE_FIELD", payload: { field: "is_public", value: v === "public" } })}
            options={VISIBILITY_OPTIONS}
            placeholder="공개 여부를 선택해주세요"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 6: 이미지 추가 ─── */
interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
}

function ImageAddTab() {
  const { state, dispatch } = useWizard();
  const { formData } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach((file) => {
      if (uploadedFiles.length + newFiles.length >= 200) return;
      const id = crypto.randomUUID();
      newFiles.push({ id, file, previewUrl: URL.createObjectURL(file) });
    });
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    e.target.value = "";
  };

  const toggleFileSelection = (id: string) => {
    const next = new Set(selectedFiles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFiles(next);
  };

  const toggleAllFiles = () => {
    if (selectedFiles.size === uploadedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(uploadedFiles.map((f) => f.id)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-[24px]">
      <SectionTitle
        label={`이미지 추가 ${uploadedFiles.length}/200`}
        description="추가할 이미지들을 등록해주세요."
      />

      {/* 업로드 영역 */}
      <div className="flex h-[272px] w-full items-center justify-center gap-[24px] rounded-[8px] bg-[#fafafa] p-[24px] dark:bg-[#0D1117]">
        <div className="relative h-[140px] w-[140px] flex-shrink-0 overflow-hidden rounded-[8px] bg-[#ededed] dark:bg-[#333741]">
          {formData.avatar_url ? (
            <img src={formData.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderSilhouette w={80} h={100} />
            </div>
          )}
          <span className="absolute bottom-[8px] left-[8px] rounded-[6px] bg-[rgba(0,0,0,0.8)] px-[8px] py-[4px] text-[12px] font-semibold text-white">
            1:1
          </span>
        </div>
        <div className="relative h-[140px] w-[105px] flex-shrink-0 overflow-hidden rounded-[8px] bg-[#ededed] dark:bg-[#333741]">
          {formData.banner_url ? (
            <img src={formData.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderSilhouette w={60} h={80} />
            </div>
          )}
          <span className="absolute bottom-[8px] left-[8px] rounded-[6px] bg-[rgba(0,0,0,0.8)] px-[8px] py-[4px] text-[12px] font-semibold text-white">
            3:4
          </span>
        </div>
        <div className="flex flex-col items-center gap-[12px]">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleFilesUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
          >
            업로드하기
          </button>
          <p className="text-center text-[14px] text-[#414651] dark:text-[#CECFD2]">
            PNG, JPG, WebP 이미지 파일만 올릴 수 있어요.<br />
            용량은 5mb이하, 1:1 비율을 권장해요.
          </p>
        </div>
      </div>

      {/* 미리보기 갤러리 */}
      <div className="overflow-hidden rounded-[8px] border border-[#e9eaeb] shadow-[0px_1px_2px_rgba(10,13,18,0.06),0px_1px_3px_rgba(10,13,18,0.1)] dark:border-[#333741]">
        <div className="p-[20px]">
          <h3 className="text-[18px] font-medium text-[#181d27] dark:text-white">미리보기</h3>
          <div className="mt-[12px] flex max-h-[300px] flex-wrap gap-[8px] overflow-y-auto">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((f) => (
                <div key={f.id} className="h-[80px] w-[80px] overflow-hidden rounded-[8px] bg-[#ededed] dark:bg-[#333741]">
                  <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ))
            ) : (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[80px] w-[80px] rounded-[8px] bg-[#ededed] dark:bg-[#333741]" />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 업로드된 파일 관리 */}
      <div className="overflow-hidden rounded-[8px] border border-[#e9eaeb] shadow-[0px_1px_2px_rgba(10,13,18,0.06),0px_1px_3px_rgba(10,13,18,0.1)] dark:border-[#333741]">
        <div className="px-[24px] py-[20px]">
          <h3 className="text-[18px] font-medium text-[#181d27] dark:text-white">업로드된 파일 관리</h3>
        </div>
        {/* Table header */}
        <div className="flex h-[44px] items-center border-y border-[#e9eaeb] px-[24px] dark:border-[#333741]">
          <div className="flex w-[40px] items-center">
            <input
              type="checkbox"
              checked={uploadedFiles.length > 0 && selectedFiles.size === uploadedFiles.length}
              onChange={toggleAllFiles}
              className="h-[16px] w-[16px] rounded border-[#d5d7da]"
            />
          </div>
          <div className="flex-1 text-[12px] font-medium text-[#535862] dark:text-[#94969C]">파일명</div>
          <div className="w-[120px] text-[12px] font-medium text-[#535862] dark:text-[#94969C]">파일 크기</div>
          <div className="w-[40px]" />
        </div>
        {/* Table rows */}
        {uploadedFiles.length === 0 ? (
          <div className="flex h-[72px] items-center justify-center px-[24px] text-[14px] text-[#717680] dark:text-[#9ca3af]">
            업로드된 파일이 없습니다
          </div>
        ) : (
          uploadedFiles.map((f) => (
            <div key={f.id} className="flex h-[72px] items-center border-b border-[#e9eaeb] bg-[#fafafa] px-[24px] py-[16px] dark:border-[#333741] dark:bg-[#0D1117]">
              <div className="flex w-[40px] items-center">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(f.id)}
                  onChange={() => toggleFileSelection(f.id)}
                  className="h-[16px] w-[16px] rounded border-[#d5d7da]"
                />
              </div>
              <div className="flex flex-1 items-center gap-[12px]">
                <div className="h-[40px] w-[40px] overflow-hidden rounded-[4px] bg-[#ededed] dark:bg-[#333741]">
                  <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#181d27] dark:text-white">{f.file.name}</p>
                  <p className="text-[14px] text-[#535862] dark:text-[#94969C]">{f.file.type}</p>
                </div>
              </div>
              <div className="w-[120px] text-[14px] text-[#535862] dark:text-[#94969C]">{formatFileSize(f.file.size)}</div>
              <div className="flex w-[40px] justify-center">
                <button type="button"><MoreVerticalIcon /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Preview Page ─── */
function PreviewPage({ onBack }: { onBack: () => void }) {
  const { state } = useWizard();
  const { formData } = state;

  return (
    <div className="space-y-[24px]">
      <SectionTitle label="미리보기" description="마지막으로 미리보기로 내용을 확인해주세요." />

      {/* 캐릭터 정보 카드 */}
      <div className="mx-auto w-[400px] overflow-hidden rounded-[8px] border border-[#a4a7ae] dark:border-[#333741] dark:bg-[#1F242F]">
        {/* Header */}
        <div className="flex items-center justify-between p-[24px]">
          <h2 className="text-[20px] font-semibold text-black dark:text-white">캐릭터 정보</h2>
          <button type="button" onClick={onBack}><XCloseIcon /></button>
        </div>

        {/* 이미지 */}
        <div className="relative h-[400px] w-full bg-[#ededed] dark:bg-[#333741]">
          {formData.avatar_url ? (
            <img src={formData.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderSilhouette w={160} h={200} />
            </div>
          )}
          {/* Carousel arrows */}
          <button type="button" className="absolute left-[12px] top-1/2 -translate-y-1/2 rounded-full bg-[rgba(0,0,0,0.6)] p-[12px] backdrop-blur-[6.5px]">
            <ChevronLeftIcon stroke="white" />
          </button>
          <button type="button" className="absolute right-[12px] top-1/2 -translate-y-1/2 rounded-full bg-[rgba(0,0,0,0.6)] p-[12px] backdrop-blur-[6.5px]">
            <ChevronRightIcon stroke="white" />
          </button>
          {/* 하트 버튼 */}
          <div className="absolute bottom-[12px] right-[12px]">
            <button type="button" className="flex items-center gap-[6px] rounded-[8px] border border-[#d5d7da] bg-white px-[12px] py-[8px] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F]">
              <HeartIcon />
              <span className="text-[14px] font-semibold text-[#414651] dark:text-[#CECFD2]">1.1K</span>
            </button>
          </div>
        </div>

        {/* 캐릭터 정보 */}
        <div className="p-[24px]">
          <h3 className="text-[20px] font-semibold text-black dark:text-white">{formData.name || "캐릭터명"}</h3>
          <div className="mt-[8px] flex items-center gap-[4px]">
            <span className="rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] text-[#9ca3af] dark:border-[#333741] dark:bg-[#333741]">
              @username
            </span>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-[8px] flex flex-wrap gap-[4px]">
              {formData.tags.map((tag) => (
                <span key={tag} className="rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] text-[#9ca3af] dark:border-[#333741] dark:bg-[#333741]">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="mt-[12px] text-[16px] font-medium text-black dark:text-white">{formData.tagline || "한줄소개가 여기에 표시됩니다"}</p>
        </div>

        {/* 구분선 */}
        <div className="mx-[24px] h-px bg-[#d5d7da] dark:bg-[#333741]" />

        {/* 상세 설명 */}
        <div className="p-[24px]">
          <h4 className="text-[20px] font-semibold text-black dark:text-white">상세 설명</h4>
          <p className="mt-[8px] text-[14px] text-black dark:text-[#CECFD2]">{formData.personality || "상세 설명이 여기에 표시됩니다"}</p>
        </div>

        {/* 구분선 */}
        <div className="mx-[24px] h-px bg-[#d5d7da] dark:bg-[#333741]" />

        {/* 댓글 */}
        <div className="p-[24px]">
          <div className="flex items-center gap-[8px]">
            <h4 className="text-[20px] font-semibold text-black dark:text-white">댓글</h4>
            <span className="text-[14px] text-[#535862] dark:text-[#94969C]">0개</span>
          </div>
          <div className="mt-[12px] rounded-[8px] bg-[#f5f5f5] px-[14px] py-[12px] dark:bg-[#333741]">
            <span className="text-[14px] font-semibold text-[#535862] dark:text-[#94969C]">댓글을 남겨보세요</span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center gap-[12px] border-t border-[#e9eaeb] p-[24px] shadow-[0px_-4px_16px_rgba(0,0,0,0.05)] dark:border-[#333741]">
          <button type="button" className="flex h-[44px] w-[44px] items-center justify-center rounded-[8px] border border-[#d5d7da] bg-white dark:border-[#333741] dark:bg-[#1F242F]">
            <HeartIcon />
          </button>
          <button type="button" className="flex-1 rounded-[8px] border border-[#e9faf7] bg-[#e9faf7] px-[18px] py-[10px] text-center text-[16px] font-semibold text-[#28a393]">
            이어서 대화하기
          </button>
          <button type="button" className="flex-1 rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-center text-[16px] font-semibold text-white">
            새 대화하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Layout ─── */
function CreateContentInner() {
  const { state, dispatch } = useWizard();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = navigation.state === "submitting";
  const isLastTab = activeTab === 5;

  const handlePrev = () => {
    if (showPreview) { setShowPreview(false); return; }
    if (activeTab > 0) setActiveTab(activeTab - 1);
  };

  const handleNext = () => {
    if (isLastTab && !showPreview) { setShowPreview(true); return; }
    if (isLastTab && showPreview) { handleSubmit(); return; }
    if (activeTab < 5) setActiveTab(activeTab + 1);
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      const { formData } = state;
      const response = await fetch("/characters/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _action: "create",
          ...formData,
          display_name: formData.display_name || formData.name,
          example_dialogues: formData.example_dialogues.length > 0
            ? formData.example_dialogues.map((d) => ({ user: d.user, character: d.character }))
            : null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        navigate("/my-content");
      } else {
        setError(result.error || "캐릭터 생성에 실패했습니다");
      }
    } catch {
      setError("캐릭터 생성 중 오류가 발생했습니다");
    }
  }, [state, navigate]);

  const tabContent = [
    <CharacterSetupTab key={0} />,
    <PromptTab key={1} />,
    <IntroTab key={2} />,
    <KeywordbookTab key={3} />,
    <CharacterDetailTab key={4} />,
    <ImageAddTab key={5} />,
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* Header */}
      <div className="flex items-start justify-between px-[312px] pt-[32px]">
        <div>
          <h1 className="text-[24px] font-semibold leading-[32px] text-[#181d27] dark:text-white">새 컨텐츠 만들기</h1>
          <p className="mt-[4px] text-[16px] font-normal leading-[24px] text-[#535862] dark:text-[#94969C]">
            마음에 드는 캐릭터와 작품을 만들어보세요!
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-[8px] rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
        >
          <ChevronLeftIcon />
          뒤로가기
        </button>
      </div>

      {/* Tab Bar */}
      <div className="mt-[24px] flex h-[54px] items-end border-y border-[#d5d7da] bg-[#fafafa] px-[312px] dark:border-[#333741] dark:bg-[#0D1117]">
        {TAB_LABELS.map((label, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => { setActiveTab(idx); setShowPreview(false); }}
            className={`flex h-full items-center px-[16px] text-[14px] font-medium ${
              activeTab === idx
                ? "border-b-2 border-[#535862] text-[#414651] dark:border-[#CECFD2] dark:text-[#CECFD2]"
                : "text-[#717680] dark:text-[#9ca3af]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-[312px] mt-[16px] rounded-[8px] border border-red-300 bg-red-50 px-[16px] py-[12px] text-[14px] text-red-600">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="px-[312px] py-[32px]">
        {showPreview ? (
          <PreviewPage onBack={() => setShowPreview(false)} />
        ) : (
          tabContent[activeTab]
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-[312px] pb-[48px]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeTab === 0 && !showPreview}
          className="flex items-center gap-[8px] rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] disabled:opacity-40 dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#CECFD2]"
        >
          이전
        </button>
        <span className="text-[14px] font-medium text-[#414651] dark:text-[#CECFD2]">
          Page {getPageNumber(activeTab)} of 4
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex items-center gap-[8px] rounded-[8px] bg-[#36c4b3] px-[18px] py-[10px] text-[14px] font-semibold text-white"
        >
          {isLastTab && showPreview ? "완료하기" : isLastTab ? "완료하기" : "다음"}
          {!(isLastTab && showPreview) && <ChevronRightIcon />}
        </button>
      </div>
    </div>
  );
}

/* ─── Loader ─── */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return redirect("/login");
  return {};
}

/* ─── Action ─── */
const STORAGE_BUCKET = "character-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isBase64DataUrl(str: string | null | undefined): boolean {
  return !!str && str.startsWith("data:");
}

async function uploadImageToStorage(
  client: ReturnType<typeof makeServerClient>[0],
  characterId: number,
  mediaType: "avatar" | "banner",
  base64Data: string
): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;
    const [, mimeType, imgData] = matches;
    const buffer = Buffer.from(imgData, "base64");
    if (buffer.length > MAX_FILE_SIZE) return null;
    const ext = mimeType.split("/")[1] || "png";
    const path = `${characterId}/${mediaType}/${Date.now()}.${ext}`;
    const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: mimeType, upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return publicUrl;
  } catch { return null; }
}

const createSchema = z.object({
  _action: z.enum(["create", "save_draft"]).optional(),
  name: z.string().min(1).max(50),
  display_name: z.string().max(50).optional().nullable(),
  tagline: z.string().max(50).optional().nullable(),
  description: z.string().min(1),
  role: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.string().min(1),
  speech_style: z.string().optional().nullable(),
  system_prompt: z.string().min(1),
  greeting_message: z.string().min(1),
  relationship: z.string().optional().nullable(),
  world_setting: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  age_rating: z.string().default("everyone"),
  is_public: z.boolean().default(false),
  is_nsfw: z.boolean().default(false),
  enable_memory: z.boolean().default(true),
  example_dialogues: z.any().optional().nullable(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return redirect("/login", { headers });

  try {
    const formData = await request.json();
    const result = createSchema.safeParse(formData);
    if (!result.success) {
      return data({ error: "유효성 검사 실패", fieldErrors: result.error.flatten().fieldErrors }, { headers });
    }
    const d = result.data;
    const avatarBase64 = isBase64DataUrl(d.avatar_url) ? d.avatar_url : null;
    const bannerBase64 = isBase64DataUrl(d.banner_url) ? d.banner_url : null;

    const { data: newChar, error: insertErr } = await client
      .from("characters")
      .insert({
        creator_id: user.id,
        name: d.name,
        display_name: d.display_name || d.name,
        tagline: d.tagline || null,
        description: d.description || "",
        role: d.role || null,
        appearance: d.appearance || null,
        personality: d.personality || "",
        speech_style: d.speech_style || null,
        system_prompt: d.system_prompt || "",
        greeting_message: d.greeting_message || "",
        relationship: d.relationship || null,
        world_setting: d.world_setting || null,
        avatar_url: avatarBase64 ? null : (d.avatar_url ?? null),
        banner_url: bannerBase64 ? null : (d.banner_url ?? null),
        tags: d.tags,
        category: d.category || null,
        gender: d.gender || null,
        age_rating: d.age_rating,
        is_public: d.is_public,
        is_nsfw: d.is_nsfw,
        enable_memory: d.enable_memory,
        example_dialogues: d.example_dialogues || null,
        status: "approved",
      })
      .select()
      .single();

    if (insertErr) return data({ error: insertErr.message }, { headers });
    const charId = newChar.character_id;

    const updates: Record<string, string> = {};
    if (avatarBase64) {
      const url = await uploadImageToStorage(client, charId, "avatar", avatarBase64);
      if (url) updates.avatar_url = url;
    }
    if (bannerBase64) {
      const url = await uploadImageToStorage(client, charId, "banner", bannerBase64);
      if (url) updates.banner_url = url;
    }
    if (Object.keys(updates).length > 0) {
      await client.from("characters").update(updates).eq("character_id", charId);
    }
    await client.from("character_safety_filters").insert({
      character_id: charId,
      block_nsfw: true, block_violence: true, block_hate_speech: true,
      block_personal_info: true, sensitivity_level: 5,
    });

    return data({ success: true, characterId: charId }, { headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return data({ error: `캐릭터 생성 중 오류: ${msg}` }, { headers });
  }
}

/* ─── Default Export ─── */
export default function CreateContent() {
  return (
    <WizardProvider>
      <CreateContentInner />
    </WizardProvider>
  );
}
