import { useSyncExternalStore } from "react";
import {
  getDiagnosticsServerSnapshot,
  getDiagnosticsSnapshot,
  subscribeDiagnostics,
} from "@/lib/diagnostics";

/** The recorder outlives About so modal and tab changes retain the same log. */
export function useDiagnostics() {
  return useSyncExternalStore(
    subscribeDiagnostics,
    getDiagnosticsSnapshot,
    getDiagnosticsServerSnapshot,
  );
}
