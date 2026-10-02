import type { ScanRecord } from "@/lib/db";

/** Paths are generated from verified session ownership, never an old URL. */
export function scanStoragePath(ownerId: string, cloudId: string, blob: Blob) {
  return `${ownerId}/${cloudId}.${blob.type === "image/webp" ? "webp" : "jpg"}`;
}

export function isOwnScanStoragePath(
  path: string | undefined,
  ownerId: string,
  cloudId: string,
): path is string {
  return (
    path === `${ownerId}/${cloudId}.webp` ||
    path === `${ownerId}/${cloudId}.jpg`
  );
}

/** A previous guest's queue must never be transferred to a new identity. */
export function canSyncScan(scan: ScanRecord, ownerId: string) {
  return !scan.owner_id || scan.owner_id === ownerId;
}
