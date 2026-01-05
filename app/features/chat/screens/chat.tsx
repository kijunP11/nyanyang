/**
 * Chat Screen Component
 *
 * Main chat interface for AI character conversations
 */
import type { Route } from "./+types/chat";

import { useEffect, useRef, useState } from "react";

import { CharacterProfile } from "../components/character-profile";
import { type CharacterInfo, ChatHeader } from "../components/chat-header";
import { ChatInput } from "../components/chat-input";
import {
  ChatMessage,
  type ChatMessage as ChatMessageType,
} from "../components/chat-message";
import {
  type ChatSettings,
  ChatSettingsDialog,
} from "../components/chat-settings";
import { MessageActions } from "../components/message-actions";
import { type AIModel, ModelSelector } from "../components/model-selector";
import {
  type ModelStatus,
  ModelStatusBanner,
} from "../components/model-status-banner";

/**
 * Meta function for the chat page
 */
export const meta: Route.MetaFunction = ({ params }) => {
  return [
    {
      title: `채팅 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

import { data } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Loader function for the chat page
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const characterId = params.characterId;

  if (!characterId) {
    throw new Error("Character ID is required");
  }

  // Fetch character data
  const { data: character } = await client
    .from("characters")
    .select("*")
    .eq("character_id", Number(characterId))
    .single();

  if (!character) {
    throw new Error("Character not found");
  }

  return {
    character,
  };
}

export default function Chat({ loaderData }: Route.ComponentProps) {
  const { character } = loaderData;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convert DB character to CharacterInfo for UI components
  const characterInfo: CharacterInfo = {
    id: String(character.character_id),
    name: character.name,
    avatarUrl: character.avatar_url || undefined,
    status: character.status,
    description: character.description || undefined,
  };

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "1",
      role: "character",
      content: character.greeting_message || "안녕!",
      timestamp: new Date(),
      characterName: character.name,
      action: "*인사를 건넨다*",
    },
  ]);

  // State for AI model and settings
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-3-flash");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("stable");
  const [settings, setSettings] = useState<ChatSettings>({
    fontSize: 14,
    userBubbleColor: "#41C7BD",
    characterBubbleColor: "#3f3f46",
    theme: "dark",
  });

  // Mock character data
  // const character: CharacterInfo = {
  //   id: loaderData.characterId,
  //   name: "캐릭터",
  //   status: "알수없음",
  //   description: "세부 내용 설명",
  // };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string, type: "action" | "dialogue") => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: type === "action" ? `*${content}*` : content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      // Send to AI API
      const response = await fetch("/api/chat/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_id: character.character_id,
          message: content,
          message_type: type,
          model: selectedModel,
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: "character",
          content: data.response.content,
          timestamp: new Date(),
          characterName: data.response.character_name,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle error with fallback message
        const errorMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: "character",
          content:
            data.response?.content || "죄송합니다. 응답을 생성할 수 없습니다.",
          timestamp: new Date(),
          characterName: character.name,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Fallback message on error
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: "character",
        content: "죄송합니다. 네트워크 오류가 발생했습니다.",
        timestamp: new Date(),
        characterName: character.name,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleRollback = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex >= 0) {
      setMessages((prev) => prev.slice(0, messageIndex + 1));
    }
  };

  const handleRegenerate = (messageId: string) => {
    // TODO: Regenerate message from AI
    console.log("Regenerating message:", messageId);
  };

  const handleBranch = (messageId: string) => {
    // TODO: Create new branch from this message
    console.log("Creating branch from message:", messageId);
  };

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        backgroundImage: settings.backgroundImage
          ? `url(${settings.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="bg-background/95 flex items-center justify-between border-b backdrop-blur">
        <ChatHeader character={characterInfo} />
        <div className="flex items-center gap-2 px-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <ChatSettingsDialog
            settings={settings}
            onSettingsChange={setSettings}
          />
        </div>
      </div>

      {/* Model Status Banner */}
      <ModelStatusBanner
        status={modelStatus}
        currentModel={selectedModel}
        recommendedAlternatives={["claude-sonnet", "opus"]}
        onSwitchModel={(model) => setSelectedModel(model as AIModel)}
      />

      {/* Character Profile */}
      <CharacterProfile
        name={character.name}
        description={character.description || ""}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl">
          {messages.map((message, index) => (
            <div key={message.id} className="group relative">
              <ChatMessage
                message={message}
                userBubbleColor={settings.userBubbleColor}
                characterBubbleColor={settings.characterBubbleColor}
                fontSize={settings.fontSize}
              />
              {message.role === "character" &&
                index === messages.length - 1 && (
                  <div className="absolute top-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <MessageActions
                      messageId={message.id}
                      onRollback={handleRollback}
                      onRegenerate={handleRegenerate}
                      onBranch={handleBranch}
                    />
                  </div>
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
