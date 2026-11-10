"use client";

import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import {
  androidApkDownloadHref,
  type AndroidRelease,
} from "@/lib/android-release";
import { loadCachedAndroidRelease } from "@/lib/android-release-cache";

const subscribeOrigin = () => () => {};
const readOrigin = () => window.location.origin;
const serverOrigin = () => null;

/** Repeated guide visits share validated metadata instead of spending a new API request per tap. */
export function useAndroidRelease(enabled = true) {
  const origin = useSyncExternalStore<string | null>(
    subscribeOrigin,
    readOrigin,
    serverOrigin,
  );
  const [state, setState] = useState<{
    checking: boolean;
    release: AndroidRelease | null;
  }>({ checking: true, release: null });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState((previous) => ({ ...previous, checking: true }));
    setAttempt((value) => value + 1);
  }, []);
  useEffect(() => {
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [retry]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadCachedAndroidRelease().then((release) => {
      if (active) setState({ checking: false, release });
    });
    return () => {
      active = false;
    };
  }, [enabled, attempt]);
  return {
    checking: enabled && state.checking,
    retry,
    release: enabled ? state.release : null,
    downloadHref:
      enabled && state.release
        ? androidApkDownloadHref(state.release, origin)
        : undefined,
  };
}
