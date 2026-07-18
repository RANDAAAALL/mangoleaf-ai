import Dexie, { type Table } from "dexie";

export interface Task {
  id: string; // UUID
  title: string;
  description?: string;
  is_completed: boolean;
  updated_at: string; // ISO String
  _status?: "synced" | "pending-insert" | "pending-update" | "pending-delete";
}

class OffOnSyncDB extends Dexie {
  tasks!: Table<Task>;

  constructor() {
    super("OffOnSyncDB");
    this.version(1).stores({
      tasks: "id, title, is_completed, updated_at, _status"
    });
  }
}

export const db = new OffOnSyncDB();
