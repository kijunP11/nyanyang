/**
 * Chat Screen (리팩토링)
 * 훅과 컴포넌트를 조합한 메인 채팅 화면
 */
import type { Route } from "./+types/chat";
import { useLoaderData, useOutletContext, useFetcher, useRevalidator } from "react-router";
import { useState, useEffect, useRef, Fragment } from "react";
import { eq, desc } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { chatRooms } from "../schema";
import { getActiveBranchMessages, getRoomBranches } from "../lib/branch-manager.server";

import { ChatSidebar, type ChatItem } from "~/core/components/chat-sidebar";
import type { NavigationOutletContext } from "~/core/layouts/navigation.layout";

import { useChatStreaming } from "../hooks/use-chat-streaming";
import { useChatBranches } from "../hooks/use-chat-branches";
import type { AIModel } from "../components/model-selector";
import { ModelStatusBanner } from "../components/model-status-banner";
import { MemoryBookModal } from "../components/memory-book-modal";
import { ImageGalleryModal } from "../components/image-gallery-modal";
import { MaxOutputModal } from "../components/max-output-modal";

import { ChatHeaderBar } from "../components/chat-header-bar";
import { ChatInputBar } from "../components/chat-input-bar";
import { MessageBubble } from "../components/message-bubble";
import { StreamingIndicator } from "../components/streaming-indicator";
import { RollbackDialog } from "../components/rollback-dialog";
import { RegenerationDialog } from "../components/regeneration-dialog";
import { RegenerationComparison } from "../components/regeneration-comparison";
import { useRegenerationHistory } from "../hooks/use-regeneration-history";
import { SummaryButton } from "../components/summary-button";
import { SummaryBlock } from "../components/summary-block";
import { SuggestedActions } from "../components/suggested-actions";
import { ModelWarningModal } from "../components/model-warning-modal";
import { useRoomSettings } from "../hooks/use-room-settings";
import { ConversationSettingsModal } from "../components/conversation-settings-modal";
import { CustomizingModal } from "../components/customizing-modal";
import { ChatSettingsPanel } from "../components/chat-settings-panel";
import { useJellyBalance } from "../hooks/use-jelly-balance";
import { JellyDepletionModal } from "~/features/points/components/jelly-depletion-modal";
import { JellyPurchaseSheet } from "~/features/points/components/jelly-purchase-sheet";

export async function loader({ request, params }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const roomId = parseInt(params.roomId);
  if (isNaN(roomId)) {
    throw new Response("Invalid room ID", { status: 400 });
  }

  const db = drizzle;

  const [room] = await db
    .select({
      room_id: chatRooms.room_id,
      title: chatRooms.title,
      user_id: chatRooms.user_id,
      character: {
        character_id: characters.character_id,
        display_name: characters.display_name,
        avatar_url: characters.avatar_url,
        greeting_message: characters.greeting_message,
        recommended_model: characters.recommended_model,
      },
    })
    .from(chatRooms)
    .innerJoin(characters, eq(chatRooms.character_id, characters.character_id))
    .where(eq(chatRooms.room_id, roomId))
    .limit(1);

  if (!room) {
    throw new Response("Room not found", { status: 404 });
  }

  if (room.user_id !== user.id) {
    throw new Response("Forbidden", { status: 403 });
  }

  const messageList = await getActiveBranchMessages(roomId);
  const branches = await getRoomBranches(roomId);

  const allRooms = await db
    .select({
      room_id: chatRooms.room_id,
      title: chatRooms.title,
      last_message_at: chatRooms.last_message_at,
      created_at: chatRooms.created_at,
      character_name: characters.display_name,
      character_avatar_url: characters.avatar_url,
    })
    .from(chatRooms)
    .innerJoin(characters, eq(chatRooms.character_id, characters.character_id))
    .where(eq(chatRooms.user_id, user.id))
    .orderBy(desc(chatRooms.last_message_at));

  return { room, messages: messageList, branches, allRooms };
}

export default function ChatScreen() {
  const { room, messages: initialMessages, branches, allRooms } = useLoaderData<typeof loader>();
  const { user: navUser } = useOutletContext<NavigationOutletContext>();
  const revalidator = useRevalidator();
  const { settings, updateSetting, updateMultiple } = useRoomSettings(room.room_id);

  const [selectedModel, setSelectedModel] = useState<AIModel>(
    (room.character.recommended_model as AIModel) || "gemini-2.5-flash"
  );
  const [showMemoryBook, setShowMemoryBook] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showMaxOutput, setShowMaxOutput] = useState(false);
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [regenTargetId, setRegenTargetId] = useState<number | null>(null);
  const [modelWarningOpen, setModelWarningOpen] = useState(false);
  const [convSettingsOpen, setConvSettingsOpen] = useState(false);
  const [customizingOpen, setCustomizingOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [showDepletionModal, setShowDepletionModal] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    balance: jellyBalance,
    isLow: jellyIsLow,
    isDepleted: jellyIsDepleted,
    refresh: refreshBalance,
  } = useJellyBalance();

  const { comparison, recordRegeneration, clearComparison } = useRegenerationHistory();
  const summaryFetcher = useFetcher<{ success?: boolean; error?: string; summaries?: Array<{ content: string; message_range_start: number | null; message_range_end: number | null; created_at: Date; memory_id: number }> }>();

  const {
    messageList,
    setMessageList,
    isStreaming,
    streamingMessage,
    modelStatus,
    setModelStatus,
    suggestedActions,
    sendMessage,
    regenerateMessage,
  } = useChatStreaming({
    roomId: room.room_id,
    initialMessages,
    selectedModel,
    onRegenerationRecord: recordRegeneration,
    onInsufficientPoints: () => {
      setShowDepletionModal(true);
      refreshBalance();
    },
  });

  const {
    branchFetcher,
    showRollbackDialog,
    setShowRollbackDialog,
    rollbackMessageId,
    openRollbackDialog,
    confirmRollback,
    switchBranch,
  } = useChatBranches({ roomId: room.room_id });

  const sidebarChats: ChatItem[] = allRooms.map((r) => ({
    roomId: r.room_id,
    characterName: r.character_name ?? "Unknown",
    characterAvatarUrl: r.character_avatar_url,
    lastMessageAt: (r.last_message_at ?? r.created_at ?? new Date()).toISOString(),
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, streamingMessage]);

  useEffect(() => {
    summaryFetcher.load(`/api/chat/summary?room_id=${room.room_id}`);
  }, [room.room_id]);

  // POST 성공 후에만 요약 목록 재조회 (GET 응답에 success가 없어서 루프 방지)
  useEffect(() => {
    const data = summaryFetcher.data as
      | { success?: boolean; summaries?: unknown[] }
      | undefined;
    const isPostSuccess =
      summaryFetcher.state === "idle" &&
      data != null &&
      "success" in data &&
      data.success === true &&
      !("summaries" in data && Array.isArray(data.summaries));
    if (isPostSuccess) {
      summaryFetcher.load(`/api/chat/summary?room_id=${room.room_id}`);
    }
  }, [summaryFetcher.state, summaryFetcher.data]);

  const summaryLoading = summaryFetcher.state === "submitting" || summaryFetcher.state === "loading";
  const summaries = summaryFetcher.data?.summaries ?? [];

  const handleSummary = () => {
    const formData = new FormData();
    formData.set("room_id", String(room.room_id));
    formData.set("character_name", room.character.display_name ?? "");
    summaryFetcher.submit(formData, {
      method: "POST",
      action: "/api/chat/summary",
    });
  };

  const characterInfo = {
    display_name: room.character.display_name,
    avatar_url: room.character.avatar_url,
    recommended_model: room.character.recommended_model,
  };

  function extractImagesFromContent(content: string): string[] {
    const regex = /!\[.*?\]\((.*?)\)/g;
    const urls: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  }

  const handleImageClick = (imageUrl: string) => {
    const allImages = messageList
      .map((msg) => extractImagesFromContent(msg.content))
      .flat()
      .filter(Boolean);
    const index = allImages.indexOf(imageUrl);
    setGalleryImages(allImages);
    setGalleryIndex(index >= 0 ? index : 0);
    setShowGallery(true);
  };

  return (
    <div className="flex h-[calc(100vh-57px)] w-full overflow-hidden">
      <div className="hidden lg:block">
        <ChatSidebar
          user={navUser ? { name: navUser.name, email: navUser.email, avatarUrl: navUser.avatarUrl } : null}
          chats={sidebarChats}
        />
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {settings.background_enabled && settings.background_image_url ? (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${settings.background_image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : room.character.avatar_url ? (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${room.character.avatar_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
              transform: "scale(1.1)",
            }}
          />
        ) : null}
        <div className="absolute inset-0 z-0 bg-black/50" />

        <div className="relative z-10 flex min-w-0 flex-1">
          <div className="mx-auto flex h-full w-full max-w-[600px] flex-col bg-black/60">
            <ChatHeaderBar
              character={characterInfo}
              roomTitle={room.title}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onMemoryClick={() => setShowMemoryBook(true)}
              branches={branches}
              onSwitchBranch={switchBranch}
              onConversationSettingsClick={() => setConvSettingsOpen(true)}
              onCustomizingClick={() => setCustomizingOpen(true)}
              onSettingsPanelClick={() => setSettingsPanelOpen(true)}
              jellyBalance={jellyBalance}
              jellyIsLow={jellyIsLow}
              jellyIsDepleted={jellyIsDepleted}
              onJellyClick={() => setShowPurchaseSheet(true)}
            />

          <div className="bg-[#3f3f46]/80 px-4 py-2 text-center text-xs text-[#9ca3af]">
            이 캐릭터는 유저가 기입한 정보를 토대로 제작된 AI 챗봇입니다. 동명의 실존인물 혹은 단체와는 관련이 없습니다.
          </div>

          <ModelStatusBanner
            status={modelStatus}
            currentModel={selectedModel}
            recommendedAlternatives={["gemini-2.5-flash", "claude-sonnet"]}
            onSwitchModel={(model) => setSelectedModel(model as AIModel)}
            onClick={() => setModelWarningOpen(true)}
          />

          <div className="flex-1 overflow-y-auto">
            <div
              className="space-y-4 px-4 py-6"
              style={{ fontSize: `${settings.font_size}px` }}
            >
              {messageList.length === 0 && !isStreaming && (
                <EmptyState
                  character={characterInfo}
                  roomTitle={room.title}
                  greetingMessage={room.character.greeting_message}
                />
              )}

              {summaries.map((s) => (
                <SummaryBlock
                  key={s.memory_id}
                  content={s.content}
                  messageRangeStart={s.message_range_start}
                  messageRangeEnd={s.message_range_end}
                  createdAt={String(s.created_at)}
                />
              ))}

              {messageList.map((msg, index) => (
                <Fragment key={msg.message_id}>
                  {index > 0 && index % 20 === 0 && (
                    <SummaryButton onClick={handleSummary} isLoading={summaryLoading} />
                  )}
                  <MessageBubble
                    message={msg}
                    character={characterInfo}
                    onRollback={openRollbackDialog}
                    onRegenerate={(messageId) => {
                      setRegenTargetId(messageId);
                      setRegenDialogOpen(true);
                    }}
                    isStreaming={isStreaming}
                    onImageClick={handleImageClick}
                  />
                </Fragment>
              ))}

              {comparison && (
                <RegenerationComparison
                  previousContent={comparison.previousContent}
                  newContent={comparison.newContent}
                  onKeepNew={clearComparison}
                  onRevert={() => {
                    setMessageList((prev) => {
                      const copy = [...prev];
                      const lastAssistantIdx = copy.map((m) => m.role).lastIndexOf("assistant");
                      if (lastAssistantIdx === -1) return prev;
                      copy[lastAssistantIdx] = {
                        ...copy[lastAssistantIdx],
                        content: comparison.previousContent,
                      };
                      return copy;
                    });
                    clearComparison();
                  }}
                />
              )}

              <StreamingIndicator
                character={characterInfo}
                isStreaming={isStreaming}
                streamingMessage={streamingMessage}
              />

              {!isStreaming &&
                messageList.length > 0 &&
                messageList[messageList.length - 1].role === "assistant" && (
                  <SuggestedActions
                    actions={suggestedActions}
                    onSelect={sendMessage}
                    disabled={isStreaming}
                  />
                )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <ChatInputBar onSend={sendMessage} disabled={isStreaming} />
          </div>

          <div className="hidden lg:block">
            <ChatSettingsPanel
              open={settingsPanelOpen}
              onClose={() => setSettingsPanelOpen(false)}
              settings={settings}
              onUpdateSetting={updateSetting}
              onOpenMemory={() => setShowMemoryBook(true)}
              onOpenMaxOutput={() => setShowMaxOutput(true)}
            />
          </div>
        </div>

        <ConversationSettingsModal
          open={convSettingsOpen}
          onOpenChange={setConvSettingsOpen}
          currentModel={selectedModel}
          recommendedModel={room.character.recommended_model}
          roomTitle={room.title}
          onApply={(model, title) => {
            setSelectedModel(model);
            fetch("/api/chat/room-settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ room_id: room.room_id, title }),
            }).then(() => revalidator.revalidate());
          }}
        />

        <CustomizingModal
          open={customizingOpen}
          onOpenChange={setCustomizingOpen}
          characterNickname={settings.character_nickname}
          fontSize={settings.font_size}
          backgroundImageUrl={settings.background_image_url}
          onApply={(s) => updateMultiple(s)}
        />

        <JellyDepletionModal
          open={showDepletionModal}
          onClose={() => setShowDepletionModal(false)}
          onPurchase={() => {
            setShowDepletionModal(false);
            setShowPurchaseSheet(true);
          }}
        />
        <JellyPurchaseSheet
          open={showPurchaseSheet}
          onClose={() => setShowPurchaseSheet(false)}
          returnTo={`/chat/${room.room_id}`}
        />

        <MemoryBookModal
          open={showMemoryBook}
          onClose={() => setShowMemoryBook(false)}
          roomId={room.room_id}
        />

        <ImageGalleryModal
          images={galleryImages}
          initialIndex={galleryIndex}
          open={showGallery}
          onClose={() => setShowGallery(false)}
        />

        <MaxOutputModal
          open={showMaxOutput}
          onClose={() => setShowMaxOutput(false)}
          currentValue={settings.response_length}
          onSave={(value) => updateSetting("response_length", value)}
        />

        <RollbackDialog
          open={showRollbackDialog}
          onOpenChange={setShowRollbackDialog}
          rollbackMessageId={rollbackMessageId}
          messageList={messageList}
          onConfirm={confirmRollback}
          isSubmitting={branchFetcher.state === "submitting"}
        />

        <RegenerationDialog
          open={regenDialogOpen}
          onOpenChange={(open) => {
            setRegenDialogOpen(open);
            if (!open) setRegenTargetId(null);
          }}
          onConfirm={(guidance) => {
            if (regenTargetId != null) {
              regenerateMessage(regenTargetId, guidance);
              setRegenTargetId(null);
            }
          }}
          isStreaming={isStreaming}
        />

        <ModelWarningModal
          open={modelWarningOpen}
          onOpenChange={setModelWarningOpen}
          currentModel={selectedModel}
          alternatives={["gemini-2.5-flash", "claude-sonnet", "gpt-4o"]}
          onSwitchModel={(model) => setSelectedModel(model)}
        />
      </div>
    </div>
  );
}

function EmptyState({
  character,
  roomTitle,
  greetingMessage,
}: {
  character: { display_name: string | null; avatar_url: string | null };
  roomTitle: string;
  greetingMessage: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {character.avatar_url ? (
        <img
          src={character.avatar_url}
          alt={character.display_name ?? undefined}
          className="mb-4 h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#3f3f46]">
          <span className="text-3xl font-semibold text-white">
            {(character.display_name ?? "?")[0]}
          </span>
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold text-white">{character.display_name}</h3>
      <p className="mb-6 text-sm text-[#9ca3af]">{roomTitle}</p>
      {greetingMessage && (
        <div className="max-w-[320px] rounded-2xl bg-[#2f3032] px-4 py-3 text-center">
          <p className="text-sm leading-relaxed text-white">{greetingMessage}</p>
        </div>
      )}
      <p className="mt-6 text-xs text-[#6b7280]">아래에 메시지를 입력해서 대화를 시작해보세요</p>
    </div>
  );
}
