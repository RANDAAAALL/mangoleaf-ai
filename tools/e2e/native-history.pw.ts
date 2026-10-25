import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { translations } from "../../src/lib/translations";

const origin = "https://appassets.androidplatform.net";
let script: Buffer;
let styles: Buffer;
// A real decodable local fixture keeps the browser image pipeline in this check.
const photo = readFileSync(
  resolve(
    "tools/e2e/fixtures/photos",
    readdirSync("tools/e2e/fixtures/photos").find((name) =>
      /\.jpe?g$/i.test(name),
    )!,
  ),
);

test.beforeAll(() => {
  execFileSync(
    "bun",
    [
      "-e",
      `
    const result=await Bun.build({entrypoints:['tools/e2e/support/native-history-harness.tsx'],target:'browser',
      define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_APP_TARGET':'"android"'}});
    if(!result.success)throw Error(String(result.logs));
    await Bun.write('.tools/performance-20261026/native-history-harness.js',result.outputs[0]);
  `,
    ],
    { cwd: process.cwd(), stdio: "pipe" },
  );
  script = readFileSync(
    ".tools/performance-20261026/native-history-harness.js",
  );
  const build = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
  const directory = resolve(build.directory, "out/_next/static/css");
  styles = Buffer.concat(
    readdirSync(directory)
      .filter((name) => name.endsWith(".css"))
      .map((name) => readFileSync(resolve(directory, name))),
  );
});

/** Refuse all external traffic; count actual img-handler reads separately from JS fetches. */
async function openHistory(page: Page, query = "") {
  const reads: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin)
      throw Error("History attempted an external photo request");
    if (url.pathname.startsWith("/_native/photos/")) {
      reads.push(url.pathname);
      await route.fulfill(
        url.pathname.endsWith("missing")
          ? { status: 404 }
          : { contentType: "image/jpeg", body: photo },
      );
    } else if (url.pathname === "/fixture.js")
      await route.fulfill({ contentType: "text/javascript", body: script });
    else if (url.pathname === "/fixture.css")
      await route.fulfill({ contentType: "text/css", body: styles });
    else
      await route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>',
      });
  });
  await page.addInitScript(() => {
    // Metadata readers must never convert every saved image into a JS Blob.
    window.fetch = () => {
      throw Error("History must not fetch a photo Blob");
    };
  });
  await page.goto(`${origin}/${query}`);
  await expect(page.locator("output")).toHaveText("500");
  return reads;
}

test("H01: 500 native reports load photos only for mounted pages and keep metadata refreshes isolated", async ({
  page,
}) => {
  const reads = await openHistory(page);
  const desktop = page.viewportSize()!.width >= 768;
  const homeCount = desktop ? 4 : 1;
  const pageSize = desktop ? 6 : 4;
  await expect(page.locator('img[loading="lazy"]')).toHaveCount(homeCount);
  await expect
    .poll(() =>
      page
        .locator('img[loading="lazy"]')
        .first()
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  expect(
    reads.every((path) => Number(path.split("-").at(-1)) < homeCount),
  ).toBe(true);
  await page
    .getByRole("button", { name: "History fixture", exact: true })
    .click();
  await expect(page.locator('img[loading="lazy"]')).toHaveCount(pageSize);
  const source = await page
    .locator('img[loading="lazy"]')
    .first()
    .getAttribute("src");
  await page
    .getByRole("button", { name: "Refresh reports fixture", exact: true })
    .click();
  await expect(page.locator('img[loading="lazy"]').first()).toHaveAttribute(
    "src",
    source!,
  );
  const listCount = await page.evaluate(
    () =>
      (window as unknown as { historyFixture: { calls: string[] } })
        .historyFixture.calls.length,
  );
  await page
    .getByRole("button", { name: "Refresh guidelines fixture", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { historyFixture: { calls: string[] } })
          .historyFixture.calls.length,
    ),
  ).toBe(listCount);
  await page
    .getByRole("button", { name: translations.en.nextPage, exact: true })
    .click();
  await expect(page.locator('img[loading="lazy"]').first()).toHaveAttribute(
    "src",
    `${origin}/_native/photos/fixture-${pageSize}`,
  );
  expect(
    reads.every((path) => Number(path.split("-").at(-1)) < pageSize * 2),
  ).toBe(true);
  // Offline mode still exercises the native handler; no network-backed fallback is permitted.
  await page.context().setOffline(true);
  await page
    .getByRole("button", {
      name: translations.en.historyDetailsScanLabel.replace(
        "{name}",
        "Healthy Leaf",
      ),
      exact: true,
    })
    .first()
    .click();
  const close = page
    .getByRole("button", {
      name: translations.en.closeDetailsBtn,
    })
    .first();
  await expect(close).toBeVisible();
  await expect(close.locator("..").locator("img")).toHaveAttribute(
    "src",
    `${origin}/_native/photos/fixture-${pageSize}`,
  );
  await expect
    .poll(() =>
      close
        .locator("..")
        .locator("img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await close.click();
  await page
    .getByRole("button", { name: "Refresh reports fixture", exact: true })
    .click();
  await expect(page.locator("output")).toHaveText("500");
});

test("H02: missing and rejected native photo paths preserve readable reports and Details", async ({
  page,
}) => {
  for (const flag of ["missing", "invalid"]) {
    await openHistory(page, `?${flag}`);
    await expect(
      page.getByText(translations.en.noImageOffline, { exact: true }).first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Details", exact: true })
      .first()
      .click();
    const close = page
      .getByRole("button", {
        name: translations.en.closeDetailsBtn,
      })
      .first();
    await expect(
      close.locator("..").getByText(translations.en.noImageOffline),
    ).toBeVisible();
    await close.click();
    await page.unrouteAll();
  }
});

test("H03: a temporarily unreadable private photo retries after metadata refresh", async ({
  page,
}) => {
  await openHistory(page, "?missing");
  await expect(
    page.getByText(translations.en.noImageOffline, { exact: true }).first(),
  ).toBeVisible();
  await page.route("**/_native/photos/missing", (route) =>
    route.fulfill({ contentType: "image/jpeg", body: photo }),
  );
  await page
    .getByRole("button", { name: "Refresh reports fixture", exact: true })
    .click();
  const recovered = page.locator('img[loading="lazy"][src$="/missing"]');
  await expect(recovered).toHaveCount(1);
  await expect
    .poll(() =>
      recovered.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
});
