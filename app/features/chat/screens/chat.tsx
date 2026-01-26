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

import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import { useState, useEffect, useRef } from "react";
import { eq, desc } from "drizzle-orm";
import { Brain, RotateCcw } from "lucide-react";
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

  return { room, messages: messageList, branches };
}

/**
 * Chat Screen Component
 */
export default function ChatScreen() {
  const { room, messages: initialMessages, branches } = useLoaderData<typeof loader>();
  const [messageList, setMessageList] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [selectedMessageForBranch, setSelectedMessageForBranch] = useState<number | null>(null);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackMessageId, setRollbackMessageId] = useState<number | null>(null);
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
          model: "gpt-3.5-turbo",
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
      setIsStreaming(false);
      setStreamingMessage("");
      // Remove optimistic message on error
      setMessageList((prev) => prev.slice(0, -1));
      alert("메시지 전송에 실패했습니다.");
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

  // Handle branch creation response
  useEffect(() => {
    if (branchFetcher.state === "idle" && branchFetcher.data) {
      if (branchFetcher.data.success) {
        revalidator.revalidate();
      } else if (branchFetcher.data.error) {
        alert(`분기 생성 실패: ${branchFetcher.data.error}`);
      }
    }
  }, [branchFetcher.state, branchFetcher.data, revalidator]);

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

  // Handle branch switch response
  useEffect(() => {
    if (branchFetcher.state === "idle" && branchFetcher.data) {
      if (branchFetcher.data.success) {
        revalidator.revalidate();
      } else if (branchFetcher.data.error) {
        alert(`분기 전환 실패: ${branchFetcher.data.error}`);
      }
    }
  }, [branchFetcher.state, branchFetcher.data, revalidator]);

  // Get active branch
  const activeBranch = branches.find((b) => b.is_active);
  const activeBranchName = activeBranch?.branch_name || "main";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {room.character.avatar_url ? (
              <img
                src={room.character.avatar_url}
                alt={room.character.display_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold">
                  {room.character.display_name[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-semibold">{room.character.display_name}</h2>
              <p className="text-sm text-muted-foreground">{room.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Memory Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMemoryDrawerOpen(true)}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              메모리
            </Button>

            {/* Branch Selector */}
            {branches.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">분기:</span>
                <select
                  value={activeBranchName}
                  onChange={(e) => handleSwitchBranch(e.target.value)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {branches.map((branch) => (
                    <option key={branch.branch_name} value={branch.branch_name}>
                      {branch.branch_name} ({branch.message_count} 메시지)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
          {messageList.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex items-start gap-3 group ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0">
                  {room.character.avatar_url ? (
                    <img
                      src={room.character.avatar_url}
                      alt={room.character.display_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {room.character.display_name[0]}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`rounded-lg px-4 py-2 max-w-md ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            className="rounded-lg max-w-full h-auto my-2"
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {/* Rollback button - only show for non-streaming messages, visible on hover */}
                  {typeof msg.message_id === 'number' && msg.message_id > 0 && (
                    <button
                      onClick={() => handleOpenRollbackDialog(msg.message_id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-opacity opacity-0 group-hover:opacity-100"
                      title="이 메시지로 되돌리기"
                    >
                      <RotateCcw className="h-3 w-3" />
                      되돌리기
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
                    alt={room.character.display_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">
                      {room.character.display_name[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted max-w-md">
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg max-w-full h-auto my-2"
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
                <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
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
                    alt={room.character.display_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">
                      {room.character.display_name[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2">
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
              className="flex-1 rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
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
            <div className="bg-muted rounded-lg p-4 my-4">
              <p className="text-sm font-medium mb-2">되돌릴 메시지:</p>
              <div className="text-sm text-muted-foreground">
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
  );
}
