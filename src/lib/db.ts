import Dexie, { type Table } from "dexie";

export interface ScanRecord {
  id: string;              // UUID
  disease_name: string;    // e.g. "Anthracnose", "Sooty Mold", "Bacterial Canker", "Bacterial Black Spot", "Mango Scab", "Healthy"
  confidence: number;      // e.g. 0.92 (92%)
  image_blob: Blob;        // The raw binary photo captured by mobile camera (used for offline display)
  image_url: string | null;// Public cloud link of the uploaded photo (null when offline)
  updated_at: string;      // ISO Timestamp
  device_id: string;       // Unique mobile/browser device ID
  _status?: "synced" | "pending-insert" | "pending-delete";
}

export interface DiseaseGuideline {
  id: string;              // primary key e.g., "anthracnose", "sooty_mold"
  disease_name: string;    // e.g. "Anthracnose"
  guidelines_en: string;   // English pre-written treatment rules
  guidelines_bis: string;  // Bisaya pre-written treatment rules
  color: "yellow" | "pink" | "blue" | "green" | "purple";
}

class MangoLeafDB extends Dexie {
  scans!: Table<ScanRecord>;
  guidelines!: Table<DiseaseGuideline>;

  constructor() {
    super("MangoLeafDB");
    // Version 6 stores scans (including binary image blobs) and agricultural guidelines
    this.version(6).stores({
      scans: "id, disease_name, confidence, updated_at, device_id, _status",
      guidelines: "id, disease_name"
    });
  }
}

export const db = new MangoLeafDB();
