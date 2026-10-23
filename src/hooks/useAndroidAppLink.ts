"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isAndroidBuild } from "@/lib/native-bridge";
import {
  androidLaunchLink,
  readAndroidInstallation,
} from "@/lib/android-installation";

// Origin and browser identity are stable during this document's lifetime; there is no changing store to watch.
const subscribe = () => () => {};
const serverSnapshot = () => null;

function appLink() {
  if (isAndroidBuild() || !/Android/i.test(navigator.userAgent)) return null;
  return androidLaunchLink(window.location.origin);
}

/** Installation is a browser hint, independent of native storage/Auth and never an authorization signal. */
export function useAndroidAppLink() {
  const href = useSyncExternalStore(subscribe, appLink, serverSnapshot);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (!href) return;
    let active = true;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      void readAndroidInstallation().then((value) => {
        if (active) setInstalled(value);
      });
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
    };
  }, [href]);
  return { href, installed };
}
