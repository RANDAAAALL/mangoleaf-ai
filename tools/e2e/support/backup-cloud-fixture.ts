import { RecoveryCodeError } from "@/lib/cloud-backup-format";

export function isCloudBackupRunning() {
  return false;
}

export interface BackupFixtureState {
  code: string | null;
  enabled: boolean;
  restored: number;
  inputs: (string | null)[];
  toggles: boolean[];
  created: number;
  codeReadsStarted: number;
  codeReadsFinished: number;
  preferenceReads: number;
  updateRequests: number;
}

export interface BackupFixtureControls {
  snapshot(): BackupFixtureState;
  update(): void;
  finishToggle(): void;
  finishCodeRead(): void;
  finishPreferenceRead(): void;
  finishRestore(): void;
  failPreferenceReads(count: number): void;
}

// This module replaces only the cloud service in isolated UI builds. It never contacts a backend.
const query = new URLSearchParams(location.search);
const fresh = query.has("fresh");
const source = `MLB1.22222222-2222-4222-8222-222222222222.${"A".repeat(43)}`;
const own = `MLB1.11111111-1111-4111-8111-111111111111.${"B".repeat(43)}`;
const state: BackupFixtureState = {
  code: fresh ? null : own,
  enabled: !fresh && !query.has("paused"),
  restored: 0,
  inputs: [],
  toggles: [],
  created: 0,
  codeReadsStarted: 0,
  codeReadsFinished: 0,
  preferenceReads: 0,
  updateRequests: 0,
};
let failed = false;
let preferenceFailures = query.has("preferences-error") ? 1 : 0;
const toggles: (() => void)[] = [];
const codeReads: (() => void)[] = [];
const preferenceReads: (() => void)[] = [];
const restores: (() => void)[] = [];
window.backupRestoreUi = {
  snapshot: () => ({
    ...state,
    inputs: [...state.inputs],
    toggles: [...state.toggles],
  }),
  update: () => {
    state.updateRequests++;
  },
  finishToggle: () => toggles.shift()?.(),
  finishCodeRead: () => codeReads.shift()?.(),
  finishPreferenceRead: () => preferenceReads.shift()?.(),
  finishRestore: () => restores.shift()?.(),
  failPreferenceReads: (count) => {
    preferenceFailures = count;
  },
};

export async function backupPreferences() {
  state.preferenceReads++;
  if (query.has("hold-preferences") && state.preferenceReads > 1)
    await new Promise<void>((resolve) => preferenceReads.push(resolve));
  if (query.has("delay-preferences"))
    await new Promise((resolve) => setTimeout(resolve, 150));
  if (preferenceFailures > 0) {
    preferenceFailures--;
    throw new Error("Controlled preference failure");
  }
  return { hasCode: !!state.code, enabled: state.enabled };
}

export async function savedRecoveryCode() {
  state.codeReadsStarted++;
  if (query.has("hold-code"))
    await new Promise<void>((resolve) => codeReads.push(resolve));
  if (query.has("delay-code"))
    await new Promise((resolve) => setTimeout(resolve, 150));
  state.codeReadsFinished++;
  return state.code;
}

export async function createBackupVault() {
  state.created++;
  if (query.has("setup-error")) throw new Error("Controlled setup failure");
  state.code = own;
  state.enabled = true;
  return own;
}

export async function setBackupEnabled(value: boolean) {
  state.toggles.push(value);
  if (query.has("hold-toggle"))
    await new Promise<void>((resolve) => toggles.push(resolve));
  if (query.has("toggle-error")) throw new Error("Controlled toggle failure");
  state.enabled = value;
}

export async function restoreCloudBackup(input?: string) {
  state.inputs.push(input ?? null);
  if (query.has("hold-restore"))
    await new Promise<void>((resolve) => restores.push(resolve));
  if (input !== undefined && input !== source && input !== own)
    throw new RecoveryCodeError("Controlled invalid source");
  if (query.has("connection-error"))
    throw new Error("Controlled network failure");
  if (!state.code) {
    state.code = own;
    state.enabled = true;
  }
  if (query.has("photo-error") && !failed) {
    failed = true;
    state.restored = 1;
    throw new Error("Controlled later photo failure");
  }
  const count = state.restored ? 0 : Number(query.get("count") || 2);
  state.restored += count;
  return count;
}
