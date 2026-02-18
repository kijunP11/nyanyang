# F4 추가 개선 — SelectedCharacter 타입 중복 제거

## 문제
`SelectedCharacter` 인터페이스가 두 파일에 동일하게 정의되어 있음:
- `app/features/image-generation/components/character-selector.tsx` (lines 8-15) — 원본
- `app/features/image-generation/components/image-generation-sidebar.tsx` (lines 15-22) — 중복

## 수정

**파일**: `app/features/image-generation/components/image-generation-sidebar.tsx`

1. lines 15-22의 `SelectedCharacter` interface 정의 삭제:
```tsx
// 삭제
export interface SelectedCharacter {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string | null;
  appearance: string | null;
  description: string | null;
}
```

2. `character-selector.tsx`에서 import 추가:
```tsx
import type { SelectedCharacter } from "./character-selector";
```

다른 파일은 변경 없음.

## 검증
- `npm run typecheck` 통과
