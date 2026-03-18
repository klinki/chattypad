import React, { useState } from "react";

interface LockScreenProps {
  projectName: string;
  isBusy: boolean;
  onUnlock: (password: string) => void;
}

export function LockScreen({
  projectName,
  isBusy,
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
  background: "#1e1e2e",
};

const cardStyle: React.CSSProperties = {
  width: "min(400px, 100%)",
  padding: 32,
  borderRadius: 16,
  background: "#181825",
  border: "1px solid #313244",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 700,
  color: "#cdd6f4",
};

const copyStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#a6adc8",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #45475a",
  background: "#11111b",
  color: "#cdd6f4",
  fontSize: 16,
  outline: "none",
  marginBottom: 16,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 10,
  border: "none",
  background: "#89b4fa",
  color: "#11111b",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#45475a",
  color: "#7f849c",
  cursor: "not-allowed",
};
