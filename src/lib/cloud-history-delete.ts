import { db, type CloudHistoryDeletion } from "@/lib/db";
import {
  cloudProjects,
  isBrowserTestSync,
  validateCloudTarget,
} from "@/lib/cloud-target";
import { parseRecoveryCode } from "@/lib/cloud-backup-format";
import {
  initializeNativeRuntime,
  isAndroidBuild,
  nativeRequest,
} from "@/lib/native-bridge";
import { notifyStorageChange } from "@/lib/native-storage";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let currentMutation: Promise<unknown> | undefined;

/** Only scope-sensitive local commits share this guard; network upload batches never block History deletion. */
export async function withCloudHistoryMutation<T>(action: () => Promise<T>) {
  const prior = currentMutation;
  const next = (async () => {
    if (prior) await prior.catch(() => {});
    return action();
  })();
  currentMutation = next;
  try {
    return await next;
  } finally {
    if (currentMutation === next) currentMutation = undefined;
  }
}

/** A scope routes an offline job; the server must still verify Auth ownership before deletion. */
export async function cloudHistoryScope(): Promise<string | null> {
  if (!isAndroidBuild() && !isBrowserTestSync()) return null;
  const environment = validateCloudTarget(
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  if (isAndroidBuild()) {
    const info = await initializeNativeRuntime();
    if (
      info.cloudEnvironment !== environment ||
      !Number.isSafeInteger(info.hostVersion) ||
      info.hostVersion < 2
    )
      throw new Error(
        "Update the Android host before using synchronized History deletion.",
      );
  }
  const project = cloudProjects[environment];
  const key = `backup-recovery-code:${project}`;
  const code = isAndroidBuild()
    ? await nativeRequest<string | null>("storage.settings.get", { key })
    : localStorage.getItem(key);
  if (!code) {
    const ownerKey = `backup-owner:${project}`;
    const owner = isAndroidBuild()
      ? await nativeRequest<string | null>("storage.settings.get", {
          key: ownerKey,
        })
      : localStorage.getItem(ownerKey);
    // This public scope labels queued work; authenticatedOwner still verifies the server identity.
    return owner && uuid.test(owner) ? `${project}:${owner}` : null;
  }
  const credential = parseRecoveryCode(code);
  // Store only a public vault label, never its password, recovery code or session.
  return `${project}:${credential.email.split("@")[0]}`;
}

/** Commit the cloud job with local removal; offline deletion never waits for a network request. */
export async function deleteScansWithCloudQueue(ids: string[]) {
  return withCloudHistoryMutation(async () => {
    // Reading the scope and committing its outbox job cannot straddle a recovery-owner switch.
    const scope = await cloudHistoryScope();
    if (isAndroidBuild()) {
      await nativeRequest(
        scope ? "storage.report.deleteSynced" : "storage.report.delete",
        { ids, scope },
      );
      notifyStorageChange("reports");
    } else if (scope) {
      await db.transaction("rw", db.scans, db.cloudDeletes, async () => {
        await db.cloudDeletes.bulkPut(
          ids
            .filter((id) => uuid.test(id))
            .map((record_id) => ({ scope, record_id })),
        );
        await db.scans.bulkDelete(ids);
      });
    } else await db.scans.bulkDelete(ids);
  });
}

/** Read only the connected vault's pending work; switching vaults never reassigns old jobs. */
export async function pendingHistoryDeletes(
  scope: string,
): Promise<CloudHistoryDeletion[]> {
  return isAndroidBuild()
    ? nativeRequest("storage.cloudDelete.list", { scope })
    : db.cloudDeletes.where("scope").equals(scope).limit(200).toArray();
}

export async function acknowledgeHistoryDelete(job: CloudHistoryDeletion) {
  if (isAndroidBuild()) await nativeRequest("storage.cloudDelete.ack", job);
  else await db.cloudDeletes.delete([job.scope, job.record_id]);
}
