import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { translations } from "../../src/lib/translations";
import { UNCERTAIN_LABEL } from "../../src/lib/constants";

const scripts = new Map<string, Buffer>();
let styles: Buffer;
test.beforeAll(() => {
  for (const variant of ["debug", "release", "website"]) {
    const defines = {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.NEXT_PUBLIC_APP_VERSION": JSON.stringify("v9.8.7"),
      "process.env.NEXT_PUBLIC_APP_TARGET": JSON.stringify(
        variant === "website" ? "browser" : "android",
      ),
      "process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT": JSON.stringify(
        variant === "release" ? "production" : "testing",
      ),
    };
    const script = execFileSync(
      "bun",
      [
        "-e",
        `
      const result=await Bun.build({entrypoints:['tools/e2e/support/prediction-details-harness.tsx'],target:'browser',minify:true,define:${JSON.stringify(defines)}});
      if(!result.success)throw Error(String(result.logs));process.stdout.write(await result.outputs[0].text());
    `,
      ],
      { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 },
    );
    scripts.set(variant, script);
  }
  const current = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
  const folder = resolve(current.directory, "out/_next/static/css");
  styles = Buffer.concat(
    readdirSync(folder)
      .filter((name) => name.endsWith(".css"))
      .map((name) => readFileSync(resolve(folder, name))),
  );
});

async function openDetails(page: Page, variant: string) {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "https://appassets.androidplatform.net")
      throw Error("Unexpected external fixture request");
    if (url.pathname === "/fixture.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: scripts.get(variant)!,
      });
    if (url.pathname === "/fixture.css")
      return route.fulfill({ contentType: "text/css", body: styles });
    return route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
    });
  });
  await page.goto("https://appassets.androidplatform.net/");
  await expect(page.getByText(UNCERTAIN_LABEL, { exact: true })).toBeVisible();
}

test("P01: Debug APK shows seven fresh-result scores without changing the rejected diagnosis", async ({
  page,
}) => {
  await openDetails(page, "debug");
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(7);
  await expect(table.locator("tbody tr").first()).toHaveText(
    "Healthy Leaf63.0000%",
  );
  await expect(
    page.getByText(translations.en.classProbabilityHeading, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bisaya", exact: true }).click();
  await expect(
    page.getByText(translations.bis.classProbabilityHeading, { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.predictionDetailsFixture.showSaved());
  await expect(table).toHaveCount(0);
  await expect(page.getByText(UNCERTAIN_LABEL, { exact: true })).toBeVisible();
});

for (const variant of ["release", "website"])
  test(`P02: ${variant} never renders score rows even when supplied`, async ({
    page,
  }) => {
    await openDetails(page, variant);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(
      page.getByText(translations.en.classProbabilityHeading, { exact: true }),
    ).toHaveCount(0);
  });
