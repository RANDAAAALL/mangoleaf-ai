"use client";

import { useSyncExternalStore } from "react";
import { connectionHint, subscribeConnection } from "@/lib/native-bridge";

const serverSnapshot = () => false;

/** Observe validated native connectivity without starting Auth or private transfers. */
export function useConnectionStatus() {
  return useSyncExternalStore(
    subscribeConnection,
    connectionHint,
    serverSnapshot,
  );
}
