/**
 * Message history list: renders messages in chronological order.
 * FR-006: Messages displayed oldest to newest.
 */
import React, { useEffect, useRef } from "react";
import type { MessageView } from "../../shared/contracts/workspace.js";

interface MessageHistoryProps {
  messages: MessageView[];
}

export function MessageHistory({ messages }: MessageHistoryProps): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#585b70",
          fontSize: 13,
        }}
      >
        No messages yet. Start the conversation below.
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      role="log"
      aria-label="Conversation history"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: MessageView }): React.ReactElement {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const roleLabel = isSystem ? "System" : isUser ? "You" : "Assistant";
  const bubbleColor = isSystem ? "#313244" : isUser ? "#1e66f5" : "#313244";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        alignSelf: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#585b70",
          marginBottom: 3,
          paddingLeft: isUser ? 0 : 4,
          paddingRight: isUser ? 4 : 0,
        }}
      >
        {roleLabel}
      </div>
      <div
        style={{
          background: bubbleColor,
          color: "#cdd6f4",
          borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          padding: "8px 12px",
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
