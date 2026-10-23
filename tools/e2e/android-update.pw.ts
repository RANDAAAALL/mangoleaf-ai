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
      status(value: string): void;
    };
  }
}

const origin = "https://appassets.androidplatform.net";
let script: Buffer;
let styles: Buffer;
const clockPages = new WeakSet<Page>();

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

test("A01: verified update waits for idle; modal supports both languages, focus, retry and Later", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    await openHarness(page, language === "bis" ? "?bis" : "");
    const t = translations[language];
    await expect(
      page.getByRole("button", { name: t.backupPause, exact: true }),
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
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
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
