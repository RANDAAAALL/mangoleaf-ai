import { translations, type Language } from "@/lib/translations";

export function ModelStatusBanner({
  language,
  onReload,
}: {
  language: Language;
  onReload: () => void;
}) {
  const t = translations[language];
  return (
    <div
      role="alert"
      className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[#143519]"
    >
      <p>{t.modelLoadFailedText}</p>
      <button
        type="button"
        onClick={onReload}
        className="mt-3 rounded-xl bg-[#2e7d32] px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143519]"
      >
        {t.reloadAppBtn}
      </button>
    </div>
  );
}
