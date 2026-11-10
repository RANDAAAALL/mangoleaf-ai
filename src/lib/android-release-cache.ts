import {
  androidApkDownloadHref,
  fetchAndroidRelease,
  type AndroidRelease,
} from "@/lib/android-release";
import { parseAndroidApkAssetLabel } from "@/lib/android-version.mjs";

type CachedRelease = { until: number; release: AndroidRelease | null };
const key = "mangoleaf-public-apk-release-v1";
const successTtl = 5 * 60_000;
const failureTtl = 30_000;
let memory: CachedRelease | null = null;
let pending: Promise<AndroidRelease | null> | null = null;

/** Only bounded public metadata is cached; never trust cached download origins or native labels. */
export function readCachedAndroidRelease(): CachedRelease | null {
  const now = Date.now();
  if (memory && memory.until > now && memory.until <= now + successTtl)
    return memory;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw || raw.length > 2048) return null;
    const value = JSON.parse(raw);
    if (!value || !Number.isFinite(value.until) || value.until <= now)
      return null;
    const release = value.release;
    const ttl = release === null ? failureTtl : successTtl;
    if (value.until > now + ttl) return null;
    if (
      release !== null &&
      (!release ||
        typeof release.tag !== "string" ||
        typeof release.downloadUrl !== "string" ||
        !androidApkDownloadHref(release, null) ||
        (release.apkVersion !== undefined &&
          (typeof release.apkVersion !== "string" ||
            parseAndroidApkAssetLabel(`Android APK v${release.apkVersion}`) !==
              release.apkVersion)))
    )
      return null;
    memory = { until: value.until, release };
    return memory;
  } catch {
    // Private browsing and storage failures must still allow an in-memory request.
    return null;
  }
}

/** Share one bounded request. Subscriber unmounts cannot cancel another reader's availability check. */
export function loadCachedAndroidRelease(): Promise<AndroidRelease | null> {
  const cached = readCachedAndroidRelease();
  if (cached) return Promise.resolve(cached.release);
  if (pending) return pending;
  pending = fetchAndroidRelease()
    .then((release) => {
      memory = {
        until: Date.now() + (release ? successTtl : failureTtl),
        release,
      };
      try {
        sessionStorage.setItem(key, JSON.stringify(memory));
      } catch {
        /* Memory remains usable. */
      }
      return release;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
