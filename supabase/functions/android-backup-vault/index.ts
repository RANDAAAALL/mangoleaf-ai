// Deploy separately after SQL/RLS review. No scan/photo payload belongs in this function.
import { createClient } from "npm:@supabase/supabase-js@2.110.7";
import { createVaultHandler } from "./handler.ts";
import { vaultDeploymentOptions } from "./deployment.ts";

// Development CORS/bootstrap is allowed only on this separately verified testing project.
// Production remains disabled until its reviewed SQL and explicit server-side enablement are deployed.
const deployment = vaultDeploymentOptions(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("ANDROID_BACKUP_PROVISIONING_ENABLED"),
);

Deno.serve(
  createVaultHandler({
    enabled: () => deployment.enabled,
    allowDevelopmentOrigins: deployment.allowDevelopmentOrigins,
    allowAnonymousOwners: deployment.allowAnonymousOwners,
    admin: () => {
      const url = Deno.env.get("SUPABASE_URL");
      const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !secret) return null;
      const client = createClient(url, secret, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }),
        },
      });
      return {
        async claimSlot() {
          const { data, error } = await client.rpc(
            "claim_android_backup_provision_slot",
          );
          return !error && data === true;
        },
        async createUser(input) {
          const { error } = await client.auth.admin.createUser(input);
          return !error;
        },
        async authenticatedUser(token) {
          const { data, error } = await client.auth.getUser(token);
          return error ? null : data.user;
        },
        async updateUser(id, input) {
          const { error } = await client.auth.admin.updateUserById(id, input);
          return !error;
        },
      };
    },
  }),
);
