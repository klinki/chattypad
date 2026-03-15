import React from "react";
import { workspaceIpcClient } from "../ipc/workspace-client.js";

export function Header() {
  return (
    <div
      style={{
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#181825", // Catppuccin mantle roughly
        WebkitAppRegion: "drag", // Makes it draggable in Electron/Electrobun
        paddingLeft: "16px",
        color: "#cdd6f4",
        userSelect: "none",
        borderBottom: "1px solid #313244",
      } as any}
    >
      <div style={{ fontSize: "12px", fontWeight: "bold" }}>ChattyPad</div>
      <div
        style={{
          display: "flex",
          height: "100%",
          WebkitAppRegion: "no-drag", // Buttons shouldn't drag
        } as any}
      >
        <button
          onClick={() => workspaceIpcClient.minimizeWindow()}
          style={buttonStyle}
          title="Minimize"
        >
          ─
        </button>
        <button
          onClick={() => workspaceIpcClient.maximizeWindow()}
          style={buttonStyle}
          title="Maximize"
        >
          □
        </button>
        <button
          onClick={() => workspaceIpcClient.closeWindow()}
          style={{ ...buttonStyle, hoverColor: "#f38ba8" } as any}
          title="Close"
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "#f38ba8";
            (e.target as HTMLElement).style.color = "#11111b";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "transparent";
            (e.target as HTMLElement).style.color = "#cdd6f4";
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#cdd6f4",
  width: "46px",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "default",
  fontSize: "14px",
};
