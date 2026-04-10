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
          color: "var(--text-muted)",
          fontSize: 14,
          background: "var(--bg-darker)",
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
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        background: "var(--bg-darker)",
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

  return (
    <div
      ref={registerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginLeft: 200,
        maxWidth: "min(900px, calc(100% - 240px))",
        alignSelf: "flex-start",
        padding: isHighlighted ? 8 : 0,
        background: isHighlighted ? "var(--bg-active)" : "transparent",
        borderRadius: 8,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-muted)",
          marginBottom: 8,
          opacity: 0.8,
        }}
      >
        {roleLabel}
      </div>
      <div
         style={{
          background: "rgba(255, 255, 255, 0.04)",
          color: "var(--text-main)",
          fontSize: 14,
          lineHeight: 1.6,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--border-subtle)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
