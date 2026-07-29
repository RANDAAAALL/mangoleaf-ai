import React, { useState, useEffect, memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

interface HeaderProps {
  showInstallButton: boolean;
  language: Language;
  activeTab?: "home" | "history" | "about";
  onTabChange?: (tab: "home" | "history" | "about") => void;
  onLanguageChange: (lang: Language) => void;
  onInstall: () => void;
}

export const Header = memo(function Header({
  showInstallButton,
  language,
  activeTab = "home",
  onTabChange,
  onLanguageChange,
  onInstall,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = translations[language];

  // Lock background body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  const toggleLanguage = () => {
    onLanguageChange(language === "en" ? "bis" : "en");
  };

  const handleNavClick = (tab: "home" | "history" | "about") => {
    onTabChange?.(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[#e1ebd7] transition-colors ${
        isMobileMenuOpen ? "bg-[#f6faf1]" : "bg-[#f6faf1]/95 backdrop-blur-md"
      }`}
    >
      {/* Top Header Bar: Logo + Brand + Close Button (Always crisp 100% opacity, z-50) */}
      <div className="relative z-50 max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 bg-[#f6faf1]">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <Logo width={24} height={24} />
          <span className="text-xl font-bold tracking-tight text-[#173a1d] font-sans">
            MangoLeaf AI
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-8 text-sm font-semibold text-[#3b523f]">
            <button
              onClick={() => handleNavClick("home")}
              className={`hover:text-[#277839] transition-colors cursor-pointer ${
                activeTab === "home" ? "text-[#277839] font-bold" : ""
              }`}
            >
              {t.navHome}
            </button>
            <button
              onClick={() => handleNavClick("about")}
              className={`hover:text-[#277839] transition-colors cursor-pointer ${
                activeTab === "about" ? "text-[#277839] font-bold" : ""
              }`}
            >
              {t.navAbout}
            </button>
            <button
              onClick={() => handleNavClick("history")}
              className={`hover:text-[#277839] transition-colors cursor-pointer ${
                activeTab === "history" ? "text-[#277839] font-bold" : ""
              }`}
            >
              {t.navHistory}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {showInstallButton && (
              <button
                onClick={onInstall}
                className="text-xs px-3.5 py-2 bg-[#277839] text-white font-bold rounded-xl hover:bg-[#1f622d] transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="install" size={16} fill="#ffffff" />

                {t.installApp}
              </button>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#1b3d20] rounded-xl text-xs font-bold text-[#1b3d20] hover:bg-[#f0f7eb] transition-all cursor-pointer shadow-xs"
            >
              <Icon name="language" size={16} fill="#1b3d20" />

              <span>{language === "en" ? "EN/BIS" : "BIS/EN"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Hamburger / Close Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="p-2 bg-white border border-[#d2e2c4] rounded-xl text-[#173a1d] hover:bg-[#f0f7eb] transition-colors cursor-pointer shadow-xs"
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Floating Mobile Drawer & Backdrop */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay starting BELOW header (z-30) */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 top-[60px] bg-black/40 backdrop-blur-xs z-30 md:hidden"
          />

          {/* Drawer Box attached directly below top bar (top-full, z-40) */}
          <div className="absolute top-full left-0 right-0 bg-[#f6faf1] border-b border-[#cce0be] px-6 py-6 flex flex-col gap-4 shadow-2xl rounded-b-3xl z-40 md:hidden animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-2.5 font-semibold text-sm">
              <button
                onClick={() => handleNavClick("home")}
                className={`text-left py-3 px-4 rounded-2xl transition-colors cursor-pointer flex items-center gap-3 ${
                  activeTab === "home"
                    ? "bg-[#277839] text-white font-bold shadow-sm"
                    : "bg-white border border-[#d2e2c4] text-[#173a1d] hover:bg-[#eef8eb]"
                }`}
              >
                <Icon
                  name="home"
                  size={18}
                  fill={activeTab === "home" ? "#ffffff" : "#277839"}
                />
                <span>{t.navHome}</span>
              </button>

              <button
                onClick={() => handleNavClick("about")}
                className={`text-left py-3 px-4 rounded-2xl transition-colors cursor-pointer flex items-center gap-3 ${
                  activeTab === "about"
                    ? "bg-[#277839] text-white font-bold shadow-sm"
                    : "bg-white border border-[#d2e2c4] text-[#173a1d] hover:bg-[#eef8eb]"
                }`}
              >
                <Icon
                  name="about"
                  size={18}
                  fill={activeTab === "about" ? "#ffffff" : "#277839"}
                />
                <span>{t.navAbout}</span>
              </button>

              <button
                onClick={() => handleNavClick("history")}
                className={`text-left py-3 px-4 rounded-2xl transition-colors cursor-pointer flex items-center gap-3 ${
                  activeTab === "history"
                    ? "bg-[#277839] text-white font-bold shadow-sm"
                    : "bg-white border border-[#d2e2c4] text-[#173a1d] hover:bg-[#eef8eb]"
                }`}
              >
                <Icon
                  name="history"
                  size={18}
                  fill={activeTab === "history" ? "#ffffff" : "#277839"}
                />
                <span>{t.navHistory}</span>
              </button>
            </nav>

            <div className="pt-3 border-t border-[#d2e2c4] flex flex-col gap-2.5">
              {showInstallButton && (
                <button
                  onClick={() => {
                    onInstall();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-[#277839] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Icon name="install" size={16} fill="#ffffff" />
                  <span>{t.installApp}</span>
                </button>
              )}

              <button
                onClick={toggleLanguage}
                className="w-full py-3 bg-white border border-[#1b3d20] text-[#173a1d] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Icon name="language" size={16} fill="#1b3d20" />
                <span>
                  Language:{" "}
                  {language === "en" ? "English (EN)" : "Bisaya (BIS)"}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
});
