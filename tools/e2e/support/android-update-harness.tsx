import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
import { AboutTab } from "@/components/tab/about-tab";
import { SettingsTab } from "@/components/tab/settings-tab";
import { Footer } from "@/components/layout/footer";
import type { Language } from "@/lib/translations";

// This isolated browser host exercises real components with a controlled native protocol, never cloud HTTP.
const query = new URLSearchParams(location.search);
const calls: string[] = [];
let status = query.has("disabled") ? "disabled" : "checking";
const port: {
  onmessage?: (event: { data: string }) => void;
  postMessage(value: string): void;
} = {
  postMessage(value) {
    const { id, method } = JSON.parse(value);
    calls.push(method);
    queueMicrotask(() => {
      const result =
        method === "app.info"
          ? {
              bridgeVersion: 1,
              schemaVersion: 1,
              hostVersion: 3,
              hostVersionName: query.has("missing-version")
                ? undefined
                : query.has("bad-version")
                  ? "v0.1.4<script>"
                  : query.has("debug")
                    ? "0.1.4-dev"
                    : query.has("updated")
                      ? "0.1.8"
                      : "0.1.4",
              cloudEnvironment: "production",
              connected: true,
              validated: true,
              updateRestartSupported: !query.has("legacy"),
              apkUpdateSupported:
                !query.has("debug") && !query.has("unsupported"),
            }
          : method === "ota.status"
            ? { status }
            : method === "storage.settings.get"
              ? null
              : true;
      const error = method === "ota.restart" ? { code: "BUSY" } : undefined;
      port.onmessage?.({ data: JSON.stringify({ id, result, error }) });
    });
  },
};
Object.assign(window, { MangoLeafNative: port });

function Harness() {
  const [blocked, setBlocked] = useState(true);
  const [about, setAbout] = useState(false);
  const [settings, setSettings] = useState(false);
  const [language] = useState<Language>(query.has("bis") ? "bis" : "en");
  useEffect(() => {
    Object.assign(window, {
      updateTest: {
        calls,
        block: setBlocked,
        online(value: boolean) {
          port.onmessage?.({
            data: JSON.stringify({
              event: "connectivity",
              payload: { connected: value, validated: value },
            }),
          });
        },
        status(value: string) {
          status = value;
          port.onmessage?.({
            data: JSON.stringify({
              event: "connectivity",
              payload: { connected: true, validated: true },
            }),
          });
        },
      },
    });
  }, []);
  return (
    <>
      <button
        id="launcher"
        onClick={() => {
          setAbout(false);
          setSettings(false);
        }}
      >
        Home
      </button>
      <button
        id="about"
        onClick={() => {
          setAbout(true);
          setSettings(false);
        }}
      >
        About
      </button>
      <button
        id="settings"
        onClick={() => {
          setAbout(false);
          setSettings(true);
        }}
      >
        Settings
      </button>
      <input id="typing" aria-label="Test text input" />
      {about && <AboutTab language={language} onScanPress={() => {}} />}
      {settings && (
        <SettingsTab
          language={language}
          onLanguageChange={() => {}}
          updateBlocked={blocked}
        />
      )}
      <BackupRecoveryPanel language={language} />
      <Footer language={language} />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
