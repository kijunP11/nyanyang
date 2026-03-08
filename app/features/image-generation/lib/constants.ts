/**
 * F4-3-2 이미지 생성 상수
 * 장르, 비율, 개수, 젤리 비용
 */

export const GENRES = [
  { id: "romance", label: "로맨스", sub: "순정/첫사랑/감성", color: "#F43F5E", image: "/images/genres/romance.png" },
  { id: "subculture", label: "서브컬처", sub: "모에/키치/Vtuber", color: "#8B5CF6", image: "/images/genres/subculture.png" },
  { id: "modern", label: "현대극", sub: "모던/오피스/누아르", color: "#3B82F6", image: "/images/genres/modern.png" },
  { id: "fantasy", label: "판타지", sub: "로판/이세계물/마법사", color: "#6366F1", image: "/images/genres/fantasy.png" },
  { id: "action", label: "액션", sub: "액션/범죄/무협", color: "#EF4444", image: "/images/genres/action.png" },
  { id: "dark", label: "다크/스릴러", sub: "와일드/악역", color: "#1F2937", image: "/images/genres/dark.png" },
  { id: "healing", label: "힐링/일상", sub: "따뜻한 감성", color: "#10B981", image: "/images/genres/healing.png" },
  { id: "game", label: "게임/히어로", sub: "게임감성", color: "#0EA5E9", image: "/images/genres/game.png" },
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
