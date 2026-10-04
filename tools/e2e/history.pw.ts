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

declare global {
  interface Window {
    mangoThumbnailTrace?: { revoked: string[]; removed: string[] };
  }
}

test("F10: Recent thumbnails stay stable through new scans, sync metadata and offline deletion", async ({
  page,
  context,
}) => {
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await expect
    .poll(async () => (await records(page))[0]?._status)
    .toBe("synced");
  await page
    .getByRole("heading", { name: "Recent Scans" })
    .scrollIntoViewIfNeeded();
  const thumbnails = page.locator('img[loading="lazy"]');
  await expect(thumbnails).toHaveCount(1);
  await expect
    .poll(() =>
      thumbnails
        .first()
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  const originalUrl = await thumbnails.first().getAttribute("src");

  await page.evaluate(() => {
    const trace = { revoked: [] as string[], removed: [] as string[] };
    window.mangoThumbnailTrace = trace;
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => {
      trace.revoked.push(url);
      revoke(url);
    };
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (!(node instanceof Element)) continue;
          const images = node.matches('img[loading="lazy"]')
            ? [node]
            : [...node.querySelectorAll('img[loading="lazy"]')];
          for (const image of images)
            trace.removed.push(image.getAttribute("src") || "");
        }
      }
    }).observe(document, { subtree: true, childList: true });
  });

  let releaseUpload!: () => void;
  let signalUpload!: () => void;
  const uploadReleased = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  const uploadStarted = new Promise<void>((resolve) => {
    signalUpload = resolve;
  });
  let releaseInsert!: () => void;
  let signalInsert!: () => void;
  const insertReleased = new Promise<void>((resolve) => {
    releaseInsert = resolve;
  });
  const insertStarted = new Promise<void>((resolve) => {
    signalInsert = resolve;
  });
  // Hold the two network phases separately so each real local metadata update
  // must retain the same thumbnail URL. Eventual visibility alone misses blinking.
  await page.route("**/__mock__/storage/v1/object/scans/**", async (route) => {
    if (route.request().method() === "POST") {
      signalUpload();
      await uploadReleased;
    }
    await route.continue();
  });
  await page.route("**/__mock__/rest/v1/scans", async (route) => {
    if (route.request().method() === "POST") {
      signalInsert();
      await insertReleased;
    }
    await route.continue();
  });

  try {
    await runScan(page, photos[1].file);
    await closeDetails(page);
    await uploadStarted;
    await expect(thumbnails).toHaveCount(2);
    await expect(thumbnails.nth(1)).toHaveAttribute("src", originalUrl!);
    const newUrl = await thumbnails.first().getAttribute("src");
    expect(newUrl).toMatch(/^blob:/);
    releaseUpload();
    await insertStarted;
    await expect(thumbnails.first()).toHaveAttribute("src", newUrl!);
    await expect(thumbnails.nth(1)).toHaveAttribute("src", originalUrl!);
    releaseInsert();
    await expect
      .poll(async () =>
        (await records(page)).every((row) => row._status === "synced"),
      )
      .toBe(true);
    await expect(thumbnails.first()).toHaveAttribute("src", newUrl!);
    await expect(thumbnails.nth(1)).toHaveAttribute("src", originalUrl!);
    const trace = await page.evaluate(() => window.mangoThumbnailTrace!);
    expect(trace.removed).toEqual([]);
    expect(trace.revoked).not.toContain(originalUrl);
    expect(trace.revoked).not.toContain(newUrl);

    // An offline deletion must release only the deleted card's URL.
    await context.setOffline(true);
    await page.getByTitle("Delete scan log").first().click();
    await expect(thumbnails).toHaveCount(1);
    await expect(thumbnails.first()).toHaveAttribute("src", originalUrl!);
    await expect
      .poll(() =>
        page.evaluate(
          (url) =>
            window.mangoThumbnailTrace!.revoked.filter((value) => value === url)
              .length,
          newUrl,
        ),
      )
      .toBe(1);
    expect(
      await page.evaluate(
        (url) => window.mangoThumbnailTrace!.revoked.includes(url!),
        originalUrl,
      ),
    ).toBe(false);
  } finally {
    releaseUpload();
    releaseInsert();
  }
});

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
