import React, { memo, useState, useEffect } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { translations, type Language } from "@/lib/translations";
import { getBadgeStyles } from "@/lib/get-badge-styles";
import { formatTimeAgo } from "@/lib/format-time-ago";

interface ScanCardProps {
  scan: ScanRecord;
  imageBlob: Blob | null;
  imageUrlFallback: string | null;
  guidelineColor: DiseaseGuideline["color"];
  language: Language;
  onSelect: (scan: ScanRecord) => void;
  onDelete: (id: string) => void;
}

export const ScanCard = memo(function ScanCard({
  scan,
  imageBlob,
  imageUrlFallback,
  language,
  onSelect,
  onDelete,
}: ScanCardProps) {
  const t = translations[language];
  const badgeClass = getBadgeStyles(scan.disease_name);
  const timeAgoText = formatTimeAgo(scan.updated_at, language);

  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageBlob && imageBlob.size > 0) {
      const url = URL.createObjectURL(imageBlob);
      setLocalBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLocalBlobUrl(null);
  }, [imageBlob]);

  const displayUrl = localBlobUrl || imageUrlFallback;

  return (
    <div className="bg-white border border-[#e2ebd9] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      {/* Top Image Box with Badge */}
      <div className="relative aspect-[4/3] bg-[#f0f5eb] overflow-hidden">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={scan.disease_name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#738a77] text-xs font-semibold bg-[#eef5e9]">
            <svg className="h-8 w-8 mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t.noImageOffline}</span>
          </div>
        )}

        {/* Floating Disease Badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border shadow-xs ${badgeClass}`}>
            {scan.disease_name}
          </span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-[#627a66] font-medium">
            {timeAgoText}
          </span>

          <button
            onClick={() => onDelete(scan.id)}
            title="Delete scan log"
            className="text-rose-600 sm:text-slate-300 sm:hover:text-rose-600 transition-colors p-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Details Button */}
        <button
          onClick={() => onSelect(scan)}
          className="w-full py-2 bg-white border border-[#277839] hover:bg-[#277839] hover:text-white text-[#277839] font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer text-center mt-1"
        >
          {t.detailsBtn}
        </button>
      </div>
    </div>
  );
});
