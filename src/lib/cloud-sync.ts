import { db, type ScanRecord } from "@/lib/db";
import { supabase } from "@/lib/supabase-client";
import { peekCloudOwnerId } from "@/lib/cloud-session";
import {
  canSyncScan,
  isOwnScanStoragePath,
  scanStoragePath,
} from "@/lib/cloud-scan";

function assertCurrentOwner(ownerId: string) {
  if (peekCloudOwnerId() !== ownerId) {
    throw new Error("Cloud guest identity changed during synchronization.");
  }
}

async function removePrivateScan(scan: ScanRecord, ownerId: string) {
  assertCurrentOwner(ownerId);
  const cloudId = scan.cloud_id || scan.id;
  const { error } = await supabase
    .from("scans")
    .delete()
    .eq("id", cloudId)
    .eq("owner_id", ownerId);
  if (error) throw error;
  assertCurrentOwner(ownerId);
  // Retain the local tombstone if object cleanup fails, even after row deletion.
  const paths = [`${ownerId}/${cloudId}.webp`, `${ownerId}/${cloudId}.jpg`];
  const { error: storageError } = await supabase.storage
    .from("scans")
    .remove(paths);
  if (storageError) throw storageError;
  assertCurrentOwner(ownerId);
  await db.scans.delete(scan.id);
}

async function insertPrivateScan(snapshot: ScanRecord, ownerId: string) {
  const scan = await db.transaction("rw", db.scans, async () => {
    const current = await db.scans.get(snapshot.id);
    assertCurrentOwner(ownerId);
    if (!current || current._status !== "pending-insert") return null;
    if (!canSyncScan(current, ownerId)) return null;
    const claimed = {
      ...current,
      owner_id: ownerId,
      cloud_id: current.cloud_id || current.id,
    };
    await db.scans.put(claimed);
    return claimed;
  });
  if (!scan) return;
  assertCurrentOwner(ownerId);
  const cloudId = scan.cloud_id;
  let path = scan.storage_path;
  if (!isOwnScanStoragePath(path, ownerId, cloudId)) {
    if (scan.image_blob.size === 0) {
      assertCurrentOwner(ownerId);
      await db.scans.update(scan.id, { _status: "local-only" });
      return;
    }
    path = scanStoragePath(ownerId, cloudId, scan.image_blob);
    const { error } = await supabase.storage
      .from("scans")
      .upload(path, scan.image_blob, {
        contentType: scan.image_blob.type || "image/jpeg",
        upsert: true,
      });
    if (error) throw error;
    assertCurrentOwner(ownerId);
    const saved = await db.scans.update(scan.id, {
      storage_path: path,
      image_url: null,
    });
    if (!saved) {
      assertCurrentOwner(ownerId);
      // The user removed the local record while the request was in flight.
      await supabase.storage.from("scans").remove([path]);
      return;
    }
  }
  const current = await db.scans.get(scan.id);
  assertCurrentOwner(ownerId);
  if (
    !current ||
    current._status !== "pending-insert" ||
    current.owner_id !== ownerId
  )
    return;

  const { error } = await supabase.from("scans").insert({
    id: cloudId,
    owner_id: ownerId,
    storage_path: path,
    image_url: null,
    disease_name: current.disease_name,
    confidence: current.confidence,
    image_hash: current.image_hash || null,
    model_version: current.model_version || null,
    device_id: current.device_id,
    updated_at: current.updated_at,
  });
  if (error) {
    assertCurrentOwner(ownerId);
    if (error.code !== "23505") throw error;
    // A successful insert whose response was lost is safe to acknowledge only
    // when the same verified guest can read the exact cloud object reference.
    const { data, error: lookupError } = await supabase
      .from("scans")
      .select("id,owner_id,storage_path")
      .eq("id", cloudId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (lookupError || !data || data.storage_path !== path) throw error;
    assertCurrentOwner(ownerId);
  }
  await db.transaction("rw", db.scans, async () => {
    const latest = await db.scans.get(scan.id);
    assertCurrentOwner(ownerId);
    // Deleting during upload/insert must not resurrect the scan in History.
    if (latest?._status === "pending-insert" && latest.owner_id === ownerId) {
      await db.scans.update(scan.id, { _status: "synced", image_url: null });
    }
  });
}

/** Returns true while retryable private mutations remain queued. */
export async function flushOwnedScans(ownerId: string): Promise<boolean> {
  assertCurrentOwner(ownerId);
  const pending = await db.scans
    .where("_status")
    .anyOf(["pending-insert", "pending-delete"])
    .toArray();
  for (const snapshot of pending) {
    try {
      const scan = await db.scans.get(snapshot.id);
      assertCurrentOwner(ownerId);
      if (!scan) continue;
      if (!canSyncScan(scan, ownerId)) {
        // Session loss must not grant a replacement guest the previous cloud
        // copy. Local data remains readable; a local delete stays local only.
        if (scan._status === "pending-delete") await db.scans.delete(scan.id);
        else await db.scans.update(scan.id, { _status: "local-only" });
      } else if (scan._status === "pending-delete") {
        if (scan.owner_id) await removePrivateScan(scan, ownerId);
        else await db.scans.delete(scan.id);
      } else if (scan._status === "pending-insert") {
        await insertPrivateScan(scan, ownerId);
      }
    } catch (error) {
      // A stale task must stop before touching any other unclaimed local rows.
      assertCurrentOwner(ownerId);
      console.warn("Private scan mutation deferred:", error);
    }
  }
  return (
    (await db.scans
      .where("_status")
      .anyOf(["pending-insert", "pending-delete"])
      .count()) > 0
  );
}

type RemoteScan = {
  id: string;
  owner_id: string;
  storage_path: string;
  disease_name: string;
  confidence: number;
  image_hash: string | null;
  model_version: string | null;
  updated_at: string;
  device_id: string;
};

/** Read only the current guest's rows; cache private image bytes for offline use. */
export async function pullOwnedScans(ownerId: string): Promise<boolean> {
  assertCurrentOwner(ownerId);
  const { data, error } = await supabase
    .from("scans")
    .select(
      "id,owner_id,storage_path,disease_name,confidence,image_hash,model_version,updated_at,device_id",
    )
    .eq("owner_id", ownerId);
  if (error) throw error;
  assertCurrentOwner(ownerId);
  if (!data?.length) return true;
  const remoteScans = data as RemoteScan[];
  const cloudIds = remoteScans.map((scan) => scan.id);
  const local = await db.scans.where("cloud_id").anyOf(cloudIds).toArray();
  assertCurrentOwner(ownerId);
  const byCloudId = new Map(local.map((scan) => [scan.cloud_id, scan]));
  let downloadedAll = true;
  for (const remote of remoteScans) {
    assertCurrentOwner(ownerId);
    if (
      remote.owner_id !== ownerId ||
      !isOwnScanStoragePath(remote.storage_path, ownerId, remote.id)
    ) {
      downloadedAll = false;
      continue;
    }
    const existing = byCloudId.get(remote.id);
    if (
      existing?._status === "pending-delete" ||
      existing?._status === "local-only"
    )
      continue;
    if (existing && existing.image_blob.size > 0) continue;

    const { data: image, error: downloadError } = await supabase.storage
      .from("scans")
      .download(remote.storage_path);
    assertCurrentOwner(ownerId);
    if (downloadError) downloadedAll = false;
    await db.transaction("rw", db.scans, async () => {
      const localId = existing?.id || remote.id;
      const latest = await db.scans.get(localId);
      assertCurrentOwner(ownerId);
      if (existing && !latest) return;
      if (
        latest &&
        (latest._status !== "synced" || latest.owner_id !== ownerId)
      )
        return;
      // Recheck after downloading: a user may have deleted this scan while its
      // photo was loading. Never replace their tombstone with the remote row.
      await db.scans.put({
        id: localId,
        cloud_id: remote.id,
        owner_id: ownerId,
        storage_path: remote.storage_path,
        disease_name: remote.disease_name,
        confidence: remote.confidence,
        image_blob: image || latest?.image_blob || new Blob(),
        image_url: null,
        image_hash: remote.image_hash || undefined,
        model_version: remote.model_version || undefined,
        updated_at: remote.updated_at,
        device_id: remote.device_id,
        _status: "synced",
      });
    });
  }
  return downloadedAll;
}

/** Serialize private requests across open tabs without delaying local actions. */
export async function syncPrivateScans(ownerId: string): Promise<boolean> {
  const work = async () => {
    // A tab can acquire this lock after its previous guest was replaced.
    assertCurrentOwner(ownerId);
    const hasPending = await flushOwnedScans(ownerId);
    const pulled = await pullOwnedScans(ownerId);
    return !hasPending && pulled;
  };
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("mangoleaf-private-sync", work);
  }
  return work();
}
