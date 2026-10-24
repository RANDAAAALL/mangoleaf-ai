import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import {
  test,
  expect,
  openApp,
  nav,
  photos,
  controlledModel,
  scoresFor,
  runScan,
  closeDetails,
  records,
  requestScanDeletion,
  confirmScanDeletion,
} from "./support/fixtures";
import { translations } from "../../src/lib/translations";

const t = translations.en;
const panel = (page: Page) =>
  page.getByRole("region", { name: t.diagnosticsTitle, exact: true });
const log = (page: Page) =>
  panel(page).getByRole("textbox", { name: t.diagnosticsLogLabel });

async function viewLogs(page: Page) {
  await nav(page, t.navAbout);
  // The panel loads lazily; wait before inspecting its expanded/collapsed state.
  await expect(panel(page)).toBeVisible();
  const show = panel(page).getByRole("button", {
    name: t.diagnosticsView,
    exact: true,
  });
  // A scan launched from About can leave this same viewer expanded underneath.
  if (await show.isVisible()) await show.click();
  await expect(log(page)).toBeVisible();
}

test("A01: About diagnostics retain events across tabs and reload, export text, and clear only their history", async ({
  page,
}) => {
  await openApp(page);
  await viewLogs(page);
  const checkbox = panel(page).getByRole("checkbox", {
    name: t.diagnosticsEnable,
  });
  await expect(checkbox).not.toBeChecked();
  await expect(log(page)).toHaveValue(/events=0/);
  await checkbox.check();
  await expect(log(page)).toHaveValue(/diagnostics.enabled/);

  await nav(page, t.navHistory);
  await viewLogs(page);
  await expect(log(page)).toHaveValue(/navigation.changed tab=history/);
  await expect
    .poll(() =>
      page.evaluate(
        () => localStorage.getItem("mangoleaf-diagnostics-v1") ?? "",
      ),
    )
    .toContain("navigation.changed");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: t.HowItWorksTitle, exact: true }),
  ).toBeVisible({ timeout: 90_000 });
  await viewLogs(page);
  await expect(checkbox).toBeChecked();
  await expect(log(page)).toHaveValue(/session.started/);
  await expect(log(page)).toHaveValue(/navigation.changed tab=history/);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    panel(page)
      .getByRole("button", { name: t.diagnosticsDownload, exact: true })
      .click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^MangoLeafAI-diagnostics-\d+\.txt$/,
  );
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = await readFile(downloadPath!, "utf8");
  expect(exported).toContain("navigation.changed tab=history");
  expect(exported).toContain("browser=");
  expect(exported).not.toContain("image_hash");

  const beforeClear = (await records(page)).map((record) => record.id);
  await checkbox.uncheck();
  await panel(page)
    .getByRole("button", { name: t.diagnosticsClear, exact: true })
    .click();
  await expect(log(page)).toHaveValue(/events=0/);
  expect((await records(page)).map((record) => record.id)).toEqual(beforeClear);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: t.HowItWorksTitle, exact: true }),
  ).toBeVisible({ timeout: 90_000 });
  await viewLogs(page);
  await expect(checkbox).not.toBeChecked();
  await expect(log(page)).toHaveValue(/events=0/);
});

test("A02: diagnostics remain readable when saving and clipboard access fail, with bilingual controls", async ({
  page,
}) => {
  await openApp(page);
  await viewLogs(page);
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    // Deny only diagnostic persistence; normal app storage keeps its native path.
    Storage.prototype.setItem = function (key, value) {
      if (key === "mangoleaf-diagnostics-v1")
        throw new DOMException(
          "Controlled diagnostic quota failure",
          "QuotaExceededError",
        );
      return setItem.call(this, key, value);
    };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException(
            "Controlled clipboard denial",
            "NotAllowedError",
          );
        },
      },
    });
  });
  await panel(page)
    .getByRole("checkbox", { name: t.diagnosticsEnable })
    .check();
  await expect(panel(page).getByText(t.diagnosticsMemoryOnly)).toBeVisible();
  await panel(page)
    .getByRole("button", { name: t.diagnosticsCopy, exact: true })
    .click();
  await expect(panel(page).getByText(t.diagnosticsCopyFailed)).toBeVisible();
  await expect(log(page)).toBeFocused();
  await expect(log(page)).toHaveValue(/diagnostics.enabled/);

  await page
    .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
    .filter({ visible: true })
    .first()
    .click();
  const bis = translations.bis;
  await expect(
    panel(page).getByRole("checkbox", { name: bis.diagnosticsEnable }),
  ).toBeChecked();
  await expect(
    panel(page).getByRole("button", {
      name: bis.diagnosticsDownload,
      exact: true,
    }),
  ).toBeVisible();
  await expect(panel(page).getByText(bis.diagnosticsMemoryOnly)).toBeVisible();
});

test("A03: completed photo checks, scan stages and deletion stay in About after their modals close", async ({
  page,
}) => {
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await viewLogs(page);
  await panel(page)
    .getByRole("checkbox", { name: t.diagnosticsEnable })
    .check();
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await viewLogs(page);
  await expect(log(page)).toHaveValue(/photo.check.completed/);
  await expect(log(page)).toHaveValue(/diagnosis.stage.finished.*stage=save/);
  await expect(log(page)).toHaveValue(/database.save.completed/);

  await panel(page)
    .getByRole("button", { name: t.diagnosticsClear, exact: true })
    .click();
  // Clearing diagnostic history must preserve a real saved local photo/report.
  expect(await records(page)).toHaveLength(1);
  await nav(page, t.navHistory);
  await requestScanDeletion(page);
  await confirmScanDeletion(page);
  await viewLogs(page);
  await expect(log(page)).toHaveValue(/history.delete.confirmed/);
  await expect(log(page)).toHaveValue(/database.delete.completed/);
  await expect(log(page)).toHaveValue(/history.delete.dialog.closed/);
  expect(await records(page)).toHaveLength(0);
  await expect(log(page)).not.toHaveValue(
    /image_blob|image_hash|diagnosedResultTabular|Healthy Fruit/,
  );
});
