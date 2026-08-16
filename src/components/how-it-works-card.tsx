"use client";

import React, { memo, useId, useState } from "react";
import { translations, type Language } from "@/lib/translations";

interface HowItWorksCardProps {
  language: Language;
}

export const HowItWorksCard = memo(function HowItWorksCard({
  language,
}: HowItWorksCardProps) {
  const t = translations[language];
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();
  const steps = t.HowItWorksDesc.split("\n")
    .map((step) => step.trim().replace(/^\d+\.\s*/, ""))
    .filter(Boolean);

  return (
    <section className="bg-[#eaf3e5] border border-[#d3e3ca] p-5 sm:p-6 rounded-3xl shadow-xs transition-colors mb-5 sm:mb-8">
      <button
        type="button"
        className="w-full flex items-center gap-3 text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <div className="h-8 w-8 rounded-2xl bg-[#fbe6cb] border border-[#ebd0b0] flex items-center justify-center text-[#d97706] shrink-0 shadow-xs">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        <h3 className="font-bold text-[#1a3d1f] text-lg flex-1">
          {t.HowItWorksTitle}
        </h3>

        <svg
          className="h-5 w-5 text-[#3b523f] shrink-0 transition-transform duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <ol
          id={contentId}
          className="mt-4 pl-5 space-y-2 text-xs sm:text-[13px] text-[#3b523f] leading-relaxed list-decimal"
        >
          {steps.map((step) => (
            <li key={step} lang={language === "en" ? "en" : "ceb"}>
              {step}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
});
