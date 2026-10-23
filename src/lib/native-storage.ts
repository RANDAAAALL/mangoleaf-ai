import type { ScanRecord, DiseaseGuideline } from "@/lib/db";
import { nativeRequest } from "@/lib/native-bridge";

export type NativeRecord = Omit<ScanRecord, "image_blob"> & {
  photoUri?: string | null;
};
export type SerializedRecord = {
  record: Omit<ScanRecord, "image_blob">;
  image: { base64: string; mimeType: string } | null;
};
const listeners = new Set<() => void>();
let storageRevision = 0;

export function notifyStorageChange() {
  storageRevision++;
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      /* Storage completion must not depend on a view's listener. */
    }
  }
}

export function subscribeStorageChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Native photos are fetched only from the dedicated private local handler. */
export async function hydrateNativeRecord(
  record: NativeRecord,
): Promise<ScanRecord> {
  const { photoUri, ...metadata } = record;
  let imageBlob = new Blob();
  if (photoUri) {
    const url = new URL(photoUri, window.location.origin);
    if (
      url.origin !== "https://appassets.androidplatform.net" ||
      !/^\/_native\/photos\/[a-zA-Z0-9._-]+$/.test(url.pathname) ||
      url.search ||
      url.hash
    ) {
      throw new Error("Native photo path is invalid.");
    }
    const response = await fetch(url.href);
    if (!response.ok) throw new Error("Local photo could not be read.");
    imageBlob = await response.blob();
  }
  return { ...metadata, image_blob: imageBlob };
}

/** Transfer one bounded compressed photo; report lists never contain base64 photos. */
export async function serializeRecord(
  record: ScanRecord,
): Promise<SerializedRecord> {
  const { image_blob: image, ...metadata } = record;
  if (!(image instanceof Blob) || image.size === 0)
    return { record: metadata, image: null };
  if (image.size > 8 * 1024 * 1024)
    throw new Error("Local photo exceeds the supported transfer size.");
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 16_384) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 16_384));
  }
  return {
    record: metadata,
    image: {
      base64: btoa(binary),
      mimeType: image.type || "application/octet-stream",
    },
  };
}

// Reuse immutable private photo files for recent rows without retaining an unbounded Blob cache.
let historyPhotos = new Map<string, Blob>();
let historyRead: Promise<ScanRecord[]> | undefined;
const historyPhotoLimit = 64;
const historyPhotoBytes = 16 * 1024 * 1024;

async function readNativeHistory() {
  const rows = await nativeRequest<NativeRecord[]>("storage.report.list");
  const visible = rows.filter((row) => row._status !== "pending-delete");
  const nextPhotos = new Map<string, Blob>();
  let cachedBytes = 0;
  const result: ScanRecord[] = [];
  // Limit file concurrency; a missing photo must not hide otherwise-readable SQLite reports.
  for (let index = 0; index < visible.length; index += 4) {
    const batch = await Promise.all(
      visible.slice(index, index + 4).map(async (row) => {
        const { photoUri, ...metadata } = row;
        const cached = photoUri ? historyPhotos.get(photoUri) : undefined;
        if (cached) return { ...metadata, image_blob: cached };
        try {
          return await hydrateNativeRecord(row);
        } catch {
          return { ...metadata, image_blob: new Blob() };
        }
      }),
    );
    for (let offset = 0; offset < batch.length; offset++) {
      const record = batch[offset];
      const uri = visible[index + offset].photoUri;
      if (
        uri &&
        record.image_blob.size &&
        !nextPhotos.has(uri) &&
        nextPhotos.size < historyPhotoLimit &&
        cachedBytes + record.image_blob.size <= historyPhotoBytes
      ) {
        nextPhotos.set(uri, record.image_blob);
        cachedBytes += record.image_blob.size;
      }
      result.push(record);
    }
  }
  // Removed rows and unsuccessful reads are not retained; unavailable photos can retry next refresh.
  historyPhotos = nextPhotos;
  return result;
}

/** Collapse concurrent view refreshes; strict save/backup reads still validate their own local photo. */
export function readNativeScans() {
  historyRead ??= (async () => {
    // A consumer joining after a notification must not inherit an older in-flight snapshot.
    let revision: number;
    let rows: ScanRecord[];
    do {
      revision = storageRevision;
      rows = await readNativeHistory();
    } while (revision !== storageRevision);
    return rows;
  })().finally(() => {
    historyRead = undefined;
  });
  return historyRead;
}

export async function findNativeScan(hash: string, modelVersion: string) {
  const row = await nativeRequest<NativeRecord | null>(
    "storage.report.findByHash",
    { hash, modelVersion },
  );
  return row ? hydrateNativeRecord(row) : undefined;
}

export async function saveNativeScan(record: ScanRecord, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const payload = await serializeRecord(record);
  signal?.throwIfAborted();
  const row = await nativeRequest<NativeRecord>("storage.report.save", payload);
  notifyStorageChange();
  // A cancellation after native commit leaves this prepared ID available for retry.
  signal?.throwIfAborted();
  return hydrateNativeRecord(row);
}

export async function deleteNativeScans(ids: string[]) {
  await nativeRequest("storage.report.delete", { ids });
  notifyStorageChange();
}

export async function readNativeGuidelines() {
  return nativeRequest<DiseaseGuideline[]>("storage.guidelines.get");
}

export async function importNativeRecords(
  records: ScanRecord[],
  guidelines?: DiseaseGuideline[],
) {
  // Commit records separately to keep the bridge payload bounded. Existing IDs are immutable.
  let imported = 0;
  try {
    for (const record of records) {
      const result = await nativeRequest<{ imported?: number }>(
        "storage.import",
        { records: [await serializeRecord(record)] },
      );
      imported += result.imported ?? 0;
    }
    if (guidelines)
      await nativeRequest("storage.import", { records: [], guidelines });
  } finally {
    // A later conflict must not hide records committed earlier in this import.
    notifyStorageChange();
  }
  return imported;
}
