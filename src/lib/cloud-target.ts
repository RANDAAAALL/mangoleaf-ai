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

/** Websites never enroll or upload, including local development. Kept for bounded legacy callers. */
export function isBrowserTestSync() {
  return false;
}

/** Automatic backup is restricted to the exact testing project and a supported testing runtime. */
export function isAutomaticTestBackup() {
  return (
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "testing" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL ===
      `https://${cloudProjects.testing}.supabase.co` &&
    process.env.NEXT_PUBLIC_APP_TARGET === "android"
  );
}

/** Both APK variants support automatic transfers after recovery-code setup; websites never enroll. */
export function isAutomaticBackup() {
  return (
    isAutomaticTestBackup() ||
    (process.env.NEXT_PUBLIC_APP_TARGET === "android" &&
      process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "production" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL ===
        `https://${cloudProjects.production}.supabase.co`)
  );
}
