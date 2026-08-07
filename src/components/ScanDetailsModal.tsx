import { memo } from "react";
import { type ScanRecord } from "@/lib/db";
import { translations, type Language } from "@/lib/translations";

interface ScanDetailsModalProps {
  scan: ScanRecord;
  imageUrl: string | null;
  language: Language;
  guidelineText: { en: string; bis: string };
  onLanguageChange: (lang: Language) => void;
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
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Card Container: 2 Columns on Desktop (md:grid-cols-2), 1 Column Stack on Mobile */}
      <div className="bg-white border border-[#e2ebd9] rounded-3xl w-full max-w-md md:max-w-4xl overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-2 max-h-[92vh] my-auto relative">
        
        {/* Floating Close Button (Top-Right of Modal on Mobile & Desktop) */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 h-9 w-9 bg-white/90 hover:bg-white border border-[#d2e2c4] text-[#143519] rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer font-black text-sm"
        >
          ✕
        </button>

        {/* Left Column: Photo Banner */}
        <div className="w-full aspect-[4/3] md:aspect-auto md:h-full bg-[#f0f5eb] relative border-b md:border-b-0 md:border-r border-[#e2ebd9] shrink-0 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={scan.disease_name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#738a77] font-bold text-sm p-6 text-center">
              <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.noImageOffline}</span>
            </div>
          )}

          {/* Floating Disease Badge on Photo */}
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="text-[11px] font-black uppercase px-3 py-1 bg-[#143519]/85 backdrop-blur-md text-white rounded-full shadow-sm tracking-wide">
              {scan.disease_name}
            </span>
          </div>
        </div>

        {/* Right Column: Diagnostic Report & Pre-Treatment Guidelines */}
        <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto min-h-0 gap-5 bg-white">
          <div className="flex flex-col gap-5">
            {/* Header: Title (Full Width) */}
            <div className="flex flex-col gap-2 pr-10">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#143519] leading-snug">
                {t.diagnosisPrefix} {scan.disease_name}
              </h3>

              {/* Sub-header: Timestamp + Score Badge Row */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                <span className="text-xs font-semibold text-[#526856]">
                  {t.scannedOnPrefix} {new Date(scan.updated_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>

                {/* AI Confidence Score Badge */}
                <span className="text-xs font-extrabold px-3 py-1 bg-[#e5f5e0] border border-[#c3e6ba] text-[#1b5e28] rounded-full shadow-xs">
                  {t.scorePrefix} {Math.round(scan.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Treatment Guidelines Section */}
            <div className="border-t border-[#e2ebd9] pt-4 flex flex-col gap-3">
              {/* Guidelines Section Header & Language Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black text-[#143519] uppercase tracking-wider flex items-center gap-1.5">
                  <span>📋</span>
                  <span>{t.preTreatmentGuidelines}</span>
                </span>

                {/* Language Switcher Toggle */}
                <div className="flex items-center gap-1 bg-[#f0f7eb] border border-[#d2e2c4] p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => onLanguageChange("bis")}
                    className={`text-[11px] font-extrabold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      language === "bis"
                        ? "bg-[#277839] text-white shadow-xs"
                        : "text-[#4a634e] hover:text-[#143519]"
                    }`}
                  >
                    Bisaya
                  </button>
                  <button
                    onClick={() => onLanguageChange("en")}
                    className={`text-[11px] font-extrabold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      language === "en"
                        ? "bg-[#277839] text-white shadow-xs"
                        : "text-[#4a634e] hover:text-[#143519]"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Guidelines Text Block (Structured Section Cards) */}
              <div
                lang={language === "en" ? "en" : "ceb"}
                className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 text-left"
              >
                {(() => {
                  const rawText = (language === "en" ? guidelineText.en : guidelineText.bis)
                    .replace(/[ \t]+/g, " ")
                    .replace(/\n[ \t]+/g, "\n")
                    .trim();

                  const paragraphs = rawText.split(/\n\n+/);

                  return paragraphs.map((para, idx) => {
                    const trimmed = para.trim();
                    if (!trimmed) return null;

                    // 1. Source Citation Footer
                    if (trimmed.startsWith("(Source:") || trimmed.startsWith("(Tinubdan:")) {
                      return (
                        <div
                          key={idx}
                          className="mt-1 text-[11px] font-medium italic text-[#3f5e44] bg-[#eaf3e4] border border-[#d2e2c7] px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          <span className="not-italic text-xs">📖</span>
                          <span>{trimmed.replace(/^\(|\)$/g, "")}</span>
                        </div>
                      );
                    }

                    // 2. Headed Sections (e.g. "Chemical Control:", "Kultural nga Pagdumala:")
                    const colonIdx = trimmed.indexOf(":");
                    if (colonIdx > 0 && colonIdx < 40) {
                      const title = trimmed.slice(0, colonIdx).trim();
                      const body = trimmed.slice(colonIdx + 1).trim();

                      const lowerTitle = title.toLowerCase();

                      let icon = "📋";
                      let badgeBg = "bg-[#edf5e8] text-[#1e4823] border-[#d2e2c8]";

                      if (lowerTitle.includes("chemical") || lowerTitle.includes("kemikal") || lowerTitle.includes("tambal")) {
                        icon = "🧪";
                        badgeBg = "bg-[#e5f4e3] text-[#1b5622] border-[#c0e4bc]";
                      } else if (lowerTitle.includes("cultural") || lowerTitle.includes("kultural")) {
                        icon = "🌿";
                        badgeBg = "bg-[#f5f7e6] text-[#4d5917] border-[#e2e7c0]";
                      } else if (lowerTitle.includes("insect") || lowerTitle.includes("insekto")) {
                        icon = "🐛";
                        badgeBg = "bg-[#f4edf9] text-[#552773] border-[#dec7ed]";
                      } else if (lowerTitle.includes("post-harvest") || lowerTitle.includes("pagkahuman")) {
                        icon = "📦";
                        badgeBg = "bg-[#eaf4f8] text-[#1c4e63] border-[#c2e1ed]";
                      }

                      return (
                        <div
                          key={idx}
                          className="bg-[#f7faf4] border border-[#e2ebd9] p-3.5 sm:p-4 rounded-2xl flex flex-col gap-1.5 shadow-2xs transition-all"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{icon}</span>
                            <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-md border ${badgeBg}`}>
                              {title}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#1b3d20] leading-relaxed font-normal text-left pl-0.5">
                            {body}
                          </p>
                        </div>
                      );
                    }

                    // 3. Fallback Standard Paragraph
                    return (
                      <div key={idx} className="bg-[#f7faf4] border border-[#e2ebd9] p-3.5 sm:p-4 rounded-2xl">
                        <p className="text-xs sm:text-sm text-[#1b3d20] leading-relaxed font-normal text-left">
                          {trimmed}
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Modal Footer Action Button */}
          <div className="pt-4 border-t border-[#e2ebd9] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto text-xs px-6 py-2.5 bg-[#277839] text-white hover:bg-[#1f622d] rounded-xl font-bold cursor-pointer transition-colors shadow-xs text-center"
            >
              {t.closeDetailsBtn}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
});
