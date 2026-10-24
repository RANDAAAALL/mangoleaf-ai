import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  androidApkAssetLabel,
  parseAndroidVersion,
} from "../src/lib/android-version.mjs";
import {
  androidApkAsset,
  androidApkDownloadHref,
  androidReleaseApi,
  androidReleasePage,
  fetchAndroidRelease,
  parseAndroidRelease,
} from "../src/lib/android-release";

test("the production download path resolves only to the fixed APK and disables intermediary caching", () => {
  const config = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  expect(config.rewrites).toHaveLength(1);
  const rewrite = config.rewrites[0];
  const parameter = /^\/apk\/:tag\((.+)\)\/mangoleaf-ai\.apk$/.exec(
    rewrite.source,
  );
  expect(parameter).not.toBeNull();
  const route = new RegExp(`^/apk/(${parameter[1]})/mangoleaf-ai\\.apk$`);
  const release = parseAndroidRelease(published());
  const path = androidApkDownloadHref(
    release,
    "https://mangoleafai.vercel.app",
  );
  const matched = route.exec(path);
  expect(matched).not.toBeNull();
  expect(rewrite.destination.replace(":tag", matched[1])).toBe(
    release.downloadUrl,
  );
  for (const invalid of [
    "/apk/../mangoleaf-ai.apk",
    "/apk/v1%2fother/mangoleaf-ai.apk",
    "/apk/v1/other.apk",
    "/apk/v1/mangoleaf-ai.apk/extra",
  ])
    expect(route.test(invalid)).toBe(false);
  const response = config.headers.find(
    (entry) => entry.source === rewrite.source,
  );
  const headers = Object.fromEntries(
    response.headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );
  expect(headers["content-disposition"]).toBe(
    'attachment; filename="mangoleaf-ai.apk"',
  );
  expect(headers["cache-control"]).toContain("no-store");
  expect(headers["cdn-cache-control"]).toBe("no-store");
  expect(headers["x-vercel-enable-rewrite-caching"]).toBe("0");
});

test("production APK links stay on the website while local hosts retain validated GitHub URLs", () => {
  const release = parseAndroidRelease(published());
  expect(release).not.toBeNull();
  expect(
    androidApkDownloadHref(release, "https://mangoleafai.vercel.app"),
  ).toBe("/apk/v9.8.7/mangoleaf-ai.apk");
  for (const origin of [
    null,
    "http://localhost:3000",
    "https://example.trycloudflare.com",
    "https://mangoleafai.vercel.app.evil.invalid",
    "http://mangoleafai.vercel.app",
  ])
    expect(androidApkDownloadHref(release, origin)).toBe(release.downloadUrl);
  for (const tag of ["../other", "v1/other", "v1%2fother", "v1..2", "v1\n"])
    expect(
      androidApkDownloadHref(
        { ...release, tag },
        "https://mangoleafai.vercel.app",
      ),
    ).toBeUndefined();
  expect(
    androidApkDownloadHref(
      { ...release, downloadUrl: "https://evil.invalid/app.apk" },
      "https://mangoleafai.vercel.app",
    ),
  ).toBeUndefined();
});

function published() {
  return {
    draft: false,
    prerelease: false,
    published_at: "2026-10-22T00:00:00Z",
    tag_name: "v9.8.7",
    html_url: `${androidReleasePage}/tag/v9.8.7`,
    assets: [
      {
        name: androidApkAsset,
        state: "uploaded",
        size: 15_000_000,
        content_type: "application/vnd.android.package-archive",
        browser_download_url: `${androidReleasePage}/download/v9.8.7/${androidApkAsset}`,
      },
    ],
  };
}

test("APK asset versions stay independent of web tags and accept only production labels", () => {
  const release = published();
  release.assets[0].label = androidApkAssetLabel("0.1.4");
  expect(parseAndroidRelease(release)).toMatchObject({
    tag: "v9.8.7",
    apkVersion: "0.1.4",
  });
  for (const label of [
    null,
    "",
    "v9.8.7",
    "Android APK v0.1.4-dev",
    "Android APK v01.2.3",
    "Android APK v0.1.4\n",
    "Android APK v<script>",
  ]) {
    const parsed = parseAndroidRelease({
      ...release,
      assets: [{ ...release.assets[0], label }],
    });
    expect(parsed?.downloadUrl).toBe(release.assets[0].browser_download_url);
    expect(parsed?.apkVersion).toBeUndefined();
  }
  // Labels never bypass the existing exact-repository upload checks.
  expect(parseAndroidRelease({ ...release, draft: true })).toBeNull();
  expect(
    parseAndroidRelease({
      ...release,
      assets: [{ ...release.assets[0], state: "new" }],
    }),
  ).toBeNull();
});

test("installed versions allow Debug while production publisher labels reject it", () => {
  expect(parseAndroidVersion("0.1.4")).toBe("0.1.4");
  expect(parseAndroidVersion("0.1.4-dev")).toBe("0.1.4-dev");
  for (const value of [
    undefined,
    null,
    5,
    "v0.1.4",
    "0.1",
    "0.1.4\n",
    "0.1.4-dev.exe",
    "0.1.4<script>",
    "9".repeat(60),
  ])
    expect(parseAndroidVersion(value)).toBeUndefined();
  expect(() => androidApkAssetLabel("0.1.4-dev")).toThrow();
  expect(() => androidApkAssetLabel(undefined)).toThrow();
});

test("download availability requires a stable published release with exactly one complete APK", () => {
  const release = published();
  expect(parseAndroidRelease(release)).toEqual({
    tag: release.tag_name,
    downloadUrl: release.assets[0].browser_download_url,
  });
  for (const replacement of [
    { draft: true },
    { draft: undefined },
    { prerelease: true },
    { published_at: null },
    { published_at: "invalid" },
    { assets: [] },
    { assets: [...release.assets, ...release.assets] },
    { tag_name: "../other" },
    { tag_name: "v1/../v2" },
    { tag_name: "v1?query" },
    { html_url: "https://github.com/other/project/releases/tag/v9.8.7" },
  ])
    expect(parseAndroidRelease({ ...release, ...replacement })).toBeNull();
  for (const replacement of [
    { name: "app-debug.apk" },
    { state: "new" },
    { size: 0 },
    { size: 0.1 },
    { size: 128 * 1024 * 1024 + 1 },
    { content_type: "text/html" },
  ])
    expect(
      parseAndroidRelease({
        ...release,
        assets: [{ ...release.assets[0], ...replacement }],
      }),
    ).toBeNull();
  for (const invalid of [null, [], "available", 1, {}])
    expect(parseAndroidRelease(invalid)).toBeNull();
});

test("download links reject external hosts, redirects, tag mismatch and URL decorations", () => {
  const release = published();
  const url = release.assets[0].browser_download_url;
  for (const untrusted of [
    url.replace("github.com", "github.com.evil.invalid"),
    url.replace("github.com", "github.com@evil.invalid"),
    url.replace("https:", "http:"),
    url.replace("RANDAAAALL", "other-owner"),
    url.replace("mangoleaf-ai/releases", "other-project/releases"),
    url.replace("v9.8.7", "v9.8.6"),
    url.replace("v9.8.7", "latest"),
    url.replace("mangoleaf-ai.apk", "app-debug.apk"),
    `${url}?redirect=https://evil.invalid`,
    `${url}#download`,
    url.replace("v9.8.7", "%2E%2E"),
    "javascript:alert(1)",
  ])
    expect(
      parseAndroidRelease({
        ...release,
        assets: [{ ...release.assets[0], browser_download_url: untrusted }],
      }),
    ).toBeNull();
});

test("availability fetch uses only the fixed public API without credentials or redirects", async () => {
  const release = published();
  const result = await fetchAndroidRelease(undefined, async (url, options) => {
    expect(url).toBe(androidReleaseApi);
    expect(options.credentials).toBe("omit");
    expect(options.referrerPolicy).toBe("no-referrer");
    expect(options.redirect).toBe("error");
    expect(options.cache).toBe("no-store");
    expect(options.headers).toEqual({ Accept: "application/vnd.github+json" });
    expect(options.signal.aborted).toBe(false);
    return Response.json(release);
  });
  expect(result?.downloadUrl).toBe(release.assets[0].browser_download_url);
});

test("unavailable, malformed or oversized responses never advertise a download", async () => {
  const oversized = new Uint8Array(256 * 1024 + 1);
  let canceled = false;
  const responses = [
    new Response(null, { status: 404 }),
    new Response(null, { status: 429 }),
    new Response("<html>not a release</html>", {
      headers: { "Content-Type": "text/html" },
    }),
    new Response("invalid JSON", {
      headers: { "Content-Type": "application/json" },
    }),
    Response.json(published(), { headers: { "Content-Length": "262145" } }),
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(oversized);
        },
        cancel() {
          canceled = true;
        },
      }),
      { headers: { "Content-Type": "application/json" } },
    ),
  ];
  for (const response of responses)
    expect(
      await fetchAndroidRelease(undefined, async () => response),
    ).toBeNull();
  expect(canceled).toBe(true);
  const redirect = Response.json(published());
  Object.defineProperty(redirect, "redirected", { value: true });
  expect(await fetchAndroidRelease(undefined, async () => redirect)).toBeNull();
  expect(
    await fetchAndroidRelease(undefined, async () => {
      throw new TypeError("Offline");
    }),
  ).toBeNull();
});

test("leaving the download screen cancels its request and cannot publish late results", async () => {
  const canceled = new AbortController();
  canceled.abort();
  let canceledCalls = 0;
  expect(
    await fetchAndroidRelease(canceled.signal, async () => {
      canceledCalls++;
      return Response.json(published());
    }),
  ).toBeNull();
  expect(canceledCalls).toBe(0);
  const controller = new AbortController();
  let requestSignal;
  const pending = fetchAndroidRelease(
    controller.signal,
    async (_url, options) => {
      requestSignal = options.signal;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () =>
          reject(new Error("Aborted")),
        );
      });
    },
  );
  controller.abort();
  expect(await pending).toBeNull();
  expect(requestSignal.aborted).toBe(true);
});
