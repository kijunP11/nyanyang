/**
 * Chat Screen
 *
 * Main chat interface for conversing with AI characters.
 * Features:
 * - Message thread UI (user on right, AI on left)
 * - Real-time streaming responses
 * - Typing indicator
 * - Message timestamps
 * - Optimistic updates
 */

import type { Route } from "./+types/chat";

import { useLoaderData, useFetcher, useRevalidator, useOutletContext } from "react-router";
import { useState, useEffect, useRef } from "react";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, Brain, Menu, RefreshCw, RotateCcw, Send, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";

import { characters } from "../../characters/schema";
import { chatRooms, messages } from "../schema";
import { getActiveBranchMessages, getRoomBranches } from "../lib/branch-manager.server";
import MemoryDrawer from "../components/memory-drawer";
import { ModelSelector, type AIModel } from "../components/model-selector";
import { ModelStatusBanner, type ModelStatus } from "../components/model-status-banner";
import { ChatSidebar, type ChatItem } from "~/core/components/chat-sidebar";
import type { NavigationOutletContext } from "~/core/layouts/navigation.layout";

/**
 * Loader function for fetching chat room and messages
 */
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

  // Fetch room with character info
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

  // Fetch active branch messages only
  const messageList = await getActiveBranchMessages(roomId);

  // Get all branches for the branch selector
  const branches = await getRoomBranches(roomId);

  // Fetch all user's chat rooms for sidebar
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

/**
 * Chat Screen Component
 */
export default function ChatScreen() {
  const { room, messages: initialMessages, branches, allRooms } = useLoaderData<typeof loader>();
  const { user: navUser } = useOutletContext<NavigationOutletContext>();

  // Map allRooms to ChatItem[] for sidebar
  const sidebarChats: ChatItem[] = allRooms.map((r) => ({
    roomId: r.room_id,
    characterName: r.character_name ?? "Unknown",
    characterAvatarUrl: r.character_avatar_url,
    lastMessageAt: (r.last_message_at ?? r.created_at).toISOString(),
  }));
  const [messageList, setMessageList] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackMessageId, setRollbackMessageId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    (room.character.recommended_model as AIModel) || "gemini-2.5-flash"
  );
  const [modelStatus, setModelStatus] = useState<ModelStatus>("stable");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const branchFetcher = useFetcher();
  const revalidator = useRevalidator();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList, streamingMessage]);

  // Handle message send
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistic update - add user message immediately
    const optimisticUserMsg = {
      message_id: Date.now(),
      room_id: room.room_id,
      user_id: "",
      role: "user",
      content: userMessage,
      sequence_number: messageList.length + 1,
      tokens_used: 0,
      cost: 0,
      parent_message_id: null,
      branch_name: null,
      is_active_branch: 1,
      is_deleted: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    setMessageList((prev) => [...prev, optimisticUserMsg]);

    try {
      // Stream AI response
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.room_id,
          message: userMessage,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        let fullResponse = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.content) {
                    fullResponse += data.content;
                    setStreamingMessage(fullResponse);
                  }

                  if (data.done) {
                    setModelStatus("stable");
                    // Add AI message to list
                    const aiMessage = {
                      message_id: Date.now() + 1,
                      room_id: room.room_id,
                      user_id: "",
                      role: "assistant",
                      content: fullResponse,
                      sequence_number: messageList.length + 2,
                      tokens_used: data.tokens || 0,
                      cost: data.cost || 0,
                      parent_message_id: null,
                      branch_name: null,
                      is_active_branch: 1,
                      is_deleted: 0,
                      created_at: new Date(),
                      updated_at: new Date(),
                    };
                    setMessageList((prev) => [...prev, aiMessage]);
                    setStreamingMessage("");
                    setIsStreaming(false);
                  }
                } catch (e) {
                  console.error("Failed to parse SSE data:", e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setModelStatus("unstable");
      setIsStreaming(false);
      setStreamingMessage("");
      // Remove optimistic message on error
      setMessageList((prev) => prev.slice(0, -1));
      alert("메시지 전송에 실패했습니다.");
    }
  };

  // Handle regenerate AI message
  const handleRegenerate = async (aiMessageId: number) => {
    if (isStreaming) return;

    // Find the AI message to regenerate
    const aiMsgIndex = messageList.findIndex((m) => m.message_id === aiMessageId);
    if (aiMsgIndex === -1) return;

    // Find the user message right before the AI message
    const userMsg = messageList
      .slice(0, aiMsgIndex)
      .reverse()
      .find((m) => m.role === "user");
    if (!userMsg) return;

    // Store original AI message for rollback
    const originalAiMsg = messageList[aiMsgIndex];

    // Remove AI message from UI immediately
    setMessageList((prev) => prev.filter((m) => m.message_id !== aiMessageId));

    // Start streaming
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.room_id,
          message: userMsg.content,
          model: selectedModel,
          regenerate: true,
          replace_message_id: aiMessageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        let fullResponse = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.content) {
                    fullResponse += data.content;
                    setStreamingMessage(fullResponse);
                  }

                  if (data.done) {
                    setModelStatus("stable");
                    // Add regenerated AI message to list
                    const aiMessage = {
                      message_id: Date.now() + 1,
                      room_id: room.room_id,
                      user_id: "",
                      role: "assistant",
                      content: fullResponse,
                      sequence_number: originalAiMsg.sequence_number,
                      tokens_used: data.tokens || 0,
                      cost: data.cost || 0,
                      parent_message_id: null,
                      branch_name: null,
                      is_active_branch: 1,
                      is_deleted: 0,
                      created_at: new Date(),
                      updated_at: new Date(),
                    };
                    setMessageList((prev) => [...prev, aiMessage]);
                    setStreamingMessage("");
                    setIsStreaming(false);
                  }
                } catch (e) {
                  console.error("Failed to parse SSE data:", e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error regenerating message:", error);
      setModelStatus("unstable");
      // Restore original AI message on error
      setMessageList((prev) => {
        const restored = [...prev];
        restored.splice(aiMsgIndex, 0, originalAiMsg);
        return restored;
      });
      setIsStreaming(false);
      setStreamingMessage("");
      alert("메시지 재생성에 실패했습니다.");
    }
  };

  // Handle branch creation from a message (rollback)
  const handleOpenRollbackDialog = (messageId: number) => {
    setRollbackMessageId(messageId);
    setShowRollbackDialog(true);
  };

  const handleConfirmRollback = () => {
    if (!rollbackMessageId) return;

    branchFetcher.submit(
      { room_id: room.room_id, parent_message_id: rollbackMessageId },
      {
        method: "POST",
        action: "/api/chat/branch",
        encType: "application/json",
      }
    );
    setShowRollbackDialog(false);
    setRollbackMessageId(null);
  };

  // Handle branch switch
  const handleSwitchBranch = (branchName: string) => {
    branchFetcher.submit(
      { room_id: room.room_id, branch_name: branchName },
      {
        method: "PUT",
        action: "/api/chat/branch",
        encType: "application/json",
      }
    );
  };

  // Handle branch fetcher response (creation & switch)
  useEffect(() => {
    if (branchFetcher.state === "idle" && branchFetcher.data) {
      if (branchFetcher.data.success) {
        revalidator.revalidate();
      } else if (branchFetcher.data.error) {
        alert(`분기 작업 실패: ${branchFetcher.data.error}`);
      }
    }
  }, [branchFetcher.state, branchFetcher.data, revalidator]);

  // Get active branch
  const activeBranch = branches.find((b) => b.is_active);
  const activeBranchName = activeBranch?.branch_name || "main";

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="flex h-[calc(100vh-57px)] w-full overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <ChatSidebar
          user={navUser ? { name: navUser.name, email: navUser.email, avatarUrl: navUser.avatarUrl } : null}
          chats={sidebarChats}
        />
      </div>

      {/* Chat Area */}
      <div className="relative flex flex-1 overflow-hidden">
      {/* 블러 배경 이미지 */}
      {room.character.avatar_url && (
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
      )}
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 z-0 bg-black/50" />

      {/* 메인 채팅 영역 (가운데 정렬) */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[600px] flex-col bg-black/60">
        {/* Header */}
        <div className="relative flex items-center justify-between bg-[#232323]/90 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={() => window.history.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* 아바타 (56px) */}
            {room.character.avatar_url ? (
              <img
                src={room.character.avatar_url ?? undefined}
                alt={room.character.display_name ?? undefined}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3f3f46]">
                <span className="text-lg font-semibold text-white">
                  {(room.character.display_name ?? "?")[0]}
                </span>
              </div>
            )}

            {/* 캐릭터 이름 + 부제 */}
            <div>
              <h2 className="font-semibold text-white">{room.character.display_name}</h2>
              <p className="text-sm text-[#9ca3af]">{room.title || "알수없음"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Badge */}
            <span className="rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white">
              {selectedModel.toUpperCase().replace("GEMINI-", "").replace("-", " ")}
              {room.character.recommended_model === selectedModel && (
                <span className="ml-1 text-[10px] opacity-80">권장</span>
              )}
            </span>

            {/* 메뉴 버튼 */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* 드롭다운 메뉴 */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-4 top-full z-50 mt-2 w-56 rounded-lg bg-[#232323] p-2 shadow-lg"
            >
            {/* Model Selector */}
            <div className="border-b border-[#3f3f46] pb-2 mb-2">
              <p className="px-3 py-1 text-xs text-[#9ca3af]">AI 모델</p>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={(model) => {
                  setSelectedModel(model);
                  setShowMenu(false);
                }}
              />
            </div>

            {/* Memory Button */}
            <button
              onClick={() => {
                setIsMemoryDrawerOpen(true);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              <Brain className="h-4 w-4" />
              메모리 관리
            </button>

            {/* Branch Selector */}
            {branches.length > 1 && (
              <div className="border-t border-[#3f3f46] pt-2 mt-2">
                <p className="px-3 py-1 text-xs text-[#9ca3af]">대화 분기</p>
                {branches.map((branch) => (
                  <button
                    key={branch.branch_name}
                    onClick={() => {
                      handleSwitchBranch(branch.branch_name);
                      setShowMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                      branch.is_active
                        ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{branch.branch_name}</span>
                    <span className="text-xs text-[#9ca3af]">{branch.message_count}개</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* 면책 배너 */}
        <div className="bg-[#3f3f46]/80 px-4 py-2 text-center text-xs text-[#9ca3af]">
          이 캐릭터는 유저가 기입한 정보를 토대로 제작된 AI 챗봇입니다. 동명의 실존인물 혹은 단체와는 관련이 없습니다.
        </div>

        {/* 모델 상태 배너 */}
        <ModelStatusBanner
          status={modelStatus}
          currentModel={selectedModel}
          recommendedAlternatives={["gemini-2.5-flash", "claude-sonnet"]}
          onSwitchModel={(model) => setSelectedModel(model as AIModel)}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-4 py-6">
            {/* Empty state - Entry UI with greeting message */}
            {messageList.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-12">
                {/* Character Avatar (Large) */}
                {room.character.avatar_url ? (
                  <img
                    src={room.character.avatar_url}
                    alt={room.character.display_name ?? undefined}
                    className="h-24 w-24 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#3f3f46] mb-4">
                    <span className="text-3xl font-semibold text-white">
                      {(room.character.display_name ?? "?")[0]}
                    </span>
                  </div>
                )}

                {/* Character Name */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  {room.character.display_name}
                </h3>

                {/* Room Title */}
                <p className="text-sm text-[#9ca3af] mb-6">{room.title}</p>

                {/* Greeting Message */}
                {room.character.greeting_message && (
                  <div className="max-w-[320px] rounded-2xl bg-[#2f3032] px-4 py-3 text-center">
                    <p className="text-sm text-white leading-relaxed">
                      {room.character.greeting_message}
                    </p>
                  </div>
                )}

                {/* Hint Text */}
                <p className="mt-6 text-xs text-[#6b7280]">
                  아래에 메시지를 입력해서 대화를 시작해보세요
                </p>
              </div>
            )}

          {messageList.map((msg) => (
            <div
              key={msg.message_id}
              className={`group flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar - AI만 표시 */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0">
                  {room.character.avatar_url ? (
                    <img
                      src={room.character.avatar_url}
                      alt={room.character.display_name ?? undefined}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3f3f46]">
                      <span className="text-xs font-semibold text-white">
                        {(room.character.display_name ?? "?")[0]}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`max-w-[280px] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#14b8a6] text-white"
                      : "bg-[#2f3032] text-white"
                  }`}
                >
                  <div className="prose prose-sm max-w-none text-sm text-white prose-p:text-white prose-strong:text-white prose-em:text-white">
                    <ReactMarkdown
                      components={{
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            className="my-2 h-auto max-w-full rounded-lg"
                            alt={props.alt || "Image"}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-[#9ca3af]">
                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {/* Rollback button - only show for non-streaming messages, visible on hover */}
                  {typeof msg.message_id === 'number' && msg.message_id > 0 && (
                    <button
                      onClick={() => handleOpenRollbackDialog(msg.message_id)}
                      className="flex items-center gap-1 text-xs text-[#9ca3af] opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100"
                      title="이 메시지로 되돌리기"
                    >
                      <RotateCcw className="h-3 w-3" />
                      되돌리기
                    </button>
                  )}
                  {/* Regenerate button - only for AI messages */}
                  {msg.role === "assistant" && typeof msg.message_id === 'number' && msg.message_id > 0 && (
                    <button
                      onClick={() => handleRegenerate(msg.message_id)}
                      className="flex items-center gap-1 text-xs text-[#9ca3af] opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100"
                      title="재생성"
                      disabled={isStreaming}
                    >
                      <RefreshCw className="h-3 w-3" />
                      재생성
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {room.character.avatar_url ? (
                  <img
                    src={room.character.avatar_url}
                    alt={room.character.display_name ?? undefined}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3f3f46]">
                    <span className="text-xs font-semibold text-white">
                      {(room.character.display_name ?? "?")[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="max-w-[280px] rounded-2xl bg-[#2f3032] px-4 py-3">
                <div className="prose prose-sm max-w-none text-sm text-white prose-p:text-white">
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="my-2 h-auto max-w-full rounded-lg"
                          alt={props.alt || "Image"}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-2 last:mb-0" {...props} />
                      ),
                    }}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                </div>
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-white" />
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingMessage && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {room.character.avatar_url ? (
                  <img
                    src={room.character.avatar_url}
                    alt={room.character.display_name ?? undefined}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3f3f46]">
                    <span className="text-xs font-semibold text-white">
                      {(room.character.display_name ?? "?")[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-[#2f3032] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

        {/* Input */}
        <div className="bg-[#232323] px-4 py-3">
          <div className="flex items-center gap-2">
            {/* [+] 버튼 */}
            <button
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3f3f46] text-white hover:bg-[#52525b]"
              title="첨부"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* 텍스트 입력 */}
            <div className="flex flex-1 items-center gap-2 rounded-full bg-[#3f3f46] px-4 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#9ca3af] focus:outline-none disabled:opacity-50"
              />

              {/* 퀵 입력 버튼들 */}
              <button
                onClick={() => setInputValue((prev) => prev + "*지문*")}
                className="rounded-md px-2 py-1 text-xs text-[#9ca3af] hover:bg-white/10 hover:text-white"
                title="지문 추가"
              >
                *지문*
              </button>
              <button
                onClick={() => setInputValue((prev) => prev + '"대사"')}
                className="rounded-md px-2 py-1 text-xs text-[#9ca3af] hover:bg-white/10 hover:text-white"
                title="대사 추가"
              >
                "대사"
              </button>
            </div>

            {/* 전송 버튼 (민트색 원형) */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#14b8a6] text-white hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Memory Drawer */}
      <MemoryDrawer
        roomId={room.room_id}
        open={isMemoryDrawerOpen}
        onOpenChange={setIsMemoryDrawerOpen}
      />

      {/* Rollback Confirmation Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대화 되돌리기</DialogTitle>
            <DialogDescription>
              이 메시지로 대화를 되돌리시겠습니까? 현재 대화는 유지되며, 이 메시지부터 새로운 대화를 시작할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {/* Preview of the message to rollback to */}
          {rollbackMessageId && (
            <div className="rounded-lg bg-[#2f3032] p-4 my-4">
              <p className="text-sm font-medium text-white mb-2">되돌릴 메시지:</p>
              <div className="text-sm text-[#9ca3af]">
                {messageList
                  .find((msg) => msg.message_id === rollbackMessageId)
                  ?.content.substring(0, 200)}
                {messageList.find((msg) => msg.message_id === rollbackMessageId)?.content
                  .length && messageList.find((msg) => msg.message_id === rollbackMessageId)!
                    .content.length > 200
                  ? "..."
                  : ""}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRollbackDialog(false);
                setRollbackMessageId(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmRollback} disabled={branchFetcher.state === "submitting"}>
              {branchFetcher.state === "submitting" ? "처리 중..." : "되돌리기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
