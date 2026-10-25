import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AndroidUpdateModal } from "@/components/modal/android-update-modal";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
import { AboutTab } from "@/components/tab/about-tab";
import { AndroidUpdatePanel } from "@/components/tab/android-update-panel";
import { AndroidApkProgressModal } from "@/components/modal/android-apk-progress-modal";
import { useAndroidApkInstall } from "@/hooks/useAndroidApkInstall";
import type { AndroidApkOffer } from "@/lib/android-update";
import { Footer } from "@/components/layout/footer";
import type { Language } from "@/lib/translations";

// This isolated browser host exercises real components with a controlled native protocol, never cloud HTTP.
const query = new URLSearchParams(location.search);
const calls: string[] = [];
let status = query.has("disabled") ? "disabled" : "checking";
let installer = {
  id: "",
  version: "",
  status: "cancelled",
  downloaded: 0,
  total: 1000,
};
const port: {
  onmessage?: (event: { data: string }) => void;
  postMessage(value: string): void;
} = {
  postMessage(value) {
    const { id, method, payload } = JSON.parse(value);
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
            : method === "apkUpdate.start"
              ? (installer = {
                  id: payload.id,
                  version: payload.version,
                  status: "downloading",
                  downloaded: 0,
                  total: 1000,
                })
              : method === "apkUpdate.install"
                ? (installer = { ...installer, status: "installing" })
                : method === "apkUpdate.cancel"
                  ? (installer = { ...installer, status: "cancelled" })
                  : method === "apkUpdate.status"
                    ? { ...installer }
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
  const [apkOffer, setApkOffer] = useState<AndroidApkOffer | null>(null);
  const [language] = useState<Language>(query.has("bis") ? "bis" : "en");
  const apkInstaller = useAndroidApkInstall(blocked);
  useEffect(() => {
    Object.assign(window, {
      updateTest: {
        calls,
        block: setBlocked,
        installer(value: string, downloaded = installer.downloaded) {
          installer = { ...installer, status: value, downloaded };
        },
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
      <button id="launcher" onClick={() => setAbout(false)}>
        Home
      </button>
      <button id="about" onClick={() => setAbout(true)}>
        About
      </button>
      <input id="typing" aria-label="Test text input" />
      {about && (
        <AboutTab
          language={language}
          onScanPress={() => {}}
          updateNotice={
            <AndroidUpdatePanel
              language={language}
              offer={apkOffer}
              onUpdate={apkInstaller.start}
              busy={apkInstaller.busy}
            />
          }
        />
      )}
      <BackupRecoveryPanel language={language} />
      <AndroidUpdateModal
        language={language}
        blocked={blocked || apkInstaller.busy}
        onApkOffer={setApkOffer}
        onUpdate={apkInstaller.start}
        suppressApkReoffer={apkInstaller.isInstalling}
      />
      <AndroidApkProgressModal
        language={language}
        state={apkInstaller.state}
        onCancel={apkInstaller.cancel}
        onDismiss={apkInstaller.dismiss}
      />
      <Footer language={language} />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
