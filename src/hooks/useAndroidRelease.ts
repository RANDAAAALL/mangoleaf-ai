"use client";

import { useEffect, useState } from "react";
import {
  fetchAndroidRelease,
  type AndroidRelease,
} from "@/lib/android-release";

/** Request only on the download screen; leaving it cancels the bounded request. */
export function useAndroidRelease() {
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
  return state;
}
