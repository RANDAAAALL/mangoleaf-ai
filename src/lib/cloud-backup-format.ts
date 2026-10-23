import type { ScanRecord } from "@/lib/db";

export const maximumBackupPhotoBytes = 8 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const hash = /^[a-f0-9]{64}$/;

export type BackupMetadata = Omit<ScanRecord, "image_blob">;
export type BackupRow = {
  owner_id: string;
  record_id: string;
  cloud_id: string;
  storage_path: string;
  photo_sha256: string;
  photo_bytes: number;
  photo_mime: "image/jpeg" | "image/webp";
  metadata: BackupMetadata;
  completed?: boolean;
};

export function backupScanRow(backup: BackupRow) {
  return {
    id: backup.cloud_id,
    owner_id: backup.owner_id,
    storage_path: backup.storage_path,
    image_url: null,
    disease_name: backup.metadata.disease_name,
    confidence: backup.metadata.confidence,
    model_version: backup.metadata.model_version ?? null,
    updated_at: backup.metadata.updated_at,
    // The legacy required column is a label, not authorization evidence.
    device_id: backup.owner_id,
  };
}

/** Existing schemas can store confidence as REAL. Compare its storage representation
 * only for parent-row retry recognition; the manifest keeps the full raw number. */
export function sameCloudScan(
  stored: Record<string, unknown>,
  expected: ReturnType<typeof backupScanRow>,
) {
  return Object.entries(expected).every(([key, value]) => {
    if (key === "confidence")
      return (
        typeof stored[key] === "number" &&
        Math.fround(stored[key]) === Math.fround(Number(value))
      );
    if (key === "updated_at")
      return Date.parse(String(stored[key])) === Date.parse(String(value));
    return stored[key] === value;
  });
}

/** Recovery codes are credentials, not device identifiers or public lookup keys. */
export function parseRecoveryCode(input: string) {
  const match = /^MLB1\.([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/.exec(
    input.trim(),
  );
  if (!match || !uuid.test(match[1]))
    throw new Error("Invalid recovery credential.");
  return {
    email: `${match[1]}@backup.mangoleaf.invalid`,
    password: match[2],
    code: match[0],
  };
}

export async function photoChecksum(photo: Blob) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await photo.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

/** Namespace cloud rows by their authenticated vault; original legacy UUIDs stay metadata. */
export async function backupCloudId(owner: string, originalId: string) {
  if (!uuid.test(owner) || !uuid.test(originalId))
    throw new Error("Invalid backup record identity.");
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`mangoleaf-backup-v1:${owner}:${originalId}`),
    ),
  );
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 0x80;
  bytes[8] = (bytes[8] & 63) | 0x80;
  const hex = Array.from(bytes, (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Preserve historical metadata while rejecting executable or malformed imported records. */
export function validateBackupMetadata(value: unknown): BackupMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid backup record.");
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    !uuid.test(row.id) ||
    typeof row.disease_name !== "string" ||
    !row.disease_name ||
    row.disease_name.length > 200 ||
    typeof row.confidence !== "number" ||
    !Number.isFinite(row.confidence) ||
    row.confidence < 0 ||
    row.confidence > 1 ||
    typeof row.updated_at !== "string" ||
    !Number.isFinite(Date.parse(row.updated_at)) ||
    row._status === "pending-delete" ||
    "image_blob" in row ||
    "photoUri" in row
  ) {
    throw new Error("Invalid backup record.");
  }
  for (const key of [
    "image_url",
    "image_hash",
    "model_version",
    "device_id",
    "owner_id",
    "cloud_id",
    "storage_path",
  ]) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      (typeof row[key] !== "string" || row[key].length > 2048)
    ) {
      throw new Error("Invalid backup metadata.");
    }
  }
  if (
    row._status !== undefined &&
    !["synced", "pending-insert", "local-only"].includes(String(row._status))
  )
    throw new Error("Invalid backup status.");
  if (JSON.stringify(row).length > 32_768)
    throw new Error("Backup metadata is too large.");
  return {
    ...row,
    image_url: typeof row.image_url === "string" ? row.image_url : null,
  } as BackupMetadata;
}

export async function prepareBackupRow(
  owner: string,
  record: ScanRecord,
): Promise<BackupRow> {
  if (!uuid.test(owner)) throw new Error("Invalid backup owner.");
  const { image_blob: photo, ...raw } = record;
  const metadata = validateBackupMetadata(raw);
  if (
    !(photo instanceof Blob) ||
    photo.size < 1 ||
    photo.size > maximumBackupPhotoBytes ||
    !["image/jpeg", "image/webp"].includes(photo.type)
  )
    throw new Error("Unsupported backup photo.");
  const cloudId = await backupCloudId(owner, record.id);
  return {
    owner_id: owner,
    record_id: record.id,
    cloud_id: cloudId,
    storage_path: `${owner}/${cloudId}.${photo.type === "image/webp" ? "webp" : "jpg"}`,
    photo_sha256: await photoChecksum(photo),
    photo_bytes: photo.size,
    photo_mime: photo.type as BackupRow["photo_mime"],
    metadata,
  };
}

export function validateBackupRow(value: unknown, owner: string): BackupRow {
  if (!value || typeof value !== "object")
    throw new Error("Invalid backup manifest.");
  const row = value as BackupRow;
  const metadata = validateBackupMetadata(row.metadata);
  if (
    !uuid.test(owner) ||
    row.owner_id !== owner ||
    row.record_id !== metadata.id ||
    !uuid.test(row.cloud_id) ||
    !hash.test(row.photo_sha256) ||
    !Number.isSafeInteger(row.photo_bytes) ||
    row.photo_bytes < 1 ||
    row.photo_bytes > maximumBackupPhotoBytes ||
    !["image/jpeg", "image/webp"].includes(row.photo_mime) ||
    row.storage_path !==
      `${owner}/${row.cloud_id}.${row.photo_mime === "image/webp" ? "webp" : "jpg"}`
  ) {
    throw new Error("Backup ownership or image identity differs.");
  }
  return {
    owner_id: row.owner_id,
    record_id: row.record_id,
    cloud_id: row.cloud_id,
    storage_path: row.storage_path,
    photo_sha256: row.photo_sha256,
    photo_bytes: row.photo_bytes,
    photo_mime: row.photo_mime,
    metadata,
    ...(typeof row.completed === "boolean" ? { completed: row.completed } : {}),
  };
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object")
    return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
    .join(",")}}`;
}

/** Retry succeeds only for the same immutable report and photo, never an upsert. */
export function sameBackup(left: BackupRow, right: BackupRow) {
  return (
    stableJson({
      ...validateBackupRow(left, right.owner_id),
      completed: undefined,
    }) ===
    stableJson({
      ...validateBackupRow(right, right.owner_id),
      completed: undefined,
    })
  );
}

export async function restoreBackupPhoto(
  row: BackupRow,
  owner: string,
  photo: Blob,
): Promise<ScanRecord> {
  const verified = validateBackupRow(row, owner);
  if (
    verified.cloud_id !== (await backupCloudId(owner, verified.record_id)) ||
    photo.size !== verified.photo_bytes ||
    (await photoChecksum(photo)) !== verified.photo_sha256
  ) {
    throw new Error("Backup photo failed integrity verification.");
  }
  // Metadata URLs remain historical strings. History displays this verified local Blob only.
  return {
    ...verified.metadata,
    image_blob: new Blob([photo], { type: verified.photo_mime }),
  };
}
