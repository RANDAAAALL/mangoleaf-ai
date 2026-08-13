import React, { memo } from "react";
import { translations, type Language } from "@/lib/translations";

interface InfoCalloutCardProps {
  language: Language;
}

export const InfoCalloutCard = memo(function InfoCalloutCard({ language }: InfoCalloutCardProps) {
  const t = translations[language];

  return (
    <div className="bg-[#eaf3e5] border border-[#d3e3ca] p-6 rounded-3xl shadow-xs flex items-start gap-4 transition-colors">
      <div className="h-12 w-12 rounded-2xl bg-[#fbe6cb] border border-[#ebd0b0] flex items-center justify-center text-[#d97706] shrink-0 shadow-xs">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      <div className="flex flex-col gap-1 text-sm flex-1">
        <h4 className="font-bold text-[#1a3d1f]">
          {t.didYouKnowTitle}
        </h4>
        <p
          lang={language === "en" ? "en" : "ceb"}
          className="text-[#3b523f] leading-relaxed text-xs text-justify [text-justify:inter-word] break-words hyphens-auto"
        >
          {t.didYouKnowDesc}
        </p>
      </div>
    </div>
  );
});
