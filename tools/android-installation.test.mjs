import { expect, test } from "bun:test";
import {
  androidApplicationId,
  androidLaunchLink,
  confirmsAndroidInstallation,
} from "../src/lib/android-installation";

test("only an exact native package from the related-app API confirms installation", async () => {
  for (const apps of [
    [],
    null,
    {},
    [{ platform: "webapp", id: androidApplicationId }],
    [{ platform: "play", id: `${androidApplicationId}.other` }],
    [{ platform: "play", id: androidApplicationId.toUpperCase() }],
  ])
    expect(
      await confirmsAndroidInstallation({
        getInstalledRelatedApps: async () => apps,
      }),
    ).toBe(false);
  expect(
    await confirmsAndroidInstallation({
      getInstalledRelatedApps: async () => [
        { platform: "play", id: androidApplicationId },
      ],
    }),
  ).toBe(true);
});

test("unsupported, failed and unsettled checks remain unknown without blocking the guide", async () => {
  expect(await confirmsAndroidInstallation({})).toBe(false);
  expect(
    await confirmsAndroidInstallation({
      get getInstalledRelatedApps() {
        throw new Error("Unavailable");
      },
    }),
  ).toBe(false);
  expect(
    await confirmsAndroidInstallation({
      getInstalledRelatedApps: async () => {
        throw new DOMException("Unavailable", "SecurityError");
      },
    }),
  ).toBe(false);
  // A browser API that never settles must not keep the install UI waiting indefinitely.
  expect(
    await confirmsAndroidInstallation({
      getInstalledRelatedApps: () => new Promise(() => {}),
    }),
  ).toBe(false);
});

test("launch intent fixes the package and discards all incoming query/hash paths", () => {
  const link = androidLaunchLink(
    "https://mangoleafai.vercel.app/?package=evil#Intent;scheme=evil",
  );
  expect(link).toBe(
    `intent://open#Intent;scheme=mangoleaf;package=${androidApplicationId};S.browser_fallback_url=${encodeURIComponent("https://mangoleafai.vercel.app/download")};end`,
  );
});
