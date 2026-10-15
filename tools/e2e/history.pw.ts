import {
  test,
  expect,
  photos,
  controlledModel,
  scoresFor,
  openApp,
  runScan,
  closeDetails,
  confirmScanDeletion,
  historyDetails,
  nav,
  recentHeading,
  homeHeading,
  records,
  requestScanDeletion,
  savedPhotoSize,
} from "./support/fixtures";
import { translations } from "../../src/lib/translations";

declare global {
  interface Window {
    mangoThumbnailTrace?: { revoked: string[]; removed: string[] };
    mangoDeleteFailures?: number;
    mangoFailNextScanDelete?: boolean;
  }
}

test("F10: visible thumbnails stay stable through new local scans and offline deletion", async ({
  page,
  context,
}) => {
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await expect
    .poll(async () => (await records(page))[0]?._status)
    .toBe("local-only");
  // History keeps both photos mounted. Wider Home now shows the Download card.
  await nav(page, "History");
  const heading = page.getByRole("heading", {
    name: "Scan history",
    exact: true,
  });
  await heading.scrollIntoViewIfNeeded();
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

  await runScan(page, photos[1].file);
  await closeDetails(page);
  await expect(heading).toBeVisible();
  await expect(thumbnails).toHaveCount(2);
  await expect(thumbnails.nth(1)).toHaveAttribute("src", originalUrl!);
  const newUrl = await thumbnails.first().getAttribute("src");
  expect(newUrl).toMatch(/^blob:/);
  const trace = await page.evaluate(() => window.mangoThumbnailTrace!);
  expect(trace.removed).toEqual([]);
  expect(trace.revoked).not.toContain(originalUrl);
  expect(trace.revoked).not.toContain(newUrl);

  await context.setOffline(true);
  await requestScanDeletion(page);
  await confirmScanDeletion(page);
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
  expect(await records(page)).toHaveLength(1);
});

test("F10/F11: responsive previews, search/filter, selection, deletion and page recovery", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const desktop = page.viewportSize()!.width >= 768;
  const homeCount = 1;
  const pageSize = desktop ? 6 : 4;
  const lastPageCount = 7 - pageSize;
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  for (const photo of photos.slice(0, 7)) {
    await runScan(page, photo.file);
    await closeDetails(page);
  }
  const originalViewport = page.viewportSize()!;
  if (desktop) {
    await expect(recentHeading(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Details", exact: true }),
    ).toHaveCount(0);
    await page.setViewportSize({ ...originalViewport, width: 767 });
  }
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(homeCount);
  await expect(
    page.getByRole("heading", {
      name: "Recent Scan",
      exact: true,
    }),
  ).toBeVisible();
  const latest = [...(await records(page))].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
  for (const [index, scan] of latest.slice(0, homeCount).entries()) {
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
  await page.setViewportSize(originalViewport);
  await expect(historyDetails(page)).toHaveCount(pageSize);
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(historyDetails(page)).toHaveCount(lastPageCount);
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await expect(historyDetails(page)).toHaveCount(pageSize);
  await page.getByRole("button", { name: "Next page" }).click();
  const search = page.getByPlaceholder("Search by name...");
  await search.fill("not-a-disease");
  await expect(historyDetails(page)).toHaveCount(0);
  await expect(
    page.getByText("No scans match your search or filter.", { exact: true }),
  ).toBeVisible();
  await search.fill("Healthy");
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await expect(historyDetails(page)).toHaveCount(pageSize);
  await search.clear();
  const categoryFilter = page.getByLabel("Filter scans", { exact: true });
  if (!desktop) {
    await page.getByRole("button", { name: "Filters", exact: true }).click();
  }
  await expect(categoryFilter.locator('option[value="all"]')).toHaveText(
    "All (7)",
  );
  await expect(categoryFilter.locator('option[value="healthy"]')).toHaveText(
    "Healthy (7)",
  );
  await categoryFilter.selectOption("anthracnose");
  await expect(historyDetails(page)).toHaveCount(0);
  // Typing a search clears a category that would otherwise hide valid matches.
  await search.fill("Healthy");
  await expect(categoryFilter).toHaveValue("all");
  await expect(historyDetails(page)).toHaveCount(pageSize);
  if (!desktop) {
    await expect(
      page.getByRole("button", { name: "Filters", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(categoryFilter).not.toBeVisible();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
  }
  await categoryFilter.selectOption("healthy");
  await search.clear();
  await expect(categoryFilter).toHaveValue("all");
  if (!desktop) {
    await expect(
      page.getByRole("button", { name: "Filters", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(categoryFilter).not.toBeVisible();
  }
  // Confirm all local commits before exercising deletion.
  await expect
    .poll(async () => {
      const saved = await records(page);
      return (
        saved.length === 7 && saved.every((row) => row._status === "local-only")
      );
    })
    .toBe(true);

  const savedState = async () => {
    const saved = await records(page);
    const state = await Promise.all(
      saved.map(async (scan) => ({
        id: scan.id,
        status: scan._status,
        photoBytes: await savedPhotoSize(page, scan.id),
      })),
    );
    return state.sort((a, b) => a.id.localeCompare(b.id));
  };
  const beforeCancellation = await savedState();
  if (desktop) {
    const originalViewport = page.viewportSize()!;
    const trashButton = page.getByTitle("Delete scan", { exact: true }).first();
    await trashButton.focus();
    await trashButton.click();
    const singleScanDialog = page.getByRole("dialog", {
      name: "Delete selected scan (1)?",
      exact: true,
    });
    await expect(singleScanDialog).toBeVisible();
    try {
      // Resizing hides the original trash button, so Cancel needs a visible fallback.
      await page.setViewportSize({
        width: 360,
        height: originalViewport.height,
      });
      await expect(trashButton).not.toBeVisible();
      await singleScanDialog
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      await expect(singleScanDialog).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Scan history", exact: true }),
      ).toBeFocused();
      await expect.poll(savedState).toEqual(beforeCancellation);
    } finally {
      await page.setViewportSize(originalViewport);
    }
    await expect(historyDetails(page)).toHaveCount(pageSize);
  }
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "0 selected", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: desktop ? "Select all (7)" : "Select all",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "7 selected", exact: true }),
  ).toBeVisible();
  const selectedScans = page.getByRole("checkbox", { name: /^Select scan: / });
  await expect(selectedScans).toHaveCount(pageSize);
  for (const checkbox of await selectedScans.all()) {
    await expect(checkbox).toBeChecked();
  }
  // Select all includes the second page, not only the visible rows.
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(selectedScans).toHaveCount(lastPageCount);
  for (const checkbox of await selectedScans.all()) {
    await expect(checkbox).toBeChecked();
  }
  const deleteSelected = page
    .getByRole("button", {
      name: desktop ? /^Delete \(\d+\)$/ : /^Delete \d+ scans?$/,
    })
    .filter({ visible: true });
  const allScansDialog = page.getByRole("dialog", {
    name: "Delete selected scans (7)?",
    exact: true,
  });
  for (const dismiss of ["Cancel", "Close", "Escape"] as const) {
    await deleteSelected.click();
    await expect(allScansDialog).toBeVisible();
    await expect(
      allScansDialog.getByRole("button", { name: "Cancel", exact: true }),
    ).toBeFocused();
    if (dismiss === "Escape") await page.keyboard.press("Escape");
    else {
      await allScansDialog
        .getByRole("button", { name: dismiss, exact: true })
        .click();
    }
    await expect(allScansDialog).not.toBeVisible();
    await expect.poll(savedState).toEqual(beforeCancellation);
    await expect(
      page.getByRole("heading", { name: "7 selected", exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Scan history", exact: true }),
  ).toBeFocused();
  await expect(selectedScans).toHaveCount(0);
  await expect.poll(savedState).toEqual(beforeCancellation);

  // Delete the whole last page: one desktop scan or three phone scans.
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await expect(selectedScans).toHaveCount(lastPageCount);
  for (const checkbox of await selectedScans.all()) await checkbox.check();
  await expect(
    page
      .getByRole("button", {
        name: desktop
          ? `Delete (${lastPageCount})`
          : `Delete ${lastPageCount} scans`,
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
  await deleteSelected.click();
  await confirmScanDeletion(page, lastPageCount);
  await expect(historyDetails(page)).toHaveCount(pageSize);
  await expect(page.getByRole("button", { name: "Next page" })).toHaveCount(0);
  await page.reload();
  await expect(homeHeading(page)).toBeVisible();
  await nav(page, "History");
  await expect(historyDetails(page)).toHaveCount(pageSize);
});

test("F17: offline batch deletion keeps its selected IDs through a local failure and retry", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  const desktop = page.viewportSize()!.width >= 768;
  await context.addInitScript(() => {
    // Dexie binds this method when opening the database, so install it first.
    const transaction = IDBDatabase.prototype.transaction;
    window.mangoFailNextScanDelete = false;
    window.mangoDeleteFailures = 0;
    IDBDatabase.prototype.transaction = function (
      this: IDBDatabase,
      ...args: Parameters<typeof transaction>
    ) {
      const [storeNames, mode] = args;
      const stores = typeof storeNames === "string" ? [storeNames] : storeNames;
      if (
        window.mangoFailNextScanDelete &&
        this.name === "MangoLeafDB" &&
        mode === "readwrite" &&
        stores.includes("scans")
      ) {
        // The bound wrapper uses the native method again once this flag clears.
        window.mangoFailNextScanDelete = false;
        IDBDatabase.prototype.transaction = transaction;
        window.mangoDeleteFailures! += 1;
        throw new DOMException(
          "Isolated local deletion failure",
          "QuotaExceededError",
        );
      }
      return transaction.apply(this, args);
    };
  });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  for (const photo of photos.slice(0, 2)) {
    await runScan(page, photo.file);
    await closeDetails(page);
  }
  await expect
    .poll(async () => {
      const saved = await records(page);
      return (
        saved.length === 2 &&
        saved.every((scan) => scan._status === "local-only")
      );
    })
    .toBe(true);
  const originalScans = await records(page);
  await nav(page, "History");
  await expect(historyDetails(page)).toHaveCount(2);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page
    .getByRole("button", {
      name: desktop ? "Select all (2)" : "Select all",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: desktop ? "Delete (2)" : "Delete 2 scans",
      exact: true,
    })
    .filter({ visible: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Delete selected scans (2)?",
    exact: true,
  });
  await expect(dialog).toBeVisible();

  // Insert another local report after the confirmation has captured its IDs.
  const arrival = await page.evaluate(
    (sourceId) =>
      new Promise<{ id: string; photoBytes: number }>((resolve, reject) => {
        const opening = indexedDB.open("MangoLeafDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const transaction = database.transaction("scans", "readwrite");
          const store = transaction.objectStore("scans");
          const source = store.get(sourceId);
          const id = crypto.randomUUID();
          let photoBytes = 0;
          source.onsuccess = () => {
            const scan = source.result;
            photoBytes = scan.image_blob.size;
            store.add({
              id,
              disease_name: "Mango Scab",
              confidence: 0.95,
              image_blob: scan.image_blob,
              image_url: null,
              model_version: scan.model_version,
              updated_at: new Date().toISOString(),
              device_id: scan.device_id,
              _status: "local-only",
            });
          };
          transaction.onerror = transaction.onabort = () => {
            database.close();
            reject(transaction.error);
          };
          transaction.oncomplete = () => {
            database.close();
            // Native writes bypass Dexie; notify its live query about this row.
            window.dispatchEvent(
              new CustomEvent("x-storagemutated-1", {
                detail: {
                  "idb://MangoLeafDB/scans/": { d: 1, from: id, to: id },
                  "idb://MangoLeafDB/scans/updated_at": {
                    d: 1,
                    from: "",
                    to: "\uffff",
                  },
                },
              }),
            );
            resolve({ id, photoBytes });
          };
        };
      }),
    originalScans[0].id,
  );
  expect(arrival.photoBytes).toBeGreaterThan(0);
  const arrivingCheckbox = page.getByRole("checkbox", {
    name: "Select scan: Mango Scab",
    exact: true,
    includeHidden: true,
  });
  await expect(arrivingCheckbox).toHaveCount(1);
  await expect(arrivingCheckbox).not.toBeChecked();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText(
    "Delete selected scans (2)?",
  );
  const rowStatuses = async () =>
    (await records(page))
      .map((scan) => ({ id: scan.id, status: scan._status }))
      .sort((a, b) => a.id.localeCompare(b.id));
  const beforeFailure = [
    ...originalScans.map((scan) => ({ id: scan.id, status: "local-only" })),
    { id: arrival.id, status: "local-only" },
  ].sort((a, b) => a.id.localeCompare(b.id));

  await page.evaluate(() => {
    window.mangoFailNextScanDelete = true;
  });
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    translations.en.historyDeleteFailed,
  );
  await expect(dialog).toBeVisible();
  await expect.poll(rowStatuses).toEqual(beforeFailure);
  expect(await page.evaluate(() => window.mangoDeleteFailures)).toBe(1);
  expect(await savedPhotoSize(page, arrival.id)).toBe(arrival.photoBytes);

  await confirmScanDeletion(page, 2);
  expect(await page.evaluate(() => window.mangoDeleteFailures)).toBe(1);
  await expect
    .poll(rowStatuses)
    .toEqual([{ id: arrival.id, status: "local-only" }]);
  await expect(historyDetails(page)).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "View details: Mango Scab",
      exact: true,
    }),
  ).toBeVisible();
  expect(await savedPhotoSize(page, arrival.id)).toBe(arrival.photoBytes);

  await context.setOffline(false);
  await expect
    .poll(rowStatuses, { timeout: 20_000 })
    .toEqual([{ id: arrival.id, status: "local-only" }]);
  await expect(historyDetails(page)).toHaveCount(1);
  expect(await savedPhotoSize(page, arrival.id)).toBe(arrival.photoBytes);
});
