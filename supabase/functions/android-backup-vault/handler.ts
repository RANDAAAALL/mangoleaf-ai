type VaultUser = {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  app_metadata?: Record<string, unknown>;
};
type VaultAdmin = {
  claimSlot(): Promise<boolean>;
  createUser(input: {
    email: string;
    password: string;
    email_confirm: true;
    app_metadata: { android_backup_vault: true };
  }): Promise<boolean>;
  authenticatedUser?(token: string): Promise<VaultUser | null>;
  updateUser?(
    id: string,
    input: {
      email?: string;
      password?: string;
      email_confirm?: boolean;
      app_metadata: Record<string, unknown>;
    },
  ): Promise<boolean>;
};
type Dependencies = {
  enabled: () => boolean;
  admin: () => VaultAdmin | null;
  allowDevelopmentOrigins?: boolean;
  allowAnonymousOwners?: boolean;
};
const nativeOrigin = "https://appassets.androidplatform.net";
const baseHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  Vary: "Origin",
};

function developmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (
      url.origin === origin &&
      ((url.protocol === "https:" &&
        /^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname)) ||
        (["http:", "https:"].includes(url.protocol) &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}

/** Dependency boundary permits quota/auth failure tests without touching real users. */
export function createVaultHandler(dependencies: Dependencies) {
  return async (request: Request) => {
    const origin = request.headers.get("Origin") || "";
    const allowed =
      origin === nativeOrigin ||
      (dependencies.allowDevelopmentOrigins === true &&
        developmentOrigin(origin));
    const headers = allowed
      ? { ...baseHeaders, "Access-Control-Allow-Origin": origin }
      : baseHeaders;
    const response = (status: number, body: Record<string, unknown>) =>
      new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return response(403, { code: "origin_not_allowed" });
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST")
      return response(405, { code: "method_not_allowed" });
    if (!dependencies.enabled())
      return response(503, { code: "backup_not_enabled" });
    try {
      const reader = request.body?.getReader();
      if (!reader) return response(400, { code: "invalid_request" });
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 128) {
          await reader.cancel();
          return response(413, { code: "request_too_large" });
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const body = JSON.parse(new TextDecoder().decode(bytes));
      if (
        !["create", "enroll"].includes(body?.action) ||
        Object.keys(body).length !== 1
      )
        return response(400, { code: "invalid_request" });
      const admin = dependencies.admin();
      if (!admin) return response(503, { code: "backup_not_configured" });
      if (dependencies.allowAnonymousOwners === true) {
        // Verify the caller with Auth; neither request body nor editable user metadata proves ownership.
        const token = /^Bearer (.+)$/i.exec(
          request.headers.get("Authorization") || "",
        )?.[1];
        const user = token && (await admin.authenticatedUser?.(token));
        if (!user) return response(401, { code: "authentication_required" });
        const approved = user.app_metadata?.android_backup_vault === true;
        if (!approved && user.is_anonymous !== true)
          return response(403, { code: "anonymous_owner_required" });
        if (!approved && !(await admin.claimSlot()))
          return response(429, { code: "provisioning_limit" });
        const metadata = { ...user.app_metadata, android_backup_vault: true };
        if (body.action === "enroll") {
          if (
            !approved &&
            !(await admin.updateUser?.(user.id, { app_metadata: metadata }))
          )
            return response(502, { code: "owner_enrollment_failed" });
          return response(200, { ownerId: user.id });
        }
        // Attach recovery credentials to the same owner, preserving every earlier anonymous upload.
        const priorVault = /^([0-9a-f-]{36})@backup\.mangoleaf\.invalid$/.exec(
          user.email || "",
        )?.[1];
        const vault = priorVault || user.id;
        const password = randomPassword();
        if (
          !(await admin.updateUser?.(user.id, {
            email: `${vault}@backup.mangoleaf.invalid`,
            password,
            email_confirm: true,
            app_metadata: metadata,
          }))
        )
          return response(502, { code: "recovery_creation_failed" });
        return response(201, {
          recoveryCode: `MLB1.${vault}.${password}`,
          ownerId: user.id,
        });
      }
      if (body.action !== "create")
        return response(400, { code: "invalid_request" });
      // Origin can be forged. An atomic server-side quota is mandatory before creating an identity.
      if (!(await admin.claimSlot()))
        return response(429, { code: "provisioning_limit" });
      const vault = crypto.randomUUID();
      const password = randomPassword();
      if (
        !(await admin.createUser({
          email: `${vault}@backup.mangoleaf.invalid`,
          password,
          email_confirm: true,
          app_metadata: { android_backup_vault: true },
        }))
      )
        return response(502, { code: "vault_creation_failed" });
      return response(201, { recoveryCode: `MLB1.${vault}.${password}` });
    } catch {
      // No raw Auth/database message, credential, or token is logged or reflected.
      return response(400, { code: "invalid_request" });
    }
  };
}

function randomPassword() {
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
