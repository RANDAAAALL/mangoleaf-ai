import Dexie, { type Table } from "dexie";

export interface ScanRecord {
  id: string; // UUID
  disease_name: string; // e.g. "Anthracnose", "Healthy Leaf", "Healthy Fruit", or a saved older "Healthy"
  confidence: number; // e.g. 0.92 (92%)
  image_blob: Blob; // The raw binary photo captured by mobile camera (used for offline display)
  image_url: string | null; // Preserved legacy link only; new private photos use storage_path.
  image_hash?: string; // Unique SHA-256 binary hash of the photo for duplicate prevention
  model_version?: string; // Local model label; keeps trial reports out of another model's duplicate lookup
  updated_at: string; // ISO Timestamp
  device_id: string; // Unique mobile/browser device ID
  owner_id?: string; // Verified guest session that owns the cloud copy, never the device ID.
  cloud_id?: string; // Separate cloud UUID lets a legacy pending local scan keep its local ID.
  storage_path?: string; // Private bucket path; photo bytes remain in image_blob for offline use.
  // Says whether the local row matches Supabase or still owes it a change.
  _status?: "synced" | "pending-insert" | "pending-delete" | "local-only";
}

export interface DiseaseGuideline {
  id: string; // primary key e.g., "anthracnose", "sooty_mold"
  disease_name: string; // e.g. "Anthracnose"
  guidelines_en: string; // English pre-written treatment rules
  guidelines_bis: string; // Bisaya pre-written treatment rules
}

class MangoLeafDB extends Dexie {
  scans!: Table<ScanRecord>;
  guidelines!: Table<DiseaseGuideline>;

  constructor() {
    super("MangoLeafDB");
    // Listed fields are the indexes, not the whole row. image_hash is indexed
    // so a duplicate photo can be found without reading every stored record.
    this.version(7).stores({
      scans:
        "id, image_hash, disease_name, confidence, updated_at, device_id, _status",
      guidelines: "id, disease_name",
    });
    this.version(8)
      .stores({
        scans:
          "id, image_hash, disease_name, confidence, updated_at, device_id, owner_id, cloud_id, _status",
        guidelines: "id, disease_name",
      })
      .upgrade(async (transaction) => {
        // Old device UUIDs cannot prove cloud ownership. Keep the saved local
        // history intact; only never-uploaded photos enter the new private queue.
        await transaction
          .table<ScanRecord>("scans")
          .toCollection()
          .modify((scan) => {
            if (
              scan._status === "pending-insert" &&
              !scan.image_url &&
              scan.image_blob.size > 0
            ) {
              scan.cloud_id = crypto.randomUUID();
            } else if (scan._status !== "pending-delete") {
              scan._status = "local-only";
            }
          });
      });
  }
}

export const db = new MangoLeafDB();
