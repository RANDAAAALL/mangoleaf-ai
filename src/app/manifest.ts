import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MangoLeaf AI",
    short_name: "MangoLeafAI",
    description:
      "Offline-First Mango Leaf Disease Diagnostic PWA powered by TensorFlow.js and Supabase.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6faf1",
    theme_color: "#277839",
    icons: [
      {
        src: "/images/icons/png/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/icons/png/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
