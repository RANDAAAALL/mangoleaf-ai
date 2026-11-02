import { test, expect, type Page } from "@playwright/test";
import { translations } from "../../src/lib/translations";
import {
  prepareBackupHarness,
  openBackupHarness,
  receivingCode,
  sourceCode,
} from "./support/backup-ui-harness";

declare global {
  interface Window {
    clipboardWrites: string[];
    finishDiagnosticCopy(): void;
    flushSettingsBack(): void;
    queuedSettingsBacks(): number;
  }
}

test.beforeAll(prepareBackupHarness);

async function observeClipboard(page: Page) {
  await page.addInitScript(() => {
    window.clipboardWrites = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          window.clipboardWrites.push(value);
        },
      },
    });
  });
}

async function openDiagnostics(page: Page, flags = "") {
  const t = translations.en;
  await openBackupHarness(page, "en", "settings&" + flags);
  await page
    .getByRole("button", { name: new RegExp("^" + t.settingsDiagnostics) })
    .click();
  await page.getByRole("checkbox", { name: t.diagnosticsEnable }).check();
  await page
    .getByRole("button", { name: t.diagnosticsView, exact: true })
    .click();
}

test("B19: failed preference reads offer a local retry instead of permanent loading", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openBackupHarness(page, language, "preferences-error");
    await expect(page.getByText(t.backupError, { exact: true })).toBeVisible();
    const retry =
      language === "en"
        ? "Retry backup status"
        : "Sulayi pag-usab ang kahimtang sa backup";
    await expect(
      page.getByRole("button", { name: retry, exact: true }),
    ).toBeVisible({ timeout: 1200 });
    await page.getByRole("button", { name: retry, exact: true }).click();
    await expect(
      page.getByRole("button", { name: t.backupShowCode, exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      created: 0,
      inputs: [],
      preferenceReads: 2,
    });
  }
});

test("B20: a delayed code read cannot write the clipboard after backgrounding", async ({
  page,
}) => {
  await observeClipboard(page);
  await openBackupHarness(page, "en", "hold-code");
  await page
    .getByRole("button", { name: translations.en.backupCopy, exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().codeReadsStarted),
    )
    .toBe(1);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    window.backupRestoreUi.finishCodeRead();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().codeReadsFinished),
    )
    .toBe(1);
  expect(await page.evaluate(() => window.clipboardWrites)).toEqual([]);
});

test("B21: Hide can cancel a pending Show before its code read settles", async ({
  page,
}) => {
  const t = translations.en;
  await openBackupHarness(page, "en", "hold-code");
  await page
    .getByRole("button", { name: t.backupShowCode, exact: true })
    .click();
  const hide = page.getByRole("button", {
    name: t.backupHideCode,
    exact: true,
  });
  await expect(hide).toBeVisible({ timeout: 1200 });
  await hide.click();
  await page.evaluate(() => window.backupRestoreUi.finishCodeRead());
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().codeReadsFinished),
    )
    .toBe(1);
  await expect(
    page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: t.backupShowCode, exact: true }),
  ).toBeVisible();
});

test("B22: Settings shares one preference snapshot across pages and refreshes only after changes", async ({
  page,
}) => {
  const t = translations.en;
  await openBackupHarness(page, "en", "settings");
  await expect(page.getByText(t.backupEnabled, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  await page.getByRole("switch", { name: t.backupToggle }).waitFor();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  expect(
    await page.evaluate(
      () => window.backupRestoreUi.snapshot().preferenceReads,
    ),
  ).toBe(1);
  await page.goBack();
  await page
    .getByRole("button", { name: new RegExp("^" + t.settingsDiagnostics) })
    .click();
  await page.goBack();
  expect(
    await page.evaluate(
      () => window.backupRestoreUi.snapshot().preferenceReads,
    ),
  ).toBe(1);
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  await page.getByRole("switch", { name: t.backupToggle }).click();
  await expect(page.getByText(t.backupPaused, { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByText(t.backupPaused, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => window.backupRestoreUi.snapshot().preferenceReads,
    ),
  ).toBe(2);
});

test("B23: retiring old Settings history cannot close a newly opened page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const back = window.history.back.bind(window.history),
      queue: (() => void)[] = [];
    // Hold the actual traversal so the close/reopen race is deterministic.
    window.history.back = () => {
      queue.push(back);
    };
    window.flushSettingsBack = () => queue.shift()?.();
    window.queuedSettingsBacks = () => queue.length;
  });
  const t = translations.en;
  await openBackupHarness(page, "en", "settings");
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: t.navHome, exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.queuedSettingsBacks()))
    .toBe(1);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: t.navSettings, exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp("^" + t.settingsDiagnostics) })
    .click();
  await page.evaluate(() => window.flushSettingsBack());
  await expect(
    page.getByRole("heading", { name: t.settingsDiagnostics, level: 1 }),
  ).toBeVisible({ timeout: 1500 });
  await expect(page).toHaveURL(/#settings-diagnostics$/);
});

test("B24: duplicate opens create one history entry and Forward restores its page", async ({
  page,
}) => {
  const t = translations.en;
  await openBackupHarness(page, "en", "settings");
  const length = await page.evaluate(() => history.length);
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .evaluate((el) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });
  await expect(
    page.getByRole("heading", { name: t.backupTitle, level: 1 }),
  ).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(length + 1);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: t.navSettings, level: 1 }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: t.backupTitle, level: 1 }),
  ).toBeVisible();
});

test("B25: late diagnostic Copy feedback cannot replace a later Clear result", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            window.finishDiagnosticCopy = resolve;
          }),
      },
    });
  });
  const t = translations.en;
  await openDiagnostics(page);
  await page
    .getByRole("button", { name: t.diagnosticsCopy, exact: true })
    .click();
  await page
    .getByRole("button", { name: t.diagnosticsClear, exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(t.diagnosticsCleared);
  await page.evaluate(() => window.finishDiagnosticCopy());
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  await expect(page.getByRole("status")).toHaveText(t.diagnosticsCleared, {
    timeout: 1200,
  });
});

test("B26: late diagnostic export failure cannot replace a later Clear result", async ({
  page,
}) => {
  const t = translations.en;
  await openDiagnostics(page, "hold-export");
  const download = page.getByRole("button", {
    name: t.diagnosticsDownload,
    exact: true,
  });
  await download.click();
  await expect(download).toBeDisabled();
  await page
    .getByRole("button", { name: t.diagnosticsClear, exact: true })
    .click();
  await page.evaluate(() => window.nativeFixture.finishExport(false));
  await expect(download).toBeEnabled();
  await expect(page.getByRole("status")).toHaveText(t.diagnosticsCleared, {
    timeout: 1200,
  });
  expect(await page.evaluate(() => window.nativeFixture.exportRequests)).toBe(
    1,
  );
});

test("B27: Hide remains immediate while Copy waits for its private code read", async ({
  page,
}) => {
  const t = translations.en;
  await observeClipboard(page);
  await openBackupHarness(page, "en", "hold-code");
  await page
    .getByRole("button", { name: t.backupShowCode, exact: true })
    .click();
  await page.evaluate(() => window.backupRestoreUi.finishCodeRead());
  await expect(
    page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: t.backupCopy, exact: true }).click();
  await page
    .getByRole("button", { name: t.backupHideCode, exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
  ).toHaveCount(0, { timeout: 1200 });
  await page.evaluate(() => window.backupRestoreUi.finishCodeRead());
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().codeReadsFinished),
    )
    .toBe(2);
  expect(await page.evaluate(() => window.clipboardWrites)).toEqual([]);
});

test("B28: a failed Back API call does not permanently lock Settings navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const back = history.back.bind(history);
    let fail = true;
    history.back = () => {
      if (fail) {
        fail = false;
        throw new Error("Controlled Back failure");
      }
      back();
    };
  });
  const t = translations.en;
  await openBackupHarness(page, "en", "settings");
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  const back = page.getByRole("button", { name: t.settingsBack, exact: true });
  await back.click();
  await expect(
    page.getByRole("heading", { name: t.backupTitle, level: 1 }),
  ).toBeVisible();
  await back.click();
  await expect(
    page.getByRole("heading", { name: t.navSettings, level: 1 }),
  ).toBeVisible({ timeout: 1200 });
});

test("B29: failed post-change status reads require Retry before showing a confirmed choice", async ({
  page,
}) => {
  const t = translations.en;
  await openBackupHarness(page, "en", "settings&paused");
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  await page.evaluate(() => window.backupRestoreUi.failPreferenceReads(1));
  const toggle = page.getByRole("switch", { name: t.backupToggle });
  await toggle.click();
  await expect(
    page.getByRole("alert").getByText(t.backupError, { exact: true }),
  ).toBeVisible();
  await expect(toggle).toBeDisabled();
  await page.getByRole("button", { name: t.backupRetry, exact: true }).click();
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(t.backupEnabled, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot()),
  ).toMatchObject({
    code: receivingCode,
    enabled: true,
    toggles: [true],
    inputs: [],
    created: 0,
  });
});

test("B30: overlapping Show and Copy share one local credential read without losing either action", async ({
  page,
}) => {
  const t = translations.en;
  await observeClipboard(page);
  for (const labels of [
    [t.backupShowCode, t.backupCopy],
    [t.backupCopy, t.backupShowCode],
  ]) {
    await openBackupHarness(page, "en", "hold-code");
    for (const label of labels)
      await page.getByRole("button", { name: label, exact: true }).click();
    expect(
      await page.evaluate(
        () => window.backupRestoreUi.snapshot().codeReadsStarted,
      ),
    ).toBe(1);
    await page.evaluate(() => window.backupRestoreUi.finishCodeRead());
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveText(receivingCode);
    await expect
      .poll(() => page.evaluate(() => window.clipboardWrites))
      .toEqual([receivingCode]);
  }
});

test("B31: rejected input during status refresh cannot leave Working after settlement", async ({
  page,
}) => {
  const t = translations.en;
  await openBackupHarness(page, "en", "settings&hold-toggle&hold-preferences");
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  await page
    .getByLabel(t.backupRestoreCodeLabel, { exact: true })
    .fill(sourceCode);
  const toggle = page.getByRole("switch", { name: t.backupToggle });
  await toggle.click();
  await page.evaluate(() => window.backupRestoreUi.finishToggle());
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().preferenceReads),
    )
    .toBe(2);
  await page
    .getByRole("button", { name: t.backupRestore, exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(t.backupBusy);
  await page.evaluate(() => window.backupRestoreUi.finishPreferenceRead());
  await expect(toggle).toBeEnabled();
  await expect(page.getByRole("status")).toBeEmpty({ timeout: 1200 });
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot().inputs),
  ).toEqual([]);
});
