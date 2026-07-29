import React, { memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Logo } from "@/components/Logo";

interface FooterProps {
  language: Language;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Footer = memo(function Footer({
  language,
  onOpenPrivacy,
  onOpenTerms,
}: FooterProps) {
  const t = translations[language];

  return (
    <footer className="border-t border-[#e2ebd9] bg-[#edf4e8]/60 mt-16 py-12 text-center transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Logo width={22} height={22} />
          <span className="text-lg font-bold text-[#143519]">
            MangoLeaf AI
          </span>
        </div>

        {/* Text Details */}
        <div className="flex flex-col gap-1 text-xs text-[#526856]">
          <p>{t.footerCopyright}</p>
        </div>

        {/* Legal Links */}
        <div className="flex items-center gap-4 text-xs text-[#425946] font-medium pt-1">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-[#277839] transition-colors cursor-pointer"
          >
            {t.privacyPolicy}
          </button>
          <span>•</span>
          <button
            onClick={onOpenTerms}
            className="hover:text-[#277839] transition-colors cursor-pointer"
          >
            {t.termsOfService}
          </button>
        </div>
      </div>
    </footer>
  );
});
