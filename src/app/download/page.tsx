"use client";

import { useState } from "react";
import Link from "next/link";
import { translations, type Language } from "@/lib/translations";
import { useAndroidAppLink } from "@/hooks/useAndroidAppLink";
import { useAndroidRelease } from "@/hooks/useAndroidRelease";
import { androidApkAsset, androidReleasePage } from "@/lib/android-release";

/** Keep download availability honest until a signed APK is actually published. */
export default function DownloadPage() {
  const [language, setLanguage] = useState<Language>("bis");
  const t = translations[language];
  const { href: appLink, installed } = useAndroidAppLink();
  const { checking, release, downloadHref } = useAndroidRelease();
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-6 text-[#143519]">
      <button
        onClick={() => setLanguage(language === "en" ? "bis" : "en")}
        className="self-end rounded-xl border px-4 py-2"
      >
        EN / BIS
      </button>
      <h1 className="text-3xl font-bold">{t.androidDownloadTitle}</h1>
      <p>{t.androidDownloadDescription}</p>
      {appLink && (
        <div className="rounded-xl border border-[#b8d7b5] p-4">
          <p className="mb-3">
            {installed
              ? t.androidInstalledConfirmed
              : t.androidAlreadyInstalled}
          </p>
          <a
            href={appLink}
            className="inline-flex min-h-11 items-center rounded-xl bg-[#277839] px-5 py-3 font-bold text-white"
          >
            {installed ? t.androidOpenApp : t.androidOpenOrInstall}
          </a>
        </div>
      )}
      <p role="status" className="rounded-xl bg-[#eaf6e5] p-4">
        {checking
          ? t.androidDownloadChecking
          : release
            ? t.androidDownloadAvailable.replace("{version}", release.tag)
            : t.androidDownloadPending}
      </p>
      {release?.apkVersion && (
        <p className="font-semibold" data-testid="available-apk-version">
          {t.androidDownloadVersion.replace("{version}", release.apkVersion)}
        </p>
      )}
      {release &&
        downloadHref &&
        (installed ? (
          <details className="rounded-xl border border-[#b8d7b5] p-4">
            <summary className="cursor-pointer font-semibold">
              {t.androidDownloadAgain}
            </summary>
            <p className="my-3 text-sm">{t.androidDownloadAgainHint}</p>
            <a
              className="inline-flex min-h-11 items-center rounded-xl border border-[#277839] px-5 py-3 font-bold"
              href={downloadHref}
              download={
                downloadHref.startsWith("/apk/") ? androidApkAsset : undefined
              }
              rel="noopener noreferrer"
            >
              {t.androidDownloadApk}
            </a>
          </details>
        ) : (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#277839] px-5 py-3 font-bold text-white"
            href={downloadHref}
            download={
              downloadHref.startsWith("/apk/") ? androidApkAsset : undefined
            }
            rel="noopener noreferrer"
          >
            {t.androidDownloadApk}
          </a>
        ))}
      {release && <p className="text-sm">{t.androidDownloadTrouble}</p>}
      <a
        className="underline"
        href={
          release
            ? `${androidReleasePage}/tag/${release.tag}`
            : androidReleasePage
        }
        rel="noopener noreferrer"
        target="_blank"
      >
        {release ? t.androidDownloadFallback : t.androidDownloadReleases}
      </a>
      <p>{t.androidDownloadCompatibility}</p>
      <p>{t.androidDownloadMigration}</p>
      <Link className="underline" href="/">
        {t.androidDownloadBrowser}
      </Link>
    </main>
  );
}
