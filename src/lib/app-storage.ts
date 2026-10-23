import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { isAndroidBuild, nativeRequest } from "@/lib/native-bridge";
import {
  findNativeScan,
  notifyStorageChange,
  readNativeGuidelines,
  readNativeScans,
} from "@/lib/native-storage";
import {
  sameGuidelineSnapshot,
  type GuidelineChange,
} from "@/lib/guidelines-sync";

/** The Android branch never opens IndexedDB or falls back after a native failure. */
export function readStoredScans(): Promise<ScanRecord[]> {
  if (isAndroidBuild()) return readNativeScans();
  return db.scans
    .orderBy("updated_at")
    .reverse()
    .filter((row) => row._status !== "pending-delete")
    .toArray();
}

export function findStoredScan(hash: string, modelVersion: string) {
  if (isAndroidBuild()) return findNativeScan(hash, modelVersion);
  return db.scans
    .where("image_hash")
    .equals(hash)
    .filter(
      (row) =>
        row._status !== "pending-delete" && row.model_version === modelVersion,
    )
    .first();
}

export function readStoredGuidelines(): Promise<DiseaseGuideline[]> {
  return isAndroidBuild() ? readNativeGuidelines() : db.guidelines.toArray();
}

/** Both storage engines compare the previous snapshot inside their write transaction. */
export async function replaceStoredGuidelines(
  rows: DiseaseGuideline[],
  baseline: DiseaseGuideline[],
  canWrite: () => boolean,
) {
  if (!canWrite()) return false;
  if (isAndroidBuild()) {
    const saved = await nativeRequest<boolean>("storage.guidelines.replace", {
      rows,
      expected: baseline,
    });
    if (saved) notifyStorageChange();
    return saved;
  }
  return db
    .transaction("rw", db.guidelines, async (transaction) => {
      const stored = await db.guidelines.toArray();
      if (!canWrite() || !sameGuidelineSnapshot(stored, baseline)) return false;
      if (sameGuidelineSnapshot(stored, rows)) return true;
      await db.guidelines.clear();
      await db.guidelines.bulkPut(rows);
      if (!canWrite()) transaction.abort();
      return true;
    })
    .catch((error) => {
      if (error?.name === "AbortError" && !canWrite()) return false;
      throw error;
    });
}

export async function applyStoredGuidelineChange(change: GuidelineChange) {
  if (isAndroidBuild()) {
    await nativeRequest("storage.guidelines.change", change);
    notifyStorageChange();
  } else if (change.type === "DELETE") await db.guidelines.delete(change.id);
  else await db.guidelines.put(change.guideline);
}
