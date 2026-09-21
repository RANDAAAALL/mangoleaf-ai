import {
  test,
  expect,
  photos,
  openApp,
  runScan,
  closeDetails,
  records,
  nav,
  attachJson,
} from "./support/fixtures";
import { writeFileSync } from "node:fs";

test("R03: thirty-minute mixed-use session with fresh real predictions", async ({
  page,
}, info) => {
  const durationMs = 30 * 60_000;
  test.setTimeout(durationMs + 180_000);
  await openApp(page);
  const started = Date.now();
  const cycles: {
    file: string;
    durationMs: number;
    heapBytes: number | null;
  }[] = [];
  while (Date.now() - started < durationMs) {
    const photo = photos[cycles.length % photos.length];
    const cycleStart = Date.now();
    await runScan(page, photo.file);
    expect(await records(page)).toHaveLength(1);
    await closeDetails(page);
    await nav(page, "History");
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await closeDetails(page);
    // Delete this test record so the next upload must perform inference again.
    await expect
      .poll(async () =>
        (await records(page)).every((row) => row._status === "synced"),
      )
      .toBe(true);
    await page.getByTitle("Delete scan log").click();
    await expect.poll(async () => (await records(page)).length).toBe(0);
    await nav(page, "Home");
    if (cycles.length % 10 === 9) {
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Recent Scans" }),
      ).toBeVisible();
    }
    const heapBytes = await page.evaluate(
      () =>
        (performance as Performance & { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize ?? null,
    );
    cycles.push({
      file: photo.file,
      durationMs: Date.now() - cycleStart,
      heapBytes,
    });
    // Preserve useful partial evidence if a laptop or runner stops before 30 minutes.
    writeFileSync(
      info.outputPath("endurance-progress.json"),
      JSON.stringify(
        {
          plannedDurationMs: durationMs,
          elapsedMs: Date.now() - started,
          cycles,
        },
        null,
        2,
      ),
    );
    // A short pause models user reading time and avoids a tight stress loop.
    await page.waitForTimeout(1000);
  }
  await attachJson(info, "endurance", {
    plannedDurationMs: durationMs,
    elapsedMs: Date.now() - started,
    cycles,
  });
  expect(cycles.length).toBeGreaterThan(1);
});
