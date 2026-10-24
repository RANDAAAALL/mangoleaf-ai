"use client";

import { memo } from "react";
import { Icon } from "@/components/brand/icon";
import { AndroidInstallAction } from "@/components/layout/android-install-action";
import { translations, type Language } from "@/lib/translations";

type WebsiteTab = "home" | "about";

interface BrowserBottomNavProps {
  activeTab: WebsiteTab;
  language: Language;
  onTabChange: (tab: WebsiteTab) => void;
  onInstall: () => void;
  onLanguageToggle: () => void;
}

/** Phone websites expose information and APK installation, without scanner or History controls. */
export const BrowserBottomNav = memo(function BrowserBottomNav({
  activeTab,
  language,
  onTabChange,
  onInstall,
  onLanguageToggle,
}: BrowserBottomNavProps) {
  const t = translations[language];
  return (
    <nav
      aria-label={t.websiteNavigationLabel}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e2ebd9] bg-white md:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 items-stretch gap-1 px-2 py-1">
        {(["home", "about"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-current={activeTab === tab ? "page" : undefined}
            onClick={() => onTabChange(tab)}
            className={`flex min-h-16 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-bold leading-tight ${activeTab === tab ? "text-[#277839]" : "text-[#738a77]"}`}
          >
            <Icon name={tab} size={22} />
            <span>{tab === "home" ? t.navHome : t.navAbout}</span>
          </button>
        ))}
        <AndroidInstallAction
          language={language}
          onGuide={onInstall}
          className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-bold leading-tight text-[#277839]"
          labelClassName="break-words"
        >
          <Icon name="install" size={22} />
        </AndroidInstallAction>
        <button
          type="button"
          onClick={onLanguageToggle}
          className="flex min-h-16 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-bold leading-tight text-[#738a77]"
        >
          <Icon name="language" size={22} />
          <span>{language.toUpperCase()}</span>
        </button>
      </div>
    </nav>
  );
});
