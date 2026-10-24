"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchAndroidRelease,
  androidApkDownloadHref,
  type AndroidRelease,
} from "@/lib/android-release";

const subscribeOrigin = () => () => {};
const readOrigin = () => window.location.origin;
const serverOrigin = () => null;

/** Request only on the download screen; leaving it cancels the bounded request. */
export function useAndroidRelease() {
  const origin = useSyncExternalStore<string | null>(
    subscribeOrigin,
    readOrigin,
    serverOrigin,
  );
  const [state, setState] = useState<{
    checking: boolean;
    release: AndroidRelease | null;
  }>({ checking: true, release: null });
  useEffect(() => {
    const controller = new AbortController();
    void fetchAndroidRelease(controller.signal).then((release) => {
      if (!controller.signal.aborted) setState({ checking: false, release });
    });
    return () => controller.abort();
  }, []);
  return {
    ...state,
    downloadHref: state.release
      ? androidApkDownloadHref(state.release, origin)
      : undefined,
  };
}
