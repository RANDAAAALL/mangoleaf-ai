import Dexie, { type Table } from "dexie";

export interface ScanRecord {
  id: string; // UUID
  disease_name: string; // e.g. "Anthracnose", "Healthy Leaf", "Healthy Fruit", or a saved older "Healthy"
  confidence: number; // e.g. 0.92 (92%)
  image_blob: Blob; // The raw binary photo captured by mobile camera (used for offline display)
  image_url: string | null; // Preserved legacy metadata; display uses the local Blob only.
  image_hash?: string; // Unique SHA-256 binary hash of the photo for duplicate prevention
  model_version?: string; // Local model label; keeps trial reports out of another model's duplicate lookup
  updated_at: string; // ISO Timestamp
  device_id?: string; // Preserved browser label from the former cloud workflow.
  owner_id?: string; // Preserved former cloud ownership; never reassigned.
  cloud_id?: string; // Preserved former cloud record identifier.
  storage_path?: string; // Preserved former private bucket path, never fetched.
  // Legacy deletion tombstones remain hidden; new records are local-only.
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
    // Keep the previous schema declaration for upgrades, but retire its cloud
    // queue transformer: a v7 browser upgrading now never needs cloud IDs.
    this.version(8).stores({
      scans:
        "id, image_hash, disease_name, confidence, updated_at, device_id, owner_id, cloud_id, _status",
      guidelines: "id, disease_name",
    });
    // Remove unused indexes without rewriting Blob-bearing rows on an already
    // full device. Historical statuses/identifiers stay as metadata; current
    // code handles every non-tombstone locally and never resumes their queues.
    this.version(9).stores({
      scans: "id, image_hash, updated_at",
      guidelines: "id, disease_name",
    });
  }
}

export const db = new MangoLeafDB();
