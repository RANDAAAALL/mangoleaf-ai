import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { isAndroidBuild } from "@/lib/native-bridge";
import {
  subscribeStorageChange,
  type StorageScope,
} from "@/lib/native-storage";
import { observeStorageQuery } from "@/lib/storage-query";

/** Browser queries observe Dexie; native queries refresh after committed SQLite operations. */
export function useStorageQuery<T>(
  query: () => Promise<T>,
  scope: StorageScope = "all",
) {
  const [state, setState] = useState<{ data?: T; error?: Error }>({});
  useEffect(() => {
    if (!isAndroidBuild()) {
      const subscription = liveQuery(query).subscribe({
        next: (data) => setState({ data }),
        error: () =>
          setState({ error: new Error("Local storage could not be read.") }),
      });
      return () => subscription.unsubscribe();
    }
    return observeStorageQuery(
      query,
      (changed) => subscribeStorageChange(changed, scope),
      (data) => setState({ data }),
      () => setState({ error: new Error("Local storage could not be read.") }),
    );
  }, [query, scope]);
  return state;
}
