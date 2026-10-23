import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AndroidUpdateModal } from "@/components/modal/android-update-modal";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
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
                    : "0.1.4",
              cloudEnvironment: "production",
              connected: true,
              validated: true,
              updateRestartSupported: !query.has("legacy"),
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
  const [language] = useState<Language>(query.has("bis") ? "bis" : "en");
  useEffect(() => {
    Object.assign(window, {
      updateTest: {
        calls,
        block: setBlocked,
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
      <button id="launcher">Home</button>
      <input id="typing" aria-label="Test text input" />
      <BackupRecoveryPanel language={language} />
      <AndroidUpdateModal language={language} blocked={blocked} />
      <Footer language={language} />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
