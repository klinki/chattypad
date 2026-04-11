import React, { useEffect, useMemo, useRef } from "react";
import type { IpcError, WorkspaceSearchResult } from "../../shared/contracts/workspace.js";

interface SearchOverlayProps {
  isOpen: boolean;
  query: string;
  results: WorkspaceSearchResult[];
  isLoading: boolean;
  error: IpcError | null;
  selectedResultId: string | null;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSelectResultId: (resultId: string | null) => void;
  onOpenResult: (result: WorkspaceSearchResult) => void;
}

export function SearchOverlay({
  isOpen,
  query,
  results,
  isLoading,
  error,
  selectedResultId,
  onQueryChange,
  onClose,
  onSelectResultId,
  onOpenResult,
}: SearchOverlayProps): React.ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIndex = useMemo(
    () => results.findIndex((result) => result.id === selectedResultId),
    [results, selectedResultId]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const moveSelection = (offset: number) => {
    if (results.length === 0) {
      return;
    }

    const nextIndex =
      selectedIndex === -1
        ? 0
        : (selectedIndex + offset + results.length) % results.length;
    onSelectResultId(results[nextIndex]?.id ?? null);
  };

  const openSelectedResult = () => {
    if (selectedIndex === -1) {
      return;
    }

    const result = results[selectedIndex];
    if (result) {
      onOpenResult(result);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workspace search"
      style={overlayStyle}
      onMouseDown={onClose}
    >
      <div style={panelStyle} onMouseDown={(event) => event.stopPropagation()}>
        <div style={inputRowStyle}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search threads and messages"
            aria-label="Search workspace"
            style={inputStyle}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveSelection(1);
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                moveSelection(-1);
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                openSelectedResult();
              }
            }}
          />
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Esc
          </button>
        </div>
        <div style={resultsPanelStyle}>
          {query.trim().length < 2 ? (
            <SearchHint copy="Type at least 2 characters to search the workspace." />
          ) : isLoading ? (
            <SearchHint copy="Searching…" />
          ) : error ? (
            <SearchHint copy={error.message} tone="error" />
          ) : results.length === 0 ? (
            <SearchHint copy="No matches found." />
          ) : (
            <div role="listbox" aria-label="Search results" style={resultsListStyle}>
              {results.map((result) => {
                const isSelected = result.id === selectedResultId;
                return (
                  <button
                    key={result.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    style={{
                      ...resultButtonStyle,
                      ...(isSelected ? selectedResultButtonStyle : null),
                    }}
                    onMouseEnter={() => onSelectResultId(result.id)}
                    onFocus={() => onSelectResultId(result.id)}
                    onClick={() => onOpenResult(result)}
                  >
                    <div style={resultHeaderStyle}>
                      <span style={kindBadgeStyle}>{result.kind === "thread" ? "Thread" : "Message"}</span>
                      <span style={resultPathStyle}>
                        {result.projectName} / {result.threadTitle}
                      </span>
                    </div>
                    <div style={resultSnippetStyle}>{result.snippet}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchHint({
  copy,
  tone = "muted",
}: {
  copy: string;
  tone?: "muted" | "error";
}): React.ReactElement {
  return (
    <div
      style={{
        padding: "32px 20px",
        color: tone === "error" ? "var(--text-error)" : "var(--text-muted)",
        fontSize: 14,
        textAlign: "center",
      }}
    >
      {copy}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "80px 24px 24px",
  zIndex: 1200,
  backdropFilter: "blur(4px)",
};

const panelStyle: React.CSSProperties = {
  width: "min(700px, 100%)",
  borderRadius: 12,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-sidebar)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
  overflow: "hidden",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "16px 20px",
  borderBottom: "1px solid var(--border-subtle)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  color: "var(--text-main)",
  fontSize: 16,
  padding: "8px 0",
  outline: "none",
};

const closeButtonStyle: React.CSSProperties = {
  borderRadius: 6,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-hover)",
  color: "var(--text-muted)",
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 8px",
  cursor: "pointer",
};

const resultsPanelStyle: React.CSSProperties = {
  maxHeight: "min(500px, calc(100vh - 200px))",
  overflowY: "auto",
};

const resultsListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 12,
  gap: 4,
};

const resultButtonStyle: React.CSSProperties = {
  border: "1px solid transparent",
  borderRadius: 8,
  background: "transparent",
  color: "var(--text-main)",
  padding: "10px 14px",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const selectedResultButtonStyle: React.CSSProperties = {
  background: "var(--bg-hover)",
  borderColor: "var(--border-subtle)",
};

const resultHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 4,
};

const kindBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "2px 6px",
  borderRadius: 4,
  background: "var(--bg-active)",
  color: "var(--accent)",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const resultPathStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const resultSnippetStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--text-main)",
  opacity: 0.8,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
