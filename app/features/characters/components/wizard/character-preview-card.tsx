/**
 * Character Preview Card Component
 *
 * Shows a preview of the character being created/edited.
 */
import { Badge } from "~/core/components/ui/badge";
import { Label } from "~/core/components/ui/label";
import { CATEGORY_OPTIONS, type CharacterFormData } from "../../lib/wizard-types";

interface CharacterPreviewCardProps {
  formData: CharacterFormData;
}

/**
 * Get category label in Korean
 */
function getCategoryLabel(categoryValue: string): string | null {
  const category = CATEGORY_OPTIONS.find((c) => c.value === categoryValue);
  return category ? category.label : null;
}

export function CharacterPreviewCard({ formData }: CharacterPreviewCardProps) {
  const categoryLabel = formData.category
    ? getCategoryLabel(formData.category)
    : null;

  return (
    <div className="space-y-3">
      <Label className="text-gray-900 dark:text-white">캐릭터 미리보기</Label>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
        {/* Avatar and Basic Info */}
        <div className="flex gap-4">
          {/* Avatar */}
          {formData.avatar_url ? (
            <img
              src={formData.avatar_url}
              alt={formData.name || "캐릭터"}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-[#3f3f46] dark:text-[#9ca3af]">
              <span className="text-2xl">
                {formData.name ? formData.name[0].toUpperCase() : "?"}
              </span>
            </div>
          )}

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">
              {formData.name || "(이름 없음)"}
            </h3>
            {formData.tagline && (
              <p className="truncate text-sm text-gray-600 dark:text-[#9ca3af]">
                {formData.tagline}
              </p>
            )}

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.is_public ? (
                <Badge className="bg-[#14b8a6]/20 text-[#14b8a6]">공개</Badge>
              ) : (
                <Badge className="bg-gray-200 text-gray-600 dark:bg-[#6b7280]/20 dark:text-[#6b7280]">비공개</Badge>
              )}
              {formData.is_nsfw && (
                <Badge className="bg-red-500/20 text-red-400">NSFW</Badge>
              )}
              {categoryLabel && (
                <Badge
                  variant="outline"
                  className="border-gray-300 text-gray-600 dark:border-[#3f3f46] dark:text-[#9ca3af]"
                >
                  {categoryLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {formData.description && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-[#3f3f46]">
            <p className="line-clamp-3 text-sm text-gray-600 dark:text-[#9ca3af]">
              {formData.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {formData.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {formData.tags.slice(0, 6).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-gray-200 text-gray-600 dark:bg-[#3f3f46] dark:text-[#9ca3af]"
              >
                #{tag}
              </Badge>
            ))}
            {formData.tags.length > 6 && (
              <Badge variant="secondary" className="bg-gray-200 text-gray-600 dark:bg-[#3f3f46] dark:text-[#9ca3af]">
                +{formData.tags.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Greeting Message Preview */}
        {formData.greeting_message && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-[#3f3f46]">
            <Label className="text-xs text-gray-500 dark:text-[#6b7280]">첫 인사말</Label>
            <div className="mt-2 rounded-lg bg-gray-100 p-3 dark:bg-[#1a1a1a]">
              <p className="line-clamp-3 text-sm text-gray-900 dark:text-white">
                {formData.greeting_message}
              </p>
            </div>
          </div>
        )}

        {/* Banner Preview (if exists) */}
        {formData.banner_url && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-[#3f3f46]">
            <Label className="text-xs text-gray-500 dark:text-[#6b7280]">배너</Label>
            <img
              src={formData.banner_url}
              alt="배너"
              className="mt-2 h-24 w-full rounded-lg object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
