import React, { useState } from "react";

interface LockScreenProps {
  projectName: string;
  isBusy: boolean;
  errorMessage?: string | null;
  onUnlock: (password: string) => void;
}

export function LockScreen({
  projectName,
  isBusy,
  errorMessage,
  onUnlock,
}: LockScreenProps): React.ReactElement {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() !== "" && !isBusy) {
      onUnlock(password);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={titleStyle}>{projectName} is Locked</h2>
        <p style={copyStyle}>
          This project is encrypted. Please enter the password to access its contents.
        </p>
        <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: 20 }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoFocus
            disabled={isBusy}
          />
          {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
          <button
            type="submit"
            disabled={isBusy || password.trim() === ""}
            style={isBusy || password.trim() === "" ? disabledButtonStyle : buttonStyle}
          >
            {isBusy ? "Unlocking..." : "Unlock Project"}
          </button>
        </form>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-darker)",
};

const cardStyle: React.CSSProperties = {
  width: "min(380px, 100%)",
  padding: "40px 32px",
  borderRadius: 12,
  background: "var(--bg-sidebar)",
  border: "1px solid var(--border-subtle)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  boxShadow: "0 15px 45px rgba(0, 0, 0, 0.5)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  color: "var(--text-main)",
};

const copyStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--text-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-subtle)",
  background: "rgba(255, 255, 255, 0.04)",
  color: "var(--text-main)",
  fontSize: 14,
  outline: "none",
  marginBottom: 16,
  textAlign: "center",
};

const errorStyle: React.CSSProperties = {
  marginBottom: 16,
  color: "#f38ba8",
  fontSize: 13,
  lineHeight: 1.4,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent-blue)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s ease",
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "var(--bg-active)",
  color: "var(--text-muted)",
  cursor: "not-allowed",
  opacity: 0.5,
};
