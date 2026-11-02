import { expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { translations, type Language } from "../../../src/lib/translations";

import type { BackupFixtureControls } from "./backup-cloud-fixture";

declare global {
  interface Window {
    backupRestoreUi: BackupFixtureControls;
    nativeFixture: {
      exportRequests: number;
      finishExport(completed: boolean): void;
    };
  }
}

const origin = "https://appassets.androidplatform.net";
export const sourceCode = `MLB1.22222222-2222-4222-8222-222222222222.${"A".repeat(43)}`;
export const receivingCode = `MLB1.11111111-1111-4111-8111-111111111111.${"B".repeat(43)}`;
export const wrongCode = `MLB1.22222222-2222-4222-8222-222222222222.${"C".repeat(43)}`;
let script: Buffer;
let productionScript: Buffer;
let styles: Buffer;

// Only UI state is controlled here. SDK/native tests separately prove copy isolation and counting.
const cloudFixture = readFileSync(
  resolve("tools/e2e/support/backup-cloud-fixture.ts"),
  "utf8",
);

export function prepareBackupHarness() {
  for (const environment of ["testing", "production"] as const)
    execFileSync(
      "bun",
      [
        "-e",
        `
    const contents=${JSON.stringify(cloudFixture)};let replacements=0;
    const r=await Bun.build({entrypoints:['tools/e2e/support/backup-restore-harness.tsx'],target:'browser',
      plugins:[{name:'backup-ui-only',setup(build){build.onLoad({filter:/cloud-backup[.]ts$/},()=>{replacements++;return{loader:'ts',contents}})}}],
      define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_APP_TARGET':'"android"',
        'process.env.NEXT_PUBLIC_APP_VERSION':'"v9.8.7"',
        'process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT':${JSON.stringify(JSON.stringify(environment))},
        'process.env.NEXT_PUBLIC_SUPABASE_URL':${JSON.stringify(JSON.stringify(environment === "testing" ? "https://ajwlojaclehxupntnsve.supabase.co" : "https://uuvvvoznajjqknedxpdg.supabase.co"))}}});
    if(!r.success||replacements!==1)throw Error('Expected one controlled cloud module: '+replacements+'; '+String(r.logs));
    await Bun.write('.tools/backup-restore-harness-${environment}.js',r.outputs[0]);
  `,
      ],
      { cwd: process.cwd(), stdio: "pipe" },
    );
  script = readFileSync(resolve(".tools/backup-restore-harness-testing.js"));
  productionScript = readFileSync(
    resolve(".tools/backup-restore-harness-production.js"),
  );
  expect(script.includes(Buffer.from("backupRestoreUi"))).toBe(true);
  const build = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
  const css = resolve(build.directory, "out/_next/static/css");
  styles = Buffer.concat(
    readdirSync(css)
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(resolve(css, file))),
  );
}

export async function openBackupHarness(
  page: Page,
  language: Language,
  flags = "",
) {
  await page.unrouteAll({ behavior: "wait" });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin)
      throw Error("Backup UI fixture attempted external traffic.");
    if (url.pathname === "/fixture.js")
      await route.fulfill({
        contentType: "text/javascript",
        body: flags.includes("production") ? productionScript : script,
      });
    else if (url.pathname === "/fixture.css")
      await route.fulfill({ contentType: "text/css", body: styles });
    else if (url.pathname === "/")
      await route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
      });
    else await route.abort();
  });
  await page.addInitScript(() => {
    const state = window as unknown as {
      MangoLeafNative: {
        postMessage: (raw: string) => void;
        onmessage?: (message: { data: string }) => void;
      };
    };
    const exports: ((completed: boolean) => void)[] = [];
    window.nativeFixture = {
      exportRequests: 0,
      finishExport: (completed) => exports.shift()?.(completed),
    };
    state.MangoLeafNative = {
      postMessage(raw) {
        const request = JSON.parse(raw);
        if (request.method === "diagnostics.export") {
          window.nativeFixture.exportRequests++;
          const complete = (completed: boolean) =>
            state.MangoLeafNative.onmessage?.({
              data: JSON.stringify({ id: request.id, result: completed }),
            });
          if (new URLSearchParams(location.search).has("hold-export"))
            exports.push(complete);
          else queueMicrotask(() => complete(true));
          return;
        }
        if (request.method !== "app.info")
          throw Error("Unexpected native operation in layout fixture");
        queueMicrotask(() =>
          state.MangoLeafNative.onmessage?.({
            data: JSON.stringify({
              id: request.id,
              result: {
                bridgeVersion: 1,
                schemaVersion: 1,
                cloudEnvironment: new URLSearchParams(location.search).has(
                  "production",
                )
                  ? "production"
                  : "testing",
                hostVersionName: new URLSearchParams(location.search).has(
                  "production",
                )
                  ? "0.1.9"
                  : "0.1.9-dev",
                connected: true,
                validated: !new URLSearchParams(location.search).has("offline"),
              },
            }),
          }),
        );
      },
    };
  });
  await page.goto(`${origin}/?${language === "bis" ? "bis&" : ""}${flags}`);
  await expect
    .poll(() => page.evaluate(() => typeof window.backupRestoreUi?.snapshot), {
      timeout: 3000,
      message: "The controlled backup UI module must load",
    })
    .toBe("function");
  await expect(
    page.getByRole("heading", {
      name: flags.includes("settings")
        ? translations[language].navSettings
        : translations[language].backupTitle,
      exact: true,
    }),
  ).toBeVisible();
}
