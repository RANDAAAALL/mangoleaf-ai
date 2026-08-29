import Dexie, { type Table } from "dexie";

export interface ScanRecord {
  id: string;              // UUID
  disease_name: string;    // e.g. "Anthracnose", "Sooty Mold", "Bacterial Canker", "Bacterial Black Spot", "Mango Scab", "Healthy"
  confidence: number;      // e.g. 0.92 (92%)
  image_blob: Blob;        // The raw binary photo captured by mobile camera (used for offline display)
  image_url: string | null;// Public cloud link of the uploaded photo (null when offline)
  image_hash?: string;     // Unique SHA-256 binary hash of the photo for duplicate prevention
  updated_at: string;      // ISO Timestamp
  device_id: string;       // Unique mobile/browser device ID
  // Tracks whether the local record matches Supabase or still needs a sync action.
  _status?: "synced" | "pending-insert" | "pending-delete";
}

export interface DiseaseGuideline {
  id: string;              // primary key e.g., "anthracnose", "sooty_mold"
  disease_name: string;    // e.g. "Anthracnose"
  guidelines_en: string;   // English pre-written treatment rules
  guidelines_bis: string;  // Bisaya pre-written treatment rules
}

class MangoLeafDB extends Dexie {
  scans!: Table<ScanRecord>;
  guidelines!: Table<DiseaseGuideline>;

  constructor() {
    super("MangoLeafDB");
    // Version 7 stores scans (with image_hash index) and agricultural guidelines
    this.version(7).stores({
      scans: "id, image_hash, disease_name, confidence, updated_at, device_id, _status",
      guidelines: "id, disease_name"
    });
  }
}

export const db = new MangoLeafDB();
