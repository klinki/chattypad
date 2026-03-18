import React, { useState } from "react";
import { workspaceIpcClient } from "../ipc/workspace-client.js";

interface HeaderProps {
  mode: "frameless" | "inline";
}

export function Header({ mode }: HeaderProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    workspaceIpcClient.maximizeWindow();
  };

  return (
    <div
      style={{
        height: mode === "frameless" ? "32px" : "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
          mode === "frameless"
            ? "#1e1e2e"
            : "linear-gradient(180deg, #181825 0%, #1e1e2e 100%)",
        color: "#cdd6f4",
        userSelect: "none",
        borderBottom: "1px solid #313244",
        flexShrink: 0,
      }}
    >
      <div
        className={
          mode === "frameless" ? "electrobun-webkit-app-region-drag" : undefined
        }
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          paddingLeft: "16px",
          paddingRight: "16px",
          gap: "10px",
          ...(mode === "frameless" ? ({ WebkitAppRegion: "drag" } as any) : {}),
        } as any}
        onDoubleClick={mode === "frameless" ? handleMaximize : undefined}
      >
        <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ChattyPad
        </div>
        {mode === "inline" ? (
          <>
            <div style={{ width: 1, height: 14, background: "#45475a" }} />
            <div style={{ fontSize: "12px", color: "#a6adc8" }}>
              Workspace
            </div>
          </>
        ) : null}
      </div>
      {mode === "frameless" ? (
        <div
          className="electrobun-webkit-app-region-no-drag"
          style={{
            display: "flex",
            height: "100%",
            WebkitAppRegion: "no-drag",
          } as any}
        >
          <WindowButton
            onClick={() => workspaceIpcClient.minimizeWindow()}
            icon={
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 5H10" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            }
            title="Minimize"
            hoverColor="#313244"
          />
          <WindowButton
            onClick={handleMaximize}
            icon={
              isMaximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 0.5H9.5V7.5H2.5V0.5Z" stroke="currentColor" strokeWidth="1" fill="transparent"/>
                  <path d="M0.5 2.5H7.5V9.5H0.5V2.5Z" stroke="currentColor" strokeWidth="1" fill="#1e1e2e"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1"/>
                </svg>
              )
            }
            title={isMaximized ? "Restore" : "Maximize"}
            hoverColor="#313244"
          />
          <WindowButton
            onClick={() => workspaceIpcClient.closeWindow()}
            icon={
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            }
            title="Close"
            hoverColor="#f38ba8"
            hoverBgColor="#f38ba8"
            hoverIconColor="#11111b"
          />
        </div>
      ) : (
        <div style={{ paddingRight: "16px", fontSize: "12px", color: "#6c7086" }}>
          Native window controls
        </div>
      )}
    </div>
  );
}

interface WindowButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hoverColor?: string;
  hoverBgColor?: string;
  hoverIconColor?: string;
}

function WindowButton({ onClick, icon, title, hoverBgColor, hoverIconColor }: WindowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      title={title}
      style={{
        background: isHovered ? (hoverBgColor || "#313244") : "transparent",
        color: isHovered && hoverIconColor ? hoverIconColor : "#cdd6f4",
        border: "none",
        width: "46px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
        transition: "background-color 0.1s ease, color 0.1s ease",
        WebkitAppRegion: "no-drag",
      } as any}
    >
      {icon}
    </button>
  );
}
