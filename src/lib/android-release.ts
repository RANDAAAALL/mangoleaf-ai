import { parseAndroidApkAssetLabel } from "@/lib/android-version.mjs";

export const androidReleasePage =
  "https://github.com/RANDAAAALL/mangoleaf-ai/releases";
export const androidReleaseApi =
  "https://api.github.com/repos/RANDAAAALL/mangoleaf-ai/releases/latest";
export const androidApkAsset = "mangoleaf-ai.apk";
const metadataByteLimit = 256 * 1024;
const apkByteLimit = 128 * 1024 * 1024;

export type AndroidRelease = {
  tag: string;
  downloadUrl: string;
  apkVersion?: string;
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Availability requires a published stable release and its exact repository asset. */
export function parseAndroidRelease(value: unknown): AndroidRelease | null {
  if (
    !object(value) ||
    value.draft !== false ||
    value.prerelease !== false ||
    typeof value.published_at !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(
      value.published_at,
    ) ||
    !Number.isFinite(Date.parse(value.published_at)) ||
    typeof value.tag_name !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.tag_name) ||
    value.tag_name.includes("..") ||
    !Array.isArray(value.assets) ||
    value.assets.length > 1000 ||
    value.html_url !== `${androidReleasePage}/tag/${value.tag_name}`
  )
    return null;
  const candidates = value.assets.filter(
    (asset) => object(asset) && asset.name === androidApkAsset,
  );
  if (candidates.length !== 1) return null;
  const asset = candidates[0];
  const downloadUrl = `${androidReleasePage}/download/${value.tag_name}/${androidApkAsset}`;
  if (
    asset.state !== "uploaded" ||
    !Number.isSafeInteger(asset.size) ||
    (asset.size as number) <= 0 ||
    (asset.size as number) > apkByteLimit ||
    ![
      "application/vnd.android.package-archive",
      "application/octet-stream",
    ].includes(asset.content_type as string) ||
    asset.browser_download_url !== downloadUrl
  )
    return null;
  // An app-release tag can change while the same approved native APK is reused.
  const apkVersion = parseAndroidApkAssetLabel(asset.label);
  return {
    tag: value.tag_name,
    downloadUrl,
    ...(apkVersion ? { apkVersion } : {}),
  };
}

/** Limit both waiting time and downloaded JSON; failure never implies an APK exists. */
export async function fetchAndroidRelease(
  signal?: AbortSignal,
  request: typeof fetch = fetch,
): Promise<AndroidRelease | null> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 8_000);
  signal?.addEventListener("abort", abort, { once: true });
  try {
    if (signal?.aborted) return null;
    const response = await request(androidReleaseApi, {
      headers: { Accept: "application/vnd.github+json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });
    const contentType = response.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();
    const declaredSize = response.headers.get("content-length");
    if (
      !response.ok ||
      response.redirected ||
      (response.url && response.url !== androidReleaseApi) ||
      !["application/json", "application/vnd.github+json"].includes(
        contentType || "",
      ) ||
      (declaredSize !== null &&
        (!/^\d+$/.test(declaredSize) ||
          Number(declaredSize) > metadataByteLimit))
    )
      return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > metadataByteLimit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    if (controller.signal.aborted) return null;
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return parseAndroidRelease(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
    controller.abort();
  }
}
