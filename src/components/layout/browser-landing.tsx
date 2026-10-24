"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Footer } from "@/components/layout/footer";
import { BrowserBottomNav } from "@/components/layout/browser-bottom-nav";
import { AboutTab } from "@/components/tab/about-tab";
import { HowItWorksSteps } from "@/components/scan/how-it-works-steps";
import { DiseaseCoverageCard } from "@/components/scan/disease-coverage-card";
import { DownloadPromptCard } from "@/components/scan/download-prompt-card";
import { InstallGuideOverlay } from "@/components/modal/install-guide-overlay";
import { LegalModal } from "@/components/modal/legal-modal";
import { useInstallGuide } from "@/hooks/useInstallGuide";
import type { Language } from "@/lib/translations";

let fallbackLanguage: Language = "bis";
let unsavedLanguage: Language | undefined;
const languageChanged = "mangoleaf-language-changed";

function readLanguage(): Language {
  if (unsavedLanguage) return unsavedLanguage;
  try {
    const saved = localStorage.getItem("preferred_language");
    if (saved === "en" || saved === "bis") return saved;
  } catch {}
  return fallbackLanguage;
}

function subscribeLanguage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(languageChanged, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(languageChanged, listener);
  };
}

/** The website explains the APK without opening legacy History or starting inference. */
export function BrowserLanding() {
  const [activeTab, setActiveTab] = useState<"home" | "about">("home");
  // The server snapshot keeps hydration stable; blocked storage falls back to memory.
  const language = useSyncExternalStore<Language>(
    subscribeLanguage,
    readLanguage,
    () => "bis",
  );
  const [legal, setLegal] = useState<"privacy" | "terms" | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { isOpen, openGuide, closeGuide } = useInstallGuide();

  function changeLanguage(next: Language) {
    fallbackLanguage = next;
    try {
      localStorage.setItem("preferred_language", next);
      unsavedLanguage = undefined;
    } catch {
      // Quota or write-only restrictions must not override the user's in-memory choice.
      unsavedLanguage = next;
    }
    window.dispatchEvent(new Event(languageChanged));
  }

  function changeTab(tab: "home" | "history" | "about") {
    if (tab === "history") return;
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="min-h-screen bg-[#f6faf1] text-[#143519] font-sans flex flex-col justify-between">
      <div inert={isOpen || legal !== null}>
        <TopHeader
          language={language}
          showInstallButton
          browserLanding
          activeTab={activeTab}
          onTabChange={changeTab}
          onLanguageChange={changeLanguage}
          onInstall={openGuide}
          onLogoClick={() => changeTab("home")}
        />
        <main
          ref={mainRef}
          tabIndex={-1}
          className="max-w-7xl mx-auto px-6 py-8 flex flex-col outline-none"
        >
          <div key={activeTab} className="tab-panel-fade-in flex flex-col">
            {activeTab === "home" ? (
              <>
                <HowItWorksSteps language={language} />
                <DiseaseCoverageCard language={language} />
                <DownloadPromptCard
                  language={language}
                  onDownload={openGuide}
                />
              </>
            ) : (
              <AboutTab language={language} onScanPress={openGuide} />
            )}
          </div>
        </main>
      </div>
      {isOpen && (
        <InstallGuideOverlay language={language} onClose={closeGuide} />
      )}
      <LegalModal
        type={legal}
        language={language}
        onClose={() => setLegal(null)}
      />
      {/* Keep the desktop footer at the bottom even when the viewport exceeds the content. */}
      <div inert={isOpen || legal !== null}>
        <Footer
          language={language}
          onOpenPrivacy={() => setLegal("privacy")}
          onOpenTerms={() => setLegal("terms")}
        />
        <BrowserBottomNav
          activeTab={activeTab}
          language={language}
          onTabChange={changeTab}
          onInstall={openGuide}
          onLanguageToggle={() =>
            changeLanguage(language === "en" ? "bis" : "en")
          }
        />
      </div>
    </div>
  );
}
