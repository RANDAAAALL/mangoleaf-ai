import { useState, memo, useMemo } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { ScanCard } from "./ScanCard";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "./Icon";

interface ScanHistoryListProps {
  scans: ScanRecord[];
  language: Language;
  getGuidelineColor: (diseaseName: string) => DiseaseGuideline["color"];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onViewAllHistory?: () => void;
  isFullHistoryPage?: boolean;
}

const ITEMS_PER_PAGE = 6;

// Helper to generate truncated pagination range (e.g., [1, 2, 3, '...', 10])
function getPaginationRange(
  current: number,
  total: number,
): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export const ScanHistoryList = memo(function ScanHistoryList({
  scans,
  language,
  getGuidelineColor,
  onSelectScan,
  onDeleteScan,
  onViewAllHistory,
  isFullHistoryPage = false,
}: ScanHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const t = translations[language];
  const hasUserScans = scans.length > 0;

  // Filter & search logic
  const filteredScans = useMemo(() => {
    if (!isFullHistoryPage) return scans;
    return scans.filter((scan) => {
      const matchesSearch = scan.disease_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterCategory === "all" ||
        scan.disease_name.toLowerCase().includes(filterCategory.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [scans, searchQuery, filterCategory, isFullHistoryPage]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE) || 1;
  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const visibleScans = useMemo(() => {
    if (!isFullHistoryPage) {
      return filteredScans.slice(0, 4);
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredScans.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredScans, currentPage, isFullHistoryPage]);

  // Reset to page 1 when search or filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Responsive Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Row 1 / Left: Title */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h3 className="text-xl sm:text-2xl font-black text-[#143519] tracking-tight">
            {isFullHistoryPage ? t.scanHistoryTitle : t.recentScansTitle}
          </h3>

          {!isFullHistoryPage && onViewAllHistory && (
            <button
              onClick={onViewAllHistory}
              className="text-xs font-bold text-[#277839] hover:underline flex items-center gap-1 cursor-pointer shrink-0 sm:hidden"
            >
              <span>{t.viewAllHistoryShort}</span>
            </button>
          )}
        </div>

        {/* Row 2 on Mobile / Right side on Desktop: Search & Filter OR Desktop View All link */}
        {isFullHistoryPage ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <svg
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#738a77]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-white border border-[#d2e2c4] rounded-xl text-xs font-semibold text-[#143519] placeholder-[#738a77] focus:outline-none focus:border-[#277839] transition-colors shadow-xs"
              />
            </div>

            {/* Filter selector */}
            <select
              value={filterCategory}
              onChange={handleFilterChange}
              className="w-full sm:w-auto py-2.5 sm:py-2 px-3 bg-white border border-[#d2e2c4] rounded-xl text-xs font-semibold text-[#143519] focus:outline-none focus:border-[#277839] transition-colors shadow-xs cursor-pointer"
            >
              <option value="all">{t.filterAll}</option>
              <option value="anthracnose">Anthracnose</option>
              <option value="healthy">Healthy</option>
              <option value="sooty">Sooty Mold</option>
              <option value="scab">Mango Scab</option>
              <option value="canker">Bacterial Canker</option>
              <option value="black">Bacterial Black Spot</option>
            </select>
          </div>
        ) : (
          /* View All History link on Home Screen (Desktop view) */
          onViewAllHistory && (
            <button
              onClick={onViewAllHistory}
              className="hidden sm:flex text-xs font-bold text-[#277839] items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{t.viewAllHistory}</span>
            </button>
          )
        )}
      </div>

      {/* Text-Only Empty State (when 0 scans exist on device) */}
      {!hasUserScans ? (
        <div className="bg-[#eaf3e5] border border-[#d3e3ca] p-6 sm:p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-2 shadow-xs">
          <Icon name="history" size={27} />
          <h4 className="text-sm sm:text-base font-bold text-[#143519]">
            {t.noScanHistoryTitle}
          </h4>
          <p className="text-xs text-[#526856] max-w-md">
            {t.noScanHistoryText}
          </p>
        </div>
      ) : (
        /* Responsive Grid for Scans (Max 6 per page on History Screen [3 cols x 2 rows], Max 4 on Home Screen [4 cols]) */
        <div
          className={`grid gap-4 sm:gap-6 ${!isFullHistoryPage ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
        >
          {visibleScans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              imageBlob={scan.image_blob || null}
              imageUrlFallback={scan.image_url}
              language={language}
              guidelineColor={getGuidelineColor(scan.disease_name)}
              onSelect={onSelectScan}
              onDelete={onDeleteScan}
            />
          ))}
        </div>
      )}

      {/* Smart Truncated Pagination Bar (Handles 10+ pages gracefully with '...') */}
      {isFullHistoryPage && hasUserScans && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-6 flex-wrap w-full">
          {/* Prev Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              currentPage === 1
                ? "bg-[#eaf3e5] border border-[#d3e3ca] cursor-not-allowed"
                : "bg-white border-[#d2e2c4] text-[#143519] hover:bg-[#f0f7eb] cursor-pointer"
            }`}
          >
            Prev
          </button>

          {/* Numbered Page Buttons & Truncation Ellipsis (...) */}
          {paginationRange.map((item, idx) => {
            if (typeof item === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-xs text-[#738a77] font-bold select-none"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={`page-${item}`}
                onClick={() => setCurrentPage(item)}
                className={`min-w-[32px] h-8 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${
                  currentPage === item
                    ? "bg-[#1b5e28] border-[#1b5e28] text-white shadow-xs"
                    : "bg-white border-[#d2e2c4] text-[#143519] hover:bg-[#f0f7eb]"
                }`}
              >
                {item}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              currentPage === totalPages
                ? "bg-[#eaf3e5] border border-[#d3e3ca] text-slate-400 cursor-not-allowed"
                : "bg-white border-[#d2e2c4] text-[#143519] hover:bg-[#f0f7eb] cursor-pointer"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});
