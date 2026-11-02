import type { AndroidApkOffer } from "@/lib/android-update";
import { isAndroidBuild } from "@/lib/native-bridge";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { translations, type Language } from "@/lib/translations";
import { useAndroidVersion } from "@/hooks/useAndroidVersion";

/** Keep the verified native installer available after its popup is dismissed. */
export function AndroidUpdatePanel({
  language,
  offer,
  onUpdate,
  busy = false,
  showEmpty = false,
}: {
  language: Language;
  offer: AndroidApkOffer | null;
  onUpdate: (offer: AndroidApkOffer) => void;
  busy?: boolean;
  showEmpty?: boolean;
}) {
  const installedVersion = useAndroidVersion();
  const online = useConnectionStatus();
  if (
    (!offer && !showEmpty) ||
    !isAndroidBuild() ||
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT !== "production"
  )
    return null;
  const t = translations[language];
  if (!offer)
    return (
      <section
        aria-label={t.settingsUpdates}
        className="rounded-3xl border border-[#cfe2c8] bg-white p-6 text-[#143519]"
      >
        {installedVersion && (
          <p className="font-semibold">
            {t.settingsInstalledVersion.replace("{version}", installedVersion)}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed">
          {t.settingsUpdateUnconfirmed}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#526856]">
          {online ? t.settingsUpdatesHint : t.settingsUpdateOffline}
        </p>
      </section>
    );
  const actionClass =
    "mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#277839] px-4 py-3 text-sm font-bold text-white disabled:opacity-50";
  return (
    <section
      aria-labelledby="apk-update-title"
      className="rounded-3xl border border-[#b8d7b5] bg-[#edf6e9] p-6 text-[#143519]"
    >
      <h2 id="apk-update-title" className="text-xl font-bold">
        {t.androidApkUpdateAboutTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed">
        {t.androidApkUpdateAboutText.replace("{version}", offer.version)}
      </p>
      {!online && (
        <p id="apk-update-offline" role="status" className="mt-3 text-sm">
          {t.androidApkUpdateOffline}
        </p>
      )}
      <button
        type="button"
        onClick={() => onUpdate(offer)}
        disabled={!online || busy}
        aria-describedby={!online ? "apk-update-offline" : undefined}
        className={actionClass}
      >
        {t.androidApkUpdateNow}
      </button>
    </section>
  );
}
