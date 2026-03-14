/**
 * Message composer: text input and send button for the active thread.
 * FR-007, FR-008, FR-009: Compose, send, and prevent empty submissions.
 */
import React, { useRef } from "react";
import type { IpcError } from "../../shared/contracts/workspace.js";

interface MessageComposerProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  sendError: IpcError | null;
  disabled?: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  sendError,
  disabled = false,
}: MessageComposerProps): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        padding: "12px 16px",
        borderTop: "1px solid #313244",
        background: "#1e1e2e",
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
            fontSize: 12,
            color: "#f38ba8",
            background: "#33182a",
            padding: "6px 10px",
            borderRadius: 4,
          }}
        >
          {sendError.message}
        </div>
      )}
      {showInlineHint && (
        <div style={{ fontSize: 12, color: "#f9e2af" }}>
          Enter at least one non-whitespace character to send a message.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
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
            background: "#313244",
            color: "#cdd6f4",
            border: "1px solid #45475a",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
          }}
          aria-label="Message input"
          aria-invalid={sendError ? true : undefined}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            padding: "8px 16px",
            background: canSend ? "#1e66f5" : "#313244",
            color: canSend ? "#ffffff" : "#6c7086",
            border: "none",
            borderRadius: 6,
            cursor: canSend ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
            height: 38,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
