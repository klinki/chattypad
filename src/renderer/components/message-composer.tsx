/**
 * Message composer: text input and send button for the active thread.
 * FR-007, FR-008, FR-009: Compose, send, and prevent empty submissions.
 */
import React, { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(120);
  const isResizing = useRef(false);

  useEffect(() => {
    if (focusRequestKey > 0) {
      textareaRef.current?.focus();
    }
  }, [focusRequestKey]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      const clampedHeight = Math.min(Math.max(80, newHeight), windowHeight * 0.5);
      setComposerHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

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
      // Reset height on send
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      textareaRef.current?.focus();
    }
  }

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !isResizing.current) {
      textarea.style.height = "auto";
      const maxHeight = window.innerHeight * 0.3;
      const nextHeight = Math.min(textarea.scrollHeight + 32, maxHeight); // 32 is padding
      if (nextHeight > composerHeight) {
        setComposerHeight(nextHeight);
      }
    }
  }, [value]);

  const canSend = !disabled && value.trim() !== "";
  const showInlineHint = !sendError && value.length > 0 && value.trim() === "";

  return (
    <div
      ref={containerRef}
      style={{
        padding: "16px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flexShrink: 0,
        height: composerHeight,
        position: "relative",
        userSelect: isResizing.current ? "none" : "auto",
      }}
    >
      {/* Resize Handle */}
      <div
        style={{
          position: "absolute",
          top: -2,
          left: 0,
          right: 0,
          height: 4,
          cursor: "ns-resize",
          zIndex: 10,
        }}
        onMouseDown={() => {
          isResizing.current = true;
          document.body.style.cursor = "ns-resize";
        }}
      />
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
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          overflow: "hidden",
          transition: "border-color 0.2s ease",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message…"
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            color: "var(--text-main)",
            border: "none",
            padding: "12px 50px 12px 14px",
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
            lineHeight: "1.5",
            height: "100%",
            width: "100%",
          }}
          aria-label="Message input"
          aria-invalid={sendError ? true : undefined}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          title="Send message (Enter)"
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            background: canSend ? "#1e66f5" : "transparent",
            color: canSend ? "#ffffff" : "var(--text-muted)",
            border: "none",
            borderRadius: 8,
            cursor: canSend ? "pointer" : "not-allowed",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            opacity: canSend ? 1 : 0.3,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
