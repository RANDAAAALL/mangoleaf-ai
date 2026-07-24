import { memo } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";

interface ScanCardProps {
  scan: ScanRecord;
  imageUrl: string | null;
  guidelineColor: DiseaseGuideline["color"];
  onSelect: (scan: ScanRecord) => void;
  onDelete: (id: string) => void;
}

  const cardBorderColors = {
    yellow: "border-amber-800/40 hover:border-amber-700/60 bg-amber-950/5",
    pink: "border-rose-800/40 hover:border-rose-700/60 bg-rose-950/5",
    blue: "border-sky-800/40 hover:border-sky-700/60 bg-sky-950/5",
    green: "border-emerald-800/40 hover:border-emerald-700/60 bg-emerald-950/5",
    purple: "border-purple-800/40 hover:border-purple-700/60 bg-purple-950/5",
  };

export const ScanCard = memo(function ScanCard({
  scan,
  imageUrl,
  guidelineColor,
  onSelect,
  onDelete,
}: ScanCardProps) {
  const isHealthy = scan.disease_name === "Healthy";
  const isUncertain = scan.confidence < 0.70;

  return (
    <div
      onClick={() => onSelect(scan)}
      className={`p-4 rounded-xl border bg-slate-900/95 cursor-pointer flex gap-4 transition-colors duration-300 ${
        cardBorderColors[guidelineColor]
      }`}
    >
      {/* Image Thumbnail */}
      <div className="h-20 w-20 rounded-lg overflow-hidden border border-slate-900 flex-shrink-0 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={scan.disease_name}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-650 font-bold">
            Missing
          </div>
        )}
      </div>

      {/* Diagnostic details */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold tracking-tight truncate text-slate-100">
              {scan.disease_name}
            </span>

            {/* Sync Status Badge */}
            {scan._status === "synced" ? (
              <span className="text-[7.5px] font-bold px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded">
                Cloud
              </span>
            ) : (
              <span className="text-[7.5px] font-bold px-1.5 py-0.5 bg-teal-950/40 border border-teal-900/40 text-teal-400 rounded animate-pulse">
                Local
              </span>
            )}
          </div>

          {/* Confidence level badge */}
          <span
            className={`text-[10px] font-bold ${
              isUncertain ? "text-rose-400" : isHealthy ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            Confidence: {Math.round(scan.confidence * 100)}%
          </span>
        </div>

        {/* Date and Delete actions */}
        <div className="flex items-center justify-between text-[10px] border-t border-slate-900 pt-2 mt-1">
          <span className="text-slate-500 font-mono">
            {new Date(scan.updated_at).toLocaleDateString()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(scan.id);
            }}
            className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});
