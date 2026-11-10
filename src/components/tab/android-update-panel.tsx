import { useCallback, useEffect, useRef, useState } from "react";
import { isAndroidBuild, nativeRequest } from "@/lib/native-bridge";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { translations, type Language } from "@/lib/translations";
import { useAndroidVersion } from "@/hooks/useAndroidVersion";
import { isCloudBackupRunning } from "@/lib/cloud-backup";
import {
  watchAndroidApkUpdate,
  watchAndroidUpdate,
  type AndroidApkOffer,
} from "@/lib/android-update";

/** Production updates are checked only while this Settings screen is mounted. */
export function AndroidUpdatePanel(props: {
  language: Language;
  blocked?: boolean;
}) {
  if (
    !isAndroidBuild() ||
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT !== "production"
  )
    return null;
  return <ProductionUpdatePanel {...props} />;
}

function ProductionUpdatePanel({
  language,
  blocked = false,
}: {
  language: Language;
  blocked?: boolean;
}) {
  const t = translations[language];
  const installedVersion = useAndroidVersion();
  const online = useConnectionStatus();
  const [offer, setOffer] = useState<AndroidApkOffer | null>(null);
  const [canRestart, setCanRestart] = useState<boolean | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const blockedRef = useRef(blocked);
  const restartPending = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);
  const idle = useCallback(
    () =>
      !blockedRef.current &&
      !restartPending.current &&
      document.visibilityState === "visible" &&
      !isCloudBackupRunning() &&
      !document.querySelector(
        'dialog[open], [role="dialog"], [aria-busy="true"]',
      ),
    [],
  );
  useEffect(() => {
    mounted.current = true;
    const stopApk = watchAndroidApkUpdate(setOffer, idle);
    const stopOta = watchAndroidUpdate(setCanRestart, idle);
    return () => {
      mounted.current = false;
      stopApk();
      stopOta();
    };
  }, [idle]);

  async function restart() {
    if (!idle()) return;
    restartPending.current = true;
    setRestarting(true);
    setFailed(false);
    try {
      if (!(await nativeRequest<boolean>("ota.restart")))
        throw new Error("Restart deferred");
    } catch {
      if (mounted.current) {
        setFailed(true);
        setRestarting(false);
      }
      restartPending.current = false;
    }
  }

  const actionClass =
    "mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#277839] px-4 py-3 text-sm font-bold text-white disabled:opacity-50";
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="apk-update-title"
        className="rounded-3xl border border-[#cfe2c8] bg-white p-6 text-[#143519]"
      >
        <h2 id="apk-update-title" className="text-xl font-bold">
          {offer ? t.androidApkUpdateAboutTitle : t.settingsUpdates}
        </h2>
        {installedVersion && (
          <p className="mt-3 font-semibold">
            {t.settingsInstalledVersion.replace("{version}", installedVersion)}
          </p>
        )}
        <p role="status" className="mt-3 text-sm leading-relaxed">
          {offer
            ? t.androidApkUpdateAboutText.replace("{version}", offer.version)
            : t.settingsUpdateUnconfirmed}
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          {t.androidApkWebsiteInstructions}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#526856]">
          {online ? t.settingsUpdatesHint : t.settingsUpdateOffline}
        </p>
        {online && !blocked && !restarting && (
          <a
            href="https://mangoleafai.vercel.app/download"
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            {t.androidApkWebsiteAction}
          </a>
        )}
      </section>
      {canRestart !== null && (
        <section
          aria-labelledby="ota-update-title"
          className="rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] p-6 text-[#143519]"
        >
          <h2 id="ota-update-title" className="text-xl font-bold">
            {t.androidUpdateReadyTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {canRestart
              ? t.androidUpdateReadyText
              : t.androidUpdateManualRestart}
          </p>
          <p role="status" className="mt-3 text-sm">
            {failed
              ? t.androidUpdateRestartError
              : restarting
                ? t.androidUpdateRestarting
                : ""}
          </p>
          {canRestart && (
            <button
              type="button"
              onClick={() => void restart()}
              disabled={blocked || restarting}
              className={actionClass}
            >
              {t.androidUpdateRestart}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
