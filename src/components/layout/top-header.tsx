import { memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/brand/icon";

interface TopHeaderProps {
  language: Language;
  showInstallButton: boolean;
  activeTab: "home" | "history" | "about";
  onTabChange: (tab: "home" | "history" | "about") => void;
  onLanguageChange: (lang: Language) => void;
  onInstall: () => void;
  onLogoClick: () => void;
}

export const TopHeader = memo(function TopHeader({
  language,
  showInstallButton,
  activeTab,
  onTabChange,
  onLanguageChange,
  onInstall,
  onLogoClick,
}: TopHeaderProps) {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-50 bg-[#f6faf1]/95 backdrop-blur-md border-b border-[#e1ebd7]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo (centered on mobile when no install button) */}
        <div
          onClick={onLogoClick}
          className={`flex items-center gap-2.5 cursor-pointer ${
            !showInstallButton
              ? "md:flex-none flex-1 justify-center md:justify-start"
              : ""
          }`}
        >
          <Logo width={24} height={24} />
          <span className="text-xl font-bold tracking-tight text-[#173a1d] font-sans">
            MangoLeaf AI
          </span>
        </div>

        {/* Mobile: Install icon only (hidden on desktop) */}
        {showInstallButton && (
          <button
            onClick={onInstall}
            aria-label={t.downloadApp}
            className="md:hidden p-2 bg-[#277839] text-white rounded-xl shadow-sm cursor-pointer"
          >
            <Icon name="install" size={18} fill="#ffffff" />
          </button>
        )}

        {/* Desktop Navigation (hidden on mobile — bottom nav handles it) */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-8 text-sm font-semibold text-[#3b523f]">
            <button
              onClick={() => onTabChange("home")}
              className={`hover:text-[#277839] transition-colors cursor-pointer ${
                activeTab === "home" ? "text-[#277839] font-bold" : ""
              }`}
            >
              {t.navHome}
            </button>
            {/* The desktop action opens the phone QR guide regardless of install support. */}
            <button
              onClick={onInstall}
              className="hover:text-[#277839] transition-colors cursor-pointer"
            >
              {t.downloadApp}
            </button>
            <button
              onClick={() => onTabChange("about")}
              className={`hover:text-[#277839] transition-colors cursor-pointer ${
                activeTab === "about" ? "text-[#277839] font-bold" : ""
              }`}
            >
              {t.navAbout}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLanguageChange(language === "en" ? "bis" : "en")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#1b3d20] rounded-xl text-xs font-bold text-[#1b3d20] hover:bg-[#f0f7eb] transition-all cursor-pointer shadow-xs"
            >
              <Icon name="language" size={16} fill="#1b3d20" />
              <span>{language === "en" ? "EN/BIS" : "BIS/EN"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});
