import type { NextConfig } from "next";
import { version } from "./package.json";
import withSerwistInit from "@serwist/next";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { validateCloudTarget } from "./src/lib/cloud-target";

const android = process.env.NEXT_PUBLIC_APP_TARGET === "android";
const cloudEnvironment = android
  ? process.env.MANGOLEAF_CLOUD_ENVIRONMENT || "testing"
  : process.env.NODE_ENV === "development"
    ? "testing"
    : "production";
// Explicit reading wins over Bun's inherited production .env.local values. No private key is copied into an export.
const cloudSettings =
  cloudEnvironment === "testing" && !process.env.MANGOLEAF_CLOUD_ENVIRONMENT
    ? existsSync(".env.testing.local")
      ? parseEnv(readFileSync(".env.testing.local", "utf8"))
      : {}
    : process.env;
const cloudUrl = cloudSettings.NEXT_PUBLIC_SUPABASE_URL;
const cloudKey =
  cloudSettings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  cloudSettings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (android || cloudEnvironment === "testing") {
  validateCloudTarget(cloudEnvironment, cloudUrl);
  if (!cloudKey)
    throw new Error(
      "Configure the testing public key in .env.testing.local before building.",
    );
}

const withSerwist = withSerwistInit({
  // Path to the service worker entry point
  swSrc: "src/sw.ts",
  // Path to the compiled service worker output in public/
  swDest: "public/sw.js",
  // Disable Serwist during development to avoid caching local files
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_APP_TARGET === "android",
});

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["*.trycloudflare.com"],
  experimental: {
    // Public development tunnels do not need the DevTools MCP endpoint.
    mcpServer: false,
  },
  env: {
    // Sourced from package.json "version" so the footer label always matches
    // the committed release. Override only for one-off preview builds.
    NEXT_PUBLIC_APP_VERSION: `v${version}`,
    NEXT_PUBLIC_CLOUD_ENVIRONMENT: cloudEnvironment,
    ...(cloudUrl && cloudKey
      ? {
          NEXT_PUBLIC_SUPABASE_URL: cloudUrl,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: cloudKey,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: cloudKey,
        }
      : {}),
  },
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
