export type CloudEnvironment = "testing" | "production";

// These are public project identities, never credentials. Pinning prevents a debug build from uploading to production.
export const cloudProjects = {
  testing: "ajwlojaclehxupntnsve",
  production: "uuvvvoznajjqknedxpdg",
} as const;

export function validateCloudTarget(
  environment: string | undefined,
  url: string | undefined,
): CloudEnvironment {
  if (environment !== "testing" && environment !== "production")
    throw new Error("Cloud environment is not configured.");
  if (url !== `https://${cloudProjects[environment]}.supabase.co`)
    throw new Error("Cloud project does not match this build.");
  return environment;
}

/** Browser uploads exist only in development and always use the separate testing project. */
export function isBrowserTestSync() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_APP_TARGET !== "android" &&
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "testing" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL ===
      `https://${cloudProjects.testing}.supabase.co`
  );
}

/** Automatic backup is restricted to the exact testing project and a supported testing runtime. */
export function isAutomaticTestBackup() {
  return (
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "testing" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL ===
      `https://${cloudProjects.testing}.supabase.co` &&
    (process.env.NEXT_PUBLIC_APP_TARGET === "android" || isBrowserTestSync())
  );
}

/** Both APK variants back up automatically; a published website never enrolls a production owner. */
export function isAutomaticBackup() {
  return (
    isAutomaticTestBackup() ||
    (process.env.NEXT_PUBLIC_APP_TARGET === "android" &&
      process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "production" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL ===
        `https://${cloudProjects.production}.supabase.co`)
  );
}
