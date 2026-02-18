/**
 * 채팅 스트리밍 훅
 * handleSend, handleRegenerate, 메시지 리스트, 스트리밍 상태를 관리한다.
 */
import { useState, useEffect } from "react";
import type { ModelStatus } from "../components/model-status-banner";
import type { AIModel } from "../components/model-selector";

// 메시지 타입 (chat.tsx loader 반환값과 동일)
export interface ChatMessage {
  message_id: number;
  room_id: number;
  user_id: string;
  role: string;
  content: string;
  sequence_number: number;
  tokens_used: number | null;
  cost: number | null;
  parent_message_id: number | null;
  branch_name: string | null;
  is_active_branch: number;
  is_deleted: number;
  created_at: Date;
  updated_at: Date;
}

interface UseChatStreamingOptions {
  roomId: number;
  initialMessages: ChatMessage[];
  selectedModel: AIModel;
  onRegenerationRecord?: (messageId: number, previousContent: string, newContent: string) => void;
  onInsufficientPoints?: () => void;
}

export function useChatStreaming({
  roomId,
  initialMessages,
  selectedModel,
  onRegenerationRecord,
  onInsufficientPoints,
}: UseChatStreamingOptions) {
  const [messageList, setMessageList] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("stable");
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

  // initialMessages가 변경되면 (revalidation) 업데이트
  useEffect(() => {
    setMessageList(initialMessages);
  }, [initialMessages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistic update
    const optimisticUserMsg: ChatMessage = {
      message_id: Date.now(),
      room_id: roomId,
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
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          message: userMessage,
          model: selectedModel,
        }),
      });

      if (response.status === 402) {
        const data = (await response.json()) as { code?: string };
        if (data.code === "INSUFFICIENT_POINTS" && onInsufficientPoints) {
          setMessageList((prev) => prev.slice(0, -1));
          onInsufficientPoints();
        } else {
          setMessageList((prev) => prev.slice(0, -1));
          alert("메시지 전송에 실패했습니다.");
        }
        return;
      }
      if (!response.ok) throw new Error("Failed to send message");

      await processStream(response, messageList.length + 2);
    } catch (error) {
      console.error("Error sending message:", error);
      setModelStatus("unstable");
      setIsStreaming(false);
      setStreamingMessage("");
      setMessageList((prev) => prev.slice(0, -1));
      alert("메시지 전송에 실패했습니다.");
    }
  };

  const regenerateMessage = async (aiMessageId: number, guidance?: string) => {
    if (isStreaming) return;

    const aiMsgIndex = messageList.findIndex((m) => m.message_id === aiMessageId);
    if (aiMsgIndex === -1) return;

    const userMsg = messageList
      .slice(0, aiMsgIndex)
      .reverse()
      .find((m) => m.role === "user");
    if (!userMsg) return;

    const originalAiMsg = messageList[aiMsgIndex];
    setMessageList((prev) => prev.filter((m) => m.message_id !== aiMessageId));
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          message: userMsg.content,
          model: selectedModel,
          regenerate: true,
          replace_message_id: aiMessageId,
          ...(guidance !== undefined && { guidance }),
        }),
      });

      if (response.status === 402) {
        const data = (await response.json()) as { code?: string };
        if (data.code === "INSUFFICIENT_POINTS" && onInsufficientPoints) {
          setMessageList((prev) => {
            const restored = [...prev];
            restored.splice(aiMsgIndex, 0, originalAiMsg);
            return restored;
          });
          onInsufficientPoints();
        } else {
          setMessageList((prev) => {
            const restored = [...prev];
            restored.splice(aiMsgIndex, 0, originalAiMsg);
            return restored;
          });
          alert("메시지 전송에 실패했습니다.");
        }
        setIsStreaming(false);
        return;
      }
      if (!response.ok) throw new Error("Failed to regenerate message");

      await processStream(response, originalAiMsg.sequence_number, {
        regenerationContext: {
          messageId: aiMessageId,
          previousContent: originalAiMsg.content,
        },
        onRegenerationDone:
          onRegenerationRecord != null
            ? (prev, next) => onRegenerationRecord(aiMessageId, prev, next)
            : undefined,
      });
    } catch (error) {
      console.error("Error regenerating message:", error);
      setModelStatus("unstable");
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

  type RegenerationContext = {
    messageId: number;
    previousContent: string;
  };

  const processStream = async (
    response: Response,
    sequenceNumber: number,
    options?: { regenerationContext?: RegenerationContext; onRegenerationDone?: (prev: string, next: string) => void }
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

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

              if (data.error) {
                console.error("SSE error:", data.error);
                setModelStatus("unstable");
                setIsStreaming(false);
                setStreamingMessage("");
                setMessageList((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "user") return prev.slice(0, -1);
                  return prev;
                });
                if (data.code === "INSUFFICIENT_POINTS" && onInsufficientPoints) {
                  onInsufficientPoints();
                } else {
                  const errMsg =
                    typeof data.error === "string"
                      ? data.error
                      : "메시지 전송에 실패했습니다.";
                  alert(errMsg);
                }
                return;
              }

              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }

              if (data.done) {
                setModelStatus("stable");
                if (Array.isArray(data.suggested_actions)) {
                  setSuggestedActions(data.suggested_actions);
                }
                const ctx = options?.regenerationContext;
                if (ctx && options?.onRegenerationDone) {
                  options.onRegenerationDone(ctx.previousContent, fullResponse);
                }
                const aiMessage: ChatMessage = {
                  message_id: Date.now() + 1,
                  room_id: roomId,
                  user_id: "",
                  role: "assistant",
                  content: fullResponse,
                  sequence_number: sequenceNumber,
                  tokens_used: data.tokens ?? 0,
                  cost: data.cost ?? 0,
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
  };

  return {
    messageList,
    setMessageList,
    isStreaming,
    streamingMessage,
    modelStatus,
    setModelStatus,
    suggestedActions,
    setSuggestedActions,
    sendMessage,
    regenerateMessage,
  };
}
