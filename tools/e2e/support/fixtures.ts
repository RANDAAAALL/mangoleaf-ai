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
import { CLASSES } from "../../../src/lib/constants";

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
                    tensorShape: { dim: [{ size: "1" }, { size: "6" }] },
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
              tensorShape: { dim: [{ size: "1" }, { size: "6" }] },
            },
          },
        },
        weightsManifest: [
          {
            paths: ["__ui-scores.bin"],
            weights: [{ name: "scores", shape: [1, 6], dtype: "float32" }],
          },
        ],
      },
    }),
  );
}
export const scoresFor = (label: string) =>
  CLASSES.map((name) => (name === label ? 0.95 : 0.01));
export async function openApp(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Recent Scans", exact: true }),
  ).toBeVisible({ timeout: 90_000 });
}
export async function nav(page: Page, label: string) {
  await page
    .getByRole("button", { name: label, exact: true })
    .filter({ visible: true })
    .first()
    .click();
}
export async function choosePhoto(page: Page, file: string, camera = false) {
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: "Start a Scan" }),
  ).toBeVisible();
  const choosing = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: camera ? /^Take Photo/ : /^Upload Photo/ })
    .click();
  const chooser = await choosing;
  expect(await chooser.element().getAttribute("id")).toBe(
    camera ? "scan-camera-input" : "scan-gallery-input",
  );
  await chooser.setFiles(photoPath(file));
  await expect(
    page.getByRole("heading", { name: "Review Photo" }),
  ).toBeVisible();
  const preview = page.getByRole("img", { name: "Preview", exact: true });
  await expect(preview).toBeVisible();
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
    async (image: HTMLImageElement, hash) => {
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
          .getAll(hash);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      database.close();
      if (saved.length !== 1 || saved[0].image_blob.size === 0) return false;
      const actual = new Uint8Array(
        await (await fetch(image.src)).arrayBuffer(),
      );
      const expected = new Uint8Array(await saved[0].image_blob.arrayBuffer());
      return (
        actual.length === expected.length &&
        actual.every((byte, i) => byte === expected[i])
      );
    },
    expectedHash,
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
  if (label !== uncertain)
    await expect(
      modal.getByText(`${Math.round(confidence * 100)}%`, { exact: true }),
    ).toBeVisible();
  else await expect(modal.getByText(/^\d+%$/)).toHaveCount(0);
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
