import type { Transaction } from "dexie";
import { db, type ScanRecord } from "@/lib/db";
import { modelVersion } from "@/lib/constants";
import {
  createDiagnosticOperation,
  diagnosticErrorName,
  recordDiagnostic,
} from "@/lib/diagnostics";

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
  const operation = createDiagnosticOperation("save");
  const started = performance.now();
  recordDiagnostic("database.save.started", { operation });
  let transaction: Transaction | null = null;
  const onAbort = () => {
    recordDiagnostic("database.save.abort-requested", { operation });
    try {
      transaction?.abort();
    } catch {
      // A transaction may already have committed before completion is delivered.
      // Retrying this prepared ID finds that report instead of adding another.
    }
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const saved = await db.transaction(
      "rw",
      db.scans,
      async (activeTransaction) => {
        transaction = activeTransaction;
        recordDiagnostic("database.save.transaction-entered", { operation });
        // Opening the database can itself outlast a cancellation or deadline.
        signal?.throwIfAborted();
        const existing = await db.scans.get(record.id);
        signal?.throwIfAborted();
        if (existing) {
          if (!samePreparedScan(existing, record)) {
            throw new Error("Prepared scan ID belongs to a different report.");
          }
          recordDiagnostic("database.save.existing-returned", { operation });
          return existing;
        }
        await db.scans.add(record);
        signal?.throwIfAborted();
        return record;
      },
    );
    // The transaction promise has settled; an individual add request is not a commit.
    recordDiagnostic("database.save.completed", {
      operation,
      durationMs: Math.round(performance.now() - started),
    });
    return saved;
  } catch (error) {
    recordDiagnostic("database.save.failed", {
      operation,
      errorName: diagnosticErrorName(error),
      durationMs: Math.round(performance.now() - started),
    });
    throw error;
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Delete local rows immediately; no cloud queue or network retry is involved. */
export async function deleteLocalScans(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return;
  const operation = createDiagnosticOperation("delete");
  const started = performance.now();
  recordDiagnostic("database.delete.started", {
    operation,
    count: uniqueIds.length,
  });
  try {
    await db.scans.bulkDelete(uniqueIds);
    recordDiagnostic("database.delete.completed", {
      operation,
      count: uniqueIds.length,
      durationMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    recordDiagnostic("database.delete.failed", {
      operation,
      errorName: diagnosticErrorName(error),
      durationMs: Math.round(performance.now() - started),
    });
    throw error;
  }
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
