import { memo } from "react";
import { type ScanRecord } from "@/lib/db";
import { translations, type Language } from "@/lib/translations";
import { getBadgeStyles } from "@/lib/get-badge-styles";
import { UNCERTAIN_LABEL } from "@/lib/constants";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { useScanPhotoUrl } from "@/hooks/useScanPhotoUrl";
import { Icon } from "@/components/brand/icon";

interface ScanCardProps {
  scan: ScanRecord;
  imageBlob: Blob | null;
  imageUrlFallback: string | null;
  language: Language;
  onSelect: (scan: ScanRecord) => void;
  onDelete: (id: string) => void;
  // History uses thumbnail rows on phones and full photo cards on wider screens.
  compact?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const ScanCard = memo(function ScanCard({
  scan,
  imageBlob,
  imageUrlFallback,
  language,
  onSelect,
  onDelete,
  compact = false,
  selectionMode = false,
  selected = false,
  disabled = false,
  onToggleSelection,
}: ScanCardProps) {
  const t = translations[language];
  const badgeClass = getBadgeStyles(scan.disease_name);
  const timeAgoText = formatTimeAgo(scan.updated_at, language);
  // Explicit phone lines let the badge fit its longest line. Balancing wrapped
  // text alone leaves the box at the wider available width.
  const uncertainLabelParts =
    scan.disease_name === UNCERTAIN_LABEL
      ? scan.disease_name.split(" / ")
      : null;

  // Metadata-only sync updates keep the existing photo URL and avoid blinking.
  const localImageUrl = useScanPhotoUrl(scan.id, imageBlob);
  const displayUrl = localImageUrl || imageUrlFallback;

  // History changes grid columns in selection mode, so only colors transition.
  return (
    <div
      className={`relative min-w-0 ${compact ? "transition-colors" : "transition-all"} group ${compact ? `grid ${selectionMode ? "grid-cols-[2.75rem_3.5rem_minmax(0,1fr)]" : "grid-cols-[3.5rem_minmax(0,1fr)_2.75rem]"} items-center gap-3 border-b border-[#d2e2c4] py-3 md:flex md:flex-col md:gap-0 md:overflow-hidden md:rounded-3xl md:border md:bg-white md:p-0 md:shadow-xs md:hover:shadow-md ${selected ? "md:border-[#277839] md:ring-2 md:ring-[#277839]" : "md:border-[#e2ebd9]"}` : `flex flex-col rounded-3xl border bg-white overflow-hidden shadow-xs hover:shadow-md ${selected ? "border-[#277839] ring-2 ring-[#277839]" : "border-[#e2ebd9]"}`}`}
    >
      {selectionMode && (
        <label
          className={`${compact ? "flex md:absolute md:top-2 md:left-2 md:bg-white/95 md:shadow-sm" : "absolute top-2 left-2 flex bg-white/95 shadow-sm"} z-10 h-11 w-11 shrink-0 items-center justify-center rounded-xl cursor-pointer`}
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            onChange={() => onToggleSelection?.(scan.id)}
            aria-label={t.historySelectScanLabel.replace(
              "{name}",
              scan.disease_name,
            )}
            className="h-6 w-6 accent-[#277839] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait"
          />
        </label>
      )}

      {/* Reserve photo height from its width. Older Safari can mis-size an
          aspect-ratio child inside a flex card after the viewport changes. */}
      <div
        className={`relative shrink-0 bg-[#f0f5eb] overflow-hidden ${compact ? "h-14 w-14 rounded-xl md:h-auto md:w-full md:rounded-none md:pt-[75%]" : "w-full pt-[75%]"}`}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={scan.disease_name}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${compact ? "md:group-hover:scale-103" : "group-hover:scale-103"}`}
          />
        ) : (
          <div
            className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center text-[#738a77] text-xs font-semibold bg-[#eef5e9] ${compact ? "p-1 md:p-4" : "p-4"}`}
          >
            <Icon
              name="gallery"
              size={32}
              strokeWidth={1.5}
              aria-hidden="true"
              className="mb-1 opacity-50"
            />
            <span className={compact ? "sr-only md:not-sr-only" : undefined}>
              {t.noImageOffline}
            </span>
          </div>
        )}

        {!compact && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md border shadow-xs ${badgeClass}`}
            >
              {scan.disease_name}
            </span>
          </div>
        )}
      </div>

      {/* On phones, the Details button covers the row so the photo and text are
          tappable. On desktop, it returns to the card's information area. */}
      <div
        className={
          compact
            ? "contents md:flex md:w-full md:flex-1 md:flex-col md:justify-between md:gap-3 md:p-5"
            : "p-5 flex flex-col gap-3 flex-1 justify-between"
        }
      >
        <div
          className={
            compact ? "min-w-0 flex flex-col gap-1.5 md:block" : undefined
          }
        >
          {compact && (
            <span
              aria-label={scan.disease_name}
              className={`inline-block self-start w-fit max-w-full rounded-md border px-2 py-1 text-[11px] font-extrabold leading-snug break-words md:absolute md:top-3 md:right-3 ${selectionMode ? "md:max-w-[calc(100%_-_4.5rem)]" : "md:max-w-[calc(100%_-_1.5rem)]"} md:w-auto md:px-2.5 md:text-[10px] md:uppercase md:shadow-xs ${badgeClass}`}
            >
              {uncertainLabelParts ? (
                <>
                  <span className="block md:inline">
                    {uncertainLabelParts[0]} /
                  </span>{" "}
                  <span className="block md:inline">
                    {uncertainLabelParts[1]}
                  </span>
                </>
              ) : (
                scan.disease_name
              )}
            </span>
          )}
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 text-xs text-[#627a66] font-medium break-words">
              {timeAgoText}
            </span>
            {!selectionMode && (
              <button
                type="button"
                onClick={() => onDelete(scan.id)}
                title={t.deleteScanBtn}
                aria-label={t.deleteScanLabel.replace(
                  "{name}",
                  scan.disease_name,
                )}
                disabled={disabled}
                className={`${compact ? "hidden h-11 w-11 shrink-0 items-center justify-center md:flex md:h-auto md:w-auto md:p-1" : "p-1"} text-rose-600 sm:text-slate-300 sm:hover:text-rose-600 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-60`}
              >
                <Icon name="trash" size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(scan)}
          disabled={selectionMode || disabled}
          aria-label={
            compact
              ? t.historyDetailsScanLabel.replace("{name}", scan.disease_name)
              : undefined
          }
          className={
            compact
              ? `${selectionMode ? "hidden md:flex" : "flex"} absolute inset-0 items-center justify-end rounded-xl pr-3 text-[#627a66] cursor-pointer hover:bg-[#277839]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-default disabled:opacity-50 md:static md:mt-1 md:h-auto md:w-full md:shrink-0 md:justify-center md:border md:border-[#277839] md:bg-white md:px-0 md:py-2 md:text-xs md:font-bold md:text-[#277839] md:shadow-xs md:transition-colors md:hover:bg-[#277839] md:hover:text-white md:disabled:hover:bg-white md:disabled:hover:text-[#277839]`
              : "w-full py-2 bg-white border border-[#277839] hover:bg-[#277839] hover:text-white text-[#277839] font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer text-center mt-1 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-[#277839]"
          }
        >
          {compact ? (
            <>
              <span className="hidden md:inline">{t.detailsBtn}</span>
              <Icon
                name="chevron-right"
                size={19}
                aria-hidden="true"
                className="md:hidden"
              />
            </>
          ) : (
            t.detailsBtn
          )}
        </button>
      </div>
    </div>
  );
});
