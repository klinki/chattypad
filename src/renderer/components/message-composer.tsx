/**
 * Message composer: text input and send button for the active thread.
 * FR-007, FR-008, FR-009: Compose, send, and prevent empty submissions.
 */
import React, { useEffect, useRef } from "react";
import type { IpcError } from "../../shared/contracts/workspace.js";

interface MessageComposerProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  sendError: IpcError | null;
  focusRequestKey?: number;
  disabled?: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  sendError,
  focusRequestKey = 0,
  disabled = false,
}: MessageComposerProps): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusRequestKey > 0) {
      textareaRef.current?.focus();
    }
  }, [focusRequestKey]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend(): void {
    if (value.trim() !== "") {
      onSend();
      textareaRef.current?.focus();
    }
  }

  const canSend = !disabled && value.trim() !== "";
  const showInlineHint = !sendError && value.length > 0 && value.trim() === "";

  return (
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {sendError && (
        <div
          role="alert"
          style={{
            fontSize: 13,
            color: "#f38ba8",
            background: "#33182a",
            padding: "8px 10px",
            borderRadius: 6,
          }}
        >
          {sendError.message}
        </div>
      )}
      {showInlineHint && (
        <div style={{ fontSize: 13, color: "#f9e2af" }}>
          Enter at least one non-whitespace character to send a message.
        </div>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            background: "rgba(255, 255, 255, 0.05)",
            color: "var(--text-main)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            padding: "12px",
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
            lineHeight: "1.5",
          }}
          aria-label="Message input"
          aria-invalid={sendError ? true : undefined}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            background: canSend ? "#1e66f5" : "#313244",
            color: canSend ? "#ffffff" : "#6c7086",
            border: "none",
            borderRadius: 8,
            cursor: canSend ? "pointer" : "not-allowed",
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
            padding: "0 20px",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
