import { useEffect, useState } from "react";
import { initializeNativeRuntime, isAndroidBuild } from "@/lib/native-bridge";
import { parseAndroidVersion } from "@/lib/android-version.mjs";

/** Reuse cached native initialization; a website or unavailable host never invents an installed version. */
export function useAndroidVersion() {
  const [version, setVersion] = useState<string>();
  useEffect(() => {
    if (!isAndroidBuild()) return;
    let active = true;
    void initializeNativeRuntime()
      .then((info) => {
        if (active) setVersion(parseAndroidVersion(info.hostVersionName));
      })
      .catch(() => {
        // The existing app startup owns bridge errors; version display must not interrupt it.
      });
    return () => {
      active = false;
    };
  }, []);
  return version;
}
