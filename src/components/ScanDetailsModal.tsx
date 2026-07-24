import { memo } from "react";
import { type ScanRecord } from "@/lib/db";

interface ScanDetailsModalProps {
  scan: ScanRecord;
  imageUrl: string | null;
  language: "en" | "bis";
  guidelineText: { en: string; bis: string };
  onLanguageChange: (lang: "en" | "bis") => void;
  onClose: () => void;
}

export const ScanDetailsModal = memo(function ScanDetailsModal({
  scan,
  imageUrl,
  language,
  guidelineText,
  onLanguageChange,
  onClose,
}: ScanDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Image Header */}
        <div className="w-full aspect-[4/3] bg-slate-950 relative border-b border-slate-850 flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={scan.disease_name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
              No Image Available Offline
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer font-black"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto min-h-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-black tracking-tight text-slate-100">
                Diagnosis: {scan.disease_name}
              </h3>
              <span className="text-xs font-bold text-slate-455 font-mono">
                Scanned on {new Date(scan.updated_at).toLocaleString()}
              </span>
            </div>

            {/* Score badge */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 bg-slate-950 border border-slate-850 text-slate-400 rounded-lg">
                Score: {Math.round(scan.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Guidelines Segment */}
          <div className="border-t border-slate-850 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Pre-treatment Guidelines
              </span>

              {/* English/Bisaya Language Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                <button
                  onClick={() => onLanguageChange("bis")}
                  className={`text-[9px] font-extrabold px-2 py-1 rounded-md transition-all cursor-pointer ${
                    language === "bis"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  Bisaya
                </button>
                <button
                  onClick={() => onLanguageChange("en")}
                  className={`text-[9px] font-extrabold px-2 py-1 rounded-md transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Render the pre-treatment guidelines text */}
            <p className="text-xs text-slate-300 leading-relaxed font-normal bg-slate-950 p-4 rounded-xl border border-slate-850 whitespace-pre-wrap">
              {language === "en" ? guidelineText.en : guidelineText.bis}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/40 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close details
          </button>
        </div>
      </div>
    </div>
  );
});
