import { test, expect, openApp, nav } from "./support/fixtures";

test("R04: cross-browser navigation and mobile scan controls remain usable", async ({
  page,
  isMobile,
}) => {
  await openApp(page);
  await nav(page, "History");
  await expect(
    page.getByRole("heading", { name: "Scan History", exact: true }),
  ).toBeVisible();
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: "Start a Scan" }),
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
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Start a Scan" })).toHaveCount(
    0,
  );
});
