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

// Retired labels stay in the fixture so removed product translations cannot weaken these checks.
const retiredUpdates =
  /App updates|Mga update sa app|Restart now|I-restart karon/;

test("A07: APK Home, About and Settings never mount update UI or start update discovery", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    for (const debug of [false, true]) {
      let releaseRequests = 0;
      const countRelease = (request: { url(): string }) => {
        if (request.url().startsWith("https://api.github.com/"))
          releaseRequests++;
      };
      page.on("request", countRelease);
      await openHarness(
        page,
        `?apk-update&${debug ? "debug&" : ""}${language === "bis" ? "bis" : ""}`,
      );
      // A staged native update or reconnect must not resurrect the retired web controls.
      await page.evaluate(() => window.updateTest.status("staged"));
      for (const tab of ["launcher", "about", "settings"]) {
        await page.locator("#" + tab).click();
        for (const online of [false, true]) {
          await page.evaluate(
            (value) => window.updateTest.online(value),
            online,
          );
          await page.clock.runFor(30_000);
          await expect(
            page.getByRole("button", { name: retiredUpdates }),
          ).toHaveCount(0);
          await expect(
            page.getByRole("heading", { name: retiredUpdates }),
          ).toHaveCount(0);
          await expect(
            page.getByRole("link", {
              name: /Open official download page|Ablihi ang opisyal nga download page/,
            }),
          ).toHaveCount(0);
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
      }
      expect(releaseRequests).toBe(0);
      expect(
        await page.evaluate(() =>
          window.updateTest.calls.filter(
            (method) =>
              method.startsWith("ota.") || method.startsWith("apkUpdate."),
          ),
        ),
      ).toEqual([]);
      page.off("request", countRelease);
    }
  }
});

test("A08: stale update-screen history returns to Settings and preserves backup Back navigation", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    for (const debug of [false, true]) {
      const t = translations[language];
      await openHarness(
        page,
        `?${debug ? "debug&" : ""}${language === "bis" ? "bis" : ""}`,
      );
      await page.locator("#settings").click();
      const backup = page.getByRole("button", {
        name: new RegExp("^" + t.backupTitle),
      });
      await backup.click();
      await expect(
        page.getByRole("heading", { name: t.backupTitle, level: 1 }),
      ).toBeVisible();
      await page.evaluate(() => {
        // Preserve the real Settings instance so this exercises rejection, not an unrelated entry.
        history.replaceState(
          { ...history.state, mangoleafSettingsPage: "updates" },
          "",
          "#settings-updates",
        );
        window.dispatchEvent(
          new PopStateEvent("popstate", { state: history.state }),
        );
      });
      await expect(
        page.getByRole("heading", { name: t.navSettings, level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: retiredUpdates }),
      ).toHaveCount(0);
      await backup.click();
      await page
        .getByRole("button", { name: t.settingsBack, exact: true })
        .click();
      await expect(backup).toBeFocused();
      await backup.click();
      await page.goBack();
      await expect(
        page.getByRole("heading", { name: t.navSettings, level: 1 }),
      ).toBeVisible();
    }
  }
});

test("A10: Production rejects Diagnostics history while Debug retains its Diagnostics screen", async ({
  page,
}) => {
  for (const debug of [false, true]) {
    const t = translations.en;
    await openHarness(page, debug ? "?debug&disabled" : "?release");
    await page.locator("#settings").click();
    const diagnostics = page.getByRole("button", {
      name: new RegExp("^" + t.settingsDiagnostics),
    });
    await expect(diagnostics).toHaveCount(debug ? 1 : 0);
    if (debug) {
      await diagnostics.click();
      await expect(
        page.getByRole("heading", { name: t.settingsDiagnostics, exact: true }),
      ).toBeVisible();
      await page.goBack();
      await expect(diagnostics).toBeFocused();
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
      await expect(
        page.getByRole("heading", { name: t.navSettings, level: 1 }),
      ).toBeVisible();
    }
  }
});
