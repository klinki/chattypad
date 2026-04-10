/**
 * Message history list: renders messages in chronological order.
 * FR-006: Messages displayed oldest to newest.
 */
import React, { useEffect, useRef } from "react";
import type { MessageView } from "../../shared/contracts/workspace.js";

interface MessageHistoryProps {
  messages: MessageView[];
  revealedMessageId?: string | null;
  onRevealHandled?: () => void;
}

export function MessageHistory({
  messages,
  revealedMessageId = null,
  onRevealHandled,
}: MessageHistoryProps): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const revealTimeoutRef = useRef<Timer | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);

  useEffect(() => {
    if (revealedMessageId) {
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, revealedMessageId]);

  useEffect(() => {
    if (!revealedMessageId) {
      return;
    }

    const targetNode = messageRefs.current[revealedMessageId];
    if (!targetNode) {
      onRevealHandled?.();
      return;
    }

    targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(revealedMessageId);
    onRevealHandled?.();

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId((current) => (current === revealedMessageId ? null : current));
    }, 1800);

    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, [onRevealHandled, revealedMessageId]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#585b70",
          fontSize: 14,
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
        <MessageBubble
          key={msg.id}
          message={msg}
          isHighlighted={msg.id === highlightedMessageId}
          registerRef={(node) => {
            messageRefs.current[msg.id] = node;
          }}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  isHighlighted,
  registerRef,
}: {
  message: MessageView;
  isHighlighted: boolean;
  registerRef: (node: HTMLDivElement | null) => void;
}): React.ReactElement {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const roleLabel = isSystem ? "System" : isUser ? "You" : "Assistant";
  const bubbleColor = isSystem ? "#313244" : isUser ? "#1e66f5" : "#313244";

  return (
    <div
      ref={registerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        alignSelf: isUser ? "flex-end" : "flex-start",
        borderRadius: 14,
        padding: isHighlighted ? 6 : 0,
        margin: isHighlighted ? -6 : 0,
        background: isHighlighted ? "rgba(250, 179, 135, 0.16)" : "transparent",
        boxShadow: isHighlighted ? "0 0 0 1px rgba(250, 179, 135, 0.34)" : "none",
        transition: "background-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#585b70",
          marginBottom: 4,
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
          padding: "10px 14px",
          fontSize: 15,
          lineHeight: 1.6,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
