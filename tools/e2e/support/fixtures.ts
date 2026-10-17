import {
  test as base,
  expect,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import manifest from "../fixtures/manifest.json";
import type { ScanRecord } from "../../../src/lib/db";
import { CLASSES, modelVersion } from "../../../src/lib/constants";
import { translations } from "../../../src/lib/translations";

declare global {
  interface Window {
    mangoReleaseGuidelineReads?: () => void;
  }
}

export const photos = manifest.photos;
export const photoPath = (file: string) =>
  resolve("tools/e2e/fixtures/photos", file);
export const uncertain = "Uncertain / Unrecognized";
export const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [
    async ({ page, context, serviceWorkers }, use, info) => {
      const errors: string[] = [];
      const observe = (target: Page) => {
        target.on("pageerror", (error) => errors.push(error.message));
        target.on("crash", () => errors.push("Browser page crashed"));
        target.on("console", (message) => {
          if (message.type() === "error")
            errors.push(`${message.text()} (${message.location().url})`);
        });
      };
      observe(page);
      context.on("page", observe);
      await context.addInitScript(() => {
        if (location.origin === "http://127.0.0.1:4173")
          localStorage.setItem("preferred_language", "en");
      });
      if (serviceWorkers === "block") {
        // Model routing tests use the browser's unsupported-SW path; R02 keeps the real worker.
        await context.addInitScript(() =>
          Reflect.deleteProperty(
            Object.getPrototypeOf(navigator),
            "serviceWorker",
          ),
        );
      }
      for (const photo of photos) {
        expect(
          createHash("sha256")
            .update(readFileSync(photoPath(photo.file)))
            .digest("hex"),
          photo.file,
        ).toBe(photo.sha256);
      }
      await use(errors);
      await info.attach("browser-errors.json", {
        body: JSON.stringify(errors, null, 2),
        contentType: "application/json",
      });
      expect(errors, "Unexpected browser errors/crashes").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function attachJson(info: TestInfo, name: string, value: unknown) {
  await info.attach(name + ".json", {
    body: JSON.stringify(value, null, 2),
    contentType: "application/json",
  });
}

// Fixed scores exercise UI branches without claiming anything about model accuracy.
export async function controlledModel(page: Page, scores: number[]) {
  expect(scores).toHaveLength(CLASSES.length);
  await page.route("**/model/__ui-scores.bin", (route) =>
    route.fulfill({
      body: Buffer.from(new Float32Array(scores).buffer),
      contentType: "application/octet-stream",
    }),
  );
  await page.route("**/model/model.json", (route) =>
    route.fulfill({
      json: {
        format: "graph-model",
        generatedBy: "MangoLeaf UI test fixture",
        convertedBy: "test-only",
        modelTopology: {
          node: [
            {
              name: "input",
              op: "Placeholder",
              attr: {
                dtype: { type: "DT_FLOAT" },
                shape: {
                  shape: {
                    dim: [
                      { size: "1" },
                      { size: "224" },
                      { size: "224" },
                      { size: "3" },
                    ],
                  },
                },
              },
            },
            {
              name: "scores",
              op: "Const",
              attr: {
                dtype: { type: "DT_FLOAT" },
                value: {
                  tensor: {
                    dtype: "DT_FLOAT",
                    tensorShape: {
                      dim: [{ size: "1" }, { size: String(CLASSES.length) }],
                    },
                    floatVal: scores,
                  },
                },
              },
            },
            {
              name: "output",
              op: "Identity",
              input: ["scores"],
              attr: { T: { type: "DT_FLOAT" } },
            },
          ],
          versions: { producer: 1, minConsumer: 0 },
        },
        signature: {
          inputs: {
            input: {
              name: "input:0",
              dtype: "DT_FLOAT",
              tensorShape: {
                dim: [
                  { size: "1" },
                  { size: "224" },
                  { size: "224" },
                  { size: "3" },
                ],
              },
            },
          },
          outputs: {
            output: {
              name: "output:0",
              dtype: "DT_FLOAT",
              tensorShape: {
                dim: [{ size: "1" }, { size: String(CLASSES.length) }],
              },
            },
          },
        },
        weightsManifest: [
          {
            paths: ["__ui-scores.bin"],
            weights: [
              { name: "scores", shape: [1, CLASSES.length], dtype: "float32" },
            ],
          },
        ],
      },
    }),
  );
}
export const scoresFor = (label: string) =>
  CLASSES.map((name) => (name === label ? 0.95 : 0.05 / (CLASSES.length - 1)));

export async function holdGuidelineReads(page: Page) {
  await page.addInitScript(() => {
    let holding = true;
    const pending: (() => void)[] = [];
    const getAll = IDBObjectStore.prototype.getAll;
    const success = Object.getOwnPropertyDescriptor(
      IDBRequest.prototype,
      "onsuccess",
    )!;
    IDBObjectStore.prototype.getAll = function (
      ...args: Parameters<typeof getAll>
    ) {
      const request = getAll.apply(this, args);
      if (this.name === "guidelines") {
        // Delay delivery of real IndexedDB results, keeping loading deterministic.
        Object.defineProperty(request, "onsuccess", {
          configurable: true,
          set(callback: IDBRequest["onsuccess"]) {
            success.set!.call(request, (event: Event) => {
              const deliver = () => callback?.call(request, event);
              if (holding) pending.push(deliver);
              else deliver();
            });
          },
        });
      }
      return request;
    };
    Object.assign(window, {
      mangoReleaseGuidelineReads() {
        holding = false;
        pending.splice(0).forEach((deliver) => deliver());
      },
    });
  });
}

export async function releaseGuidelineReads(page: Page) {
  await page.evaluate(() => {
    if (!window.mangoReleaseGuidelineReads)
      throw new Error("Guideline read control was not installed");
    window.mangoReleaseGuidelineReads();
  });
}

export async function openApp(page: Page) {
  await page.goto("/");
  await expect(homeHeading(page)).toBeVisible({ timeout: 90_000 });
}

export const homeHeading = (page: Page) =>
  page.getByRole("heading", {
    name: translations.en.HowItWorksTitle,
    exact: true,
  });
export const recentHeading = (page: Page) =>
  page.getByRole("heading", { name: /^Recent Scans?$/ });
export const historyDetails = (page: Page) =>
  page.getByRole("button", { name: /^View details: / });

export async function requestScanDeletion(page: Page, index = 0) {
  const trashButtons = page
    .getByTitle(translations.en.deleteScanBtn, { exact: true })
    .filter({ visible: true });
  if ((await trashButtons.count()) > 0) {
    await trashButtons.nth(index).click();
    return;
  }
  // Phone History rows use selection instead of an individual trash button.
  await page
    .getByRole("button", {
      name: translations.en.historySelectBtn,
      exact: true,
    })
    .click();
  await page
    .getByRole("checkbox", { name: /^Select scan: / })
    .nth(index)
    .check();
  await page
    .getByRole("button", {
      name: translations.en.historyDeleteSelectedOneBtn.replace("{n}", "1"),
      exact: true,
    })
    .filter({ visible: true })
    .click();
}

export async function confirmScanDeletion(page: Page, count = 1) {
  const t = translations.en;
  const dialog = page.getByRole("dialog", {
    name: (count === 1
      ? t.historyDeleteConfirmOneTitle
      : t.historyDeleteConfirmTitle
    ).replace("{n}", String(count)),
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText(
      count === 1
        ? t.historyDeleteConfirmOneDescription
        : t.historyDeleteConfirmDescription,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: t.cancelBtn, exact: true }),
  ).toBeFocused();
  await dialog
    .getByRole("button", { name: t.historyDeleteConfirmBtn, exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}

// Playwright serializes a Blob as an empty object. Inspect its byte length
// inside the browser instead of reading Blob properties in the Node test.
export async function savedPhotoSize(page: Page, id: string): Promise<number> {
  return page.evaluate(
    (scanId) =>
      new Promise<number>((resolve, reject) => {
        const opening = indexedDB.open("MangoLeafDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const query = database
            .transaction("scans")
            .objectStore("scans")
            .get(scanId);
          query.onerror = () => {
            database.close();
            reject(query.error);
          };
          query.onsuccess = () => {
            database.close();
            resolve(query.result?.image_blob?.size ?? 0);
          };
        };
      }),
    id,
  );
}
export async function nav(page: Page, label: string) {
  const originalViewport = page.viewportSize()!;
  const phoneHistory =
    originalViewport.width >= 768 && label === translations.en.navHistory;
  // Wider layouts promote Download. Activate History through its phone-width
  // launcher, then retain the original layout for History/table assertions.
  if (phoneHistory)
    await page.setViewportSize({ ...originalViewport, width: 767 });
  await page
    .getByRole("button", { name: label, exact: true })
    .filter({ visible: true })
    .first()
    .click();
  if (phoneHistory) await page.setViewportSize(originalViewport);
}
export async function choosePhoto(page: Page, file: string, duplicate = false) {
  const originalViewport = page.viewportSize()!;
  // Photo selection is a phone-width action. Restore desktop layout before
  // diagnosis and History assertions so those checks keep their original scope.
  if (originalViewport.width >= 768)
    await page.setViewportSize({ ...originalViewport, width: 767 });
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toBeVisible();
  const choosing = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /^Upload Photo/ }).click();
  const chooser = await choosing;
  expect(await chooser.element().getAttribute("id")).toBe("scan-gallery-input");
  await chooser.setFiles(photoPath(file));
  await expect(
    page.getByRole("heading", {
      name: duplicate
        ? translations.en.duplicatePhotoTitle
        : translations.en.reviewPhotoTitle,
      exact: true,
    }),
  ).toBeVisible();
  const preview = page.getByRole("img", {
    name: translations.en.photoPreviewAlt,
    exact: true,
  });
  await expect(preview).toBeVisible();
  if (originalViewport.width >= 768)
    await page.setViewportSize(originalViewport);
  const hash = await preview.evaluate(async (element: HTMLImageElement) => {
    const bytes = await (await fetch(element.src)).arrayBuffer();
    return Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });
  expect(hash).toBe(photos.find((photo) => photo.file === file)!.sha256);
}
export async function runScan(page: Page, file: string) {
  await choosePhoto(page, file);
  await page
    .getByRole("button", { name: "Run AI Diagnosis", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close details" }).first(),
  ).toBeVisible({ timeout: 90_000 });
  const expectedHash = photos.find((photo) => photo.file === file)!.sha256;
  const displayedImage = details(page).locator("img");
  const correctPhoto = await displayedImage.evaluate(
    async (image: HTMLImageElement, expected) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("MangoLeafDB");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const saved = await new Promise<ScanRecord[]>((resolve, reject) => {
        const request = database
          .transaction("scans")
          .objectStore("scans")
          .index("image_hash")
          .getAll(expected.hash);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      database.close();
      // Historical diagnoses can share the bytes; only this model owns the new result.
      const current = saved.filter(
        (row) => row.model_version === expected.modelVersion,
      );
      if (current.length !== 1 || current[0].image_blob.size === 0)
        return false;
      const actual = new Uint8Array(
        await (await fetch(image.src)).arrayBuffer(),
      );
      const stored = new Uint8Array(await current[0].image_blob.arrayBuffer());
      return (
        actual.length === stored.length &&
        actual.every((byte, i) => byte === stored[i])
      );
    },
    { hash: expectedHash, modelVersion },
  );
  expect(
    correctPhoto,
    "Displayed photo must match the saved blob for the uploaded file",
  ).toBe(true);
}
export const details = (page: Page) =>
  page.getByRole("button", { name: "Close details" }).first().locator("..");
export async function closeDetails(page: Page) {
  await page.getByRole("button", { name: "Close details" }).first().click();
}

export async function records(page: Page): Promise<ScanRecord[]> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const opening = indexedDB.open("MangoLeafDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const request = database
            .transaction("scans")
            .objectStore("scans")
            .getAll();
          request.onsuccess = () => {
            database.close();
            resolve(request.result);
          };
          request.onerror = () => {
            database.close();
            reject(request.error);
          };
        };
      }),
  );
}

export async function expectResult(
  page: Page,
  label: string,
  confidence: number,
) {
  const modal = details(page);
  await expect(modal.getByText(label, { exact: true })).toBeVisible();
  const image = modal.getByRole("img", { name: label, exact: true });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(
    modal.getByText(`${Math.floor(confidence * 1000) / 10}%`, {
      exact: true,
    }),
  ).toBeVisible();
  // Bounding boxes catch badges that exist in the DOM but are clipped by the photo.
  const photoBox = await image.boundingBox();
  const badgeBox = await modal.getByText(label, { exact: true }).boundingBox();
  expect(photoBox).not.toBeNull();
  expect(badgeBox).not.toBeNull();
  expect(badgeBox!.y).toBeGreaterThanOrEqual(photoBox!.y);
  expect(badgeBox!.y + badgeBox!.height).toBeLessThanOrEqual(
    photoBox!.y + photoBox!.height + 1,
  );
  expect(badgeBox!.x).toBeGreaterThanOrEqual(photoBox!.x);
  expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(
    photoBox!.x + photoBox!.width + 1,
  );
}
