/**
 * F4-3-2 이미지 생성 상수
 * 장르, 비율, 개수, 젤리 비용
 */

export const GENRES = [
  { id: "romance", label: "로맨스", sub: "순정/첫사랑/감성", color: "#F43F5E" },
  { id: "subculture", label: "서브컬처", sub: "코덕/키치/VTuber", color: "#8B5CF6" },
  { id: "modern", label: "현대극", sub: "로맨/오피스/뉴에라", color: "#3B82F6" },
  { id: "fantasy", label: "판타지", sub: "로판/이세계/다판시", color: "#6366F1" },
  { id: "action", label: "액션", sub: "핵선/밀리/무협", color: "#EF4444" },
  { id: "dark", label: "다크/스릴러", sub: "미스드/마법", color: "#1F2937" },
  { id: "healing", label: "힐링/일상", sub: "따뜻한 감성", color: "#10B981" },
  { id: "game", label: "게임/히어로", sub: "게임감성", color: "#0EA5E9" },
] as const;

/** DALL-E 3 지원 크기: 1024x1024, 1792x1024, 1024x1792 (나머지는 가장 가까운 크기로 매핑) */
export const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", width: 1024, height: 1024 },
  { id: "4:3", label: "4:3", width: 1792, height: 1024 },
  { id: "3:4", label: "3:4", width: 1024, height: 1792 },
  { id: "16:9", label: "16:9", width: 1792, height: 1024 },
  { id: "9:16", label: "9:16", width: 1024, height: 1792 },
] as const;

export const IMAGE_COUNTS = [1, 2, 3, 4] as const;

export const JELLY_COST_PER_IMAGE = 140;

export const MAX_PROMPT_LENGTH = 1000;
