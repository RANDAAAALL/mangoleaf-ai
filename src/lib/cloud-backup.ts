import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { liveQuery } from "dexie";
import { db } from "@/lib/db";
import {
  cloudHistoryScope,
  pendingHistoryDeletes,
  acknowledgeHistoryDelete,
  withCloudHistoryMutation,
} from "@/lib/cloud-history-delete";
import {
  cloudProjects,
  isBrowserTestSync,
  isAutomaticBackup,
  validateCloudTarget,
} from "@/lib/cloud-target";
import {
  connectionHint,
  isAndroidBuild,
  initializeNativeRuntime,
  nativeRequest,
  subscribeConnection,
} from "@/lib/native-bridge";
import {
  hydrateNativeRecord,
  importNativeRecords,
  subscribeStorageChange,
  type NativeRecord,
} from "@/lib/native-storage";
import {
  parseRecoveryCode,
  prepareBackupRow,
  restoreBackupPhoto,
  sameBackup,
  validateBackupRow,
  type BackupRow,
} from "@/lib/cloud-backup-format";

const fields =
  "owner_id,record_id,cloud_id,storage_path,photo_sha256,photo_bytes,photo_mime,metadata,completed";
const project =
  process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "testing"
    ? cloudProjects.testing
    : cloudProjects.production;
// Keep prior unscoped credentials intact. A testing session must never become a production session.
const sessionKey = `supabase-backup-session:${project}`;
const recoveryKey = `backup-recovery-code:${project}`;
const enabledKey = `backup-enabled:${project}`;
const ownerKey = `backup-owner:${project}`;
let client: SupabaseClient | undefined;
type SessionBinding = {
  generation: number;
  staged: boolean;
  revoked: boolean;
  value: string | null;
};
let clientBinding: SessionBinding | undefined;
let sessionGeneration = 0;
let currentOperation: Promise<unknown> | undefined;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
let runtimeStarted = false;
let appBusy = false;
let retryAttempt = 0;
/** Check again after awaited preparation: backgrounding or diagnosis can begin during a batch. */
function canTransfer() {
  return (
    !appBusy &&
    connectionHint() &&
    typeof document !== "undefined" &&
    document.visibilityState === "visible"
  );
}
function available() {
  return isAndroidBuild() || isBrowserTestSync();
}
function requireNativeRecovery() {
  if (!isAndroidBuild())
    throw new Error("Recovery is only available in the Android app.");
}

/** Validate before constructing Supabase: loading a persisted session can itself start network traffic. */
async function verifyTarget() {
  if (!available()) throw new Error("Cloud transfer is unavailable.");
  const environment = validateCloudTarget(
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  if (
    isAndroidBuild() &&
    (await initializeNativeRuntime()).cloudEnvironment !== environment
  )
    throw new Error("The Android host and cloud bundle do not match.");
}

/** Local diagnosis always has priority over starting the next backup photo. */
export function setCloudBackupBusy(value: boolean) {
  appBusy = value;
  if (!value && runtimeStarted) scheduleBackup();
}

async function setting(key: string) {
  await verifyTarget();
  return isAndroidBuild()
    ? nativeRequest<string | null>("storage.settings.get", { key })
    : localStorage.getItem(key);
}
async function setSetting(key: string, value: string | null) {
  await verifyTarget();
  return storeSetting(key, value);
}

/** Call only after target validation; native requests share the host's serialized local queue. */
async function storeSetting(key: string, value: string | null) {
  if (isAndroidBuild())
    await nativeRequest("storage.settings.set", { key, value });
  else if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

/** Candidate Auth persists in memory until verified; retired refreshes can never overwrite a promoted session. */
function sessionStorage(binding: SessionBinding) {
  const write = async (value: string | null) => {
    binding.value = value;
    if (binding.staged || binding.revoked) return;
    await verifyTarget();
    // Recheck after awaited host validation, immediately before issuing the local write.
    if (!binding.revoked && binding.generation === sessionGeneration)
      await storeSetting(sessionKey, value);
  };
  return {
    getItem: async () => {
      if (binding.staged || binding.revoked) return binding.value;
      const value = await setting(sessionKey);
      // A retired read may finish after promotion; never hand the new owner's refresh token to that client.
      if (!binding.revoked && binding.generation === sessionGeneration)
        binding.value = value;
      return binding.value;
    },
    setItem: (_key: string, value: string) => write(value),
    removeItem: () => write(null),
  };
}

/** Bound backup requests separately; guideline traffic has no session or dependency on this client. */
async function backupFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  recoverySignal?: AbortSignal,
) {
  const controller = new AbortController();
  const parents = new Set(
    [
      init?.signal ?? (input instanceof Request ? input.signal : undefined),
      recoverySignal,
    ].filter((signal): signal is AbortSignal => signal != null),
  );
  const abort = () => controller.abort();
  for (const parent of parents) {
    if (parent.aborted) abort();
    else parent.addEventListener("abort", abort, { once: true });
  }
  const timer = setTimeout(abort, 30_000);
  try {
    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    let body: Blob | null = null;
    if (![204, 205, 304].includes(response.status) && response.body) {
      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let bytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 10 * 1024 * 1024) {
          await reader.cancel();
          throw new Error("Backup response exceeds limits.");
        }
        chunks.push(new Uint8Array(value));
      }
      body = new Blob(chunks);
    }
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    clearTimeout(timer);
    for (const parent of parents) parent.removeEventListener("abort", abort);
  }
}

async function backupClient() {
  await verifyTarget();
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Backup service is not configured.");
    clientBinding = {
      generation: sessionGeneration,
      staged: false,
      revoked: false,
      value: null,
    };
    client = createClient(url, key, {
      auth: {
        storageKey: sessionKey,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: sessionStorage(clientBinding),
      },
      global: { fetch: backupFetch },
    });
  }
  return client;
}

async function authenticatedOwner(
  reconnect = true,
): Promise<{ active: SupabaseClient; owner: string }> {
  const active = await backupClient();
  // Server validation prevents a stored device label or edited session JSON from becoming ownership evidence.
  const { data, error } = await active.auth.getUser();
  const code = await setting(recoveryKey);
  const boundOwner = await setting(ownerKey);
  if (reconnect && (error || !data.user) && code) {
    await connectCode(code);
    return authenticatedOwner(false);
  }
  if (
    error ||
    !data.user ||
    data.user.app_metadata?.android_backup_vault !== true ||
    (code
      ? data.user.email !== parseRecoveryCode(code).email
      : !isAutomaticBackup() || boundOwner !== data.user.id) ||
    (boundOwner !== null && boundOwner !== data.user.id)
  )
    throw new Error("Backup session is unavailable.");
  return { active, owner: data.user.id };
}

export async function backupPreferences() {
  if (!available()) return { enabled: false, hasCode: false };
  const [enabled, code] = await Promise.all([
    setting(enabledKey),
    setting(recoveryKey),
  ]);
  let hasCode = false;
  if (code) {
    try {
      parseRecoveryCode(code);
      hasCode = true;
    } catch {
      // A damaged credential must not start Auth or private transfers on startup.
    }
  }
  return {
    // A valid saved code gates uploads. Keep earlier explicit disables and pauses;
    // a legacy connected code with no preference retains its existing automatic backup.
    enabled: hasCode && enabled !== "paused" && enabled !== "false",
    hasCode,
  };
}

export async function savedRecoveryCode() {
  requireNativeRecovery();
  return setting(recoveryKey);
}

/** Only this explicit action may establish anonymous ownership before a recovery code exists. */
export async function createBackupVault() {
  requireNativeRecovery();
  return provisionVault();
}

async function provisionVault() {
  return exclusive(provisionVaultUnlocked);
}

/** Caller owns the operation queue, preventing automatic setup from waiting on its own upload batch. */
async function provisionVaultUnlocked(sourceOwner?: string) {
  if (!canTransfer())
    throw new Error("Recovery creation requires a connection.");
  if ((await backupPreferences()).hasCode)
    throw new Error("A backup vault is already connected.");
  const ownSession = isAutomaticBackup()
    ? await ensureAutomaticOwner()
    : undefined;
  // A legacy session may already belong to the source even without a saved code.
  // Never rotate that source owner's credentials while preparing a receiving vault.
  if (sourceOwner && ownSession?.owner === sourceOwner)
    throw new Error("The source backup is already this installation's owner.");
  const active = ownSession?.active ?? (await backupClient());
  const { data, error } = await active.functions.invoke(
    "android-backup-vault",
    { body: { action: "create" } },
  );
  if (error || typeof data?.recoveryCode !== "string")
    throw new Error("Backup vault could not be created.");
  await connectCode(data.recoveryCode, "create");
  if ((await backupPreferences()).enabled) scheduleBackup();
  return data.recoveryCode as string;
}

async function connectCode(
  input: string,
  activation: "create" | "connect" | false = false,
) {
  if (!canTransfer()) throw new Error("Recovery requires a connection.");
  const credential = parseRecoveryCode(input);
  const active = await backupClient();
  // Verify the candidate before draining deletes: the saved same-vault code may
  // be the only way to recover a lost session. Never use another vault's session.
  const oldScope = await cloudHistoryScope();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // A wrong code must never replace the connected owner's persisted session.
  const binding: SessionBinding = {
    generation: sessionGeneration,
    staged: true,
    revoked: false,
    value: null,
  };
  const candidate = createClient(url, key, {
    auth: {
      // Separate channel/lock identity prevents staging from notifying the connected client.
      storageKey: `${sessionKey}:candidate:${crypto.randomUUID()}`,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: sessionStorage(binding),
    },
    global: { fetch: backupFetch },
  });
  let promoted = false;
  try {
    const { data, error } = await candidate.auth.signInWithPassword({
      email: credential.email,
      password: credential.password,
    });
    if (error || !data.session)
      throw new Error("Recovery credential was not accepted.");
    const verified = await candidate.auth.getUser();
    if (
      verified.error ||
      !verified.data.user ||
      verified.data.user.email !== credential.email ||
      verified.data.user.app_metadata?.android_backup_vault !== true
    )
      throw new Error("Recovery owner could not be verified.");
    const verifiedOwner = verified.data.user.id;
    const priorOwner = await setting(ownerKey);
    const sameVault =
      oldScope === `${project}:${credential.email.split("@")[0]}` &&
      (priorOwner === null || priorOwner === verifiedOwner);
    // History remains deletable during verification. Drain old-owner jobs before
    // promotion; a verified same-vault candidate can replace an expired session.
    await flushHistoryDeletes(
      sameVault ? { active: candidate, owner: verifiedOwner } : undefined,
    );
    await withCloudHistoryMutation(async () => {
      if (
        (await cloudHistoryScope()) !== oldScope ||
        (oldScope && (await pendingHistoryDeletes(oldScope)).length)
      )
        throw new Error(
          "Pending cloud deletions must finish before changing recovery codes.",
        );
      if (!binding.value)
        throw new Error("Verified recovery session is unavailable.");
      const previousBinding = clientBinding;
      const previousGeneration = sessionGeneration;
      const previous = await Promise.all([
        setting(sessionKey),
        setting(ownerKey),
        setting(recoveryKey),
        setting(enabledKey),
      ]);
      sessionGeneration++;
      if (previousBinding) previousBinding.revoked = true;
      try {
        // This commit performs local I/O only. Calling Auth.setSession here would issue another HTTP request.
        await setSetting(ownerKey, verifiedOwner);
        await setSetting(recoveryKey, credential.code);
        await setSetting(sessionKey, binding.value);
        if (
          activation === "create" ||
          (activation === "connect" &&
            previous[3] !== "paused" &&
            !(previous[2] && previous[3] === "false"))
        )
          await setSetting(enabledKey, "true");
        binding.generation = sessionGeneration;
        binding.staged = false;
        clientBinding = binding;
        client = candidate;
        promoted = true;
      } catch (error) {
        await setSetting(ownerKey, previous[1]);
        await setSetting(recoveryKey, previous[2]);
        await setSetting(enabledKey, previous[3]);
        sessionGeneration = previousGeneration;
        if (previousBinding) previousBinding.revoked = false;
        // Reactivate before the last session write so a settling original refresh can persist its newest token.
        await setSetting(sessionKey, previousBinding?.value ?? previous[0]);
        throw error;
      }
    });
    // Disposal stops timers/channels, not already-running fetches; adapter generations also reject late writes.
    await active.auth.dispose();
  } finally {
    if (!promoted) {
      binding.revoked = true;
      await candidate.auth.dispose();
    }
  }
}

/** Explicit setup keeps an older anonymous owner's ID; connected-code retries never create a replacement owner. */
async function ensureAutomaticOwner() {
  if (!isAutomaticBackup())
    throw new Error("Automatic identity is unavailable for this build.");
  const active = await backupClient();
  const current = await active.auth.getSession();
  const code = await setting(recoveryKey);
  if (code) {
    if (current.error || !current.data.session) {
      await connectCode(code);
      return authenticatedOwner(false);
    }
    return authenticatedOwner();
  }
  if (current.error) throw new Error("Backup session could not be read.");
  if (!current.data.session) {
    if (await setting(ownerKey))
      throw new Error("Reconnect the existing backup owner before uploading.");
    const anonymous = await active.auth.signInAnonymously();
    if (anonymous.error)
      throw new Error("Backup anonymous sign-in is unavailable.");
  }
  const verified = await active.auth.getUser();
  if (verified.error || !verified.data.user)
    throw new Error("Backup owner could not be verified.");
  const boundOwner = await setting(ownerKey);
  if (boundOwner && boundOwner !== verified.data.user.id)
    throw new Error("Backup owner changed unexpectedly.");
  if (verified.data.user.app_metadata?.android_backup_vault !== true) {
    const enrolled = await active.functions.invoke("android-backup-vault", {
      body: { action: "enroll" },
    });
    if (enrolled.error || enrolled.data?.ownerId !== verified.data.user.id)
      throw new Error("Backup owner could not be enrolled.");
    const refreshed = await active.auth.refreshSession();
    if (refreshed.error)
      throw new Error("Backup session could not be refreshed.");
  }
  await setSetting(ownerKey, verified.data.user.id);
  return authenticatedOwner();
}

export async function connectBackupVault(input: string) {
  requireNativeRecovery();
  return exclusive(async () => {
    await connectCode(input, "connect");
    if ((await backupPreferences()).enabled) scheduleBackup();
  });
}

export async function setBackupEnabled(enabled: boolean) {
  requireNativeRecovery();
  if (enabled) {
    if (!(await backupPreferences()).hasCode)
      throw new Error(
        "Create or connect a recovery code before enabling backup.",
      );
  }
  await setSetting(
    enabledKey,
    enabled ? "true" : isAutomaticBackup() ? "paused" : "false",
  );
  if (enabled) scheduleBackup();
}

/** Disabling stops future transfers; it does not revoke the code or delete remote copies. */
export async function disconnectBackupVault() {
  requireNativeRecovery();
  // Pause immediately even if an earlier upload is still settling; do not wait
  // for a long batch before honoring the user's decision to stop future uploads.
  await setBackupEnabled(false);
  return exclusive(async () => {
    const active = await backupClient();
    await active.auth.signOut({ scope: "local" });
    await setSetting(sessionKey, null);
    await setSetting(recoveryKey, null);
    await setSetting(ownerKey, null);
  });
}

async function exclusive<T>(action: () => Promise<T>): Promise<T> {
  const prior = currentOperation;
  const next = (async () => {
    if (prior) await prior.catch(() => {});
    return action();
  })();
  currentOperation = next;
  try {
    return await next;
  } finally {
    if (currentOperation === next) currentOperation = undefined;
  }
}

/** Includes a settling operation and any queued explicit recovery/setup work. */
export function isCloudBackupRunning() {
  return currentOperation !== undefined;
}

export async function backUpScans() {
  // Foreground/reconnect notifications coalesce; they must not queue duplicate batches.
  if (currentOperation || !canTransfer()) return 0;
  return exclusive(async () => {
    // Confirmed History deletions still drain when uploads have been paused.
    let session = await flushHistoryDeletes();
    if (!(await backupPreferences()).enabled) return 0;
    // List metadata first and read one photo at a time; a long History must not load every Blob into RAM.
    const rows = isAndroidBuild()
      ? await nativeRequest<NativeRecord[]>("storage.report.list")
      : await db.scans.toCollection().primaryKeys();
    let uploaded = 0;
    for (const row of rows) {
      if (!(await backupPreferences()).enabled || !canTransfer()) break;
      const record =
        typeof row === "string"
          ? await db.scans.get(row)
          : row._status === "pending-delete"
            ? undefined
            : await hydrateNativeRecord(row);
      if (!record || record._status === "pending-delete") continue;
      if (
        !record.image_blob?.size ||
        !["image/jpeg", "image/webp"].includes(record.image_blob.type)
      )
        continue;
      if (!canTransfer()) break;
      if (!session) {
        // backupPreferences gates this path on a saved recovery code. Existing sessions
        // can reconnect that code, but scanning alone never creates an anonymous owner.
        session = isAutomaticBackup()
          ? await ensureAutomaticOwner()
          : await authenticatedOwner();
      }
      const { active, owner } = session;
      // Session recovery may outlast a local deletion.
      // Wait for that local commit, then confirm the report remains before creating a cloud intent.
      const stored = await withCloudHistoryMutation<
        NativeRecord | null | undefined
      >(() =>
        isAndroidBuild()
          ? nativeRequest<NativeRecord | null>("storage.report.get", {
              id: record.id,
            })
          : db.scans.get(record.id),
      );
      if (!stored || stored._status === "pending-delete") continue;
      const backup = await prepareBackupRow(owner, record);
      if (!(await backupPreferences()).enabled || !canTransfer()) break;
      // The transaction records the parent and pending manifest before bytes
      // leave the phone. Interrupted transfers remain listed for retry/deletion.
      const { data: intent, error: intentError } = await active.rpc(
        "begin_android_backup_report",
        { p_manifest: backup },
      );
      if (intentError || !intent || !sameBackup(intent as BackupRow, backup))
        throw new Error("Backup intent could not be committed.");
      if ((intent as BackupRow).completed === true) continue;
      // A committed intent is retryable; do not start its photo after the app yields.
      if (!(await backupPreferences()).enabled || !canTransfer()) break;
      const { error: uploadError } = await active.storage
        .from("scans")
        .upload(backup.storage_path, record.image_blob, {
          contentType: backup.photo_mime,
          upsert: false,
        });
      if (uploadError) {
        // A lost upload acknowledgement or concurrent device can leave the same immutable object present.
        const { data: photo, error: photoError } = await active.storage
          .from("scans")
          .download(backup.storage_path);
        if (photoError || !photo)
          throw new Error("Backup photo could not be uploaded.");
        await restoreBackupPhoto(backup, owner, photo);
      }
      const { data: completed, error: completeError } = await active.rpc(
        "complete_android_backup_report",
        { p_record_id: backup.record_id },
      );
      if (completeError || completed !== true)
        throw new Error("Backup completion could not be confirmed.");
      uploaded++;
    }
    // A photo may have been deleted locally while its upload was still settling.
    await flushHistoryDeletes(session);
    return uploaded;
  });
}

/** Retry Storage first, then the paired SQL delete; acknowledge only after both actually succeed. */
async function flushHistoryDeletes(
  session?: Awaited<ReturnType<typeof authenticatedOwner>>,
) {
  const scope = await cloudHistoryScope();
  if (!scope || !canTransfer()) return session;
  for (const job of await pendingHistoryDeletes(scope)) {
    if (job.scope !== scope || !canTransfer()) break;
    session ??= await authenticatedOwner();
    if (!canTransfer()) break;
    const { active, owner } = session;
    const { data, error } = await active
      .from("android_backup_reports")
      .select(fields)
      .eq("owner_id", owner)
      .eq("record_id", job.record_id)
      .maybeSingle();
    if (error) throw new Error("Cloud deletion lookup failed.");
    if (!canTransfer()) break;
    if (data) {
      const row = validateBackupRow(data, owner);
      const { error: photoError } = await active.storage
        .from("scans")
        .remove([row.storage_path]);
      if (
        photoError &&
        !("statusCode" in photoError && Number(photoError.statusCode) === 404)
      )
        throw new Error("Backup photo deletion failed.");
      const { error: deleteError } = await active.rpc(
        "delete_android_backup_report",
        { p_record_id: job.record_id },
      );
      if (deleteError) throw new Error("Cloud backup deletion failed.");
    }
    // Missing manifests include a successfully committed delete whose response was lost.
    await acknowledgeHistoryDelete(job);
  }
  return session;
}

async function listBackups(
  active: SupabaseClient,
  owner: string,
  completedOnly = false,
  signal?: AbortSignal,
) {
  const rows: BackupRow[] = [];
  for (let offset = 0; ; offset += 100) {
    if (completedOnly) requireRecoveryTransfer(signal);
    let query = active
      .from("android_backup_reports")
      .select(fields)
      .eq("owner_id", owner);
    if (completedOnly) query = query.eq("completed", true);
    const { data, error } = await query
      .order("record_id")
      .range(offset, offset + 99);
    if (completedOnly) requireRecoveryTransfer(signal);
    if (error || !data) throw new Error("Backup list could not be read.");
    rows.push(...data.map((row) => validateBackupRow(row, owner)));
    if (rows.length > 5000)
      throw new Error("Backup exceeds the supported recovery batch.");
    if (data.length < 100) return rows;
  }
}

function requireRecoveryTransfer(signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!canTransfer())
    throw new Error("Recovery requires the foreground connection.");
}

/** A typed code grants temporary read access, never ownership of this phone's future backup. */
async function recoverySource(input: string, signal?: AbortSignal) {
  requireRecoveryTransfer(signal);
  const credential = parseRecoveryCode(input);
  await verifyTarget();
  requireRecoveryTransfer(signal);
  const active = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: `${sessionKey}:source:${crypto.randomUUID()}`,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) => backupFetch(input, init, signal),
      },
    },
  );
  let verified = false;
  try {
    const result = await active.auth.signInWithPassword({
      email: credential.email,
      password: credential.password,
    });
    requireRecoveryTransfer(signal);
    if (result.error || !result.data.session)
      throw new Error("Recovery credential was not accepted.");
    const user = await active.auth.getUser();
    requireRecoveryTransfer(signal);
    if (
      user.error ||
      !user.data.user ||
      user.data.user.email !== credential.email ||
      user.data.user.app_metadata?.android_backup_vault !== true
    )
      throw new Error("Recovery owner could not be verified.");
    verified = true;
    return { active, owner: user.data.user.id };
  } finally {
    if (!verified) await active.auth.dispose();
  }
}

/** Native import merges copies, preserving this phone's own code, pause and deletion scope. */
export async function restoreCloudBackup(code?: string, signal?: AbortSignal) {
  requireNativeRecovery();
  return exclusive(async () => {
    requireRecoveryTransfer(signal);
    const source =
      code !== undefined
        ? await recoverySource(code, signal)
        : await authenticatedOwner();
    try {
      requireRecoveryTransfer(signal);
      // Verification of a source happens before any receiving vault is created.
      if (!(await backupPreferences()).hasCode) {
        await provisionVaultUnlocked(source.owner);
        requireRecoveryTransfer(signal);
      }
      // Only the receiving owner's authenticated client may finish its own queued deletes.
      await flushHistoryDeletes();
      requireRecoveryTransfer(signal);
      const rows = await listBackups(source.active, source.owner, true, signal);
      requireRecoveryTransfer(signal);
      const existing = await nativeRequest<NativeRecord[]>(
        "storage.report.list",
      );
      const ids = new Set(existing.map((row) => row.id));
      let restored = 0;
      for (const row of rows) {
        requireRecoveryTransfer(signal);
        if (row.completed !== true || ids.has(row.record_id)) continue;
        const { data, error } = await source.active.storage
          .from("scans")
          .download(row.storage_path);
        requireRecoveryTransfer(signal);
        if (error || !data)
          throw new Error("Backup photo could not be downloaded.");
        const record = await restoreBackupPhoto(row, source.owner, data);
        requireRecoveryTransfer(signal);
        restored += await importNativeRecords([record]);
        ids.add(row.record_id);
      }
      requireRecoveryTransfer(signal);
      return restored;
    } finally {
      // Disposal removes this phone's temporary reader; signOut could revoke other devices.
      if (code !== undefined) await source.active.auth.dispose();
      if ((await backupPreferences()).enabled) scheduleBackup();
    }
  });
}

/** Delete only this credential's new manifest namespace. Legacy cloud rows remain untouched. */
export async function deleteCloudBackup(confirmed: boolean) {
  requireNativeRecovery();
  if (!confirmed) throw new Error("Cloud deletion must be confirmed.");
  await setBackupEnabled(false);
  return exclusive(async () => {
    const { active, owner } = await authenticatedOwner();
    const rows = await listBackups(active, owner);
    for (const row of rows) {
      const { error: photoError } = await active.storage
        .from("scans")
        .remove([row.storage_path]);
      if (
        photoError &&
        !("statusCode" in photoError && Number(photoError.statusCode) === 404)
      )
        throw new Error("Backup photo deletion failed.");
      const { error } = await active.rpc("delete_android_backup_report", {
        p_record_id: row.record_id,
      });
      if (error) throw new Error("Cloud backup deletion failed.");
    }
  });
}

function scheduleBackup(delay = 3000) {
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    if (
      !runtimeStarted ||
      !connectionHint() ||
      appBusy ||
      document.visibilityState !== "visible"
    )
      return;
    return (async () => {
      try {
        await backUpScans();
        retryAttempt = 0;
      } catch {
        // Reconnect events retry sooner; repeated failures back off while the app is visible.
        const delays = [10_000, 30_000, 60_000, 300_000];
        scheduleBackup(delays[Math.min(retryAttempt++, delays.length - 1)]);
      }
    })();
  }, delay);
}

/** Foreground-only retries are independent of local diagnosis, saves and guideline refresh. */
export function startCloudBackup() {
  if (!available() || runtimeStarted) return () => {};
  runtimeStarted = true;
  const foreground = () => {
    if (document.visibilityState === "visible") scheduleBackup();
  };
  const changed = () => scheduleBackup();
  // Observe keys rather than Blob-bearing rows; each upload hydrates only its own photo.
  const browserSubscription = !isAndroidBuild()
    ? liveQuery(() => db.scans.toCollection().primaryKeys()).subscribe({
        next: changed,
        error: () => {
          /* A failed observer cannot interrupt local diagnosis; foreground/reconnect still retry. */
        },
      })
    : undefined;
  const unsubscribeStorage = isAndroidBuild()
    ? subscribeStorageChange(changed)
    : () => {};
  const unsubscribeConnection = subscribeConnection(changed);
  document.addEventListener("visibilitychange", foreground);
  const interval = setInterval(foreground, 5 * 60_000);
  scheduleBackup();
  return () => {
    runtimeStarted = false;
    unsubscribeStorage();
    browserSubscription?.unsubscribe();
    unsubscribeConnection();
    document.removeEventListener("visibilitychange", foreground);
    clearInterval(interval);
    clearTimeout(pendingTimer);
    client?.auth.stopAutoRefresh();
  };
}
