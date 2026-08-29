"use client";

import { memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Icon, type IconName } from "@/components/brand/icon";

type AppTab = "home" | "history" | "about";

interface BottomNavProps {
  activeTab: AppTab;
  language: Language;
  onTabChange: (tab: AppTab) => void;
  onScanPress: () => void;
  onLanguageToggle: () => void;
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] pt-2 pb-1 cursor-pointer transition-colors duration-200 ${
        active ? "text-[#277839]" : "text-[#738a77]"
      }`}
    >
      <Icon name={icon} size={22} fill={active ? "#277839" : "#738a77"} />
      <span className="text-[10px] font-bold leading-tight">{label}</span>
    </button>
  );
}

export const BottomNav = memo(function BottomNav({
  activeTab,
  language,
  onTabChange,
  onScanPress,
  onLanguageToggle,
}: BottomNavProps) {
  const t = translations[language];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e2ebd9] md:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-lg mx-auto flex items-end justify-around px-1 h-16">
        <NavItem
          icon="home"
          label={t.navHome}
          active={activeTab === "home"}
          onClick={() => onTabChange("home")}
        />

        <NavItem
          icon="about"
          label={t.navAbout}
          active={activeTab === "about"}
          onClick={() => onTabChange("about")}
        />

        <div className="flex flex-col items-center -mt-5">
          <button
            onClick={onScanPress}
            aria-label={t.navScan}
            className="w-14 h-14 rounded-full bg-[#277839] text-white shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:bg-[#1f622d]"
          >
            <Icon name="scan" size={26} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-bold text-[#277839] mt-0.5">
            {t.navScan}
          </span>
        </div>

        <NavItem
          icon="history"
          label={t.navHistory}
          active={activeTab === "history"}
          onClick={() => onTabChange("history")}
        />

        <button
          onClick={onLanguageToggle}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] pt-2 pb-1 cursor-pointer text-[#738a77] transition-colors"
        >
          <Icon name="language" size={22} fill="#738a77" />
          <span className="text-[10px] font-bold leading-tight">
            {language === "en" ? "EN" : "BIS"}
          </span>
        </button>
      </div>
    </nav>
  );
});
