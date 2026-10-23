import type { Page } from "@playwright/test";
import { test, expect, nav, openApp, records } from "./support/fixtures";
import { translations, type Language } from "../../src/lib/translations";
import {
  androidApkAsset,
  androidReleaseApi,
  androidReleasePage,
} from "../../src/lib/android-release";

declare global {
  interface Window {
    mangoInstallControl: { calls: number; prevented: boolean; offer(): void };
    mangoLegacyInstallListeners: { added: string[]; removed: string[] };
    mangoRelatedApps: { calls: number; installed: boolean };
  }
}

const installURL = "https://mangoleafai.vercel.app/?install=1";

/** Controlled signals prove website behavior, never physical APK installation. */
async function installBrowser(
  page: Page,
  options: {
    language?: Language;
    legacyStandalone?: boolean;
    otherDevice?: boolean;
    relatedApps?: "confirmed" | "empty" | "reject" | "hang" | "wrong-package";
  } = {},
) {
  // The isolated server blocks all external connections. Permit only this
  // mocked endpoint on the download document, preserving every other policy.
  await page.route("http://127.0.0.1:4173/download", async (route) => {
    const response = await route.fetch();
    const headers = response.headers();
    headers["content-security-policy"] = headers[
      "content-security-policy"
    ].replace("connect-src 'self'", `connect-src 'self' ${androidReleaseApi}`);
    await route.fulfill({ response, headers });
  });
  // Download-screen checks use controlled metadata, never real release traffic.
  await page.route(androidReleaseApi, (route) =>
    route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: { assets: [] },
    }),
  );
  await page.addInitScript((settings) => {
    localStorage.setItem("preferred_language", settings.language ?? "en");
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: settings.otherDevice
        ? "Unsupported mobile device"
        : "Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/130.0.0.0 Mobile",
    });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: !!settings.legacyStandalone,
    });
    window.mangoRelatedApps = {
      calls: 0,
      installed: settings.relatedApps === "confirmed",
    };
    Object.defineProperty(navigator, "getInstalledRelatedApps", {
      configurable: true,
      value: !settings.relatedApps
        ? undefined
        : async () => {
            window.mangoRelatedApps.calls++;
            if (settings.relatedApps === "reject")
              throw new DOMException("Unavailable", "SecurityError");
            if (settings.relatedApps === "hang") return new Promise(() => {});
            if (settings.relatedApps === "wrong-package")
              return [{ platform: "play", id: "com.mangoleaf.ai.debug" }];
            return window.mangoRelatedApps.installed
              ? [{ platform: "play", id: "com.mangoleaf.ai" }]
              : [];
          },
    });
    const control = {
      calls: 0,
      prevented: false,
      offer() {
        const event = new Event("beforeinstallprompt", { cancelable: true });
        Object.assign(event, {
          prompt: async () => {
            control.calls++;
          },
          userChoice: Promise.resolve({ outcome: "accepted" }),
        });
        window.dispatchEvent(event);
        control.prevented = event.defaultPrevented;
      },
    };
    window.mangoInstallControl = control;
  }, options);
}

const guide = (page: Page, language: Language = "en", desktop = false) =>
  page.getByRole("dialog", {
    name: desktop
      ? translations[language].installGuideDesktopTitle
      : translations[language].installGuideMobileTitle,
    exact: true,
  });
async function openDownload(page: Page, language: Language = "en") {
  const launch = page
    .getByRole("link", {
      name: translations[language].androidOpenOrInstall,
      exact: true,
    })
    .filter({ visible: true })
    .first();
  if (await launch.count()) {
    // Exercise the synchronous guide fallback without launching an external APK.
    await launch.evaluate((element) =>
      element.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      }),
    );
    await launch.click();
    return;
  }
  await nav(page, translations[language].downloadApp);
}

async function openLocalizedApp(page: Page, language: Language) {
  // The shared startup helper waits for English; localized tests need their translated heading.
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: translations[language].HowItWorksTitle,
      exact: true,
    }),
  ).toBeVisible({ timeout: 90_000 });
}

test("I01: desktop Android-only QR guide supports both languages, focus and dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await installBrowser(page, { otherDevice: true });
  await openApp(page);
  for (const language of ["en", "bis"] as const) {
    if (language === "bis")
      await page
        .getByRole("button", { name: "EN/BIS", exact: true })
        .filter({ visible: true })
        .click();
    const t = translations[language];
    const launcher = page
      .getByRole("button", { name: t.downloadApp, exact: true })
      .filter({ visible: true })
      .first();
    await launcher.click();
    const dialog = guide(page, language, true);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    const close = dialog.getByRole("button", { name: t.closeBtn, exact: true });
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS("position", "fixed");
    await expect(
      dialog.getByRole("img", { name: t.installGuideQRAlt, exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("link", {
        name: t.installGuideWebsiteLink,
        exact: true,
      }),
    ).toHaveAttribute("href", installURL);
    for (const title of [
      t.installGuideAndroid,
      t.installGuideAndroidOpen,
      t.installGuideAndroidInstall,
      t.installGuideConfirm,
    ])
      await expect(
        dialog.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /iPhone|iPad|Safari/i }),
    ).toHaveCount(0);
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    const before = await close.boundingBox();
    await dialog.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(close).toBeInViewport({ ratio: 1 });
    expect((await close.boundingBox())!.y).toBeCloseTo(before!.y, 0);
    await close.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: t.installGuideContinue, exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(launcher).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
  expect(await records(page)).toHaveLength(0);
});

test("I02: 767 and 768 pixels preserve Android guidance and phone scan controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await installBrowser(page);
  await openApp(page);
  await openDownload(page);
  await expect(guide(page)).toBeVisible();
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(guide(page, "en", true)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: translations.en.navScan, exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 767, height: 800 });
  await nav(page, translations.en.navScan);
  await expect(page.getByRole("button", { name: /^Take Photo/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Upload Photo/ }),
  ).toBeVisible();
});

test("I03: QR arrival preserves URL state and suppresses browser installation prompts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installBrowser(page);
  await page.goto("/?source=qr&install=1&keep=yes#guide");
  const dialog = guide(page);
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await expect
    .poll(() => new URL(page.url()).search)
    .toBe("?source=qr&keep=yes");
  expect(new URL(page.url()).hash).toBe("#guide");
  await page.evaluate(() => window.mangoInstallControl.offer());
  expect(await page.evaluate(() => window.mangoInstallControl.prevented)).toBe(
    true,
  );
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
  await expect(dialog.getByRole("button")).toHaveCount(2);
  await expect(dialog.locator('a[href="/download"]')).toHaveCount(1);
  await expect(dialog.getByRole("status")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: translations.en.HowItWorksTitle,
      exact: true,
    }),
  ).toBeVisible({ timeout: 90_000 });
  await expect(guide(page)).toHaveCount(0);
});

for (const language of ["en", "bis"] as const) {
  test(`I04: other devices receive Android-only information in ${language}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await installBrowser(page, { language, otherDevice: true });
    await openLocalizedApp(page, language);
    await openDownload(page, language);
    const t = translations[language];
    const dialog = guide(page, language);
    // Short copy should fit a narrow phone without truncation or forced no-wrap.
    const openAPK = dialog.getByRole("heading", {
      name: t.installGuideAndroidInstall,
      exact: true,
    });
    await expect(openAPK).toBeVisible();
    expect(
      await openAPK.evaluate(
        (heading) =>
          heading.getBoundingClientRect().height <=
          Number.parseFloat(getComputedStyle(heading).lineHeight) + 1,
      ),
    ).toBe(true);
    await expect(
      dialog.getByText(t.installGuideDescription, { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: t.installGuideAndroid, exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /iPhone|iPad|Safari/i }),
    ).toHaveCount(0);
    await expect(
      page.locator(
        'meta[name="apple-mobile-web-app-capable"], link[rel="apple-touch-icon"]',
      ),
    ).toHaveCount(0);
  });
}

test("I05: Android download information opens without claiming a public APK exists", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installBrowser(page, { language: "bis" });
  // Availability remains on its own page after the guide's extra block was removed.
  await page.goto("/download");
  await expect(page).toHaveURL(/\/download$/);
  await expect(
    page.getByRole("heading", {
      name: translations.bis.androidDownloadTitle,
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    translations.bis.androidDownloadPending,
  );
  await expect(
    page.getByText(translations.bis.androidDownloadCompatibility, {
      exact: true,
    }),
  ).toBeVisible();
});

test("I06: a legacy standalone website does not claim the Android APK is installed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installBrowser(page, { legacyStandalone: true });
  await page.goto("/?install=1&source=qr#home");
  await expect(guide(page)).toBeVisible({ timeout: 90_000 });
  await expect.poll(() => new URL(page.url()).search).toBe("?source=qr");
  await expect(
    guide(page).getByRole("heading", {
      name: translations.en.installGuideAndroidInstall,
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await openDownload(page);
  await expect(guide(page)).toBeVisible();
});

test("I07: ordinary visits and unrelated install flag values do not open the guide", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installBrowser(page);
  for (const path of ["/", "/?install=0", "/?install=yes"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", {
        name: translations.en.HowItWorksTitle,
        exact: true,
      }),
    ).toBeVisible({ timeout: 90_000 });
    await expect(guide(page)).toHaveCount(0);
  }
});

test("I08: Android visitors can open the installed app with a safe download fallback in both languages", async ({
  page,
}) => {
  await installBrowser(page);
  await openApp(page);
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    if (language === "bis")
      await page
        .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
        .filter({ visible: true })
        .first()
        .click();
    await openDownload(page, language);
    const dialog = guide(page, language, page.viewportSize()!.width >= 768);
    const open = dialog.getByRole("link", {
      name: t.androidOpenOrInstall,
      exact: true,
    });
    await expect(open).toBeVisible();
    const href = await open.getAttribute("href");
    expect(href).toContain(
      "intent://open#Intent;scheme=mangoleaf;package=com.mangoleaf.ai;",
    );
    expect(href).toContain(
      `S.browser_fallback_url=${encodeURIComponent(new URL("/download", page.url()).href)};end`,
    );
    await expect(
      dialog.getByText(t.androidAlreadyInstalled, { exact: true }),
    ).toBeVisible();
    // Inspect the link without launching an external app or downloading/installing anything from automation.
    await dialog.getByRole("button", { name: t.closeBtn, exact: true }).click();
  }
  await page.goto("/download");
  await expect(
    page.getByRole("link", {
      name: translations.bis.androidOpenOrInstall,
      exact: true,
    }),
  ).toBeVisible();
});

test("I09: a published Android APK appears in both languages without downloading or installing", async ({
  page,
}) => {
  await installBrowser(page);
  const downloadUrl = `${androidReleasePage}/download/v9.8.7/${androidApkAsset}`;
  // Fictional release metadata verifies presentation and URL validation only.
  await page.route(androidReleaseApi, (route) =>
    route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: {
        draft: false,
        prerelease: false,
        published_at: "2026-10-22T00:00:00Z",
        tag_name: "v9.8.7",
        html_url: `${androidReleasePage}/tag/v9.8.7`,
        assets: [
          {
            name: androidApkAsset,
            label: "Android APK v0.1.4",
            state: "uploaded",
            size: 15_000_000,
            content_type: "application/vnd.android.package-archive",
            browser_download_url: downloadUrl,
          },
        ],
      },
    }),
  );
  await page.goto("/download");
  for (const language of ["bis", "en"] as const) {
    if (language === "en")
      await page.getByRole("button", { name: "EN / BIS", exact: true }).click();
    const t = translations[language];
    await expect(page.getByRole("status")).toHaveText(
      t.androidDownloadAvailable.replace("{version}", "v9.8.7"),
    );
    await expect(page.getByTestId("available-apk-version")).toHaveText(
      t.androidDownloadVersion.replace("{version}", "0.1.4"),
    );
    await expect(
      page.getByRole("link", { name: t.androidDownloadApk, exact: true }),
    ).toHaveAttribute("href", downloadUrl);
    await expect(
      page.getByRole("link", { name: t.androidOpenOrInstall, exact: true }),
    ).toBeVisible();
  }
});

test("I15: an unlabeled older APK stays downloadable without inventing its native version from the release tag", async ({
  page,
}) => {
  await installBrowser(page);
  const downloadUrl = `${androidReleasePage}/download/v9.8.7/${androidApkAsset}`;
  await page.route(androidReleaseApi, (route) =>
    route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: {
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
            browser_download_url: downloadUrl,
          },
        ],
      },
    }),
  );
  await page.goto("/download");
  await expect(page.getByRole("status")).toContainText("v9.8.7");
  await expect(page.getByTestId("available-apk-version")).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: translations.bis.androidDownloadApk,
      exact: true,
    }),
  ).toHaveAttribute("href", downloadUrl);
});

test("I10: untrusted APK URLs keep the download unavailable and preserve official release navigation", async ({
  page,
}) => {
  await installBrowser(page);
  await page.route(androidReleaseApi, (route) =>
    route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: {
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
            browser_download_url: "https://untrusted.invalid/app.apk",
          },
        ],
      },
    }),
  );
  await page.goto("/download");
  await expect(page.getByRole("status")).toHaveText(
    translations.bis.androidDownloadPending,
  );
  await expect(
    page.getByRole("link", {
      name: translations.bis.androidDownloadApk,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: translations.bis.androidDownloadReleases,
      exact: true,
    }),
  ).toHaveAttribute("href", androidReleasePage);
});

for (const relatedApps of [
  "empty",
  "reject",
  "hang",
  "wrong-package",
] as const) {
  test(`I12: ${relatedApps} installation hints keep the main action and guide usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installBrowser(page, { relatedApps });
    await openApp(page);
    const launch = page
      .getByRole("link", {
        name: translations.en.androidOpenOrInstall,
        exact: true,
      })
      .filter({ visible: true })
      .first();
    await expect(launch).toBeVisible();
    await expect(launch).toHaveAttribute("href", /package=com\.mangoleaf\.ai;/);
    await openDownload(page);
    await expect(guide(page)).toBeVisible();
    await guide(page)
      .getByRole("link", {
        name: translations.en.androidDownloadGuide,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/download$/);
    await expect(
      page.getByRole("link", {
        name: translations.bis.androidOpenOrInstall,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(
      translations.bis.androidDownloadPending,
    );
  });
}

test("I13: confirmed production installation opens directly and makes another APK an explicit choice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await installBrowser(page, { relatedApps: "confirmed" });
  await openApp(page);
  const launch = page
    .getByRole("link", { name: translations.en.androidOpenApp, exact: true })
    .filter({ visible: true })
    .first();
  await expect(launch).toBeVisible();
  await launch.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await launch.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => window.mangoRelatedApps.calls)).toBe(1);
  const downloadUrl = `${androidReleasePage}/download/v9.8.7/${androidApkAsset}`;
  await page.route(androidReleaseApi, (route) =>
    route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: {
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
            browser_download_url: downloadUrl,
          },
        ],
      },
    }),
  );
  await page.goto("/download");
  for (const language of ["bis", "en"] as const) {
    if (language === "en")
      await page.getByRole("button", { name: "EN / BIS", exact: true }).click();
    const t = translations[language];
    await expect(
      page.getByRole("link", { name: t.androidOpenApp, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: t.androidDownloadApk, exact: true }),
    ).not.toBeVisible();
    const choice = page
      .locator("summary")
      .filter({ hasText: t.androidDownloadAgain });
    await choice.click();
    await expect(
      page.getByRole("link", { name: t.androidDownloadApk, exact: true }),
    ).toHaveAttribute("href", downloadUrl);
    await choice.click();
  }
  // No overflow at the narrow supported layout, including translated controls.
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.related_applications).toEqual([
    { platform: "play", id: "com.mangoleaf.ai" },
  ]);
  expect(manifest.prefer_related_applications).toBe(false);
});

test("I14: unsupported desktop ignores a native-looking result and retains its QR guide", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await installBrowser(page, { otherDevice: true, relatedApps: "confirmed" });
  await openApp(page);
  await openDownload(page);
  await expect(guide(page, "en", true)).toBeVisible();
  expect(await page.evaluate(() => window.mangoRelatedApps.calls)).toBe(0);
});

test.describe("release metadata service-worker freshness", () => {
  test.use({ serviceWorkers: "allow" });

  test("I11: real worker evicts old release metadata and never falls back to a cached APK announcement", async ({
    page,
    context,
    browserName,
    runtimeErrors,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Service-worker request interception is verified in Chromium only.",
    );
    test.setTimeout(180_000);
    const metadata = { marker: "old release announcement" };
    const workerPage = "http://127.0.0.1:4173/__test__/release-worker";
    const policy = `connect-src 'self' ${androidReleaseApi}; object-src 'none'`;
    // A minimal local document avoids model inference and lets activation be
    // observed before any application has automatically registered its worker.
    await page.route(workerPage, (route) =>
      route.fulfill({
        contentType: "text/html",
        headers: { "Content-Security-Policy": policy },
        body: "<!doctype html><html><body>Release freshness fixture</body></html>",
      }),
    );
    await context.route("http://127.0.0.1:4173/sw.js", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "Content-Security-Policy": policy },
      });
    });
    let networkAvailable = true;
    let networkReads = 0;
    await context.route(androidReleaseApi, (route) => {
      networkReads++;
      return networkAvailable
        ? route.fulfill({
            headers: { "Access-Control-Allow-Origin": "*" },
            json: { marker: "current network metadata" },
          })
        : route.abort("internetdisconnected");
    });
    await page.goto(workerPage);
    const unrelated = "https://example.invalid/unrelated-public-metadata";
    await page.evaluate(
      async ({ api, metadata, unrelated }) => {
        const cache = await caches.open("cross-origin");
        await cache.put(api, Response.json(metadata));
        await cache.put(unrelated, Response.json({ keep: true }));
        await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      },
      { api: androidReleaseApi, metadata, unrelated },
    );
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    await expect
      .poll(() =>
        page.evaluate(
          async (api) => Boolean(await caches.match(api)),
          androidReleaseApi,
        ),
      )
      .toBe(false);
    expect(
      await page.evaluate(
        async (url) => Boolean(await caches.match(url)),
        unrelated,
      ),
    ).toBe(true);
    const response = page.waitForResponse(androidReleaseApi);
    expect(
      await page.evaluate(
        async (api) => (await fetch(api, { cache: "no-store" })).json(),
        androidReleaseApi,
      ),
    ).toEqual({ marker: "current network metadata" });
    expect((await response).fromServiceWorker()).toBe(true);
    expect(networkReads).toBe(1);
    // Reintroduce a stale entry after activation. A cache-fallback strategy
    // would return it after this controlled network failure; NetworkOnly must fail.
    await page.evaluate(
      async ({ api, metadata }) => {
        for (const name of ["cross-origin", "others"])
          await (await caches.open(name)).put(api, Response.json(metadata));
      },
      { api: androidReleaseApi, metadata },
    );
    networkAvailable = false;
    const expectedFailures: string[] = [];
    const observeFailure = (
      message: import("@playwright/test").ConsoleMessage,
    ) => {
      if (
        message.type() === "error" &&
        message.location().url === androidReleaseApi &&
        /^Failed to load resource: net::ERR_(INTERNET_DISCONNECTED|FAILED)$/.test(
          message.text(),
        )
      )
        expectedFailures.push(`${message.text()} (${message.location().url})`);
    };
    page.on("console", observeFailure);
    expect(
      await page.evaluate(async (api) => {
        try {
          await fetch(api, { cache: "no-store" });
          return "unexpected cached release";
        } catch {
          return "network failed";
        }
      }, androidReleaseApi),
    ).toBe("network failed");
    expect(networkReads).toBe(2);
    await expect.poll(() => expectedFailures.length).toBeGreaterThan(0);
    page.off("console", observeFailure);
    for (const error of expectedFailures) {
      expect(runtimeErrors).toContain(error);
      runtimeErrors.splice(runtimeErrors.indexOf(error), 1);
    }
  });
});
