import React, { useEffect, useState } from "react";
import { Header } from "../../components/header.js";
import { settingsIpcClient, getCachedSettings } from "../../ipc/settings.js";
import { appBuildInfo } from "../../../shared/app-build-info.js";

type SettingsSectionId = "general" | "storage" | "about";

interface SettingsScreenProps {
  mode: "frameless" | "inline";
  onBack: () => void;
}

const sections: Array<{
  id: SettingsSectionId;
  title: string;
  description: string;
}> = [
  {
    id: "general",
    title: "General",
    description: "Workspace location and app defaults",
  },
  {
    id: "storage",
    title: "Storage",
    description: "Where ChattyPad keeps local data",
  },
  {
    id: "about",
    title: "About",
    description: "App information and local-only notes",
  },
];

export function SettingsScreen({
  mode,
  onBack,
}: SettingsScreenProps): React.ReactElement {
  const [selectedSection, setSelectedSection] = useState<SettingsSectionId>("general");
  const [databaseDir, setDatabaseDir] = useState(
    () => getCachedSettings()?.general.databaseDir ?? ""
  );
  const [isLoading, setIsLoading] = useState(() => getCachedSettings() === null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cachedSettings = getCachedSettings();

    if (cachedSettings) {
      setDatabaseDir(cachedSettings.general.databaseDir);
    }

    void settingsIpcClient.getSettings().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.success) {
        setDatabaseDir(result.data.general.databaseDir);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error.message);
      }

      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onBack]);

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
      setDatabaseDir(result.data.general.databaseDir);
      setIsSaving(false);
      return;
    }

    setErrorMessage(result.error.message);
    setIsSaving(false);
  };

  return (
    <div style={screenStyle}>
      <Header mode={mode} subtitle="Settings" />
      <div style={contentLayoutStyle}>
        <aside style={sidebarStyle} aria-label="Settings sections">
          <div style={sidebarHeaderRowStyle}>
            <div style={sidebarHeadingStyle}>Sections</div>
            <button
              type="button"
              className="top-action-btn"
              onClick={onBack}
              disabled={isSaving}
              title="Return to the workspace"
            >
              Back to app
            </button>
          </div>
          <div style={sectionListStyle}>
            {sections.map((section) => {
              const isSelected = section.id === selectedSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  className="sidebar-item-container"
                  onClick={() => setSelectedSection(section.id)}
                  disabled={isSaving}
                  style={{
                    ...sectionButtonStyle,
                    background: isSelected ? "var(--bg-active)" : "transparent",
                    color: isSelected ? "var(--text-main)" : "var(--text-muted)",
                  }}
                >
                  <div style={sectionButtonTitleStyle}>{section.title}</div>
                  <div style={{ ...sectionButtonDescriptionStyle, color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>{section.description}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <main style={mainStyle}>
          {selectedSection === "general" ? (
            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h1 style={panelTitleStyle}>General</h1>
                  <p style={panelCopyStyle}>
                    Choose where ChattyPad stores its local workspace database.
                  </p>
                </div>
              </div>

              <div style={cardStyle}>
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
                  style={inputStyle}
                />
                <p style={helperTextStyle}>
                  Changes to the database directory take effect after restarting ChattyPad.
                </p>
                {errorMessage ? <p style={errorTextStyle}>{errorMessage}</p> : null}
                <div style={actionsStyle}>
                  <button
                    type="button"
                    className="top-action-btn"
                    onClick={onBack}
                    disabled={isSaving}
                    style={{ padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="top-action-btn"
                    onClick={() => {
                      void handleSave();
                    }}
                    disabled={!canSave}
                    style={{ padding: "8px 16px", background: "var(--accent-blue)", color: "var(--text-main)", border: "none" }}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </section>
          ) : selectedSection === "storage" ? (
            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h1 style={panelTitleStyle}>Storage</h1>
                  <p style={panelCopyStyle}>
                    ChattyPad keeps its local database in a single directory on your machine.
                  </p>
                </div>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Current database directory</div>
                <div style={pathValueStyle}>{databaseDir || "Loading settings..."}</div>
                <div style={infoCopyStyle}>
                  This directory contains <code>chattypad.db</code> and any local workspace data.
                </div>
              </div>
            </section>
          ) : (
            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h1 style={panelTitleStyle}>About ChattyPad</h1>
                  <p style={panelCopyStyle}>
                    ChattyPad is a local-first desktop workspace. Your data never leaves your machine.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={infoLabelStyle}>App Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 24px", marginTop: 12 }}>
                    <div style={infoRowLabelStyle}>Version</div>
                    <div style={infoRowValueStyle}>{appBuildInfo.version}</div>
                    
                    <div style={infoRowLabelStyle}>Git commit</div>
                    <div style={infoRowValueStyle}>{appBuildInfo.gitCommit}</div>
                    
                    <div style={infoRowLabelStyle}>Build date</div>
                    <div style={infoRowValueStyle}>{new Date(appBuildInfo.buildDate).toLocaleString()}</div>
                  </div>
                </div>

                <div style={infoCopyStyle}>
                  Settings are saved locally and apply the next time the application starts.
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}


const screenStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100%",
  background: "var(--bg-darker)",
  color: "var(--text-main)",
};

const contentLayoutStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  minHeight: 0,
  overflow: "hidden",
};

const sidebarStyle: React.CSSProperties = {
  width: 280,
  minWidth: 220,
  background: "var(--bg-sidebar)",
  borderRight: "1px solid var(--border-subtle)",
  display: "flex",
  flexDirection: "column",
  padding: "20px 12px",
  gap: 16,
  flexShrink: 0,
};

const sidebarHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  padding: "0 4px",
};

const sidebarHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const sectionListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const sectionButtonStyle: React.CSSProperties = {
  border: "1px solid transparent",
  borderRadius: 12,
  background: "transparent",
  color: "var(--text-muted)",
  padding: "10px 12px",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const selectedSectionButtonStyle: React.CSSProperties = {
  background: "var(--bg-active)",
  borderColor: "var(--border-subtle)",
  color: "var(--text-main)",
};

const sectionButtonTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 4,
};

const sectionButtonDescriptionStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.4,
  color: "var(--text-muted)",
  opacity: 0.8,
};

const backButtonStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-hover)",
  color: "var(--text-main)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: "auto",
  padding: 28,
};

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  maxWidth: 820,
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
  color: "var(--text-main)",
};

const panelCopyStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  maxWidth: 560,
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--text-muted)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.02)",
  padding: 20,
};

const infoCardStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.02)",
  padding: 20,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--text-main)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-sidebar)",
  color: "var(--text-main)",
  fontSize: 15,
  outline: "none",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--text-muted)",
};

const errorTextStyle: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--text-error)",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
};

const buttonBaseStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid transparent",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  borderColor: "var(--border-subtle)",
  background: "transparent",
  color: "var(--text-main)",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "var(--accent-blue)",
  color: "var(--text-main)",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: 10,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginBottom: 14,
};


const infoRowLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 400,
  color: "var(--text-muted)",
};

const infoRowValueStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 400,
  color: "var(--text-main)",
  fontFamily: "monospace",
  wordBreak: "break-word",
};

const pathValueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text-main)",
  wordBreak: "break-word",
};

const infoCopyStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--text-muted)",
};
