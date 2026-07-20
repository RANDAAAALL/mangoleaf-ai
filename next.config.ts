import type { NextConfig } from "next";
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
  images: {
    unoptimized: true,
  }
};

export default withSerwist(nextConfig);
