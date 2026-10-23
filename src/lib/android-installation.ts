export const androidApplicationId =
  process.env.NODE_ENV === "development"
    ? "com.mangoleaf.ai.debug"
    : "com.mangoleaf.ai";

type RelatedAppsNavigator = {
  getInstalledRelatedApps?: () => Promise<unknown>;
};

/** Only a positive result for our exact native package changes the UI. Empty/error means unknown. */
export async function confirmsAndroidInstallation(
  browser: RelatedAppsNavigator,
  applicationId = androidApplicationId,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (typeof browser.getInstalledRelatedApps !== "function") return false;
    const apps = await Promise.race([
      browser.getInstalledRelatedApps(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 2000);
      }),
    ]);
    return (
      Array.isArray(apps) &&
      apps
        .slice(0, 3)
        .some((app) => app?.platform === "play" && app.id === applicationId)
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Package and fallback are fixed by this build/site, never taken from URL input or release metadata. */
export function androidLaunchLink(origin: string) {
  const fallback = encodeURIComponent(new URL("/download", origin).href);
  return `intent://open#Intent;scheme=mangoleaf;package=${androidApplicationId};S.browser_fallback_url=${fallback};end`;
}

let pending: Promise<boolean> | undefined;
let cached: { until: number; installed: boolean } | undefined;

/** Share short-lived hints across header/guide consumers; never persist an installation flag. */
export function readAndroidInstallation() {
  if (typeof navigator === "undefined") return Promise.resolve(false);
  if (cached && Date.now() < cached.until)
    return Promise.resolve(cached.installed);
  if (!pending) {
    pending = confirmsAndroidInstallation(
      navigator as RelatedAppsNavigator,
    ).then((installed) => {
      cached = { installed, until: Date.now() + 5000 };
      pending = undefined;
      return installed;
    });
  }
  return pending;
}
