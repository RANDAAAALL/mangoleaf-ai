import {
  test,
  expect,
  photos,
  controlledModel,
  scoresFor,
  openApp,
  runScan,
  closeDetails,
  nav,
  records,
} from "./support/fixtures";

test("F10/F11: latest four, six per page, search/filter, deletion and page recovery", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  for (const photo of photos.slice(0, 7)) {
    await runScan(page, photo.file);
    await closeDetails(page);
  }
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(4);
  const latest = [...(await records(page))].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
  for (const [index, scan] of latest.slice(0, 4).entries()) {
    await page
      .getByRole("button", { name: "Details", exact: true })
      .nth(index)
      .click();
    // Compare bytes, not file sizes: different photos can have the same size.
    const correctPhoto = await page
      .getByRole("button", { name: "Close details" })
      .first()
      .locator("..")
      .locator("img")
      .evaluate(async (img: HTMLImageElement, id) => {
        const saved = await new Promise<Blob>((resolve, reject) => {
          const opening = indexedDB.open("MangoLeafDB");
          opening.onerror = () => reject(opening.error);
          opening.onsuccess = () => {
            const database = opening.result;
            const query = database
              .transaction("scans")
              .objectStore("scans")
              .get(id);
            query.onsuccess = () => {
              resolve(query.result.image_blob);
              database.close();
            };
            query.onerror = () => {
              reject(query.error);
              database.close();
            };
          };
        });
        const actual = new Uint8Array(
          await (await fetch(img.src)).arrayBuffer(),
        );
        const expected = new Uint8Array(await saved.arrayBuffer());
        return (
          expected.length > 0 &&
          actual.length === expected.length &&
          actual.every((byte, i) => byte === expected[i])
        );
      }, scan.id);
    expect(
      correctPhoto,
      `Recent photo ${index + 1} must match its saved record`,
    ).toBe(true);
    await closeDetails(page);
  }
  await nav(page, "History");
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(6);
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(6);
  await page.getByRole("button", { name: "Next page" }).click();
  await page.getByPlaceholder("Search by name...").fill("not-a-disease");
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(0);
  await page.getByPlaceholder("Search by name...").fill("Healthy");
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Search by name...").clear();
  await page.getByRole("combobox").selectOption("Anthracnose");
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("combobox").selectOption("all");
  // Wait for upload sync so this case tests deletion of a persisted record.
  await expect
    .poll(async () => {
      const saved = await records(page);
      return (
        saved.length === 7 && saved.every((row) => row._status === "synced")
      );
    })
    .toBe(true);
  await page.getByRole("button", { name: "Next page" }).click();
  await page.getByTitle("Delete scan log").click();
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Next page" })).toHaveCount(0);
  await page.reload();
  await nav(page, "History");
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(6);
});
