const testingUrl = "https://ajwlojaclehxupntnsve.supabase.co";
const productionUrl = "https://uuvvvoznajjqknedxpdg.supabase.co";

/** A copied deployment must not enable provisioning on an unreviewed project. */
export function vaultDeploymentOptions(
  url: string | undefined,
  productionEnabled: string | undefined,
) {
  const testing = url === testingUrl;
  const production = url === productionUrl && productionEnabled === "true";
  return {
    enabled: testing || production,
    allowDevelopmentOrigins: testing,
    // Production uses the same verified, quota-limited owner enrollment as Debug, with native CORS only.
    allowAnonymousOwners: testing || production,
  };
}
