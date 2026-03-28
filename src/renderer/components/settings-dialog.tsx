import React, { useEffect, useState } from "react";
import { getCachedSettings, settingsIpcClient } from "../ipc/settings.js";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
}: SettingsDialogProps): React.ReactElement | null {
  const [databaseDir, setDatabaseDir] = useState(
    () => getCachedSettings()?.general.databaseDir ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    void settingsIpcClient.getSettings().then((result) => {
      if (result.success) {
        setDatabaseDir(result.data.general.databaseDir);
      } else {
        setErrorMessage(result.error.message);
      }
      setIsLoading(false);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  const canSave = !isLoading && !isSaving && databaseDir.trim() !== "";

  const handleSave = async (): Promise<void> => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    const result = await settingsIpcClient.updateSettings({
      general: {
        databaseDir,
      },
    });

    if (result.success) {
      setIsSaving(false);
      onClose();
      return;
    }

    setErrorMessage(result.error.message);
    setIsSaving(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      style={dialogOverlayStyle}
      onClick={() => {
        if (!isSaving) {
          onClose();
        }
      }}
    >
      <div style={dialogCardStyle} onClick={(event) => event.stopPropagation()}>
        <h2 id="settings-dialog-title" style={dialogTitleStyle}>
          Settings
        </h2>
        <div style={sectionLabelStyle}>General</div>
        <label style={fieldLabelStyle} htmlFor="settings-database-dir">
          Database directory
        </label>
        <input
          id="settings-database-dir"
          type="text"
          value={databaseDir}
          onChange={(event) => setDatabaseDir(event.target.value)}
          disabled={isLoading || isSaving}
          autoFocus
          style={dialogInputStyle}
        />
        <p style={helperTextStyle}>
          Changes to the database directory take effect after restarting ChattyPad.
        </p>
        {errorMessage ? <p style={errorTextStyle}>{errorMessage}</p> : null}
        <div style={dialogActionsStyle}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={dialogSecondaryButtonStyle}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={!canSave}
            style={dialogPrimaryButtonStyle}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const dialogOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 17, 27, 0.78)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1200,
};

const dialogCardStyle: React.CSSProperties = {
  width: "min(520px, 100%)",
  borderRadius: 16,
  border: "1px solid #313244",
  background: "#181825",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
  padding: 20,
};

const dialogTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: "#cdd6f4",
};

const sectionLabelStyle: React.CSSProperties = {
  marginTop: 18,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6c7086",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  marginTop: 12,
  fontSize: 14,
  fontWeight: 600,
  color: "#cdd6f4",
};

const dialogInputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #45475a",
  background: "#11111b",
  color: "#cdd6f4",
  fontSize: 15,
  outline: "none",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#a6adc8",
};

const errorTextStyle: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#f38ba8",
};

const dialogActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
};

const dialogButtonBaseStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid transparent",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const dialogSecondaryButtonStyle: React.CSSProperties = {
  ...dialogButtonBaseStyle,
  borderColor: "#45475a",
  background: "transparent",
  color: "#cdd6f4",
};

const dialogPrimaryButtonStyle: React.CSSProperties = {
  ...dialogButtonBaseStyle,
  background: "#89b4fa",
  color: "#11111b",
};
