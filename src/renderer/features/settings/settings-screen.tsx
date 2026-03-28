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
              onClick={onBack}
              disabled={isSaving}
              title="Return to the workspace"
              style={backButtonStyle}
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
                  onClick={() => setSelectedSection(section.id)}
                  disabled={isSaving}
                  style={{
                    ...sectionButtonStyle,
                    ...(isSelected ? selectedSectionButtonStyle : {}),
                  }}
                >
                  <div style={sectionButtonTitleStyle}>{section.title}</div>
                  <div style={sectionButtonDescriptionStyle}>{section.description}</div>
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
                    onClick={onBack}
                    disabled={isSaving}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSave();
                    }}
                    disabled={!canSave}
                    style={primaryButtonStyle}
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
                  <h1 style={panelTitleStyle}>About</h1>
                  <p style={panelCopyStyle}>
                    ChattyPad keeps settings and workspace data local to this device.
                  </p>
                </div>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Build information</div>
                <div style={infoGridStyle}>
                  <InfoRow label="Version" value={appBuildInfo.version} />
                  <InfoRow label="Git commit" value={appBuildInfo.gitCommit} />
                  <InfoRow
                    label="Build date"
                    value={new Date(appBuildInfo.buildDate).toLocaleString()}
                  />
                </div>
                <div style={infoCopyStyle}>
                  Settings are saved on this machine and apply the next time ChattyPad starts.
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div style={infoRowStyle}>
      <div style={infoRowLabelStyle}>{label}</div>
      <div style={infoRowValueStyle}>{value}</div>
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100%",
  background: "linear-gradient(180deg, #11111b 0%, #1e1e2e 100%)",
  color: "#cdd6f4",
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
  background: "#181825",
  borderRight: "1px solid #313244",
  display: "flex",
  flexDirection: "column",
  padding: "20px 12px",
  gap: 16,
  flexShrink: 0,
};

const sidebarHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6c7086",
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
  color: "#a6adc8",
  padding: "12px 12px",
  textAlign: "left",
  cursor: "pointer",
};

const selectedSectionButtonStyle: React.CSSProperties = {
  background: "#262637",
  borderColor: "#45475a",
  color: "#cdd6f4",
};

const sectionButtonTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 4,
};

const sectionButtonDescriptionStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.4,
  color: "#6c7086",
};

const backButtonStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #45475a",
  background: "#313244",
  color: "#cdd6f4",
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
  fontSize: 28,
  fontWeight: 800,
  color: "#cdd6f4",
};

const panelCopyStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  maxWidth: 560,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#a6adc8",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #313244",
  borderRadius: 16,
  background: "#181825",
  padding: 20,
  boxShadow: "0 18px 40px rgba(0, 0, 0, 0.24)",
};

const infoCardStyle: React.CSSProperties = {
  border: "1px solid #313244",
  borderRadius: 16,
  background: "#181825",
  padding: 20,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 700,
  color: "#cdd6f4",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
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
  borderColor: "#45475a",
  background: "transparent",
  color: "#cdd6f4",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "#89b4fa",
  color: "#11111b",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6c7086",
  marginBottom: 10,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginBottom: 14,
};

const infoRowStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "12px 14px",
  borderRadius: 12,
  background: "#11111b",
  border: "1px solid #313244",
};

const infoRowLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6c7086",
};

const infoRowValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#cdd6f4",
  wordBreak: "break-word",
};

const pathValueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#cdd6f4",
  wordBreak: "break-word",
};

const infoCopyStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  lineHeight: 1.6,
  color: "#a6adc8",
};
