import Dexie, { type Table } from "dexie";

export interface ScanRecord {
  id: string; // UUID
  disease_name: string; // e.g. "Anthracnose", "Healthy Leaf", "Healthy Fruit", or a saved older "Healthy"
  confidence: number; // e.g. 0.92 (92%)
  image_blob: Blob; // The raw binary photo captured by mobile camera (used for offline display)
  image_url: string | null; // Public cloud link of the uploaded photo (null when offline)
  image_hash?: string; // Unique SHA-256 binary hash of the photo for duplicate prevention
  model_version?: string; // Local model label; keeps trial reports out of another model's duplicate lookup
  updated_at: string; // ISO Timestamp
  device_id: string; // Unique mobile/browser device ID
  // Says whether the local row matches Supabase or still owes it a change.
  _status?: "synced" | "pending-insert" | "pending-delete";
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
  }
}

export const db = new MangoLeafDB();
