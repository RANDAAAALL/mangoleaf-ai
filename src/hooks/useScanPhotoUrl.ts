import { useEffect, useRef, useState } from "react";
import { computeImageHash } from "@/lib/image-hash";
import { isAndroidBuild } from "@/lib/native-bridge";
import { nativePhotoUrl } from "@/lib/scan-photo";

interface DisplayedPhoto {
  scanId: string;
  blob: Blob;
  url: string;
  hash?: Promise<string>;
}

/** Native views use a validated private file; legacy/fresh Blob views keep stable owned URLs. */
export function useScanPhotoUrl(
  scanId: string,
  imageBlob: Blob | null,
  photoUri?: string | null,
) {
  const [photo, setPhoto] = useState<DisplayedPhoto | null>(null);
  const currentPhotoRef = useRef<DisplayedPhoto | null>(null);
  const ownedUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    let active = true;

    const replacePhoto = (hash?: Promise<string>) => {
      if (!active || !imageBlob) return;
      const next = {
        scanId,
        blob: imageBlob,
        url: URL.createObjectURL(imageBlob),
        hash,
      };
      ownedUrlsRef.current.add(next.url);
      currentPhotoRef.current = next;
      setPhoto(next);
    };

    if (!imageBlob || imageBlob.size === 0) {
      currentPhotoRef.current = null;
      // Rendering already hides an empty photo. Clear its URL state afterward.
      queueMicrotask(() => {
        if (active) setPhoto(null);
      });
    } else {
      const current = currentPhotoRef.current;
      if (
        !current ||
        current.scanId !== scanId ||
        current.blob.size !== imageBlob.size ||
        current.blob.type !== imageBlob.type
      ) {
        replacePhoto();
      } else if (current.blob !== imageBlob) {
        void (async () => {
          try {
            // Sync changes metadata, but IndexedDB creates fresh Blob objects.
            // Compare their bytes before replacing the URL; equal sizes alone
            // cannot distinguish two different photos. Cache the displayed hash.
            current.hash ??= computeImageHash(current.blob);
            const [previousHash, nextHash] = await Promise.all([
              current.hash,
              computeImageHash(imageBlob),
            ]);
            if (active && previousHash !== nextHash) {
              replacePhoto(Promise.resolve(nextHash));
            }
          } catch {
            // If comparison fails, show the incoming photo instead of keeping
            // an older one forever. Photo display must not depend on hashing.
            replacePhoto();
          }
        })();
      }
    }

    // A newer photo or unmount makes an unfinished comparison irrelevant.
    return () => {
      active = false;
    };
  }, [scanId, imageBlob]);

  useEffect(() => {
    const ownedUrls = ownedUrlsRef.current;
    return () => {
      // React has switched the image before releasing its previous URL.
      if (photo && ownedUrls.delete(photo.url)) {
        URL.revokeObjectURL(photo.url);
      }
    };
  }, [photo]);

  useEffect(() => {
    const ownedUrls = ownedUrlsRef.current;
    return () => {
      // Also release a URL created just before an interrupted render/unmount.
      for (const url of ownedUrls) URL.revokeObjectURL(url);
      ownedUrls.clear();
      currentPhotoRef.current = null;
    };
  }, []);

  if (isAndroidBuild() && photoUri) return nativePhotoUrl(photoUri);
  return imageBlob && imageBlob.size > 0 && photo?.scanId === scanId
    ? photo.url
    : null;
}
