import type { Transaction } from "dexie";
import { db, type ScanRecord } from "@/lib/db";
import { modelVersion } from "@/lib/constants";

type LocalScanInput = {
  diseaseName: string;
  confidence: number;
  imageBlob: Blob;
  imageHash?: string;
};

/** Prepare once; quota recovery retries this exact ID without new inference. */
export function prepareLocalScan(input: LocalScanInput): ScanRecord {
  return {
    id: crypto.randomUUID(),
    disease_name: input.diseaseName,
    confidence: input.confidence,
    image_blob: input.imageBlob,
    image_url: null,
    image_hash: input.imageHash,
    model_version: modelVersion,
    updated_at: new Date().toISOString(),
    _status: "local-only",
  };
}

function samePreparedScan(stored: ScanRecord, prepared: ScanRecord) {
  return (
    stored._status !== "pending-delete" &&
    stored.disease_name === prepared.disease_name &&
    stored.confidence === prepared.confidence &&
    stored.image_hash === prepared.image_hash &&
    stored.model_version === prepared.model_version &&
    stored.updated_at === prepared.updated_at &&
    stored.image_blob.size === prepared.image_blob.size &&
    stored.image_blob.type === prepared.image_blob.type
  );
}

/** A committed retry returns its existing report; a conflicting ID never overwrites. */
export async function saveLocalScan(
  record: ScanRecord,
  signal?: AbortSignal,
): Promise<ScanRecord> {
  signal?.throwIfAborted();
  let transaction: Transaction | null = null;
  const onAbort = () => {
    try {
      transaction?.abort();
    } catch {
      // A transaction may already have committed before completion is delivered.
      // Retrying this prepared ID finds that report instead of adding another.
    }
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    return await db.transaction("rw", db.scans, async (activeTransaction) => {
      transaction = activeTransaction;
      // Opening the database can itself outlast a cancellation or deadline.
      signal?.throwIfAborted();
      const existing = await db.scans.get(record.id);
      signal?.throwIfAborted();
      if (existing) {
        if (!samePreparedScan(existing, record)) {
          throw new Error("Prepared scan ID belongs to a different report.");
        }
        return existing;
      }
      await db.scans.add(record);
      signal?.throwIfAborted();
      return record;
    });
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Delete local rows immediately; no cloud queue or network retry is involved. */
export async function deleteLocalScans(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return;
  await db.scans.bulkDelete(uniqueIds);
}

/** Dexie can wrap a native quota exception in inner/cause errors. */
export function isStorageQuotaError(error: unknown): boolean {
  const pending: unknown[] = [error];
  const seen = new Set<object>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const wrapped = current as {
      name?: unknown;
      inner?: unknown;
      cause?: unknown;
    };
    if (wrapped.name === "QuotaExceededError") return true;
    pending.push(wrapped.inner, wrapped.cause);
  }
  return false;
}
