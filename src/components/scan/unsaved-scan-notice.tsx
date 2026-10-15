import { translations, type Language } from "@/lib/translations";

interface UnsavedScanNoticeProps {
  language: Language;
  onRetry: () => void;
  onDiscard: () => void;
}

export function UnsavedScanNotice({
  language,
  onRetry,
  onDiscard,
}: UnsavedScanNoticeProps) {
  const t = translations[language];
  return (
    <section
      aria-label={t.storageUnsavedTitle}
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <h2 className="font-bold">{t.storageUnsavedTitle}</h2>
      <p className="text-sm leading-relaxed">{t.storagePendingText}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-xl bg-[#277839] px-4 py-3 text-sm font-bold text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
        >
          {t.storageRetrySaveBtn}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="min-h-11 rounded-xl border border-amber-300 px-4 py-3 text-sm font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
        >
          {t.storageDiscardBtn}
        </button>
      </div>
    </section>
  );
}
