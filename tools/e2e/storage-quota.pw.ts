import type { Page } from "@playwright/test";
import {
  test,
  expect,
  choosePhoto,
  closeDetails,
  confirmScanDeletion,
  controlledModel,
  expectResult,
  historyDetails,
  openApp,
  photos,
  records,
  requestScanDeletion,
  runScan,
  scoresFor,
  attachJson,
} from "./support/fixtures";
import { translations } from "../../src/lib/translations";

declare global {
  interface Window {
    mangoScanQuota: { full: boolean; failed: number; attemptedIds: string[] };
  }
}

async function installQuotaFault(page: Page) {
  await page.addInitScript(() => {
    const control = { full: false, failed: 0, attemptedIds: [] as string[] };
    window.mangoScanQuota = control;
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === "scans") {
        control.attemptedIds.push((args[0] as { id: string }).id);
        if (control.full) {
          control.failed += 1;
          // Fail at the native persistence seam; deletion still works normally.
          throw new DOMException(
            "Isolated scan storage quota",
            "QuotaExceededError",
          );
        }
      }
      return add.apply(this, args);
    };
  });
}
const quotaDialog = (page: Page) =>
  page.getByRole("dialog", {
    name: translations.en.storageFullTitle,
    exact: true,
  });
async function startFullSave(page: Page, file: string) {
  await page.evaluate(() => {
    window.mangoScanQuota.full = true;
  });
  await choosePhoto(page, file);
  await page
    .getByRole("button", { name: translations.en.runDiagnosisBtn, exact: true })
    .click();
  await expect(quotaDialog(page)).toBeVisible();
}
test("L03: full storage warns explicitly and retries the same result without another prediction", async ({
  page,
  runtimeErrors,
}, info) => {
  await installQuotaFault(page);
  await controlledModel(page, scoresFor("Healthy Leaf"));
  let predictions = 0;
  page.on("console", (message) => {
    if (message.text().startsWith("Class probabilities (")) predictions += 1;
  });
  await openApp(page);
  await startFullSave(page, photos[0].file);
  expect(predictions).toBe(1);
  expect(await records(page)).toEqual([]);
  const dialog = quotaDialog(page);
  await expect(
    dialog.getByRole("button", {
      name: translations.en.storageRetrySaveBtn,
      exact: true,
    }),
  ).toBeEnabled();
  await dialog
    .getByRole("button", {
      name: translations.en.storageRetrySaveBtn,
      exact: true,
    })
    .click();
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.mangoScanQuota.failed))
    .toBe(2);
  expect(predictions).toBe(1);
  expect(await records(page)).toEqual([]);
  await page.evaluate(() => {
    window.mangoScanQuota.full = false;
  });
  await dialog
    .getByRole("button", {
      name: translations.en.storageRetrySaveBtn,
      exact: true,
    })
    .click();
  await expect(dialog).not.toBeVisible();
  await expectResult(page, "Healthy Leaf", Math.fround(0.95));
  expect(predictions).toBe(1);
  const saved = await records(page);
  expect(saved).toHaveLength(1);
  const attempts = await page.evaluate(() => window.mangoScanQuota);
  expect(new Set(attempts.attemptedIds).size).toBe(1);
  expect(attempts.attemptedIds[0]).toBe(saved[0].id);
  expect(runtimeErrors).toEqual([]);
  await attachJson(info, "quota-retry", {
    predictions,
    attempts,
    runtimeErrors,
    savedId: saved[0].id,
  });
});

test("L04: open History, delete a chosen report, and save the retained result offline", async ({
  page,
  context,
  runtimeErrors,
}) => {
  await installQuotaFault(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  let predictions = 0;
  page.on("console", (message) => {
    if (message.text().startsWith("Class probabilities (")) predictions += 1;
  });
  await openApp(page);
  await runScan(page, photos[0].file);
  const original = (await records(page))[0];
  await closeDetails(page);
  await context.setOffline(true);
  await startFullSave(page, photos[1].file);
  expect(predictions).toBe(2);
  expect((await records(page)).map((row) => row.id)).toEqual([original.id]);
  await quotaDialog(page)
    .getByRole("button", {
      name: translations.en.storageManageHistoryBtn,
      exact: true,
    })
    .click();
  await expect(quotaDialog(page)).not.toBeVisible();
  await expect(historyDetails(page)).toHaveCount(1);
  await requestScanDeletion(page);
  await confirmScanDeletion(page);
  expect(await records(page)).toEqual([]);
  await page.evaluate(() => {
    window.mangoScanQuota.full = false;
  });
  await page
    .getByRole("button", {
      name: translations.en.storageRetrySaveBtn,
      exact: true,
    })
    .click();
  await expectResult(page, "Healthy Fruit", Math.fround(0.95));
  expect(predictions).toBe(2);
  const saved = await records(page);
  expect(saved).toHaveLength(1);
  expect(saved[0].image_hash).toBe(photos[1].sha256);
  expect(saved[0].id).not.toBe(original.id);
  expect(runtimeErrors).toEqual([]);
});

test("L05: discarding an unsaved result preserves saved History and permits a fresh diagnosis", async ({
  page,
  runtimeErrors,
}) => {
  await installQuotaFault(page);
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  await runScan(page, photos[0].file);
  const original = (await records(page))[0];
  await closeDetails(page);
  await startFullSave(page, photos[1].file);
  await quotaDialog(page)
    .getByRole("button", {
      name: translations.en.storageDiscardBtn,
      exact: true,
    })
    .click();
  await expect(quotaDialog(page)).not.toBeVisible();
  expect((await records(page)).map((row) => row.id)).toEqual([original.id]);
  await page.evaluate(() => {
    window.mangoScanQuota.full = false;
  });
  await runScan(page, photos[2].file);
  expect(await records(page)).toHaveLength(2);
  expect(runtimeErrors).toEqual([]);
});

test("L07: narrow storage dialog contains focus and retains its draft across Escape and language change", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await installQuotaFault(page);
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  await startFullSave(page, photos[0].file);
  const dialog = quotaDialog(page);
  const manage = dialog.getByRole("button", {
    name: translations.en.storageManageHistoryBtn,
    exact: true,
  });
  const retry = dialog.getByRole("button", {
    name: translations.en.storageRetrySaveBtn,
    exact: true,
  });
  const discard = dialog.getByRole("button", {
    name: translations.en.storageDiscardBtn,
    exact: true,
  });
  await expect(manage).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(retry).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(discard).toBeFocused();
  await page.keyboard.press("Tab");
  // The scrollable help remains keyboard reachable; actions stay pinned below it.
  await expect(
    dialog.getByRole("region", { name: translations.en.storageHelpLabel }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(manage).toBeFocused();
  for (const button of [manage, retry, discard])
    await expect(button).toBeInViewport();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText(translations.en.storageUnsavedTitle, { exact: true }),
  ).toBeVisible();
  expect(await records(page)).toEqual([]);
  await page
    .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
    .filter({ visible: true })
    .first()
    .click();
  await page
    .getByRole("button", {
      name: translations.bis.storageRetrySaveBtn,
      exact: true,
    })
    .click();
  const bisaya = page.getByRole("dialog", {
    name: translations.bis.storageFullTitle,
    exact: true,
  });
  await expect(bisaya).toBeVisible();
  for (const text of [
    translations.bis.storageFullText,
    translations.bis.storagePendingText,
  ])
    await expect(bisaya.getByText(text, { exact: true })).toBeVisible();
  await expect(
    bisaya.getByRole("button", {
      name: translations.bis.storageDiscardBtn,
      exact: true,
    }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(bisaya).not.toBeVisible();
  await expect(
    page.getByText(translations.bis.storageUnsavedTitle, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: translations.bis.storageDiscardBtn,
      exact: true,
    })
    .click();
  await expect(
    page.getByText(translations.bis.storageUnsavedTitle, { exact: true }),
  ).toHaveCount(0);
  expect(await records(page)).toEqual([]);
});
