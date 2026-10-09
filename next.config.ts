import type { NextConfig } from "next";
import { version } from "./package.json";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Path to the service worker entry point
  swSrc: "src/sw.ts",
  // Path to the compiled service worker output in public/
  swDest: "public/sw.js",
  // Disable Serwist during development to avoid caching local files
  disable: process.env.NODE_ENV === "development",
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
  },
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
