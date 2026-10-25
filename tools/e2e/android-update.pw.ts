import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { translations } from "../../src/lib/translations";
import { modelVersion } from "../../src/lib/constants";

declare global {
  interface Window {
    updateTest: {
      calls: string[];
      block(value: boolean): void;
      online(value: boolean): void;
      installer(status: string, downloaded?: number): void;
      status(value: string): void;
    };
  }
}

const origin = "https://appassets.androidplatform.net";
let script: Buffer;
let styles: Buffer;
const clockPages = new WeakSet<Page>();

test("A06: native backup stays local before code setup and offers no Resume bypass in either language", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language === "bis" ? "?bis" : "");
    await expect(
      page.getByText(t.backupLocalOnly, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.backupCreate, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.backupResume, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: t.backupPause, exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          window.updateTest.calls.filter(
            (call) => call === "storage.settings.set",
          ).length,
      ),
    ).toBe(0);
  }
});

test("A05: APK footers use installed Release/Debug versions and hide missing or invalid native labels", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    for (const debug of [false, true]) {
      await openHarness(
        page,
        `?${language === "bis" ? "bis&" : ""}${debug ? "debug" : "release"}`,
      );
      await expect(page.locator("footer")).toContainText(
        t.footerApkVersions
          .replace("{apkVersion}", debug ? "0.1.4-dev" : "0.1.4")
          .replace("{modelVersion}", modelVersion),
      );
      await expect(page.locator("footer")).not.toContainText(
        t.footerVersions
          .replace("{appVersion}", "v9.8.7")
          .replace("{modelVersion}", modelVersion),
      );
    }
  }
  for (const flag of ["missing-version", "bad-version"]) {
    await openHarness(page, `?${flag}`);
    await expect(page.locator("footer")).toContainText(
      translations.en.footerVersions
        .replace("{appVersion}", "v9.8.7")
        .replace("{modelVersion}", modelVersion),
    );
    await expect(page.locator("footer")).not.toContainText("Android APK");
  }
});

test("A04: extracted recovery form focuses input and clears text without touching the connected identity", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    await openHarness(page, language === "bis" ? "?bis" : "");
    const t = translations[language];
    await page
      .getByRole("button", { name: t.backupEnterCode, exact: true })
      .click();
    const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
    await expect(input).toBeFocused();
    await input.fill("incorrect fixture credential");
    await page
      .getByRole("button", { name: t.backupRestore, exact: true })
      .click();
    // Invalid syntax fails locally; the fixture refuses every external request.
    await expect(
      page.getByRole("status").filter({ hasText: t.backupError }),
    ).toBeVisible();
    await expect(input).toHaveValue("incorrect fixture credential");
    const writes = await page.evaluate(
      () =>
        window.updateTest.calls.filter(
          (call) => call === "storage.settings.set",
        ).length,
    );
    await page
      .getByRole("button", { name: t.backupClearInput, exact: true })
      .click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    expect(
      await page.evaluate(
        () =>
          window.updateTest.calls.filter(
            (call) => call === "storage.settings.set",
          ).length,
      ),
    ).toBe(writes);
  }
});
test.beforeAll(() => {
  // Compile a separate native-component harness. Never change the browser export's target/project.
  execFileSync(
    "bun",
    [
      "-e",
      `
    const r=await Bun.build({entrypoints:['tools/e2e/support/android-update-harness.tsx'],target:'browser',
      define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_APP_TARGET':'"android"',
        'process.env.NEXT_PUBLIC_APP_VERSION':'"v9.8.7"',
        'process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT':'"production"',
        'process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://uuvvvoznajjqknedxpdg.supabase.co"'}});
    if(!r.success)throw new Error(String(r.logs));
    await Bun.write('.tools/android-update-harness.js',r.outputs[0]);
  `,
    ],
    { cwd: process.cwd(), stdio: "pipe" },
  );
  script = readFileSync(resolve(".tools/android-update-harness.js"));
  const build = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
  const css = resolve(build.directory, "out/_next/static/css");
  styles = Buffer.concat(
    readdirSync(css)
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(resolve(css, file))),
  );
});

async function openHarness(page: Page, query = "") {
  if (!clockPages.has(page)) {
    await page.clock.install();
    clockPages.add(page);
  }
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.href ===
      "https://api.github.com/repos/RANDAAAALL/mangoleaf-ai/releases/latest"
    ) {
      const offer = query.includes("apk-update");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          offer
            ? {
                draft: false,
                prerelease: false,
                published_at: "2026-10-25T00:38:55Z",
                tag_name: "v0.12.0",
                html_url:
                  "https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.12.0",
                assets: [
                  {
                    name: "mangoleaf-ai.apk",
                    state: "uploaded",
                    size: 100,
                    content_type: "application/vnd.android.package-archive",
                    label: "Android APK v0.1.8",
                    browser_download_url:
                      "https://github.com/RANDAAAALL/mangoleaf-ai/releases/download/v0.12.0/mangoleaf-ai.apk",
                  },
                ],
              }
            : {},
        ),
      });
      return;
    }
    if (url.origin !== origin)
      throw new Error("Native UI fixture attempted external traffic.");
    if (url.pathname === "/fixture.js") {
      await route.fulfill({ contentType: "text/javascript", body: script });
    } else if (url.pathname === "/fixture.css") {
      await route.fulfill({ contentType: "text/css", body: styles });
    } else {
      await route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
      });
    }
  });
  await page.goto(`${origin}/${query}`);
  await expect(page.locator("#launcher")).toBeVisible();
}

test("A07: native APK notice has translated actions and a close button without external installer links", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, `?apk-update&${language === "bis" ? "bis" : ""}`);
    await page.evaluate(() => window.updateTest.block(false));
    await page.clock.runFor(15_000);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toHaveText(
      t.androidApkUpdateTitle.replace("{version}", "0.1.8"),
    );
    await expect(
      dialog.getByRole("button", { name: t.androidApkUpdateNow, exact: true }),
    ).toBeEnabled();
    await expect(dialog.getByRole("link")).toHaveCount(0);
    await expect(
      dialog.getByRole("button", {
        name: t.androidApkUpdateLater,
        exact: true,
      }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: t.closeBtn, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    // APK dismissal is foreground-scoped; independent staged web OTA is covered by A15.
    await page.evaluate(() => window.updateTest.status("checking"));
    await page.clock.runFor(20_000);
    await expect(dialog).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        window.updateTest.calls.includes("ota.restart"),
      ),
    ).toBe(false);
  }
});

test("A08: APK notice Later and Escape dismiss during this foreground visit; Debug excludes production offers", async ({
  page,
}) => {
  await openHarness(page, "?apk-update");
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.runFor(15_000);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", {
      name: translations.en.androidApkUpdateLater,
      exact: true,
    })
    .click();
  await page.clock.runFor(20_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openHarness(page, "?apk-update");
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.runFor(15_000);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openHarness(page, "?apk-update&debug&disabled");
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.runFor(20_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("#about").click();
  await expect(
    page.getByRole("heading", {
      name: translations.en.androidApkUpdateAboutTitle,
      exact: true,
    }),
  ).toHaveCount(0);
});

async function setVisibility(page: Page, value: "visible" | "hidden") {
  // Controlled WebView lifecycle signal; physical Activity/background behavior needs phone evidence.
  await page.evaluate((visibility) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: visibility,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, value);
}

test("A09: APK close/Later/Escape keep the About download and reoffer on the next online idle foreground visit", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, `?apk-update&${language === "bis" ? "bis" : ""}`);
    await page.evaluate(() => window.updateTest.block(false));
    await page.clock.runFor(15_000);
    const dialog = page.getByRole("dialog");
    for (const action of ["close", "later", "escape"] as const) {
      await expect(dialog).toBeVisible();
      if (action === "escape") await page.keyboard.press("Escape");
      else
        await dialog
          .getByRole("button", {
            name: action === "close" ? t.closeBtn : t.androidApkUpdateLater,
            exact: true,
          })
          .click();
      await expect(dialog).toHaveCount(0);
      await page.locator("#about").click();
      const panel = page.getByRole("region", {
        name: t.androidApkUpdateAboutTitle,
        exact: true,
      });
      await expect(panel).toBeVisible();
      await expect(panel).toContainText(
        t.androidApkUpdateAboutText.replace("{version}", "0.1.8"),
      );
      await expect(
        panel.getByRole("button", { name: t.androidApkUpdateNow, exact: true }),
      ).toBeEnabled();
      await expect(panel.getByRole("link")).toHaveCount(0);
      await page.locator("#launcher").click();
      await page.locator("#about").click();
      await page.clock.runFor(60_000);
      await expect(dialog).toHaveCount(0);
      await setVisibility(page, "hidden");
      await page.evaluate(() => window.updateTest.block(true));
      await setVisibility(page, "visible");
      await page.clock.runFor(15_000);
      await expect(dialog).toHaveCount(0);
      await page.evaluate(() => window.updateTest.block(false));
      await page.clock.runFor(15_000);
    }
    expect(
      await page.evaluate(() =>
        window.updateTest.calls.includes("ota.restart"),
      ),
    ).toBe(false);
  }
});

test("A10: an installed current APK has no popup or About download card", async ({
  page,
}) => {
  await openHarness(page, "?apk-update&updated");
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.runFor(20_000);
  await page.locator("#about").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: translations.en.androidApkUpdateAboutTitle,
      exact: true,
    }),
  ).toHaveCount(0);
});

test("A11: known About update stays visible offline with a disabled action and no new popup until reconnection", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, `?apk-update&${language === "bis" ? "bis" : ""}`);
    await page.evaluate(() => window.updateTest.block(false));
    await page.clock.runFor(15_000);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: t.androidApkUpdateLater, exact: true })
      .click();
    await page.locator("#about").click();
    await page.evaluate(() => window.updateTest.online(false));
    const panel = page.getByRole("region", {
      name: t.androidApkUpdateAboutTitle,
      exact: true,
    });
    await expect(
      panel.getByRole("button", { name: t.androidApkUpdateNow, exact: true }),
    ).toBeDisabled();
    await expect(panel.getByRole("link")).toHaveCount(0);
    await expect(panel.getByRole("status")).toHaveText(
      t.androidApkUpdateOffline,
    );
    await setVisibility(page, "hidden");
    await setVisibility(page, "visible");
    await page.clock.runFor(20_000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.evaluate(() => window.updateTest.online(true));
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: t.closeBtn, exact: true })
      .click();
    await expect(
      panel.getByRole("button", { name: t.androidApkUpdateNow, exact: true }),
    ).toBeEnabled();
    await expect(panel.getByRole("link")).toHaveCount(0);
  }
});

test("A12: popup and About share native download progress and automatic Android handoff without a browser", async ({
  page,
  context,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    for (const entry of ["popup", "about"]) {
      await openHarness(page, `?apk-update&${language === "bis" ? "bis" : ""}`);
      await page.evaluate(() => window.updateTest.block(false));
      await page.clock.runFor(15_000);
      if (entry === "about") {
        await page
          .getByRole("dialog")
          .getByRole("button", { name: t.androidApkUpdateLater, exact: true })
          .click();
        await page.locator("#about").click();
      }
      await page
        .getByRole("button", { name: t.androidApkUpdateNow, exact: true })
        .click();
      const progress = page.getByRole("dialog", {
        name: t.androidApkDownloadingTitle,
        exact: true,
      });
      await expect(progress).toBeVisible();
      await page.evaluate(() =>
        window.updateTest.installer("downloading", 400),
      );
      await page.clock.runFor(1_000);
      await expect(progress.getByRole("progressbar")).toHaveAttribute(
        "value",
        "40",
      );
      await expect(progress.getByRole("status")).toHaveText(
        t.androidApkDownloadPercent.replace("{n}", "40"),
      );
      await page.evaluate(() => window.updateTest.installer("verifying", 1000));
      await page.clock.runFor(1_000);
      await expect(
        page.getByRole("dialog", {
          name: t.androidApkVerifyingTitle,
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            window.updateTest.calls.filter(
              (value) => value === "apkUpdate.install",
            ).length,
        ),
      ).toBe(0);
      await page.evaluate(() => window.updateTest.installer("ready", 1000));
      await page.clock.runFor(1_000);
      await expect(
        page.getByRole("dialog", {
          name: t.androidApkInstallingTitle,
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByRole("dialog").getByRole("button")).toHaveCount(0);
      expect(
        await page.evaluate(
          () =>
            window.updateTest.calls.filter(
              (value) => value === "apkUpdate.start",
            ).length,
        ),
      ).toBe(1);
      expect(
        await page.evaluate(
          () =>
            window.updateTest.calls.filter(
              (value) => value === "apkUpdate.install",
            ).length,
        ),
      ).toBe(1);
      expect(page.url()).toContain(origin);
      expect(context.pages()).toHaveLength(1);
      // A real APK replaces this process. The fixture supplies only the system-confirmed terminal result.
      await page.evaluate(() => window.updateTest.installer("installed", 1000));
      await page.clock.runFor(1_000);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          window.updateTest.calls.includes("ota.restart"),
        ),
      ).toBe(false);
    }
  }
});

test("A13: progress X and Escape cancel the download; connection failure keeps the current app available", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    for (const stop of ["close", "escape", "offline"]) {
      await openHarness(page, `?apk-update&${language === "bis" ? "bis" : ""}`);
      await page.evaluate(() => window.updateTest.block(false));
      await page.clock.runFor(15_000);
      await page
        .getByRole("dialog")
        .getByRole("button", { name: t.androidApkUpdateNow, exact: true })
        .click();
      const progress = page.getByRole("dialog", {
        name: t.androidApkDownloadingTitle,
        exact: true,
      });
      await expect(progress).toBeVisible();
      if (stop === "offline") {
        await page.evaluate(() => window.updateTest.online(false));
        const failure = page.getByRole("dialog", {
          name: t.androidApkInstallFailedTitle,
          exact: true,
        });
        await expect(failure).toBeVisible();
        await expect(failure).toContainText(t.androidApkInstallFailedText);
        await failure
          .getByRole("button", { name: t.closeBtn, exact: true })
          .first()
          .click();
      } else if (stop === "escape") await page.keyboard.press("Escape");
      else
        await progress
          .getByRole("button", { name: t.closeBtn, exact: true })
          .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.clock.runFor(20_000);
      expect(
        await page.evaluate(
          () =>
            window.updateTest.calls.filter(
              (value) => value === "apkUpdate.cancel",
            ).length,
        ),
      ).toBe(1);
      expect(
        await page.evaluate(() =>
          window.updateTest.calls.includes("apkUpdate.install"),
        ),
      ).toBe(false);
      await expect(page.locator("#launcher")).toBeEnabled();
      await expect(page.locator("footer")).toContainText("0.1.4");
      expect(
        await page.evaluate(() =>
          window.updateTest.calls.includes("storage.settings.set"),
        ),
      ).toBe(false);
    }
  }
});

test("A14: returning from Android Cancel does not reoffer immediately; About permits an explicit retry", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "?apk-update");
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.runFor(15_000);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: t.androidApkUpdateNow, exact: true })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: t.androidApkDownloadingTitle,
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => window.updateTest.installer("ready", 1000));
  await page.clock.runFor(1_000);
  await expect(
    page.getByRole("dialog", {
      name: t.androidApkInstallingTitle,
      exact: true,
    }),
  ).toBeVisible();
  await setVisibility(page, "hidden");
  await page.evaluate(() => window.updateTest.installer("cancelled", 1000));
  await setVisibility(page, "visible");
  await page.clock.runFor(20_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        window.updateTest.calls.filter((value) => value === "apkUpdate.start")
          .length,
    ),
  ).toBe(1);
  await page.locator("#about").click();
  await page
    .getByRole("region", { name: t.androidApkUpdateAboutTitle, exact: true })
    .getByRole("button", { name: t.androidApkUpdateNow, exact: true })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: t.androidApkDownloadingTitle,
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.updateTest.calls.filter((value) => value === "apkUpdate.start")
          .length,
    ),
  ).toBe(2);
  expect(page.url()).toContain(origin);
});

test("A15: dismissing an earlier web OTA never suppresses native APK discovery or later foreground reminders", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "?apk-update");
  await page.evaluate(() => {
    window.updateTest.block(false);
    window.updateTest.status("staged");
  });
  await page.clock.runFor(5_000);
  const ota = page.getByRole("dialog", {
    name: t.androidUpdateReadyTitle,
    exact: true,
  });
  await expect(ota).toBeVisible();
  await ota
    .getByRole("button", { name: t.androidUpdateLater, exact: true })
    .click();
  await page.clock.runFor(15_000);
  const apk = page.getByRole("dialog", {
    name: t.androidApkUpdateTitle.replace("{version}", "0.1.8"),
    exact: true,
  });
  await expect(apk).toBeVisible();
  await apk
    .getByRole("button", { name: t.androidApkUpdateLater, exact: true })
    .click();
  await page.clock.runFor(20_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Model a short real response delay, independent of the page's paused clock.
  await page.route(
    "https://api.github.com/repos/RANDAAAALL/mangoleaf-ai/releases/latest",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.fallback();
    },
  );
  // Finish the real intercepted response before advancing a virtual clock past its 8s fetch deadline.
  const releaseResponse = page.waitForResponse(
    (response) =>
      response.url() ===
      "https://api.github.com/repos/RANDAAAALL/mangoleaf-ai/releases/latest",
  );
  await setVisibility(page, "hidden");
  await setVisibility(page, "visible");
  await (await releaseResponse).finished();
  await expect(apk).toBeVisible();
  await expect(ota).toHaveCount(0);
});

test("A01: verified update waits for idle; modal supports both languages, focus, retry and Later", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    await openHarness(page, language === "bis" ? "?bis" : "");
    const t = translations[language];
    await expect(
      page.getByRole("button", { name: t.backupCreate, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.backupEnable, exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() => window.updateTest.status("staged"));
    await page.clock.fastForward(16000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.evaluate(() => window.updateTest.block(false));
    await page.locator("#typing").focus();
    await page.clock.fastForward(16000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.locator("#launcher").focus();
    await page.clock.fastForward(16000);
    const dialog = page.getByRole("dialog", {
      name: t.androidUpdateReadyTitle,
      exact: true,
    });
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate(
        (element) => element.getBoundingClientRect().width <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      dialog.getByRole("button", { name: t.androidUpdateLater, exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("button", { name: t.androidUpdateRestart, exact: true }),
    ).toBeFocused();
    // Native browser-toolbar tab stops differ; verify reverse movement inside the dialog.
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: t.androidUpdateLater, exact: true }),
    ).toBeFocused();
    await dialog
      .getByRole("button", { name: t.androidUpdateRestart, exact: true })
      .click();
    await expect(dialog.getByRole("status")).toHaveText(
      t.androidUpdateRestartError,
    );
    expect(
      await page.evaluate(
        () => window.updateTest.calls.filter((m) => m === "ota.restart").length,
      ),
    ).toBe(1);
    await dialog
      .getByRole("button", { name: t.androidUpdateLater, exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("#launcher")).toBeFocused();
    await page.evaluate(() => window.updateTest.status("staged"));
    await page.clock.fastForward(60000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("A02: disabled Debug OTA never checks or offers production updates", async ({
  page,
}) => {
  await openHarness(page, "?disabled");
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.fastForward(60000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => window.updateTest.calls.includes("ota.check")),
  ).toBe(false);
});

test("A03: legacy host gets manual restart instructions without an unsupported native request", async ({
  page,
}) => {
  await openHarness(page, "?legacy");
  await page.evaluate(() => {
    window.updateTest.block(false);
    window.updateTest.status("staged");
  });
  await page.clock.fastForward(16000);
  const t = translations.en;
  const dialog = page.getByRole("dialog", {
    name: t.androidUpdateReadyTitle,
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(t.androidUpdateManualRestart);
  await expect(
    dialog.getByRole("button", { name: t.androidUpdateRestart, exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(() => window.updateTest.calls.includes("ota.restart")),
  ).toBe(false);
});
