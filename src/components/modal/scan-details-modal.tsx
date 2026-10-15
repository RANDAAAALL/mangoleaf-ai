import { memo } from "react";
import { type ScanRecord } from "@/lib/db";
import { translations, type Language } from "@/lib/translations";
import { UNCERTAIN_LABEL } from "@/lib/constants";
import { getBadgeStyles } from "@/lib/get-badge-styles";
// This type-only import is erased from the browser bundle.
import type { DiagnosisResult } from "@/lib/classifier";

interface ScanDetailsModalProps {
  scan: ScanRecord;
  imageUrl: string | null;
  language: Language;
  guidelineText: { en: string; bis: string };
  onLanguageChange: (lang: Language) => void;
  onClose: () => void;
  // History records may have no display rows.
  diagnosedResultTabular?: DiagnosisResult["diagnosedResultTabular"];
}

export const ScanDetailsModal = memo(function ScanDetailsModal({
  scan,
  imageUrl,
  language,
  guidelineText,
  onLanguageChange,
  onClose,
  // An empty array hides rows for saved reports.
  // Enable or disable all three PANEL TABLE sections together.
  // PANEL TABLE 1/3: Comment only the parameter line below to hide the table.
  diagnosedResultTabular = [],
}: ScanDetailsModalProps) {
  const t = translations[language];
  const badgeClass = getBadgeStyles(scan.disease_name);

  // These percentages are model scores,
  // not measured accuracy. Rejected scans keep their existing diagnosis label.
  // PANEL TABLE 2/3 START: Comment the code below through its closing ); line.
  const classProbabilityTable = diagnosedResultTabular.length > 0 && (
    <div className="overflow-x-auto border-t border-[#e2ebd9] pt-4">
      <table className="w-full text-sm text-[#143519]">
        <caption className="mb-2 text-center font-semibold">
          {t.classProbabilityHeading}
        </caption>
        <thead>
          <tr className="border-b border-[#e2ebd9]">
            <th scope="col" className="py-2 text-left">
              {t.classColumn}
            </th>
            <th scope="col" className="py-2 text-right">
              {t.probabilityColumn}
            </th>
          </tr>
        </thead>
        <tbody>
          {diagnosedResultTabular.map((row) => (
            <tr key={row.Class} className="border-b border-[#e2ebd9]">
              <td className="py-2">{row.Class}</td>
              <td className="py-2 text-right tabular-nums">
                {row.Probability}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  // PANEL TABLE 2/3 END

  return (
    <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Card Container: 2 Columns on Desktop (md:grid-cols-2), 1 Column Stack on Mobile */}
      <div className="bg-white border border-[#e2ebd9] rounded-3xl w-full max-w-md md:max-w-4xl overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:h-[640px] max-h-[92dvh] my-auto relative">
        {/* Floating Close Button (Top-Right of Modal on Mobile & Desktop) */}
        <button
          onClick={onClose}
          aria-label={t.closeDetailsBtn}
          className="absolute top-4 right-4 z-30 h-9 w-9 bg-white/90 hover:bg-white border border-[#d2e2c4] text-[#143519] rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer font-black text-sm"
        >
          ✕
        </button>

        {/* Left Column: Photo Banner */}
        <div className="w-full min-w-0 min-h-0 aspect-[4/3] md:aspect-auto bg-[#f0f5eb] relative border-b md:border-b-0 md:border-r border-[#e2ebd9] shrink-0 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={scan.disease_name}
              className="absolute inset-0 object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#738a77] font-bold text-sm p-6 text-center">
              <svg
                className="h-10 w-10 mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{t.noImageOffline}</span>
            </div>
          )}

          {/* Keep both badges inside the photo and let long names wrap. */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2 pointer-events-none">
            <span
              className={`min-w-0 text-[11px] leading-snug break-words font-black uppercase px-2 py-1 ${badgeClass} backdrop-blur-md rounded-2xl shadow-sm tracking-wide`}
            >
              {scan.disease_name}
            </span>
            {/* AI Confidence Score Badge */}
            {scan.disease_name && (
              <span
                className={`shrink-0 text-[11px] leading-snug font-black uppercase px-2 py-1 ${badgeClass} backdrop-blur-md rounded-full shadow-sm tracking-wide`}
              >
                {Math.round(scan.confidence * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic Report & Treatment Guidelines */}
        <div className="p-4 sm:p-8 flex flex-col justify-between shrink-0 md:overflow-y-auto min-h-0 min-w-0 gap-5 bg-white">
          <div className="flex flex-col gap-3.5">
            {/* Header: Title (Full Width) */}
            {/* <div className="flex flex-col gap-2 pr-10"> */}
            <div className="flex justify-center">
              {/* <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#143519] leading-snug">
                {t.diagnosisPrefix} {scan.disease_name}
              </h3> */}

              {/* Sub-header: Timestamp + Score Badge Row */}
              {/* <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5"> */}
              <span className="text-xs font-semibold text-[#526856]">
                {t.scannedOnPrefix}{" "}
                {new Date(scan.updated_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>

              {/* AI Confidence Score Badge */}
              {/* {scan.disease_name !== UNCERTAIN_LABEL && (
                  <span className="text-xs font-extrabold px-3 py-1 bg-[#e5f5e0] border border-[#c3e6ba] text-[#1b5e28] rounded-full shadow-xs">
                    {t.scorePrefix} {Math.round(scan.confidence * 100)}%
                  </span>
                )} */}
              {/* </div> */}
            </div>

            {
              // PANEL TABLE 3/3: Comment only the line below; keep the surrounding braces.
              classProbabilityTable
            }

            {/* Treatment Guidelines Section */}
            <div className="border-t border-[#e2ebd9] pt-4 flex flex-col gap-3">
              {/* Guidelines Section Header & Language Toggle */}
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="text-xs font-black text-[#143519] uppercase tracking-wider flex items-center gap-1.5">
                  <span>
                    {scan.disease_name === UNCERTAIN_LABEL
                      ? t.uncertainPhotoHeading
                      : t.preTreatmentGuidelines}
                  </span>
                </span>

                {/* Language Switcher Toggle */}
                <div className="flex items-center justify-center sm:justify-start gap-1 bg-[#f0f7eb] border border-[#d2e2c4] p-1 rounded-xl sm:self-auto">
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

              {/* Guidelines Text Block */}
              <div
                lang={language === "en" ? "en" : "ceb"}
                className="bg-[#f7faf4] border border-[#e2ebd9] rounded-2xl p-4 sm:p-5 max-h-[320px] overflow-y-auto"
              >
                {(() => {
                  const rawText = (
                    language === "en" ? guidelineText.en : guidelineText.bis
                  )
                    .replace(/\(Source:.*?\)/gi, "")
                    .replace(/\(Tinubdan:.*?\)/gi, "")
                    .trim();

                  const paragraphs = rawText
                    .split(/\n\s*\n+/)
                    .map((p) => p.trim())
                    .filter(Boolean);

                  return paragraphs.map((para, idx) => {
                    const colonIdx = para.indexOf(":");
                    if (colonIdx > 0 && colonIdx < 55) {
                      const headerPart = para.slice(0, colonIdx + 1);
                      const bodyPart = para.slice(colonIdx + 1);

                      return (
                        <p
                          key={idx}
                          className={`text-xs sm:text-[13px] text-[#2d4a32] leading-relaxed text-justify ${idx > 0 ? "mt-3.5" : ""}`}
                        >
                          <span className="font-extrabold text-[#113a17] tracking-tight">
                            {headerPart}
                          </span>
                          {bodyPart}
                        </p>
                      );
                    }

                    return (
                      <p
                        key={idx}
                        className={`text-xs sm:text-[13px] text-[#2d4a32] leading-relaxed text-justify ${idx > 0 ? "mt-3.5" : ""}`}
                      >
                        {para}
                      </p>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Modal Footer Action Button */}
          <div className="border-[#e2ebd9] flex justify-end shrink-0">
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
