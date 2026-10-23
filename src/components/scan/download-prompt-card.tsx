import { memo } from "react";
import { Icon } from "@/components/brand/icon";
import { translations, type Language } from "@/lib/translations";
import { AndroidInstallAction } from "@/components/layout/android-install-action";

interface DownloadPromptCardProps {
  language: Language;
  onDownload: () => void;
}

export const DownloadPromptCard = memo(function DownloadPromptCard({
  language,
  onDownload,
}: DownloadPromptCardProps) {
  const t = translations[language];

  return (
    <section
      lang={language === "en" ? "en" : "ceb"}
      className="rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] px-6 py-8 text-center text-[#143519]"
    >
      <Icon
        name="phone"
        size={32}
        className="mx-auto mb-4 text-[#277839]"
        aria-hidden="true"
      />
      <h2 className="text-xl font-bold">{t.downloadPromptTitle}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#526856]">
        {t.downloadPromptDescription}
      </p>
      <AndroidInstallAction
        language={language}
        onGuide={onDownload}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#277839] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1f622d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
      >
        <Icon name="install" size={18} aria-hidden="true" />
      </AndroidInstallAction>
    </section>
  );
});
