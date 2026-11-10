import { test, expect, type Page } from "@playwright/test";
import { translations, type Language } from "../../src/lib/translations";
import {
  prepareBackupHarness,
  openBackupHarness as openHarness,
  sourceCode,
  receivingCode,
  wrongCode,
} from "./support/backup-ui-harness";

test.beforeAll(prepareBackupHarness);

async function restoreSource(
  page: Page,
  language: Language,
  code = sourceCode,
) {
  const t = translations[language];
  const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
  await input.fill(code);
  await page
    .getByRole("button", { name: t.backupRestore, exact: true })
    .click();
}

test("B01: restoring copies keeps an existing receiving code and Pause choice in both languages", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "paused");
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestored.replace("{n}", "2"),
    );
    await expect(page.getByText(t.backupPaused, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: t.backupShowCode, exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveText(receivingCode);
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      enabled: false,
      restored: 2,
      inputs: [sourceCode],
    });
    await page.getByRole("switch", { name: t.backupToggle }).click();
    await expect(
      page.getByRole("switch", { name: t.backupToggle }),
    ).toBeEnabled();
    await page.getByRole("switch", { name: t.backupToggle }).click();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot().toggles),
    ).toEqual([true, false]);
  }
});

test("B02: a fresh receiver reveals its newly created own code after Restore in both languages", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "fresh");
    await expect(
      page.getByRole("button", { name: t.backupCreate, exact: true }),
    ).toBeVisible();
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestored.replace("{n}", "2"),
    );
    const code = page.getByRole("textbox", {
      name: t.backupRecoveryLabel,
      exact: true,
    });
    await expect(code).toHaveText(receivingCode);
    await expect(code).toHaveAttribute("aria-readonly", "true");
    await expect(
      page.getByText(t.backupRecoveryHint, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(t.backupEnabled, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
    ).toHaveValue("");
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot().code),
    ).not.toBe(sourceCode);
  }
});

test("B03: later photo failure still reveals the new receiving code and retains source input for retry", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "fresh&photo-error");
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(t.backupError);
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveText(receivingCode);
    await expect(
      page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
    ).toHaveValue(sourceCode);
    await expect(
      page.getByText(t.backupEnabled, { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      restored: 1,
      enabled: true,
    });
  }
});

test("B04: successful first and duplicate restores use singular and zero-count translations", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "count=1");
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestoredSingle.replace("{n}", "1"),
    );
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestored.replace("{n}", "0"),
    );
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      restored: 1,
      inputs: [sourceCode, sourceCode],
    });
  }
});

test("B05: wrong source preserves typed input and the receiving code/Pause settings", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "paused");
    await restoreSource(page, language, wrongCode);
    await expect(page.getByRole("alert")).toHaveText(t.backupCodeInvalid);
    await expect(
      page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
    ).toHaveValue(wrongCode);
    await page
      .getByRole("button", { name: t.backupShowCode, exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveText(receivingCode);
    await expect(
      page.getByRole("switch", { name: t.backupToggle }),
    ).not.toBeChecked();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      enabled: false,
      restored: 0,
      toggles: [],
    });
  }
});

test("B06: APK Settings replaces the language nav item and native-style Back returns to Settings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openHarness(page, "en", "settings&fresh");
  const navigation = page.getByRole("navigation");
  await expect(navigation.getByRole("button")).toHaveCount(5);
  await expect(
    navigation.getByRole("button", { name: "EN", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(translations.en.backupNotSetUp, { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot().created),
  ).toBe(0);
  await page.getByRole("button", { name: "Bisaya", exact: true }).click();
  const t = translations.bis;
  await expect(
    page.getByRole("heading", { name: t.navSettings, exact: true }),
  ).toBeVisible();
  const entry = page.getByRole("button", {
    name: new RegExp("^" + t.backupTitle),
  });
  await entry.click();
  await expect(
    page.getByRole("heading", { name: t.backupTitle, exact: true }),
  ).toBeFocused();
  await expect(
    navigation.getByRole("button", { name: t.navSettings, exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: t.navSettings, exact: true }),
  ).toBeVisible();
  await expect(entry).toBeFocused();
  await entry.click();
  await page.getByRole("button", { name: t.settingsBack, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: t.navSettings, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot()),
  ).toMatchObject({ created: 0, code: null, enabled: false, inputs: [] });
});

test("B07: offline backup is not reported complete and late code reads remain hidden after backgrounding", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openHarness(page, "en", "settings&offline&delay-code");
  const t = translations.en;
  await expect(page.getByText(t.backupWaiting, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  const revealed = page.getByRole("textbox", {
    name: t.backupRecoveryLabel,
    exact: true,
  });
  await expect(revealed).toHaveCount(0);
  await page
    .getByRole("button", { name: t.backupShowCode, exact: true })
    .click();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  // Wait for the delayed read to settle; local code actions no longer dim/disable the page.
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().codeReadsFinished),
    )
    .toBe(1);
  await expect(revealed).toHaveCount(0);
  await page
    .getByRole("button", { name: t.backupShowCode, exact: true })
    .click();
  await expect(revealed).toHaveText(receivingCode);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "20px";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(revealed).toHaveCount(0);
  await expect(
    page.getByText(t.backupRecoveryHint, { exact: true }),
  ).toBeVisible();
});

test("B08: explicit setup reveals the new code; failed setup does not enable the switch", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "fresh&setup-error");
    await page
      .getByRole("button", { name: t.backupCreate, exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(t.backupError);
    await expect(
      page.getByRole("switch", { name: t.backupToggle }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({ code: null, enabled: false });
    await openHarness(page, language, "fresh");
    await page
      .getByRole("button", { name: t.backupCreate, exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveText(receivingCode);
    await expect(
      page.getByRole("switch", { name: t.backupToggle }),
    ).toBeChecked();
    await expect(
      page.getByText(t.backupRecoveryHint, { exact: true }),
    ).toBeVisible();
  }
});

test("B09: copying a masked code keeps it hidden and clipboard failure offers Show", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await page.addInitScript(() => {
      // A controlled clipboard checks the action without using the machine's real clipboard.
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            if (new URLSearchParams(location.search).has("clipboard-error"))
              throw new Error("Synthetic clipboard denial");
            (
              window as Window & { copiedBackupCode?: string }
            ).copiedBackupCode = value;
          },
        },
      });
    });
    for (const failure of [false, true]) {
      await openHarness(page, language, failure ? "clipboard-error" : "");
      await page
        .getByRole("button", { name: t.backupCopy, exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        failure ? t.backupCodeCopyFailed : t.backupCodeCopied,
      );
      await expect(
        page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () =>
            (window as Window & { copiedBackupCode?: string }).copiedBackupCode,
        ),
      ).toBe(failure ? undefined : receivingCode);
    }
  }
});

test("B10: empty and whitespace-only restore input requests a code without contacting backup", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    for (const flags of ["fresh", "paused"]) {
      await openHarness(page, language, flags);
      const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
      const restore = page.getByRole("button", {
        name: t.backupRestore,
        exact: true,
      });
      await expect(restore).toBeEnabled();
      for (const value of ["", "   "]) {
        await input.fill(value);
        await restore.click();
        await expect(page.getByRole("alert")).toHaveText(t.backupCodeRequired);
        await expect(input).toHaveAttribute("aria-invalid", "true");
        await expect(input).toBeFocused();
        expect(
          await page.evaluate(() => window.backupRestoreUi.snapshot().inputs),
        ).toEqual([]);
      }
      await input.fill(sourceCode);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await restore.click();
      await expect(page.getByRole("status")).toHaveText(
        t.backupRestored.replace("{n}", "2"),
      );
    }
    // This phone's own backup remains available through its explicit pasted code.
    await openHarness(page, language, "paused");
    await restoreSource(page, language, receivingCode);
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      enabled: false,
      inputs: [receivingCode],
    });
  }
});

test("B11: entering backup keeps the known state; Bisaya controls fit without compressed icons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const t = translations.bis;
  await openHarness(page, "bis", "settings&paused&delay-preferences");
  await expect(page.getByText(t.backupPaused, { exact: true })).toBeVisible();
  const group = page.getByRole("group", { name: t.settingsAppLanguage });
  const label = await group
    .locator("..")
    .getByText(t.settingsAppLanguage, { exact: true })
    .boundingBox();
  const languageGroup = await group.boundingBox();
  expect(label!.y).toBeLessThan(languageGroup!.y + languageGroup!.height);
  expect(label!.x + label!.width).toBeLessThanOrEqual(languageGroup!.x);
  // Observe every DOM update, including states too brief for an eventual visibility assertion.
  await page.evaluate(() => {
    const state = window as Window & { sawFirstTimeSetup?: boolean };
    state.sawFirstTimeSetup = false;
    new MutationObserver(() => {
      if (document.body.textContent?.includes("I-set up ang backup"))
        state.sawFirstTimeSetup = true;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  await expect(
    page.getByRole("switch", { name: t.backupToggle }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => window.backupRestoreUi.snapshot().preferenceReads),
    )
    .toBe(1);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { sawFirstTimeSetup?: boolean }).sawFirstTimeSetup,
    ),
  ).toBe(false);
  for (const width of [320, 360, 432]) {
    await page.setViewportSize({ width, height: 800 });
    const show = page.getByRole("button", {
      name: t.backupShowCode,
      exact: true,
    });
    const copy = page.getByRole("button", { name: t.backupCopy, exact: true });
    const showBox = await show.boundingBox(),
      copyBox = await copy.boundingBox();
    expect(copyBox!.y).toBeGreaterThanOrEqual(showBox!.y + showBox!.height);
    for (const button of [show, copy]) {
      await expect(button.locator("svg")).toHaveCSS("width", "20px");
      expect(
        await button.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
    }
  }
});

test("B12: Copy keeps other controls opaque and avoids unnecessary preference refreshes", async ({
  page,
}) => {
  const t = translations.en;
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });
  });
  await openHarness(page, "en", "paused&delay-code");
  const before = await page.evaluate(
    () => window.backupRestoreUi.snapshot().preferenceReads,
  );
  await page.evaluate(() => {
    const state = window as Window & { dimmedBackupControls?: boolean };
    state.dimmedBackupControls = false;
    const inspect = () => {
      if (
        [...document.querySelectorAll("button,input")].some(
          (el) => Number(getComputedStyle(el).opacity) < 1,
        )
      )
        state.dimmedBackupControls = true;
    };
    new MutationObserver(inspect).observe(document.body, {
      subtree: true,
      attributes: true,
      childList: true,
    });
  });
  await page.getByRole("button", { name: t.backupCopy, exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(t.backupCodeCopied);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { dimmedBackupControls?: boolean })
          .dimmedBackupControls,
    ),
  ).toBe(false);
  expect(
    await page.evaluate(
      () => window.backupRestoreUi.snapshot().preferenceReads,
    ),
  ).toBe(before);
  await expect(
    page.getByRole("switch", { name: t.backupToggle }),
  ).toBeEnabled();
});

test("B13: malformed and rejected codes get inline feedback without changing receiving settings", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    for (const flags of ["fresh", "paused"]) {
      await openHarness(page, language, flags);
      await restoreSource(page, language, "incomplete code");
      await expect(page.getByRole("alert")).toHaveText(t.backupCodeInvalid);
      expect(
        await page.evaluate(() => window.backupRestoreUi.snapshot().inputs),
      ).toEqual([]);
      await restoreSource(page, language, wrongCode);
      await expect(page.getByRole("alert")).toHaveText(t.backupCodeInvalid);
      const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
      await expect(input).toHaveValue(wrongCode);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      expect(
        await page.evaluate(() => window.backupRestoreUi.snapshot()),
      ).toMatchObject({
        created: 0,
        enabled: false,
        code: flags === "fresh" ? null : receivingCode,
      });
      await input.fill(sourceCode);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await page
        .getByRole("button", { name: t.backupRestore, exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        t.backupRestored.replace("{n}", "2"),
      );
    }
  }
});

test("B14: connection failure is not reported as a wrong recovery code", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "en", "paused&connection-error");
  await restoreSource(page, "en");
  await expect(page.getByRole("status")).toHaveText(t.backupError);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
  ).toHaveValue(sourceCode);
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot()),
  ).toMatchObject({ code: receivingCode, enabled: false, created: 0 });
});

test("B15: APK diagnostics open under Settings and keep recording choice/logs after Back", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "en", "settings");
  await expect(
    page.getByRole("heading", { name: t.settingsLanguage, exact: true }),
  ).toBeVisible();
  const entry = page.getByRole("button", {
    name: new RegExp("^" + t.settingsDiagnostics),
  });
  await entry.click();
  await expect(
    page.getByRole("heading", { name: t.settingsDiagnostics, level: 1 }),
  ).toBeFocused();
  await expect(page).toHaveURL(/#settings-diagnostics$/);
  const panel = page.getByRole("region", {
    name: t.diagnosticsTitle,
    exact: true,
  });
  const enabled = panel.getByRole("checkbox", { name: t.diagnosticsEnable });
  await expect(enabled).not.toBeChecked();
  await enabled.check();
  await panel
    .getByRole("button", { name: t.diagnosticsView, exact: true })
    .click();
  await expect(
    panel.getByRole("textbox", { name: t.diagnosticsLogLabel }),
  ).toHaveValue(/diagnostics.enabled/);
  await page.getByRole("button", { name: t.settingsBack, exact: true }).click();
  await expect(entry).toBeFocused();
  await entry.click();
  await expect(enabled).toBeChecked();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: t.navSettings, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: new RegExp("^" + t.settingsUpdates) }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot()),
  ).toMatchObject({ created: 0, inputs: [] });
});

test("B16: Production always has an Updates page; unconfirmed/offline state never claims latest", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    for (const offline of [false, true]) {
      await openHarness(
        page,
        language,
        "settings&production" + (offline ? "&offline" : ""),
      );
      const entry = page.getByRole("button", {
        name: new RegExp("^" + t.settingsUpdates),
      });
      await entry.click();
      await expect(
        page.getByRole("heading", { name: t.settingsUpdates, level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByText(t.settingsUpdateUnconfirmed, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          t.settingsInstalledVersion.replace("{version}", "0.1.9"),
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: t.androidApkWebsiteAction,
          exact: true,
        }),
      ).toHaveCount(0);
      if (offline)
        await expect(
          page.getByText(t.settingsUpdateOffline, { exact: true }),
        ).toBeVisible();
      await page.goBack();
      await expect(entry).toBeFocused();
    }
  }
});

test("B17: changing backup Pause never dims other actions and serializes pending changes", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "settings&hold-toggle&delay-preferences");
    await page
      .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
      .click();
    const toggle = page.getByRole("switch", { name: t.backupToggle });
    const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
    await input.fill(sourceCode);
    await page.evaluate(() => {
      const state = window as Window & { dimmedBackupControls?: boolean };
      state.dimmedBackupControls = false;
      // Observe transient opacity changes as well as the settled appearance.
      new MutationObserver(() => {
        if (
          [...document.querySelectorAll("button,input")].some(
            (el) => Number(getComputedStyle(el).opacity) < 1,
          )
        )
          state.dimmedBackupControls = true;
      }).observe(document.body, {
        subtree: true,
        attributes: true,
        childList: true,
      });
    });
    for (const enabled of [false, true]) {
      await toggle.click();
      await expect(toggle).toBeDisabled();
      for (const label of [t.backupShowCode, t.backupCopy, t.backupRestore]) {
        const button = page.getByRole("button", { name: label, exact: true });
        expect(await button.isEnabled()).toBe(true);
        await expect(button).toHaveCSS("opacity", "1");
      }
      await expect(input).toBeEnabled();
      await expect(input).toHaveValue(sourceCode);
      // The shared operation guard must reject an overlapping restore without contacting its service.
      await page
        .getByRole("button", { name: t.backupRestore, exact: true })
        .click();
      expect(
        await page.evaluate(() => window.backupRestoreUi.snapshot().inputs),
      ).toEqual([]);
      await page.evaluate(() => window.backupRestoreUi.finishToggle());
      await expect(toggle).toBeEnabled();
      await expect(toggle).toHaveAttribute("aria-checked", String(enabled));
      await expect(
        page.getByText(enabled ? t.backupEnabled : t.backupPaused, {
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      enabled: true,
      toggles: [false, true],
      inputs: [],
      created: 0,
    });
    expect(
      await page.evaluate(
        () =>
          (window as Window & { dimmedBackupControls?: boolean })
            .dimmedBackupControls,
      ),
    ).toBe(false);
  }
});

test("B18: failed backup toggle keeps its previous choice and never dims code actions", async ({
  page,
}) => {
  const t = translations.en;
  await openHarness(page, "en", "settings&hold-toggle&toggle-error");
  await page
    .getByRole("button", { name: new RegExp("^" + t.backupTitle) })
    .click();
  const toggle = page.getByRole("switch", { name: t.backupToggle });
  await toggle.click();
  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("button", { name: t.backupCopy, exact: true }),
  ).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.backupRestoreUi.finishToggle());
  await expect(page.getByRole("status")).toHaveText(t.backupError);
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(
    await page.evaluate(() => window.backupRestoreUi.snapshot()),
  ).toMatchObject({
    code: receivingCode,
    enabled: true,
    toggles: [false],
    inputs: [],
    created: 0,
  });
});
