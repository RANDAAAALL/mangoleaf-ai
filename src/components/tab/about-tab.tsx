import { memo } from "react";
import { translations, type Language } from "@/lib/translations";

interface AboutTabProps {
  language: Language;
}

export const AboutTab = memo(function AboutTab({ language }: AboutTabProps) {
  const t = translations[language];
  const contentLang = language === "en" ? "en" : "ceb";

  return (
    <div className="bg-white border border-[#e2ebd9] p-6 sm:p-8 rounded-3xl shadow-xs flex flex-col gap-6 mx-auto">
      <h2 className="text-2xl font-bold text-[#143519]">{t.aboutTitle}</h2>
      <p
        lang={contentLang}
        className="text-sm text-[#3b523f] leading-relaxed text-justify [text-justify:inter-word] break-words hyphens-auto"
      >
        {t.aboutDesc}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-5 bg-[#f6faf1] rounded-2xl border border-[#e2ebd9] flex flex-col gap-2">
          <h4 className="font-bold text-[#143519] text-base">{t.aiEngineTitle}</h4>
          <p
            lang={contentLang}
            className="text-xs text-[#526856] leading-relaxed text-justify [text-justify:inter-word] break-words hyphens-auto"
          >
            {t.aiEngineDesc}
          </p>
        </div>
        <div className="p-5 bg-[#f6faf1] rounded-2xl border border-[#e2ebd9] flex flex-col gap-2">
          <h4 className="font-bold text-[#143519] text-base">{t.offlineSyncTitle}</h4>
          <p
            lang={contentLang}
            className="text-xs text-[#526856] leading-relaxed text-justify [text-justify:inter-word] break-words hyphens-auto"
          >
            {t.offlineSyncDesc}
          </p>
        </div>
      </div>
    </div>
  );
});
