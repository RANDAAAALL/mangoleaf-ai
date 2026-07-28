import { useState, memo, useMemo, useRef, useEffect, useCallback } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { ScanCard } from "./ScanCard";

interface ScanHistoryListProps {
  scans: ScanRecord[];
  blobUrlMap: Record<string, string>;
  getGuidelineColor: (diseaseName: string) => DiseaseGuideline["color"];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
}

const BATCH_SIZE = 20;

export const ScanHistoryList = memo(function ScanHistoryList({
  scans,
  blobUrlMap,
  getGuidelineColor,
  onSelectScan,
  onDeleteScan,
}: ScanHistoryListProps) {
  const [displayLimit, setDisplayLimit] = useState<number>(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const visibleScans = useMemo(() => scans.slice(0, displayLimit), [scans, displayLimit]);
  const hasMore = scans.length > displayLimit;

  // Auto-load more cards when the sentinel element enters the viewport (infinite scroll)
  const loadMore = useCallback(() => {
    setDisplayLimit((prev) => prev + BATCH_SIZE);
  }, []);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before the user reaches the bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent">
            📸 Diagnostic Scan History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnosis is done locally. Photos are cached in IndexedDB and uploaded to Supabase Storage when online.
          </p>
        </div>
        <span className="text-xs px-3 py-1 bg-slate-950 border border-slate-850 text-slate-400 rounded-full font-bold">
          Logs Count: {scans.length}
        </span>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-900 rounded-xl bg-slate-955/20 text-slate-550 italic text-sm">
          Scan History is empty. Snap a photo of a mango leaf or fruit to run a diagnosis!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleScans.map((scan) => (
              <ScanCard
                key={scan.id}
                scan={scan}
                imageUrl={blobUrlMap[scan.id] || scan.image_url}
                guidelineColor={getGuidelineColor(scan.disease_name)}
                onSelect={onSelectScan}
                onDelete={onDeleteScan}
              />
            ))}
          </div>

          {/* Invisible sentinel element: triggers auto-load when scrolled into view */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center pt-2">
              <span className="text-xs text-slate-600 italic">
                Loading more scans...
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
