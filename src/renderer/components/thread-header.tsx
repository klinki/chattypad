/**
 * Thread header: shows the active thread title and metadata.
 * FR-005: Clearly indicates which thread is currently active.
 */
import React from "react";
import type { ThreadSummary } from "../../shared/contracts/workspace.js";

interface ThreadHeaderProps {
  thread: ThreadSummary;
}

export function ThreadHeader({ thread }: ThreadHeaderProps): React.ReactElement {
  const lastActivityLabel = thread.lastMessageAt
    ? `Last message ${formatRelativeTime(thread.lastMessageAt)}`
    : "No messages yet";

  return (
    <header
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #313244",
        background: "#1e1e2e",
        flexShrink: 0,
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#cdd6f4", margin: 0 }}>
        {thread.title}
      </h1>
      <div style={{ fontSize: 13, color: "#585b70", marginTop: 4 }}>
        {lastActivityLabel}
      </div>
    </header>
  );
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
