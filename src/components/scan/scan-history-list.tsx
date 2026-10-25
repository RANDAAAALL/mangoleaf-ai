import {
  useState,
  memo,
  useMemo,
  useRef,
  useCallback,
  useId,
  useEffect,
} from "react";
import { type ScanListRecord } from "@/lib/scan-photo";
import { ScanCard } from "./scan-card";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "@/components/brand/icon";
import { DeleteScansModal } from "@/components/modal/delete-scans-modal";
import {
  createDiagnosticOperation,
  diagnosticErrorName,
  recordDiagnostic,
} from "@/lib/diagnostics";

interface ScanHistoryListProps {
  scans: ScanListRecord[];
  language: Language;
  onSelectScan: (scan: ScanListRecord) => void;
  onDeleteScan: (id: string) => Promise<void>;
  onDeleteScans?: (ids: string[]) => Promise<void>;
  onViewAllHistory?: () => void;
  onScanPress?: () => void;
  isFullHistoryPage?: boolean;
}

const MOBILE_ITEMS_PER_PAGE = 4;
const DESKTOP_ITEMS_PER_PAGE = 6;
const MOBILE_HOME_PREVIEW_COUNT = 1;
const DESKTOP_HOME_PREVIEW_COUNT = 4;

/** Filter metadata across History, then mount photos for the current page only. */
export const ScanHistoryList = memo(function ScanHistoryList({
  scans,
  language,
  onSelectScan,
  onDeleteScan,
  onDeleteScans,
  onViewAllHistory,
  onScanPress,
  isFullHistoryPage = false,
}: ScanHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: isFullHistoryPage
      ? MOBILE_ITEMS_PER_PAGE
      : MOBILE_HOME_PREVIEW_COUNT,
  });
  const { currentPage, itemsPerPage } = pagination;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmationIds, setConfirmationIds] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const deletingRef = useRef(false);
  const historyHeadingRef = useRef<HTMLHeadingElement>(null);
  const filterPanelId = useId();
  const filterSelectId = useId();
  const selectionHintId = useId();
  const deleteDialogWasOpen = useRef(false);

  useEffect(() => {
    if (confirmationIds?.length) {
      recordDiagnostic("history.delete.dialog.opened", {
        count: confirmationIds.length,
      });
      deleteDialogWasOpen.current = true;
    } else if (deleteDialogWasOpen.current) {
      recordDiagnostic("history.delete.dialog.closed");
      deleteDialogWasOpen.current = false;
    }
  }, [confirmationIds]);

  useEffect(() => {
    // Read the viewport after hydration, using the layout's md breakpoint.
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const updatePageSize = () => {
      const nextPageSize = isFullHistoryPage
        ? desktopQuery.matches
          ? DESKTOP_ITEMS_PER_PAGE
          : MOBILE_ITEMS_PER_PAGE
        : desktopQuery.matches
          ? DESKTOP_HOME_PREVIEW_COUNT
          : MOBILE_HOME_PREVIEW_COUNT;
      setPagination((current) => {
        if (current.itemsPerPage === nextPageSize) return current;
        // Keep the old page's first scan on screen when the page size changes.
        const firstScanIndex = (current.currentPage - 1) * current.itemsPerPage;
        return {
          currentPage: Math.floor(firstScanIndex / nextPageSize) + 1,
          itemsPerPage: nextPageSize,
        };
      });
    };

    desktopQuery.addEventListener("change", updatePageSize);
    updatePageSize();
    // Remove the listener when the list unmounts or switches between tabs.
    return () => desktopQuery.removeEventListener("change", updatePageSize);
  }, [isFullHistoryPage]);

  const t = translations[language];
  const hasUserScans = scans.length > 0;

  // Search and filter apply on the History tab only. On Home the list is short
  // enough that neither control is shown.
  const searchMatchedScans = useMemo(() => {
    if (!isFullHistoryPage) return scans;
    return scans.filter((scan) =>
      scan.disease_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [scans, searchQuery, isFullHistoryPage]);

  // Count all search matches before the category filter or pagination. Choosing
  // a category must not hide the totals available in the other categories.
  const filterOptions = useMemo(
    () =>
      [
        { value: "all", label: t.filterAll },
        { value: "anthracnose", label: t.historyFilterAnthracnose },
        { value: "healthy", label: t.historyFilterHealthy },
        { value: "sooty", label: t.historyFilterSooty },
        { value: "scab", label: t.historyFilterScab },
        { value: "canker", label: t.historyFilterCanker },
        { value: "black", label: t.historyFilterBlack },
        // Rejected scans keep the existing word, outside the model classes.
        { value: "uncertain", label: t.historyFilterUncertain },
      ].map((option) => ({
        ...option,
        // Home does not show filters, so it does not need these counts.
        count: !isFullHistoryPage
          ? 0
          : option.value === "all"
            ? searchMatchedScans.length
            : searchMatchedScans.reduce(
                (count, scan) =>
                  count +
                  Number(
                    scan.disease_name.toLowerCase().includes(option.value),
                  ),
                0,
              ),
      })),
    [searchMatchedScans, t, isFullHistoryPage],
  );
  const activeFilterLabel = filterOptions.find(
    (option) => option.value === filterCategory,
  )?.label;

  const filteredScans = useMemo(() => {
    if (!isFullHistoryPage || filterCategory === "all") {
      return searchMatchedScans;
    }
    return searchMatchedScans.filter((scan) =>
      scan.disease_name.toLowerCase().includes(filterCategory.toLowerCase()),
    );
  }, [searchMatchedScans, filterCategory, isFullHistoryPage]);

  const matchingIds = useMemo(
    () => new Set(filteredScans.map((scan) => scan.id)),
    [filteredScans],
  );
  const activeSelectedIds = selectedIds.filter((id) => matchingIds.has(id));
  const selectedIdSet = new Set(activeSelectedIds);
  // Deletion in another tab can remove a selected scan. Forget its selection so
  // a later record with that ID cannot become selected without another click.
  if (activeSelectedIds.length !== selectedIds.length) {
    setSelectedIds(activeSelectedIds);
  }

  const toggleSelection = useCallback((id: string) => {
    recordDiagnostic("history.selection.toggled");
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }, []);

  const cancelSelection = () => {
    recordDiagnostic("history.selection.cancelled");
    setSelectionMode(false);
    setSelectedIds([]);
    setDeleteFailed(false);
    historyHeadingRef.current?.focus({ preventScroll: true });
  };

  const selectAllMatching = () => {
    recordDiagnostic("history.selection.all", { count: filteredScans.length });
    // Capture the current matching IDs across pages. Later arrivals need
    // another deliberate selection action.
    setSelectedIds(filteredScans.map((scan) => scan.id));
  };

  const openDeleteConfirmation = () => {
    setDeleteFailed(false);
    setConfirmationIds([...activeSelectedIds]);
  };

  const openSingleDeleteConfirmation = useCallback((id: string) => {
    if (deletingRef.current) return;
    // The trash button only opens this same confirmation. Keep its one ID
    // fixed even if new scans arrive before the user presses Delete.
    setDeleteFailed(false);
    setConfirmationIds([id]);
  }, []);

  const handleConfirmDelete = async () => {
    if (
      !confirmationIds?.length ||
      deletingRef.current ||
      (!onDeleteScans && confirmationIds.length !== 1)
    ) {
      return;
    }
    // Freeze the confirmed IDs. New arrivals and other pages cannot expand the
    // deletion while the local transaction is waiting to finish.
    const idsToDelete = [...confirmationIds];
    const operation = createDiagnosticOperation("delete-ui");
    recordDiagnostic("history.delete.confirmed", {
      operation,
      count: idsToDelete.length,
    });
    deletingRef.current = true;
    setIsDeleting(true);
    setDeleteFailed(false);
    try {
      // Await the local save for either one trash-button scan or a batch.
      // Closing early would hide a failed deletion instead of offering retry.
      if (onDeleteScans) await onDeleteScans(idsToDelete);
      else await onDeleteScan(idsToDelete[0]);
      recordDiagnostic("history.delete.caller.completed", { operation });
      setSelectedIds([]);
      setSelectionMode(false);
      setConfirmationIds(null);
    } catch (error) {
      recordDiagnostic("history.delete.caller.failed", {
        operation,
        errorName: diagnosticErrorName(error),
      });
      // Keep the confirmation and selection available for a deliberate retry.
      setDeleteFailed(true);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  // Keep the selected page valid when deletion removes the last page.
  const totalPages = Math.ceil(filteredScans.length / itemsPerPage) || 1;
  if (currentPage > totalPages) {
    setPagination((current) => ({ ...current, currentPage: totalPages }));
  }

  const visibleScans = useMemo(() => {
    if (!isFullHistoryPage) {
      // Render one Home card on phones and up to four on desktop. Extra phone
      // cards are not mounted, so their photos do not need loading.
      return filteredScans.slice(0, itemsPerPage);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredScans.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredScans, currentPage, itemsPerPage, isFullHistoryPage]);

  // Back to page 1 on every search or filter change, otherwise a user sitting on
  // page 4 of the old results would land on a page the new results do not have.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Typing or clearing search starts with all conditions so an old filter
    // cannot hide matching scans.
    setFilterCategory("all");
    // Close the phone's filter bar and return its icon to the inactive state.
    setFiltersOpen(false);
    setPagination((current) => ({ ...current, currentPage: 1 }));
    setSelectedIds([]);
    setDeleteFailed(false);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
    setPagination((current) => ({ ...current, currentPage: 1 }));
    setSelectedIds([]);
    setDeleteFailed(false);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      {isFullHistoryPage ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:flex-wrap md:justify-between">
          <div
            className={
              selectionMode
                ? "col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-[#eaf3e5] p-2 md:flex md:w-full md:flex-wrap md:gap-3 md:p-3"
                : "contents"
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              {selectionMode && (
                <button
                  type="button"
                  aria-label={t.historyCancelSelectionBtn}
                  onClick={cancelSelection}
                  disabled={isDeleting}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#143519] cursor-pointer hover:bg-[#eaf3e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-50"
                >
                  <Icon name="close" size={22} aria-hidden="true" />
                </button>
              )}
              <h3
                ref={historyHeadingRef}
                tabIndex={-1}
                className="min-w-0 rounded-sm text-lg font-black tracking-tight text-[#143519] break-words md:text-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
              >
                {selectionMode ? (
                  <span aria-live="polite" aria-atomic="true">
                    {t.historySelectedCount.replace(
                      "{n}",
                      String(activeSelectedIds.length),
                    )}
                  </span>
                ) : (
                  t.scanHistoryTitle
                )}
              </h3>
            </div>

            {selectionMode && onDeleteScans ? (
              <>
                <button
                  type="button"
                  onClick={selectAllMatching}
                  aria-describedby={selectionHintId}
                  disabled={isDeleting || filteredScans.length === 0}
                  className="min-h-11 min-w-11 rounded-xl px-3 py-2 text-sm font-bold text-[#277839] cursor-pointer hover:bg-[#eaf3e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-default disabled:opacity-50 md:ml-auto md:border md:border-[#277839] md:bg-white md:px-4"
                >
                  <span className="md:hidden">
                    {t.historySelectAllResultsBtn}
                  </span>
                  <span className="hidden md:inline">
                    {t.historySelectAllCountBtn.replace(
                      "{n}",
                      String(filteredScans.length),
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openDeleteConfirmation}
                  disabled={isDeleting || activeSelectedIds.length === 0}
                  className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white cursor-pointer hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-default disabled:opacity-50 md:inline-flex"
                >
                  <Icon name="trash" size={16} aria-hidden="true" />
                  {t.historyDeleteSelectedCountBtn.replace(
                    "{n}",
                    String(activeSelectedIds.length),
                  )}
                </button>
              </>
            ) : (
              <>
                {onDeleteScans && (
                  <button
                    type="button"
                    aria-pressed={selectionMode}
                    onClick={() => {
                      setSelectionMode(true);
                      historyHeadingRef.current?.focus({ preventScroll: true });
                    }}
                    disabled={!hasUserScans || isDeleting}
                    className="min-h-11 min-w-11 shrink-0 rounded-xl bg-[#277839] px-3 py-2 text-sm font-bold text-white cursor-pointer hover:bg-[#1f622d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-default disabled:opacity-50 md:order-3 md:border md:border-[#277839] md:bg-white md:px-4 md:text-[#277839] md:hover:bg-[#f0f7eb]"
                  >
                    {t.historySelectBtn}
                  </button>
                )}
              </>
            )}
          </div>
          <div
            className={`col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_2.75rem] gap-2.5 ${selectionMode ? "md:hidden" : "md:order-2 md:ml-auto md:flex md:items-center"}`}
          >
            <div className="relative min-w-0 md:w-52">
              <Icon
                name="search"
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#738a77]"
              />
              <input
                type="text"
                aria-label={t.searchPlaceholder}
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={isDeleting}
                className="min-h-11 w-full rounded-xl border border-[#d2e2c4] bg-white py-2.5 pr-3 pl-9 text-xs font-semibold text-[#143519] placeholder-[#738a77] shadow-xs transition-colors focus:outline-none focus:border-[#277839] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
              />
            </div>
            <button
              type="button"
              aria-label={
                filterCategory === "all"
                  ? t.historyFilterBtn
                  : t.historyFilterActiveBtn.replace(
                      "{name}",
                      activeFilterLabel || t.filterAll,
                    )
              }
              aria-expanded={filtersOpen}
              aria-controls={filterPanelId}
              onClick={() => setFiltersOpen((open) => !open)}
              disabled={isDeleting}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-[#277839] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-50 md:hidden ${filtersOpen || filterCategory !== "all" ? "border-[#277839] bg-[#eaf3e5]" : "border-[#d2e2c4] bg-white hover:bg-[#f0f7eb]"}`}
            >
              <Icon name="filter" size={21} aria-hidden="true" />
              {filterCategory !== "all" && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#277839]"
                />
              )}
            </button>
            <div
              id={filterPanelId}
              className={`relative col-span-2 min-w-0 ${filtersOpen ? "block" : "hidden"} md:block`}
            >
              <label htmlFor={filterSelectId} className="sr-only">
                {t.historyFilterLabel}
              </label>
              <select
                id={filterSelectId}
                value={filterCategory}
                onChange={handleFilterChange}
                disabled={isDeleting}
                className="min-h-11 w-full appearance-none rounded-xl border border-[#d2e2c4] bg-white py-2.5 pr-11 pl-3 text-xs font-semibold text-[#143519] shadow-xs transition-colors cursor-pointer focus:outline-none focus:border-[#277839] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t.historyFilterOptionCount
                      .replace("{name}", option.label)
                      .replace("{n}", String(option.count))}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#277839]"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center justify-between w-full">
            <h3
              ref={historyHeadingRef}
              tabIndex={-1}
              className="rounded-sm text-xl sm:text-2xl font-black text-[#143519] tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
            >
              {/* Phones keep their existing heading. Desktop wording follows
                  the displayed cards as scans are added or removed. */}
              <span className="md:hidden">{t.recentScansTitle}</span>
              <span className="hidden md:inline">
                {visibleScans.length > 1
                  ? t.recentScansDesktopTitle
                  : t.recentScanDesktopTitle}
              </span>
            </h3>
            {onViewAllHistory && (
              <button
                onClick={onViewAllHistory}
                className="text-xs font-bold text-[#277839] hover:underline flex items-center cursor-pointer shrink-0 sm:hidden"
              >
                <span>{t.viewAllHistoryShort}</span>
              </button>
            )}
          </div>
          {onViewAllHistory && (
            <button
              onClick={onViewAllHistory}
              className="hidden sm:flex text-xs font-bold text-[#277839] items-center cursor-pointer shrink-0"
            >
              <span>{t.viewAllHistory}</span>
            </button>
          )}
        </div>
      )}

      {isFullHistoryPage && selectionMode && (
        <p id={selectionHintId} className="sr-only">
          {t.historySelectionHint}
        </p>
      )}

      {!hasUserScans ? (
        <div className="bg-[#eaf3e5] border border-[#d3e3ca] p-6 sm:p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-2 shadow-xs">
          <Icon name="history" size={27} />
          <h4 className="text-sm sm:text-base font-bold text-[#143519]">
            {t.noScanHistoryTitle}
          </h4>
          <p className="text-xs text-[#526856] max-w-md">
            {t.noScanHistoryText}
          </p>
          {/* The mobile scan action lives in the bottom navigation. Desktop
              needs an explicit action when no scan cards exist yet. */}
          {onScanPress && (
            <button
              type="button"
              onClick={onScanPress}
              className="mt-2 hidden md:inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#277839] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#1f622d] active:scale-98"
            >
              <Icon name="scan" size={18} strokeWidth={2.5} />
              {t.aboutScanLeafCta}
            </button>
          )}
        </div>
      ) : filteredScans.length === 0 ? (
        <p role="status" className="py-8 text-center text-sm text-[#526856]">
          {t.historyNoMatchingResults}
        </p>
      ) : (
        <div
          className={`grid ${isFullHistoryPage ? "grid-cols-1 md:grid-cols-2 md:gap-6 lg:grid-cols-3" : "w-full max-w-sm grid-cols-1 gap-4 sm:gap-6 md:max-w-none md:grid-cols-4"}`}
        >
          {visibleScans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              language={language}
              onSelect={onSelectScan}
              onDelete={openSingleDeleteConfirmation}
              compact={isFullHistoryPage}
              selectionMode={isFullHistoryPage && selectionMode}
              selected={selectedIdSet.has(scan.id)}
              disabled={isDeleting}
              onToggleSelection={toggleSelection}
            />
          ))}
        </div>
      )}

      {/* Delete button for mobile only */}
      {isFullHistoryPage && selectionMode && onDeleteScans && (
        <button
          type="button"
          onClick={openDeleteConfirmation}
          disabled={isDeleting || activeSelectedIds.length === 0}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white cursor-pointer hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-default disabled:opacity-50 md:hidden"
        >
          <Icon name="trash" size={17} aria-hidden="true" />
          {(activeSelectedIds.length === 1
            ? t.historyDeleteSelectedOneBtn
            : t.historyDeleteSelectedBtn
          ).replace("{n}", String(activeSelectedIds.length))}
        </button>
      )}

      {/* History uses four records on mobile and six at the md breakpoint. */}
      {isFullHistoryPage && hasUserScans && totalPages > 1 && (
        <nav
          aria-label={t.scanHistoryTitle}
          className="flex items-center justify-center gap-3 pt-2 w-full"
        >
          <button
            type="button"
            aria-label={t.previousPage}
            onClick={() =>
              setPagination((current) => ({
                ...current,
                currentPage: Math.max(current.currentPage - 1, 1),
              }))
            }
            disabled={currentPage === 1 || isDeleting}
            className="h-11 w-11 shrink-0 rounded-xl border border-[#d2e2c4] bg-white text-[#143519] text-lg font-bold transition-colors hover:bg-[#f0f7eb] cursor-pointer disabled:bg-[#eaf3e5] disabled:text-[#738a77] disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="text-xs sm:text-sm font-bold text-[#143519] whitespace-nowrap tabular-nums"
          >
            {t.pageOfTotal
              .replace("{n}", String(currentPage))
              .replace("{total}", String(totalPages))}
          </span>
          <button
            type="button"
            aria-label={t.nextPage}
            onClick={() =>
              setPagination((current) => ({
                ...current,
                currentPage: Math.min(current.currentPage + 1, totalPages),
              }))
            }
            disabled={currentPage === totalPages || isDeleting}
            className="h-11 w-11 shrink-0 rounded-xl border border-[#d2e2c4] bg-white text-[#143519] text-lg font-bold transition-colors hover:bg-[#f0f7eb] cursor-pointer disabled:bg-[#eaf3e5] disabled:text-[#738a77] disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </nav>
      )}

      {confirmationIds && (
        <DeleteScansModal
          count={confirmationIds.length}
          language={language}
          isDeleting={isDeleting}
          hasError={deleteFailed}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => {
            recordDiagnostic("history.delete.cancelled");
            setConfirmationIds(null);
          }}
          fallbackFocusRef={historyHeadingRef}
        />
      )}
    </div>
  );
});
