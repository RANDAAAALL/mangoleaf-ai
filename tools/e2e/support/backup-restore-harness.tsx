import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
import { SettingsTab } from "@/components/tab/settings-tab";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopHeader } from "@/components/layout/top-header";
import type { Language } from "@/lib/translations";
import { initializeDiagnostics } from "@/lib/diagnostics";

// Controlled native/cloud adapters exercise real APK components, never a hosted backend.
function BackupHarness() {
  const query = new URLSearchParams(location.search);
  useEffect(() => {
    initializeDiagnostics();
  }, []);
  const [language, setLanguage] = useState<Language>(
    query.has("bis") ? "bis" : "en",
  );
  const [tab, setTab] = useState<"home" | "about" | "history" | "settings">(
    "settings",
  );
  if (!query.has("settings"))
    return <BackupRecoveryPanel language={language} />;
  return (
    <div className="min-h-screen bg-[#f6faf1] text-[#173a1d]">
      <TopHeader
        language={language}
        showInstallButton={false}
        activeTab={tab}
        onTabChange={setTab}
        onSettings={() => setTab("settings")}
        onLanguageChange={setLanguage}
        onInstall={() => {}}
        onLogoClick={() => setTab("home")}
      />
      <main className="px-5 py-6 pb-28">
        {tab === "settings" && (
          <SettingsTab
            language={language}
            onLanguageChange={setLanguage}
            updateOffer={
              query.has("offer") ? { tag: "v99.0.0", version: "99.0.0" } : null
            }
            onUpdate={() => {
              window.backupRestoreUi.update();
            }}
          />
        )}
      </main>
      <BottomNav
        activeTab={tab}
        language={language}
        onTabChange={setTab}
        onScanPress={() => {}}
        onLanguageToggle={() => {}}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<BackupHarness />);
