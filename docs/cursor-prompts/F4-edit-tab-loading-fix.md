# F4 기존 캐릭터 수정 — 로딩 중 EmptyState 버그 수정

## 문제
`app/features/image-generation/screens/image-generation.tsx` line 264에서,
edit 탭에서 이미지 생성 중(`isGenerating=true`)이지만 아직 이미지가 도착하지 않았을 때(`generatedImages.length === 0`),
로딩 placeholder 대신 `EditEmptyState`가 표시됨.

## 수정

**파일**: `app/features/image-generation/screens/image-generation.tsx`

```tsx
// 변경 전 (line 264)
{generatedImages.length === 0 ? (
  <EditEmptyState character={selectedCharacter} />
) : (
  <GenerationResult
    isGenerating={isGenerating}
    imageCount={imageCount}
    generatedImages={generatedImages}
    selectedImageId={selectedImageId}
    onSelectImage={handleSelectImage}
  />
)}

// 변경 후
{generatedImages.length === 0 && !isGenerating ? (
  <EditEmptyState character={selectedCharacter} />
) : (
  <GenerationResult
    isGenerating={isGenerating}
    imageCount={imageCount}
    generatedImages={generatedImages}
    selectedImageId={selectedImageId}
    onSelectImage={handleSelectImage}
  />
)}
```

조건에 `&& !isGenerating`만 추가하면 됨. 1줄 변경.

## 검증
- `npm run typecheck` 통과
- edit 탭에서 "이미지 생성하기" 클릭 → 로딩 placeholder 표시 확인 (EmptyState가 아닌)
