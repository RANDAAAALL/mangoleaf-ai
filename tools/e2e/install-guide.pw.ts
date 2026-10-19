import type { Page } from "@playwright/test";
import { test, expect, nav, openApp, records } from "./support/fixtures";
import { translations, type Language } from "../../src/lib/translations";

interface InstallControl {
  calls: number;
  prevented: boolean;
  offer: (reject?: boolean) => void;
  finish: (outcome: "accepted" | "dismissed") => void;
}

declare global {
  interface Window {
    mangoInstallControl: InstallControl;
    mangoLegacyInstallListeners: { added: string[]; removed: string[] };
  }
}

const installURL = "https://mangoleafai.vercel.app/?install=1";

// Controlled browser events prove the app's behavior. They do not prove a
// phone's native installation dialog or real device installation support.
async function installBrowser(
  page: Page,
  settings: {
    platform?: "android" | "ios" | "ipad" | "other";
    standalone?: boolean;
    language?: Language;
  } = {},
) {
  await page.addInitScript((options) => {
    localStorage.setItem("preferred_language", options.language ?? "en");
    const agents = {
      android:
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
      ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      other:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
    };
    const platform = options.platform ?? "android";
    Object.defineProperties(navigator, {
      userAgent: { configurable: true, value: agents[platform] },
      platform: {
        configurable: true,
        value: platform === "ipad" ? "MacIntel" : platform,
      },
      maxTouchPoints: {
        configurable: true,
        value: platform === "ipad" ? 5 : 1,
      },
      standalone: { configurable: true, value: Boolean(options.standalone) },
    });
    let resolveChoice:
      ((value: { outcome: "accepted" | "dismissed" }) => void) | null = null;
    const control: InstallControl = {
      calls: 0,
      prevented: false,
      offer(reject = false) {
        const event = new Event("beforeinstallprompt", { cancelable: true });
        Object.assign(event, {
          userChoice: new Promise<{ outcome: "accepted" | "dismissed" }>(
            (resolve) => {
              resolveChoice = resolve;
            },
          ),
          prompt: async () => {
            control.calls += 1;
            if (reject) throw new Error("Controlled installation unavailable");
          },
        });
        window.dispatchEvent(event);
        control.prevented = event.defaultPrevented;
      },
      finish(outcome) {
        resolveChoice?.({ outcome });
        resolveChoice = null;
      },
    };
    window.mangoInstallControl = control;
  }, settings);
}

const guide = (page: Page, language: Language = "en", desktop = false) =>
  page.getByRole("dialog", {
    name: desktop
      ? translations[language].installGuideDesktopTitle
      : translations[language].installGuideMobileTitle,
    exact: true,
  });

async function openDownload(page: Page, language: Language = "en") {
  await nav(page, translations[language].downloadApp);
}

test("I01: desktop Download shows QR and both translated guides with accessible dismissal", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await installBrowser(page);
  await openApp(page);
  const download = page
    .getByRole("button", { name: translations.en.downloadApp, exact: true })
    .filter({ visible: true })
    .first();
  await expect(download).toBeVisible();
  await expect(
    page.getByRole("button", { name: translations.en.navScan, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: translations.en.navHistory, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /^Recent Scans?$/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: translations.en.downloadPromptTitle,
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Upload Photo/ })).toHaveCount(
    0,
  );
  await info.attach("desktop-download-home.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });

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
    const qrImage = dialog.getByRole("img", { name: t.installGuideQRAlt });
    await expect(qrImage).toBeVisible();
    await expect
      .poll(() =>
        qrImage.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    if (language === "en") {
      await info.attach("desktop-install-guide-top.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("desktop-install-qr.png", {
        body: await qrImage.screenshot(),
        contentType: "image/png",
      });
    }
    await expect(
      dialog.getByRole("link", {
        name: t.installGuideWebsiteLink,
        exact: true,
      }),
    ).toHaveAttribute("href", installURL);
    for (const title of [
      t.installGuideAndroid,
      t.installGuideIOS,
      t.installGuideAndroidOpen,
      t.installGuideAndroidInstall,
      t.installGuideConfirm,
      t.installGuideIOSShare,
      t.installGuideIOSHome,
      t.installGuideIOSAdd,
    ])
      await expect(
        dialog.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    await expect(dialog.locator(".backdrop-blur-sm")).toHaveCSS(
      "backdrop-filter",
      /blur\(/,
    );
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
    if (language === "en") {
      await info.attach("desktop-install-guide-bottom.png", {
        body: await page.screenshot({ fullPage: false }),
        contentType: "image/png",
      });
      await page.keyboard.press("Escape");
    } else await close.click();
    await expect(dialog).toHaveCount(0);
    await expect(launcher).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
  await page
    .getByRole("button", { name: "BIS/EN", exact: true })
    .filter({ visible: true })
    .click();
  const homeCardDownload = page
    .locator("main section")
    .filter({
      has: page.getByRole("heading", {
        name: translations.en.downloadPromptTitle,
        exact: true,
      }),
    })
    .getByRole("button", { name: translations.en.downloadApp, exact: true });
  // Safari pointer clicks do not necessarily focus a button. Each launcher
  // must still restore its own focus after the guide closes.
  await homeCardDownload.click();
  await expect(guide(page, "en", true)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide(page, "en", true)).toHaveCount(0);
  await expect(homeCardDownload).toBeFocused();
  await nav(page, translations.en.navAbout);
  const aboutDownloads = page
    .locator("main")
    .getByRole("button", { name: translations.en.downloadApp, exact: true });
  await expect(aboutDownloads).toHaveCount(2);
  for (const launcher of await aboutDownloads.all()) {
    await launcher.click();
    const dialog = guide(page, "en", true);
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: translations.en.closeBtn, exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(launcher).toBeFocused();
  }
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
  expect(await records(page)).toHaveLength(0);
});

test("I02: 767 and 768 CSS pixels switch Scan/History to Download without losing phone controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await installBrowser(page);
  await openApp(page);
  await nav(page, translations.en.navScan);
  await expect(page.getByRole("button", { name: /^Take Photo/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Upload Photo/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: translations.en.cancelBtn, exact: true })
    .click();
  await nav(page, translations.en.navScan);
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(
    page.getByRole("heading", {
      name: translations.en.scanSheetTitle,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Upload Photo/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: translations.en.navScan, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: translations.en.navHistory, exact: true }),
  ).toHaveCount(0);
  await expect(guide(page, "en", true)).toBeVisible();
  await page.keyboard.press("Escape");
  await openDownload(page);
  await expect(guide(page, "en", true)).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 767, height: 800 });
  await expect(
    page.getByRole("button", { name: translations.en.navHistory, exact: true }),
  ).toBeVisible();
  await nav(page, translations.en.navScan);
  await expect(page.getByRole("button", { name: /^Take Photo/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Upload Photo/ }),
  ).toBeVisible();
  expect(await records(page)).toHaveLength(0);
});

test("I03: QR arrival consumes only install flag and waits for a user tap on a late native prompt", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await installBrowser(page);
  await page.goto("/?source=qr&install=1&keep=yes#guide");
  const dialog = guide(page);
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).search)
    .toBe("?source=qr&keep=yes");
  expect(new URL(page.url()).hash).toBe("#guide");
  await expect(
    dialog.getByRole("heading", {
      name: translations.en.installGuideAndroid,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", {
      name: translations.en.installGuideIOS,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("button", {
      name: translations.en.installGuideInstall,
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
  await page.evaluate(() => window.mangoInstallControl.offer());
  const install = dialog.getByRole("button", {
    name: translations.en.installGuideInstall,
    exact: true,
  });
  await expect(install).toBeEnabled();
  await install.scrollIntoViewIfNeeded();
  await info.attach("android-native-install-ready.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(await page.evaluate(() => window.mangoInstallControl.prevented)).toBe(
    true,
  );
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
  await install.click();
  const pending = dialog.getByRole("button", {
    name: translations.en.installGuideInstalling,
    exact: true,
  });
  await expect(pending).toBeDisabled();
  await pending.dispatchEvent("click");
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(1);
  await page.evaluate(() => window.mangoInstallControl.finish("dismissed"));
  await expect(pending).toHaveCount(0);
  await expect(install).toHaveCount(0);
  await page.evaluate(() => window.mangoInstallControl.offer());
  await expect(install).toBeEnabled();
  await install.click();
  await page.evaluate(() => window.mangoInstallControl.finish("accepted"));
  await expect(pending).toHaveCount(0);
  // Accepting the prompt is not installation proof; the browser confirms it.
  await expect(
    dialog.getByText(translations.en.installGuideInstalled, { exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    dialog.getByText(translations.en.installGuideInstalled, { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(2);
  await dialog
    .getByRole("button", {
      name: translations.en.installGuideContinue,
      exact: true,
    })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: translations.en.HowItWorksTitle,
      exact: true,
    }),
  ).toBeVisible();
  await expect(guide(page)).toHaveCount(0);
});

for (const platform of ["ios", "ipad"] as const) {
  test(`I04: ${platform} QR arrival shows Bisaya Apple steps without an automatic or fake Install button`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installBrowser(page, { platform, language: "bis" });
    await page.goto("/?install=1");
    const t = translations.bis;
    const dialog = guide(page, "bis");
    // QR entry still waits for real model warmup, like openApp's startup check.
    await expect(dialog).toBeVisible({ timeout: 90_000 });
    for (const title of [
      t.installGuideIOS,
      t.installGuideIOSShare,
      t.installGuideIOSHome,
      t.installGuideIOSAdd,
    ])
      await expect(
        dialog.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: t.installGuideAndroid, exact: true }),
    ).toHaveCount(0);
    await expect(
      dialog.getByText(t.installGuideIOSBrowser, { exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.mangoInstallControl.offer());
    await expect(
      dialog.getByRole("button", { name: t.installGuideInstall, exact: true }),
    ).toHaveCount(0);
    expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
    if (platform === "ios")
      await info.attach("ios-install-guide.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    await dialog
      .getByRole("button", { name: t.installGuideContinue, exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await nav(page, t.navScan);
    await expect(
      page.getByRole("button", { name: new RegExp(`^${t.uploadPhotoBtn}`) }),
    ).toBeVisible();
  });
}

test("I05: unsupported browser guide stays available and native prompt failures remain recoverable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await installBrowser(page, { platform: "other" });
  await openApp(page);
  await openDownload(page);
  const dialog = guide(page);
  await expect(
    dialog.getByRole("heading", {
      name: translations.en.installGuideFallbackTitle,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByText(translations.en.installGuideFallbackDescription, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: translations.en.installGuideInstall,
      exact: true,
    }),
  ).toHaveCount(0);
  await page.evaluate(() => window.mangoInstallControl.offer(true));
  await dialog
    .getByRole("button", {
      name: translations.en.installGuideInstall,
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    translations.en.installGuideInstallError,
  );
  await expect(
    dialog.getByRole("button", {
      name: translations.en.installGuideInstall,
      exact: true,
    }),
  ).toHaveCount(0);
  await page.evaluate(() => window.mangoInstallControl.offer());
  await dialog
    .getByRole("button", {
      name: translations.en.installGuideInstall,
      exact: true,
    })
    .click();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    dialog.getByText(translations.en.installGuideInstalled, { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.mangoInstallControl.finish("accepted"));
  await dialog
    .getByRole("button", { name: translations.en.closeBtn, exact: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: translations.en.downloadApp, exact: true })
      .filter({ visible: true }),
  ).toHaveCount(0);
  await nav(page, translations.en.navScan);
  await expect(
    page.getByRole("button", { name: /^Upload Photo/ }),
  ).toBeVisible();
});

test("I06: installed standalone consumes QR flag silently but desktop still offers phone QR guide", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await installBrowser(page, { platform: "ios", standalone: true });
  await page.goto("/?install=1&source=qr#home");
  // Use the normal startup budget before checking the installed-app behavior.
  await expect(
    page.getByRole("heading", {
      name: translations.en.HowItWorksTitle,
      exact: true,
    }),
  ).toBeVisible({ timeout: 90_000 });
  await expect.poll(() => new URL(page.url()).search).toBe("?source=qr");
  expect(new URL(page.url()).hash).toBe("#home");
  await expect(guide(page)).toHaveCount(0);
  await expect(
    page
      .getByRole("button", { name: translations.en.downloadApp, exact: true })
      .filter({ visible: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 1024, height: 768 });
  await openDownload(page);
  const dialog = guide(page, "en", true);
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", {
      name: translations.en.installGuideWebsiteLink,
      exact: true,
    }),
  ).toHaveAttribute("href", installURL);
  await expect(
    dialog.getByRole("heading", {
      name: translations.en.installGuideIOS,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", {
      name: translations.en.installGuideAndroid,
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
});

test("I07: ordinary visits and other install flag values never open installation automatically", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await installBrowser(page);
  await page.goto("/?install=0&source=normal#home");
  await expect(
    page.getByRole("heading", {
      name: translations.en.HowItWorksTitle,
      exact: true,
    }),
  ).toBeVisible();
  await expect(guide(page)).toHaveCount(0);
  expect(new URL(page.url()).search).toBe("?install=0&source=normal");
  expect(new URL(page.url()).hash).toBe("#home");
  await page.evaluate(() => window.mangoInstallControl.offer());
  await expect(guide(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(0);
});

test("I08: new install and scan-width listeners support legacy addListener APIs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await installBrowser(page);
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window);
    const trace = { added: [] as string[], removed: [] as string[] };
    window.mangoLegacyInstallListeners = trace;
    window.matchMedia = (query) => {
      const media = matchMedia(query);
      // Scope this fixture to the two new listeners. It does not claim whole
      // app compatibility with old Safari, which has other platform limits.
      if (
        query !== "(display-mode: standalone)" &&
        query !== "(min-width: 48rem)"
      )
        return media;
      const addListener = media.addListener.bind(media);
      const removeListener = media.removeListener.bind(media);
      Object.defineProperties(media, {
        addEventListener: { configurable: true, value: undefined },
        removeEventListener: { configurable: true, value: undefined },
        addListener: {
          configurable: true,
          value(listener: Parameters<typeof addListener>[0]) {
            trace.added.push(query);
            addListener(listener);
          },
        },
        removeListener: {
          configurable: true,
          value(listener: Parameters<typeof removeListener>[0]) {
            trace.removed.push(query);
            removeListener(listener);
          },
        },
      });
      return media;
    };
  });
  await openApp(page);
  await nav(page, translations.en.navScan);
  await expect(
    page.getByRole("button", { name: /^Upload Photo/ }),
  ).toBeVisible();
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(guide(page, "en", true)).toBeVisible();
  const trace = await page.evaluate(() => window.mangoLegacyInstallListeners);
  expect(trace.added).toContain("(display-mode: standalone)");
  expect(trace.added).toContain("(min-width: 48rem)");
  await expect
    .poll(() => page.evaluate(() => window.mangoLegacyInstallListeners.removed))
    .toContain("(min-width: 48rem)");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 767, height: 800 });
  await openDownload(page);
  await page.evaluate(() => window.mangoInstallControl.offer());
  const dialog = guide(page);
  await dialog
    .getByRole("button", {
      name: translations.en.installGuideInstall,
      exact: true,
    })
    .click();
  expect(await page.evaluate(() => window.mangoInstallControl.calls)).toBe(1);
  await page.evaluate(() => window.mangoInstallControl.finish("dismissed"));
  await dialog
    .getByRole("button", { name: translations.en.closeBtn, exact: true })
    .click();
  await nav(page, translations.en.navScan);
  await expect(page.getByRole("button", { name: /^Take Photo/ })).toBeVisible();
});
