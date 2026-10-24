import {
  test,
  expect,
  openApp,
  openWebsite,
  nav,
  attachJson,
} from "./support/fixtures";
import { modelVersion } from "../../src/lib/constants";
import { translations } from "../../src/lib/translations";
import packageInfo from "../../package.json";
import type { Page } from "@playwright/test";

async function legacySnapshot(page: Page, seed = false) {
  return page.evaluate(async (seed) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      // A v7 database proves the landing does not upgrade or rewrite legacy rows.
      const opening = indexedDB.open("MangoLeafDB", 70);
      opening.onupgradeneeded = () => {
        opening.result.createObjectStore("scans", { keyPath: "id" });
        opening.result.createObjectStore("guidelines", { keyPath: "id" });
      };
      opening.onerror = () => reject(opening.error);
      opening.onsuccess = () => resolve(opening.result);
    });
    if (seed) {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          ["scans", "guidelines"],
          "readwrite",
        );
        const scans = transaction.objectStore("scans");
        for (const status of ["synced", "pending-delete"]) {
          scans.put({
            id: `preserved-${status}`,
            disease_name: "Healthy Leaf",
            confidence: 0.974321987,
            updated_at: "2026-10-21T00:00:00.000Z",
            device_id: "legacy-device-metadata",
            owner_id: "legacy-owner-metadata",
            model_version: "model-v4.5.0",
            _status: status,
            image_url: "https://legacy.invalid/private-photo",
            image_blob: new Blob([new Uint8Array([255, 216, 255, 0])], {
              type: "image/jpeg",
            }),
          });
        }
        transaction.objectStore("guidelines").put({
          id: "healthy",
          guidelines_en: "Preserved public advice.",
          guidelines_bis: "Gipreserbar nga tambag.",
        });
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
      });
    }
    const read = (store: string) =>
      new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const request = database.transaction(store).objectStore(store).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    try {
      const scans = await Promise.all(
        (await read("scans")).map(async ({ image_blob, ...metadata }) => ({
          ...metadata,
          photoType: (image_blob as Blob).type,
          photoBytes: Array.from(
            new Uint8Array(await (image_blob as Blob).arrayBuffer()),
          ),
        })),
      );
      return {
        version: database.version,
        stores: [...database.objectStoreNames],
        scans,
        guidelines: await read("guidelines"),
      };
    } finally {
      database.close();
    }
  }, seed);
}

test("R04: every website size offers Home, About and Android installation without scanner startup", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) =>
    requests.push(new URL(request.url()).pathname),
  );
  await openWebsite(page);
  for (const width of [280, 320, 390, 767, 768, 1280]) {
    await page.setViewportSize({ width, height: 740 });
    for (const language of ["en", "bis"] as const) {
      const t = translations[language];
      if (language === "bis")
        await page
          .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
          .filter({ visible: true })
          .first()
          .click();
      await nav(page, t.navAbout);
      const phoneNav = page.getByRole("navigation", {
        name: t.websiteNavigationLabel,
        exact: true,
      });
      if (width < 768) {
        await expect(phoneNav).toBeVisible();
        await expect(
          phoneNav.getByRole("button").or(phoneNav.getByRole("link")),
        ).toHaveCount(4);
        await expect(
          phoneNav.getByRole("button", { name: t.navAbout, exact: true }),
        ).toHaveAttribute("aria-current", "page");
        // The logo and name share one centered group; controls stay out of the header.
        const brand = await page
          .locator("header")
          .getByText("MangoLeaf AI", { exact: true })
          .locator("..")
          .boundingBox();
        expect(brand).not.toBeNull();
        expect(Math.abs(brand!.x + brand!.width / 2 - width / 2)).toBeLessThan(
          1,
        );
        await expect(page.locator("header nav")).toBeHidden();
        await page.locator("footer").scrollIntoViewIfNeeded();
        const footerLinks = await page
          .locator("footer button")
          .last()
          .boundingBox();
        const bar = await phoneNav.boundingBox();
        expect(footerLinks).not.toBeNull();
        expect(bar).not.toBeNull();
        expect(footerLinks!.y + footerLinks!.height).toBeLessThanOrEqual(
          bar!.y,
        );
      } else {
        await expect(phoneNav).toBeHidden();
        await expect(page.locator("header nav")).toBeVisible();
      }
      await expect(
        page.getByRole("region", { name: t.diagnosticsTitle, exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("checkbox", { name: t.diagnosticsEnable, exact: true }),
      ).toHaveCount(0);
      await nav(page, t.navHome);
      await expect(
        page.getByRole("heading", { name: t.HowItWorksTitle, exact: true }),
      ).toBeVisible();
      for (const label of [t.navHistory, t.navScan])
        await expect(
          page.getByRole("button", { name: label, exact: true }),
        ).toHaveCount(0);
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: t.scanHistoryTitle, exact: true }),
      ).toHaveCount(0);
      await expect(
        page
          .getByRole("button", { name: t.downloadApp, exact: true })
          .or(
            page.getByRole("link", {
              name: t.androidOpenOrInstall,
              exact: true,
            }),
          )
          .filter({ visible: true })
          .first(),
      ).toBeVisible();
    }
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: translations.en.HowItWorksTitle,
        exact: true,
      }),
    ).toBeVisible();
  }
  expect(requests.filter((path) => path.startsWith("/model/"))).toEqual([]);
  expect(requests.filter((path) => path.startsWith("/__mock__/"))).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

test("R04: the desktop website footer reaches the bottom of a tall viewport with legal links in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 2000 });
  await openWebsite(page);
  const footer = page.locator("footer");
  // Home can be shorter than a large monitor; its footer must still fill the page.
  await expect
    .poll(() =>
      footer.evaluate((element) => element.getBoundingClientRect().bottom),
    )
    .toBeGreaterThanOrEqual(1999);
  for (const name of [
    translations.en.privacyPolicy,
    translations.en.termsOfService,
  ]) {
    const link = footer.getByRole("button", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toBeInViewport({ ratio: 1 });
  }
});

test("R04: website language changes survive denied preference writes with an older readable value", async ({
  page,
}) => {
  await openWebsite(page);
  await page.evaluate(() => {
    // Install after startup so the shared English fixture can seed normally.
    // Keep reads working: the previous saved value must not defeat a new choice.
    const setItem = Storage.prototype.setItem;
    setItem.call(localStorage, "preferred_language", "en");
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === "preferred_language")
        throw new DOMException(
          "Preference write denied.",
          "QuotaExceededError",
        );
      return setItem.call(this, key, value);
    };
  });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 740 });
    await page
      .getByRole("button", { name: "EN/BIS", exact: true })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: translations.bis.HowItWorksTitle,
        exact: true,
      }),
    ).toBeVisible();
    await nav(page, translations.bis.navAbout);
    await page
      .getByRole("button", { name: "BIS/EN", exact: true })
      .filter({ visible: true })
      .click();
    await nav(page, translations.en.navHome);
    await expect(
      page.getByRole("heading", {
        name: translations.en.HowItWorksTitle,
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("preferred_language")),
    ).toBe("en");
  }
});

test("R04: website navigation and reload preserve legacy Blobs, tombstones, metadata and diagnostic preferences", async ({
  page,
}) => {
  await page.goto("/__test__/ready");
  const before = await legacySnapshot(page, true);
  const diagnosticPreference = '{"enabled":true,"events":[],"legacy":true}';
  await page.evaluate((value) => {
    localStorage.setItem("mangoleaf-diagnostics-v1", value);
  }, diagnosticPreference);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  // A native-looking browser object cannot authorize scanner or storage access.
  await page.addInitScript(() => {
    Object.assign(window, {
      MangoLeafNative: {
        postMessage() {
          throw new Error("Website attempted a native bridge request.");
        },
      },
    });
  });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 740 });
    await openWebsite(page);
    await nav(page, translations.en.navAbout);
    await expect(
      page.getByRole("region", {
        name: translations.en.diagnosticsTitle,
        exact: true,
      }),
    ).toHaveCount(0);
    await nav(page, translations.en.navHome);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: translations.en.HowItWorksTitle,
        exact: true,
      }),
    ).toBeVisible();
    expect(await legacySnapshot(page)).toEqual(before);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("mangoleaf-diagnostics-v1"),
      ),
    ).toBe(diagnosticPreference);
  }
  expect(
    requests.filter((url) =>
      /\/model\/|\/__mock__\/|legacy\.invalid/.test(url),
    ),
  ).toEqual([]);
});

test("R04: About and footer show the current app and model versions in both languages", async ({
  page,
}) => {
  await openWebsite(page);
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
    await expect(page.locator("footer")).not.toContainText("Android APK");
    for (const type of ["privacy", "terms"] as const) {
      await page
        .getByRole("button", {
          name: type === "privacy" ? t.privacyPolicy : t.termsOfService,
          exact: true,
        })
        .click();
      const legal = page.getByRole("dialog");
      await expect(legal).toBeVisible();
      if (type === "privacy") {
        // Legal copy must still describe local History rather than guest sync.
        await expect(legal).toContainText(t.privacyUpdated);
        await expect(legal).toContainText(t.privacySections[1].text);
        await expect(legal).toContainText(t.privacySections[3].text);
        // The optional local-log disclosure must be included in both languages.
        await expect(legal).toContainText(t.privacySections[5].text);
      } else {
        await expect(legal).toContainText(t.termsUpdated);
        await expect(legal).toContainText(t.termsConfidenceText);
        await expect(legal).not.toContainText(
          /Republic Act No\. 8293|DOST-PHREB/,
        );
      }
      await legal
        .getByRole("button", { name: t.legalCloseBtn, exact: true })
        .click();
      await expect(legal).toHaveCount(0);
    }
  }
});

test("R04: isolated scanner cards keep photo proportions and compact details after viewport changes", async ({
  page,
  browserName,
}, info) => {
  if (browserName === "webkit") {
    await page.goto("/__test__/ready");
    // Probe native storage separately so an application/database failure cannot skip this case.
    const capability = await page.evaluate(async () => {
      const name = `mangoleaf-layout-blob-probe-${crypto.randomUUID()}`;
      let database: IDBDatabase | undefined;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 1400;
        const drawing = canvas.getContext("2d")!;
        drawing.fillStyle = "#7bbf67";
        drawing.fillRect(0, 0, canvas.width, canvas.height);
        const photo = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(
                    new Error("Native PNG probe could not encode its photo."),
                  ),
            "image/png",
          ),
        );
        database = await new Promise<IDBDatabase>((resolve, reject) => {
          const opening = indexedDB.open(name, 1);
          opening.onupgradeneeded = () =>
            opening.result.createObjectStore("photos");
          opening.onerror = () => reject(opening.error);
          opening.onsuccess = () => resolve(opening.result);
        });
        await new Promise<void>((resolve, reject) => {
          const transaction = database!.transaction("photos", "readwrite");
          transaction.oncomplete = () => resolve();
          transaction.onabort = () => reject(transaction.error);
          transaction.objectStore("photos").put(photo, 1);
        });
        const saved = await new Promise<Blob>((resolve, reject) => {
          const request = database!
            .transaction("photos")
            .objectStore("photos")
            .get(1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        if (!(saved instanceof Blob) || saved.type !== photo.type)
          throw new Error("Native IndexedDB Blob round-trip changed the data.");
        const original = new Uint8Array(await photo.arrayBuffer());
        const restored = new Uint8Array(await saved.arrayBuffer());
        if (
          original.length !== restored.length ||
          !original.every((byte, index) => byte === restored[index])
        )
          throw new Error("Native IndexedDB Blob round-trip changed the data.");
        return { supported: true } as const;
      } catch (error) {
        if (!(error instanceof DOMException)) throw error;
        return {
          supported: false,
          name: error.name,
          message: error.message,
        } as const;
      } finally {
        database?.close();
        await new Promise<void>((resolve) => {
          const deletion = indexedDB.deleteDatabase(name);
          deletion.onsuccess = deletion.onerror = () => resolve();
        });
      }
    });
    await attachJson(info, "native-indexeddb-blob-capability", {
      browserName,
      platform: process.platform,
      ...capability,
    });
    test.skip(
      !capability.supported &&
        capability.name === "UnknownError" &&
        capability.message ===
          "Error preparing Blob/File data to be stored in object store",
      "This browser runtime cannot persist the layout fixture's native PNG Blob. Chromium/Firefox retain photo-layout coverage; physical Android validation remains separate.",
    );
    expect(capability.supported, JSON.stringify(capability)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 1400;
    const drawing = canvas.getContext("2d")!;
    drawing.fillStyle = "#7bbf67";
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    const photo = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), "image/png"),
    );
    // Seed the same local Blob representation used by saved scan photos.
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open("MangoLeafDB");
      opening.onerror = () => reject(opening.error);
      opening.onsuccess = () => {
        const database = opening.result;
        const transaction = database.transaction("scans", "readwrite");
        const scans = transaction.objectStore("scans");
        scans.put({
          id: crypto.randomUUID(),
          disease_name: "Healthy Leaf",
          confidence: 0.95,
          image_blob: photo,
          image_url: null,
          updated_at: new Date().toISOString(),
          device_id: "local-layout-test",
          _status: "local-only",
        });
        scans.put({
          id: crypto.randomUUID(),
          disease_name: "Anthracnose",
          confidence: 0.95,
          image_blob: null,
          image_url: null,
          updated_at: new Date(Date.now() - 60_000).toISOString(),
          device_id: "local-layout-test",
          _status: "local-only",
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error);
        };
      };
    });
  });
  await page.reload();
  const image = page.locator('img[loading="lazy"]').first();
  await image.scrollIntoViewIfNeeded();
  await image.evaluate((element: HTMLImageElement) => element.decode());

  const expectPhotoLayout = async (ratio: number) => {
    await expect
      .poll(() =>
        image.evaluate((element, expectedRatio) => {
          const bounds = element.parentElement!.getBoundingClientRect();
          return Math.abs(bounds.width / bounds.height - expectedRatio);
        }, ratio),
      )
      .toBeLessThan(0.02);
  };
  for (const width of [390, 767, 320, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expectPhotoLayout(4 / 3);
    // An intrinsic portrait image must not leave a tall empty information area.
    const information = image.locator("../..").locator(":scope > div").last();
    await expect
      .poll(async () => (await information.boundingBox())!.height)
      .toBeLessThan(150);
    await expect(
      image.locator("..").getByText("Healthy Leaf", { exact: true }),
    ).toBeVisible();
  }

  await nav(page, translations.en.navHistory);
  await expectPhotoLayout(1);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expectPhotoLayout(4 / 3);
  const missingPhoto = page.getByText(translations.en.noImageOffline, {
    exact: true,
  });
  await expect(missingPhoto).toBeVisible();
  await expect
    .poll(() =>
      missingPhoto.evaluate((element) => {
        const bounds =
          element.parentElement!.parentElement!.getBoundingClientRect();
        return Math.abs(bounds.width / bounds.height - 4 / 3);
      }),
    )
    .toBeLessThan(0.02);
});
