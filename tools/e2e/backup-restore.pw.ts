import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { translations, type Language } from "../../src/lib/translations";

declare global {
  interface Window {
    backupRestoreUi: {
      snapshot(): {
        code: string | null;
        enabled: boolean;
        restored: number;
        inputs: (string | null)[];
        toggles: boolean[];
      };
    };
  }
}

const origin = "https://appassets.androidplatform.net";
const sourceCode = `MLB1.22222222-2222-4222-8222-222222222222.${"A".repeat(43)}`;
const receivingCode = `MLB1.11111111-1111-4111-8111-111111111111.${"B".repeat(43)}`;
let script: Buffer;
let styles: Buffer;

// Only UI state is controlled here. SDK/native tests separately prove copy isolation and counting.
const cloudFixture = String.raw`
const query=new URLSearchParams(location.search),fresh=query.has('fresh');
const source='MLB1.22222222-2222-4222-8222-222222222222.'+'A'.repeat(43);
const own='MLB1.11111111-1111-4111-8111-111111111111.'+'B'.repeat(43);
const state={code:fresh?null:own,enabled:!fresh&&!query.has('paused'),restored:0,inputs:[],toggles:[]};
let failed=false;
window.backupRestoreUi={snapshot:()=>({...state,inputs:[...state.inputs],toggles:[...state.toggles]})};
export async function backupPreferences(){return{hasCode:!!state.code,enabled:state.enabled}}
export async function savedRecoveryCode(){return state.code}
export async function createBackupVault(){throw Error('This UI case must use Restore')}
export async function setBackupEnabled(value){state.enabled=value;state.toggles.push(value)}
export async function restoreCloudBackup(input){
  state.inputs.push(input??null);
  if(input!==undefined&&input!==source)throw Error('controlled invalid source');
  if(!state.code){state.code=own;state.enabled=true}
  if(query.has('photo-error')&&!failed){failed=true;state.restored=1;throw Error('controlled later photo failure')}
  const count=state.restored?0:Number(query.get('count')||2);state.restored+=count;return count;
}
`;

test.beforeAll(() => {
  execFileSync(
    "bun",
    [
      "-e",
      `
    const contents=${JSON.stringify(cloudFixture)};let replacements=0;
    const r=await Bun.build({entrypoints:['tools/e2e/support/backup-restore-harness.tsx'],target:'browser',
      plugins:[{name:'backup-ui-only',setup(build){build.onLoad({filter:/cloud-backup[.]ts$/},()=>{replacements++;return{loader:'js',contents}})}}],
      define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_APP_TARGET':'"android"',
        'process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT':'"testing"',
        'process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://ajwlojaclehxupntnsve.supabase.co"'}});
    if(!r.success||replacements!==1)throw Error('Expected one controlled cloud module: '+replacements+'; '+String(r.logs));
    await Bun.write('.tools/backup-restore-harness.js',r.outputs[0]);
  `,
    ],
    { cwd: process.cwd(), stdio: "pipe" },
  );
  script = readFileSync(resolve(".tools/backup-restore-harness.js"));
  expect(script.includes(Buffer.from("backupRestoreUi"))).toBe(true);
  const build = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
  const css = resolve(build.directory, "out/_next/static/css");
  styles = Buffer.concat(
    readdirSync(css)
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(resolve(css, file))),
  );
});

async function openHarness(page: Page, language: Language, flags = "") {
  await page.unrouteAll({ behavior: "wait" });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin)
      throw Error("Backup UI fixture attempted external traffic.");
    if (url.pathname === "/fixture.js")
      await route.fulfill({ contentType: "text/javascript", body: script });
    else if (url.pathname === "/fixture.css")
      await route.fulfill({ contentType: "text/css", body: styles });
    else if (url.pathname === "/")
      await route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
      });
    else await route.abort();
  });
  await page.goto(`${origin}/?${language === "bis" ? "bis&" : ""}${flags}`);
  await expect
    .poll(() => page.evaluate(() => typeof window.backupRestoreUi?.snapshot), {
      timeout: 3000,
      message: "The controlled backup UI module must load",
    })
    .toBe("function");
  await expect(
    page.getByRole("heading", { name: translations[language].backupTitle }),
  ).toBeVisible();
}

async function restoreSource(
  page: Page,
  language: Language,
  code = sourceCode,
) {
  const t = translations[language];
  await page
    .getByRole("button", { name: t.backupEnterCode, exact: true })
    .click();
  const input = page.getByLabel(t.backupRestoreCodeLabel, { exact: true });
  await expect(input).toBeFocused();
  await input.fill(code);
  await page
    .getByRole("button", { name: t.backupRestore, exact: true })
    .click();
}

test("B01: restoring copies keeps an existing receiving code and Pause choice in both languages", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "paused");
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestored.replace("{n}", "2"),
    );
    await expect(page.getByText(t.backupPaused, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: t.backupShowCode, exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveValue(receivingCode);
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      enabled: false,
      restored: 2,
      inputs: [sourceCode],
    });
    await page
      .getByRole("button", { name: t.backupResume, exact: true })
      .click();
    await page
      .getByRole("button", { name: t.backupPause, exact: true })
      .click();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot().toggles),
    ).toEqual([true, false]);
  }
});

test("B02: a fresh receiver reveals its newly created own code after Restore in both languages", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "fresh");
    await expect(
      page.getByRole("button", { name: t.backupCreate, exact: true }),
    ).toBeVisible();
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestored.replace("{n}", "2"),
    );
    const code = page.getByRole("textbox", {
      name: t.backupRecoveryLabel,
      exact: true,
    });
    await expect(code).toHaveValue(receivingCode);
    await expect(code).toHaveAttribute("readonly", "");
    await expect(
      page.getByText(t.backupRecoveryHint, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(t.backupEnabled, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot().code),
    ).not.toBe(sourceCode);
  }
});

test("B03: later photo failure still reveals the new receiving code and retains source input for retry", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "fresh&photo-error");
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(t.backupError);
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveValue(receivingCode);
    await expect(
      page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
    ).toHaveValue(sourceCode);
    await expect(
      page.getByText(t.backupEnabled, { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      restored: 1,
      enabled: true,
    });
  }
});

test("B04: successful first and duplicate restores use singular and zero-count translations", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "count=1");
    await restoreSource(page, language);
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestoredSingle.replace("{n}", "1"),
    );
    await page
      .getByRole("button", { name: t.backupRestore, exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(
      t.backupRestored.replace("{n}", "0"),
    );
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      restored: 1,
      inputs: [sourceCode, null],
    });
  }
});

test("B05: wrong source preserves typed input and the receiving code/Pause settings", async ({
  page,
}) => {
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    await openHarness(page, language, "paused");
    await restoreSource(page, language, "wrong synthetic source");
    await expect(page.getByRole("status")).toHaveText(t.backupError);
    await expect(
      page.getByLabel(t.backupRestoreCodeLabel, { exact: true }),
    ).toHaveValue("wrong synthetic source");
    await page
      .getByRole("button", { name: t.backupShowCode, exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: t.backupRecoveryLabel, exact: true }),
    ).toHaveValue(receivingCode);
    await expect(
      page.getByRole("button", { name: t.backupResume, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => window.backupRestoreUi.snapshot()),
    ).toMatchObject({
      code: receivingCode,
      enabled: false,
      restored: 0,
      toggles: [],
    });
  }
});
