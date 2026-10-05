import { test, expect, openApp, nav } from "./support/fixtures";
import { modelVersion } from "../../src/lib/constants";
import { translations } from "../../src/lib/translations";
import packageInfo from "../../package.json";

test("R04: cross-browser navigation and mobile scan controls remain usable", async ({
  page,
  isMobile,
}) => {
  await openApp(page);
  await nav(page, "History");
  await expect(
    page.getByRole("heading", {
      name: translations.en.scanHistoryTitle,
      exact: true,
    }),
  ).toBeVisible();
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toBeVisible();
  // Native camera behavior is checked manually; this only verifies the correct control is reachable.
  await expect(
    page.getByRole("button", { name: /^Take Photo/ }).filter({ visible: true }),
  ).toHaveCount(isMobile ? 1 : 0);
  await expect(
    page
      .getByRole("button", { name: /^Upload Photo/ })
      .filter({ visible: true }),
  ).toHaveCount(1);
  const photoTips = page.getByRole("heading", {
    name: translations.en.scanSheetTipsTitle,
    exact: true,
  });
  await expect(photoTips).toHaveCount(1);
  await expect(photoTips).toBeVisible();
  const cancelButton = page.getByRole("button", {
    name: translations.en.cancelBtn,
    exact: true,
  });
  await expect(cancelButton).toBeInViewport({ ratio: 1 });
  const originalViewport = page.viewportSize()!;
  await page.setViewportSize({ ...originalViewport, height: 480 });
  // The content may scroll on short screens; Cancel must remain reachable.
  await expect(cancelButton).toBeInViewport({ ratio: 1 });
  if (originalViewport.width >= 768) {
    await expect
      .poll(() =>
        page
          .getByRole("heading", { name: translations.en.scanSheetTitle })
          .evaluate(
            (heading) =>
              heading.closest(".fixed")?.getBoundingClientRect().width ??
              Infinity,
          ),
      )
      .toBeLessThanOrEqual(520);
  }
  await page.setViewportSize(originalViewport);
  await cancelButton.click();
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toHaveCount(0);
});

test("R04: About and footer show the current app and model versions in both languages", async ({
  page,
}) => {
  await openApp(page);
  await nav(page, "About");
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    if (language === "bis")
      await page
        .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
        .filter({ visible: true })
        .first()
        .click();
    await expect(page.getByText(modelVersion, { exact: true })).toBeVisible();
    await expect(
      page.getByText(t.aboutModelVersionLabel, { exact: true }),
    ).toBeVisible();
    const versions = t.footerVersions
      .replace("{appVersion}", `v${packageInfo.version}`)
      .replace("{modelVersion}", modelVersion);
    await expect(page.getByText(versions, { exact: true })).toBeVisible();
  }
});
