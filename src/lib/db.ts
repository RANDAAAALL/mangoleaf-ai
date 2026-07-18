import Dexie, { type Table } from "dexie";

export interface Note {
  id: string; // UUID
  title: string;
  content?: string;
  color: "yellow" | "pink" | "blue" | "green" | "purple";
  updated_at: string; // ISO String
  device_id: string | null; // null for global, string for private
  _status?: "synced" | "pending-insert" | "pending-update" | "pending-delete";
}

class OffOnSyncDB extends Dexie {
  notes!: Table<Note>;

  constructor() {
    super("OffOnSyncDB");
    this.version(3).stores({
      notes: "id, title, color, updated_at, device_id, _status"
    });
  }
}

export const db = new OffOnSyncDB();
