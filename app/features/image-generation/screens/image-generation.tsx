/**
 * Image Generation Screen (F4-3-1 + F4-3-2 + F4-3-3 + 기존 캐릭터 수정 탭)
 *
 * 비로그인: blur 배경 + 로그인 모달
 * 로그인: 탭, 프롬프트, 장르, 옵션 패널, 주의사항 모달, 생성 결과/사이드바 썸네일
 */
import type { Route } from "./+types/image-generation";

import { useState, useCallback } from "react";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import {
  CharacterSelector,
  type SelectedCharacter,
} from "../components/character-selector";
import { DisclaimerModal } from "../components/disclaimer-modal";
import { EditEmptyState } from "../components/edit-empty-state";
import { EditPromptInput } from "../components/edit-prompt-input";
import { GenreCards } from "../components/genre-cards";
import { GenerationResult } from "../components/generation-result";
import { GenerationTabs } from "../components/generation-tabs";
import { ImageGenerationSidebar } from "../components/image-generation-sidebar";
import { LoginRequiredOverlay } from "../components/login-required-overlay";
import { OptionsPanel } from "../components/options-panel";
import { PromptInput } from "../components/prompt-input";
import {
  GENRES,
  JELLY_COST_PER_IMAGE,
} from "../lib/constants";

export const meta: Route.MetaFunction = () => [
  {
    title: `이미지 생성 | ${import.meta.env.VITE_APP_NAME}`,
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  return data(
    {
      isLoggedIn: !!user,
      user: user
        ? {
            name:
              user.user_metadata?.nickname ||
              user.user_metadata?.name ||
              "Anonymous",
            email: user.email,
            avatarUrl: user.user_metadata?.avatar_url || null,
          }
        : null,
    },
    { headers }
  );
}

export default function ImageGeneration({
  loaderData,
}: Route.ComponentProps) {
  const { isLoggedIn, user } = loaderData;

  const [activeTab, setActiveTab] = useState<"new" | "edit">("new");
  const [prompt, setPrompt] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageCount, setImageCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    { id: string; data: string }[]
  >([]);
  const [sidebarImages, setSidebarImages] = useState<
    { id: string; data: string }[]
  >([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] =
    useState<SelectedCharacter | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  const jellyCost = imageCount * JELLY_COST_PER_IMAGE;

  const handleTabChange = useCallback((tab: "new" | "edit") => {
    setActiveTab(tab);
    setPrompt("");
    setGeneratedImages([]);
    setSidebarImages([]);
    setSelectedImageId(null);
    if (tab === "new") {
      setSelectedCharacter(null);
      setUploadedImage((prev) => {
        if (prev?.preview) URL.revokeObjectURL(prev.preview);
        return null;
      });
    }
  }, []);

  const handleSelectImage = (id: string) => {
    setSelectedImageId((prev) => (prev === id ? null : id));
  };

  const handleUploadImage = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 최대 5MB까지 가능합니다.");
      return;
    }
    setUploadedImage((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  }, []);

  const handleClearUpload = useCallback(() => {
    setUploadedImage((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return null;
    });
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspectRatio,
        imageCount,
      };
      if (activeTab === "new") {
        body.genre = selectedGenre ?? undefined;
      } else {
        if (selectedCharacter) {
          body.characterId = selectedCharacter.id;
          body.characterAppearance = selectedCharacter.appearance ?? undefined;
          body.characterName = selectedCharacter.displayName;
        }
      }
      const res = await fetch("/api/image-generation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        alert(
          errorBody?.error ?? "이미지 생성 요청에 실패했습니다."
        );
        return;
      }
      const result = (await res.json()) as {
        error?: string;
        images?: string[];
        remainingBalance?: number;
        balance?: number;
      };
      if (result?.error) {
        alert(result.error);
        return;
      }
      if (result?.images?.length) {
        const withIds = result.images.map((data, i) => ({
          id: `${Date.now()}-${i}`,
          data,
        }));
        setGeneratedImages((prev) => [...withIds, ...prev]);
        setSidebarImages((prev) => [...withIds, ...prev]);
        setSelectedImageId(withIds[0].id);
      }
    } catch {
      alert("이미지 생성 요청에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoGenerate = () => {
    const genre = GENRES.find((g) => g.id === selectedGenre);
    const suggestions = [
      `${genre?.label ?? "캐릭터"} 장르의 캐릭터, 신비로운 분위기, 긴 머리카락, 환상적인 배경`,
      `${genre?.label ?? "캐릭터"} 스타일의 캐릭터, 강렬한 눈빛, 도시 배경, 현대적 의상`,
      `귀여운 ${genre?.label ?? ""} 캐릭터, 밝은 표정, 부드러운 색감, 일러스트 풍`,
    ];
    setPrompt(
      suggestions[Math.floor(Math.random() * suggestions.length)].trim()
    );
  };

  return (
    <div className="-mx-5 -my-16 flex min-h-[calc(100vh-57px)] bg-white dark:bg-[#0C111D] md:-my-32">
      {isLoggedIn && <DisclaimerModal />}

      <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
        <ImageGenerationSidebar
          user={isLoggedIn ? user : null}
          images={sidebarImages}
          selectedImageId={selectedImageId}
          onSelectImage={handleSelectImage}
          selectedCharacter={activeTab === "edit" ? selectedCharacter : null}
        />
      </div>

      <div className="relative min-w-0 flex-1">
        {isLoggedIn ? (
          <div className="flex h-full">
            <div className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[800px] px-6 py-6">
                <GenerationTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />

                {activeTab === "new" && (
                  <>
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      onGenerate={handleGenerate}
                      onAutoGenerate={handleAutoGenerate}
                      isGenerating={isGenerating}
                      jellyCost={jellyCost}
                    />
                    <GenerationResult
                      isGenerating={isGenerating}
                      imageCount={imageCount}
                      generatedImages={generatedImages}
                      selectedImageId={selectedImageId}
                      onSelectImage={handleSelectImage}
                    />
                    <GenreCards
                      selectedGenre={selectedGenre}
                      onSelect={setSelectedGenre}
                    />
                  </>
                )}

                {activeTab === "edit" && (
                  <>
                    {!selectedCharacter ? (
                      <CharacterSelector
                        onSelect={setSelectedCharacter}
                        onCancel={() => setSelectedCharacter(null)}
                      />
                    ) : (
                      <>
                        <EditPromptInput
                          value={prompt}
                          onChange={setPrompt}
                          onGenerate={handleGenerate}
                          onUploadImage={handleUploadImage}
                          isGenerating={isGenerating}
                          jellyCost={jellyCost}
                          uploadedImagePreview={uploadedImage?.preview ?? null}
                          onClearUpload={handleClearUpload}
                        />
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
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <OptionsPanel
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              imageCount={imageCount}
              onImageCountChange={setImageCount}
              selectedGenre={selectedGenre}
              onGenreChange={setSelectedGenre}
              showGenre={activeTab === "new"}
            />
          </div>
        ) : (
          <LoginRequiredOverlay />
        )}
      </div>
    </div>
  );
}
