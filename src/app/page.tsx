"use client";

import dynamic from "next/dynamic";
import { isAndroidBuild } from "@/lib/native-bridge";
import { BrowserLanding } from "@/components/layout/browser-landing";
import { SplashScreen } from "@/components/layout/splash-screen";

// Only APK bundles mount the scanner, storage queries, diagnostics and backup worker.
// A missing native bridge still follows the APK runtime's fail-closed handling.
const Application = dynamic(
  () =>
    import("@/components/layout/application").then(
      (module) => module.Application,
    ),
  { loading: () => <SplashScreen /> },
);

export default function Home() {
  return isAndroidBuild() ? <Application /> : <BrowserLanding />;
}
