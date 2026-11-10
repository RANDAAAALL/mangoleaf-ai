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
      status(value: string): void;
    };
  }
}

const origin = "https://appassets.androidplatform.net";
let script: Buffer;
let debugScript: Buffer;
let styles: Buffer;
const clockPages = new WeakSet<Page>();

test("A06: native backup stays local before code setup and offers no Resume bypass in either language", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language === "bis" ? "?bis" : "");
    await expect(
      page.getByText(t.backupNotSetUp, { exact: true }),
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
    const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
    await input.fill("incorrect fixture credential");
    await page
      .getByRole("button", { name: t.backupRestore, exact: true })
      .click();
    // Invalid syntax fails locally; the fixture refuses every external request.
    await expect(
      page.getByRole("alert").filter({ hasText: t.backupCodeInvalid }),
    ).toBeVisible();
    await expect(input).toHaveValue("incorrect fixture credential");
    const writes = await page.evaluate(
      () =>
        window.updateTest.calls.filter(
          (call) => call === "storage.settings.set",
        ).length,
    );
    await input.fill("");
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
    for (const environment of ['production', 'testing']) {
    const r=await Bun.build({entrypoints:['tools/e2e/support/android-update-harness.tsx'],target:'browser',
      define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_APP_TARGET':'"android"',
        'process.env.NEXT_PUBLIC_APP_VERSION':'"v9.8.7"',
        'process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT':JSON.stringify(environment),
        'process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://uuvvvoznajjqknedxpdg.supabase.co"'}});
    if(!r.success)throw new Error(String(r.logs));
    await Bun.write('.tools/android-update-harness-'+environment+'.js',r.outputs[0]);
    }
  `,
    ],
    { cwd: process.cwd(), stdio: "pipe" },
  );
  script = readFileSync(resolve(".tools/android-update-harness-production.js"));
  debugScript = readFileSync(
    resolve(".tools/android-update-harness-testing.js"),
  );
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
      await route.fulfill({
        contentType: "text/javascript",
        body: query.includes("debug") ? debugScript : script,
      });
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

async function openUpdates(page: Page, language: "en" | "bis" = "en") {
  await page.locator("#settings").click();
  await page
    .getByRole("button", {
      name: new RegExp("^" + translations[language].settingsUpdates),
    })
    .click();
  await page.evaluate(() => window.updateTest.block(false));
  await page.clock.runFor(15_000);
}

test("A07: Production checks only inside Settings and shows website guidance without any popup or native installer", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, `?apk-update&${language === "bis" ? "bis" : ""}`);
    await page.clock.runFor(30_000);
    expect(
      await page.evaluate(() => window.updateTest.calls.includes("ota.status")),
    ).toBe(false);
    await openUpdates(page, language);
    await expect(
      page.getByRole("heading", {
        name: t.androidApkUpdateAboutTitle,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(t.androidApkWebsiteInstructions, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: t.androidApkWebsiteAction, exact: true }),
    ).toHaveAttribute("href", "https://mangoleafai.vercel.app/download");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        window.updateTest.calls.some((v) => v.startsWith("apkUpdate.")),
      ),
    ).toBe(false);
  }
});

test("A08: a known newer APK stays visible offline without an actionable website link", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "?apk-update");
  await openUpdates(page);
  await expect(
    page.getByRole("heading", {
      name: t.androidApkUpdateAboutTitle,
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => window.updateTest.online(false));
  await expect(
    page.getByText(t.settingsUpdateOffline, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: t.androidApkWebsiteAction, exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("A09: equal or unavailable release metadata never claims the installed APK is latest", async ({
  page,
}) => {
  for (const query of ["?apk-update&updated", "?unavailable"]) {
    await openHarness(page, query);
    await openUpdates(page);
    await expect(
      page.getByText(translations.en.settingsUpdateUnconfirmed, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: translations.en.androidApkUpdateAboutTitle,
        exact: true,
      }),
    ).toHaveCount(0);
  }
});

test("A10: Production rejects Diagnostics history while Debug keeps Diagnostics and omits App updates", async ({
  page,
}) => {
  for (const debug of [false, true]) {
    const t = translations.en;
    await openHarness(page, debug ? "?debug&disabled" : "?release");
    await page.locator("#settings").click();
    const diagnostics = page.getByRole("button", {
      name: new RegExp("^" + t.settingsDiagnostics),
    });
    const updates = page.getByRole("button", {
      name: new RegExp("^" + t.settingsUpdates),
    });
    await expect(diagnostics).toHaveCount(debug ? 1 : 0);
    await expect(updates).toHaveCount(debug ? 0 : 1);
    if (debug) {
      await diagnostics.click();
      await expect(
        page.getByRole("heading", { name: t.settingsDiagnostics, exact: true }),
      ).toBeVisible();
    } else {
      await page.evaluate(() => {
        history.replaceState(
          {
            mangoleafSettingsPage: "diagnostics",
            mangoleafSettingsInstance: 1,
          },
          "",
          "#settings-diagnostics",
        );
        window.dispatchEvent(
          new PopStateEvent("popstate", { state: history.state }),
        );
      });
      await expect(
        page.getByRole("heading", { name: t.settingsDiagnostics, exact: true }),
      ).toHaveCount(0);
    }
  }
});

test("A01: signed web updates use inline restart feedback in Settings", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page);
  await openUpdates(page);
  await page.evaluate(() => window.updateTest.status("staged"));
  await page.clock.runFor(15_000);
  await expect(
    page.getByRole("heading", { name: t.androidUpdateReadyTitle, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: t.androidUpdateRestart, exact: true })
    .click();
  await expect(
    page.getByText(t.androidUpdateRestartError, { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => window.updateTest.calls.filter((v) => v === "ota.restart").length,
    ),
  ).toBe(1);
});

test("A03: an older host with no restart capability gets inline manual-close guidance", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "?legacy");
  await openUpdates(page);
  await page.evaluate(() => window.updateTest.status("staged"));
  await page.clock.runFor(15_000);
  await expect(
    page.getByText(t.androidUpdateManualRestart, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: t.androidUpdateRestart, exact: true }),
  ).toHaveCount(0);
});
