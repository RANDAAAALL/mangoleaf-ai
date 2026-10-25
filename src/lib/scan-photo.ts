import type { ScanRecord } from "@/lib/db";

/** Native lists carry private file references; only strict save/backup reads need Blobs. */
export type ScanListRecord = Omit<ScanRecord, "image_blob"> & {
  image_blob?: Blob;
  photoUri?: string | null;
};

/** Accept only the native host's private photo handler, never historical cloud URLs. */
export function nativePhotoUrl(photoUri: string): string | null {
  try {
    const url = new URL(photoUri, "https://appassets.androidplatform.net");
    if (
      url.origin !== "https://appassets.androidplatform.net" ||
      !/^\/_native\/photos\/[a-zA-Z0-9._-]+$/.test(url.pathname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
