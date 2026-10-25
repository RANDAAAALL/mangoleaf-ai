import { useState, type ReactNode } from "react";
import { useScanPhotoUrl } from "@/hooks/useScanPhotoUrl";
import type { ScanListRecord } from "@/lib/scan-photo";

interface ScanPhotoProps {
  scan: ScanListRecord;
  className: string;
  loading?: "lazy" | "eager";
  fallback: ReactNode;
}

/** Share local-only display; refreshed metadata retries failed files without replacing successful images. */
export function ScanPhoto({
  scan,
  className,
  loading,
  fallback,
}: ScanPhotoProps) {
  const url = useScanPhotoUrl(scan.id, scan.image_blob ?? null, scan.photoUri);
  const [failedPhoto, setFailedPhoto] = useState<{
    scan: ScanListRecord;
    url: string;
  } | null>(null);
  const failed = failedPhoto?.scan === scan && failedPhoto.url === url;
  return url && !failed ? (
    <img
      src={url}
      alt={scan.disease_name}
      loading={loading}
      className={className}
      onError={() => setFailedPhoto({ scan, url })}
    />
  ) : (
    fallback
  );
}
