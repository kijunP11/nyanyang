/**
 * Example Dialogue Editor Component
 *
 * Reusable editor for adding/editing/removing example dialogues.
 */
import { PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import type { ExampleDialogue } from "../../lib/wizard-types";

interface ExampleDialogueEditorProps {
  dialogues: ExampleDialogue[];
  onAdd: () => void;
  onUpdate: (id: string, data: Partial<ExampleDialogue>) => void;
  onRemove: (id: string) => void;
}

/**
 * Single Dialogue Item
 */
function DialogueItem({
  dialogue,
  onUpdate,
  onRemove,
}: {
  dialogue: ExampleDialogue;
  onUpdate: (data: Partial<ExampleDialogue>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[#3f3f46] bg-[#2a2a2a] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#9ca3af]">예시 대화</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-[#9ca3af] hover:bg-[#3f3f46] hover:text-red-400"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-[#6b7280]">사용자 메시지</Label>
        <Input
          value={dialogue.user}
          onChange={(e) => onUpdate({ user: e.target.value })}
          placeholder="사용자가 보내는 메시지"
          className="border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-[#6b7280]">캐릭터 응답</Label>
        <Textarea
          value={dialogue.character}
          onChange={(e) => onUpdate({ character: e.target.value })}
          placeholder="캐릭터가 응답하는 메시지"
          rows={2}
          className="border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
        />
      </div>
    </div>
  );
}

/**
 * Main Editor Component
 */
export function ExampleDialogueEditor({
  dialogues,
  onAdd,
  onUpdate,
  onRemove,
}: ExampleDialogueEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-white">예시 대화 (선택)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="border-[#3f3f46] bg-transparent text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          추가
        </Button>
      </div>

      {dialogues.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#3f3f46] p-6 text-center">
          <p className="text-sm text-[#9ca3af]">
            예시 대화를 추가하면 AI가 캐릭터의 말투와 성격을 더 잘 이해할 수
            있습니다
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dialogues.map((dialogue) => (
            <DialogueItem
              key={dialogue.id}
              dialogue={dialogue}
              onUpdate={(data) => onUpdate(dialogue.id, data)}
              onRemove={() => onRemove(dialogue.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
