import { expect, test } from "bun:test";
import {
  backupCloudId,
  backupScanRow,
  parseRecoveryCode,
  prepareBackupRow,
  restoreBackupPhoto,
  sameBackup,
  sameCloudScan,
  validateBackupMetadata,
  validateBackupRow,
} from "../src/lib/cloud-backup-format";
import { createVaultHandler } from "../supabase/functions/android-backup-vault/handler";
import { vaultDeploymentOptions } from "../supabase/functions/android-backup-vault/deployment";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";

test("vault deployment enables production only on its exact reviewed project", () => {
  const production = "https://uuvvvoznajjqknedxpdg.supabase.co";
  expect(vaultDeploymentOptions(production, "true")).toEqual({
    enabled: true,
    allowDevelopmentOrigins: false,
    allowAnonymousOwners: true,
  });
  for (const enabled of [undefined, "false", "TRUE", "1"])
    expect(vaultDeploymentOptions(production, enabled).enabled).toBe(false);
  for (const url of [
    undefined,
    "https://unreviewed.supabase.co",
    `${production}/`,
    `${production}.evil.invalid`,
    "http://uuvvvoznajjqknedxpdg.supabase.co",
  ])
    expect(vaultDeploymentOptions(url, "true")).toEqual({
      enabled: false,
      allowDevelopmentOrigins: false,
      allowAnonymousOwners: false,
    });
  expect(
    vaultDeploymentOptions(
      "https://ajwlojaclehxupntnsve.supabase.co",
      undefined,
    ),
  ).toEqual({
    enabled: true,
    allowDevelopmentOrigins: true,
    allowAnonymousOwners: true,
  });
});

function record() {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    disease_name: "Healthy Leaf",
    confidence: 0.974321987,
    updated_at: "2026-10-20T00:00:00.000Z",
    _status: "local-only",
    image_blob: new Blob([new Uint8Array([255, 216, 255, 0])], {
      type: "image/jpeg",
    }),
    image_url: "https://historical.invalid/do-not-fetch.jpg",
    owner_id: other,
    device_id: "historical-label",
    model_version: "model-v4.5.0",
  };
}

test("cloud IDs are deterministic per vault and never reuse original legacy IDs", async () => {
  const first = await backupCloudId(owner, record().id);
  expect(first).toBe(await backupCloudId(owner, record().id));
  expect(first).not.toBe(record().id);
  expect(first).not.toBe(await backupCloudId(other, record().id));
});

test("backup/restore preserves exact confidence, photo bytes and historical metadata", async () => {
  const local = record();
  const row = await prepareBackupRow(owner, local);
  expect(row.owner_id).toBe(owner);
  expect(row.metadata.owner_id).toBe(other);
  expect(row.storage_path).toBe(`${owner}/${row.cloud_id}.jpg`);
  const restored = await restoreBackupPhoto(row, owner, local.image_blob);
  expect(restored.confidence).toBe(local.confidence);
  expect(restored.image_url).toBe(local.image_url);
  expect(restored.image_blob.size).toBe(local.image_blob.size);
  expect(sameBackup(row, JSON.parse(JSON.stringify(row)))).toBe(true);
});

test("foreign-owner manifests, paths and corrupted photos cannot restore", async () => {
  const row = await prepareBackupRow(owner, record());
  expect(() => validateBackupRow(row, other)).toThrow("ownership");
  expect(() =>
    validateBackupRow(
      { ...row, storage_path: `${other}/${row.cloud_id}.jpg` },
      owner,
    ),
  ).toThrow();
  await expect(
    restoreBackupPhoto(row, owner, new Blob(["wrong bytes"])),
  ).rejects.toThrow("integrity");
  const forged = {
    ...row,
    cloud_id: record().id,
    storage_path: `${owner}/${record().id}.jpg`,
  };
  await expect(
    restoreBackupPhoto(forged, owner, record().image_blob),
  ).rejects.toThrow("integrity");
});

test("pending-delete rows stay excluded and conflicting retries never overwrite", async () => {
  expect(() =>
    validateBackupMetadata({
      ...record(),
      image_blob: undefined,
      _status: "pending-delete",
    }),
  ).toThrow();
  const row = await prepareBackupRow(owner, record());
  expect(
    sameBackup(row, { ...row, metadata: { ...row.metadata, confidence: 0.5 } }),
  ).toBe(false);
  expect(
    sameBackup({ ...row, completed: false }, { ...row, completed: true }),
  ).toBe(true);
  expect(sameBackup(row, { ...row, photo_sha256: "f".repeat(64) })).toBe(false);
});

test("parent retry recognizes REAL storage without rounding raw manifest confidence", async () => {
  const backup = await prepareBackupRow(owner, record());
  const expected = backupScanRow(backup);
  expect(
    sameCloudScan(
      { ...expected, confidence: Math.fround(expected.confidence) },
      expected,
    ),
  ).toBe(true);
  expect(sameCloudScan({ ...expected, confidence: 0.1 }, expected)).toBe(false);
  expect(sameCloudScan({ ...expected, owner_id: other }, expected)).toBe(false);
  expect(backup.metadata.confidence).toBe(record().confidence);
});

function request(
  body = { action: "create" },
  origin = "https://appassets.androidplatform.net",
) {
  return new Request("https://fixture.invalid/function", {
    method: "POST",
    headers: { Origin: origin },
    body: JSON.stringify(body),
  });
}

function ownerRequest(action, token = "fixture-token") {
  const value = request({ action });
  value.headers.set("Authorization", `Bearer ${token}`);
  return value;
}

test("testing enrolls the verified anonymous owner and creates recovery without changing its ID", async () => {
  let user = { id: owner, is_anonymous: true, app_metadata: {} };
  let slots = 0;
  const updates = [];
  const handler = createVaultHandler({
    enabled: () => true,
    allowAnonymousOwners: true,
    admin: () => ({
      claimSlot: async () => {
        slots++;
        return true;
      },
      createUser: async () => {
        throw new Error("must preserve the anonymous owner");
      },
      authenticatedUser: async (token) =>
        token === "fixture-token" ? user : null,
      updateUser: async (id, input) => {
        expect(id).toBe(owner);
        updates.push(input);
        user = { ...user, ...input };
        return true;
      },
    }),
  });
  expect((await handler(ownerRequest("enroll", "wrong-token"))).status).toBe(
    401,
  );
  expect((await handler(ownerRequest("enroll"))).status).toBe(200);
  expect((await handler(ownerRequest("enroll"))).status).toBe(200);
  const recovered = await handler(ownerRequest("create"));
  expect(recovered.status).toBe(201);
  const code = await recovered.json();
  expect(code.ownerId).toBe(owner);
  expect(parseRecoveryCode(code.recoveryCode).email).toBe(
    `${owner}@backup.mangoleaf.invalid`,
  );
  expect(user.id).toBe(owner);
  expect(slots).toBe(1);
  expect(updates).toHaveLength(2);
});

test("testing cannot enroll an unapproved permanent account or forge an owner in the request", async () => {
  const handler = createVaultHandler({
    enabled: () => true,
    allowAnonymousOwners: true,
    admin: () => ({
      claimSlot: async () => {
        throw new Error("must refuse first");
      },
      createUser: async () => false,
      authenticatedUser: async () => ({
        id: owner,
        is_anonymous: false,
        app_metadata: {},
      }),
    }),
  });
  expect((await handler(request({ action: "enroll" }))).status).toBe(401);
  expect((await handler(ownerRequest("enroll"))).status).toBe(403);
  expect(
    (await handler(request({ action: "enroll", owner_id: other }))).status,
  ).toBe(400);
});

test("testing enrollment respects quota and hides provider failures", async () => {
  let available = false;
  const handler = createVaultHandler({
    enabled: () => true,
    allowAnonymousOwners: true,
    admin: () => ({
      claimSlot: async () => available,
      createUser: async () => false,
      authenticatedUser: async () => ({ id: owner, is_anonymous: true }),
      updateUser: async () => {
        throw new Error("sensitive-provider-message");
      },
    }),
  });
  expect((await handler(ownerRequest("enroll"))).status).toBe(429);
  available = true;
  const failed = await handler(ownerRequest("create"));
  expect(failed.status).toBe(400);
  expect(await failed.text()).not.toContain("sensitive-provider-message");
});

test("development CORS is opt-in and reflects only localhost or exact tunnel origins", async () => {
  const dependencies = { enabled: () => false, admin: () => null };
  for (const origin of [
    "http://localhost:3000",
    "https://abc-123.trycloudflare.com",
  ]) {
    expect(
      (
        await createVaultHandler(dependencies)(
          request({ action: "create" }, origin),
        )
      ).status,
    ).toBe(403);
    const result = await createVaultHandler({
      ...dependencies,
      allowDevelopmentOrigins: true,
    })(
      new Request("https://fixture.invalid", {
        method: "OPTIONS",
        headers: { Origin: origin },
      }),
    );
    expect(result.status).toBe(200);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(result.headers.get("Vary")).toBe("Origin");
  }
  for (const origin of [
    "https://trycloudflare.com.evil.invalid",
    "http://foo.trycloudflare.com",
    "https://a.b.trycloudflare.com",
    "https://other.invalid",
    "null",
  ]) {
    const result = await createVaultHandler({
      ...dependencies,
      allowDevelopmentOrigins: true,
    })(request({ action: "create" }, origin));
    expect(result.status).toBe(403);
    expect(result.headers.has("Access-Control-Allow-Origin")).toBe(false);
  }
});

test("provisioning disabled or exhausted never calls admin.createUser", async () => {
  let creates = 0;
  const admin = () => ({
    claimSlot: async () => false,
    createUser: async () => {
      creates++;
      return true;
    },
  });
  expect(
    (await createVaultHandler({ enabled: () => false, admin })(request()))
      .status,
  ).toBe(503);
  expect(
    (await createVaultHandler({ enabled: () => true, admin })(request()))
      .status,
  ).toBe(429);
  expect(creates).toBe(0);
});

test("public bootstrap ignores caller-supplied owners and returns only generated credential", async () => {
  const created = [];
  const handler = createVaultHandler({
    enabled: () => true,
    admin: () => ({
      claimSlot: async () => true,
      createUser: async (input) => {
        created.push(input);
        return true;
      },
    }),
  });
  expect(
    (await handler(request({ action: "create", owner_id: other }))).status,
  ).toBe(400);
  expect(
    (await handler(request({ action: "create" }, "https://untrusted.invalid")))
      .status,
  ).toBe(403);
  const result = await handler(request());
  expect(result.status).toBe(201);
  const body = await result.json();
  const parsed = parseRecoveryCode(body.recoveryCode);
  expect(created).toHaveLength(1);
  expect(parsed.email).toBe(created[0].email);
  expect(parsed.password).toBe(created[0].password);
  expect(created[0].app_metadata).toEqual({ android_backup_vault: true });
  expect(Object.keys(body)).toEqual(["recoveryCode"]);
});

test("parallel bootstrap consumes server quota before each identity and errors do not leak secrets", async () => {
  let slots = 1;
  let creates = 0;
  const handler = createVaultHandler({
    enabled: () => true,
    admin: () => ({
      claimSlot: async () => slots-- > 0,
      createUser: async () => {
        creates++;
        return true;
      },
    }),
  });
  const results = await Promise.all([handler(request()), handler(request())]);
  expect(results.map((result) => result.status).sort()).toEqual([201, 429]);
  expect(creates).toBe(1);
  const failing = createVaultHandler({
    enabled: () => true,
    admin: () => ({
      claimSlot: async () => true,
      createUser: async () => {
        throw new Error("sensitive-provider-message");
      },
    }),
  });
  expect(await (await failing(request())).text()).toBe(
    '{"code":"invalid_request"}',
  );
});

// Production enrollment must verify bearer ownership exactly as testing does, without development CORS.
test("production automatic enrollment rejects missing/forged identities before consuming quota", async () => {
  let slots = 0;
  const options = vaultDeploymentOptions(
    "https://uuvvvoznajjqknedxpdg.supabase.co",
    "true",
  );
  const handler = createVaultHandler({
    ...options,
    enabled: () => options.enabled,
    admin: () => ({
      claimSlot: async () => {
        slots++;
        return true;
      },
      createUser: async () => {
        throw new Error("must not create unrelated owner");
      },
      authenticatedUser: async (token) =>
        token === "fixture-token"
          ? { id: owner, is_anonymous: true, app_metadata: {} }
          : null,
      updateUser: async (id) => id === owner,
    }),
  });
  expect((await handler(request({ action: "enroll" }))).status).toBe(401);
  expect((await handler(ownerRequest("enroll", "forged"))).status).toBe(401);
  expect(
    (await handler(request({ action: "enroll" }, "http://localhost:3000")))
      .status,
  ).toBe(403);
  expect(slots).toBe(0);
  expect((await handler(ownerRequest("enroll"))).status).toBe(200);
  expect(slots).toBe(1);
});
