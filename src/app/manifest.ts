import type { MetadataRoute } from "next";
import { translations } from "@/lib/translations";
import { androidApplicationId } from "@/lib/android-installation";

export const dynamic = "force-static";

// Next's type requires a store URL; the standard/Chrome also accept a native package ID alone.
type AndroidManifest = Omit<MetadataRoute.Manifest, "related_applications"> & {
  related_applications: { platform: "play"; id: string }[];
};

export default function manifest(): AndroidManifest {
  return {
    name: "MangoLeaf AI",
    short_name: "MangoLeafAI",
    description: translations.en.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f6faf1",
    theme_color: "#277839",
    // Chrome uses this declaration with the APK's asset_statements. It does not direct users to Play Store.
    related_applications: [{ platform: "play", id: androidApplicationId }],
    prefer_related_applications: false,
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
