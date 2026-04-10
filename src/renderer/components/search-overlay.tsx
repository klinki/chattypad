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
        color: tone === "error" ? "#f38ba8" : "#6c7086",
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
  background: "rgba(17, 17, 27, 0.64)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "72px 24px 24px",
  zIndex: 1200,
};

const panelStyle: React.CSSProperties = {
  width: "min(760px, 100%)",
  borderRadius: 18,
  border: "1px solid #313244",
  background: "#181825",
  boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
  overflow: "hidden",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 16,
  borderBottom: "1px solid #313244",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid #45475a",
  borderRadius: 12,
  background: "#11111b",
  color: "#cdd6f4",
  fontSize: 15,
  padding: "12px 14px",
  outline: "none",
};

const closeButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid #45475a",
  background: "#262637",
  color: "#cdd6f4",
  fontSize: 12,
  fontWeight: 700,
  padding: "10px 12px",
  cursor: "pointer",
};

const resultsPanelStyle: React.CSSProperties = {
  maxHeight: "min(480px, calc(100vh - 180px))",
  overflowY: "auto",
};

const resultsListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 10,
  gap: 8,
};

const resultButtonStyle: React.CSSProperties = {
  border: "1px solid #313244",
  borderRadius: 14,
  background: "#1e1e2e",
  color: "#cdd6f4",
  padding: 14,
  textAlign: "left",
  cursor: "pointer",
};

const selectedResultButtonStyle: React.CSSProperties = {
  borderColor: "#89b4fa",
  background: "#23273d",
};

const resultHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
  flexWrap: "wrap",
};

const kindBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#313244",
  color: "#89b4fa",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const resultPathStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#a6adc8",
};

const resultSnippetStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.5,
  color: "#cdd6f4",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
