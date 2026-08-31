"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import type * as tf from "@tensorflow/tfjs";
import { FALLBACK_GUIDELINES } from "@/lib/constants";
import { type Language } from "@/lib/translations";

// Modular UI Components matching Figma Design System
import { SplashScreen } from "@/components/layout/splash-screen";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeTab } from "@/components/tab/home-tab";
import { HistoryTab } from "@/components/tab/history-tab";
import { AboutTab } from "@/components/tab/about-tab";
import { LegalModal } from "@/components/modal/legal-modal";
import { ScanSheet } from "@/components/modal/scan-sheet";
import { DiagnosticScanner } from "@/components/scan/diagnostic-scanner";
import { Footer } from "@/components/layout/footer";
import dynamic from "next/dynamic";

// Load the details modal only when it is needed to keep the initial bundle smaller.
const ScanDetailsModal = dynamic(() =>
  import("@/components/modal/scan-details-modal").then((mod) => ({
    default: mod.ScanDetailsModal,
  })),
);

// Survives client remounts so the model is not initialized twice in one browser session.
let hasInitialized = false;

type AppTab = "home" | "history" | "about";

export default function Home() {
  const { createScan, deleteScan } = useSync();

  const { showInstallButton, installApp } = usePWAInstall();

  // Navigation tab state ("home" | "history" | "about")
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const prevTabRef = useRef<AppTab>("home");

  // TensorFlow.js model states
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isModelLoading, setIsModelLoading] =
    useState<boolean>(!hasInitialized);

  // Load MobileNetV3 model on startup
  useEffect(() => {
    if (hasInitialized) return;

    async function initModel() {
      try {
        const { loadMangoModel } = await import("@/lib/classifier");
        const loadedModel = await loadMangoModel();
        setModel(loadedModel);
        hasInitialized = true;
      } catch (err) {
        console.error("Error loading TensorFlow.js model:", err);
      } finally {
        setIsModelLoading(false);
      }
    }
    initModel();
  }, []);

  // Active scan & modal state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Refs to stabilize runDiagnosis callback (#7 — avoid re-creating on every state change)
  const selectedFileRef = useRef(selectedFile);
  const previewUrlRef = useRef(previewUrl);
  useEffect(() => {
    selectedFileRef.current = selectedFile;
    previewUrlRef.current = previewUrl;
  }, [selectedFile, previewUrl]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);
  const [legalModalType, setLegalModalType] = useState<
    "privacy" | "terms" | null
  >(null);
  const [isScanSheetOpen, setIsScanSheetOpen] = useState(false);
  const closeScanSheet = useCallback(() => setIsScanSheetOpen(false), []);
  const openScanSheet = useCallback(() => setIsScanSheetOpen(true), []);

  // Global language state initialized from actual localStorage ("bis" default)
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "bis";
    const saved = localStorage.getItem("preferred_language");
    return saved === "en" || saved === "bis" ? saved : "bis";
  });

  // Persistent language change handler
  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_language", newLang);
    }
  }, []);

  // Query local active scans
  const scansQuery = useLiveQuery(
    () =>
      db.scans
        .where("_status")
        .notEqual("pending-delete")
        .sortBy("updated_at")
        .then((results) => results.reverse()),
    [],
  );
  const activeScans = useMemo(() => scansQuery ?? [], [scansQuery]);

  const selectedScanImageUrl = useMemo(() => {
    if (selectedScan?.image_blob && selectedScan.image_blob.size > 0) {
      return URL.createObjectURL(selectedScan.image_blob);
    }
    return selectedScan?.image_url || null;
  }, [selectedScan]);

  useEffect(() => {
    return () => {
      if (selectedScanImageUrl && selectedScanImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(selectedScanImageUrl);
      }
    };
  }, [selectedScanImageUrl]);

  // Query cached guidelines
  const cachedGuidelines = useLiveQuery(() => db.guidelines.toArray(), []);

  const guidelineMap = useMemo(() => {
    const map: Record<string, DiseaseGuideline> = {};
    for (const g of cachedGuidelines || []) {
      map[g.id] = g;
    }
    return map;
  }, [cachedGuidelines]);

  // Lock body & html scroll when scan details modal or legal modal is open
  useEffect(() => {
    if (selectedScan || legalModalType) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [selectedScan, legalModalType]);

  // Remember which picker (camera / gallery / desktop) was used, so "Retake" reopens the same source
  const lastPickerIdRef = useRef<string | null>(null);

  // Handle photo capture / selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      lastPickerIdRef.current = e.target.id;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl],
  );

  // Retake — clear the current preview and immediately reopen the same photo source
  const handleRetake = useCallback(() => {
    const pickerId = lastPickerIdRef.current;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (pickerId) {
      const input = document.getElementById(
        pickerId,
      ) as HTMLInputElement | null;
      if (input) {
        input.value = ""; // reset so re-selecting the same file still triggers onChange
        input.click(); // synchronous — preserves the user-activation needed to open the camera
      }
    }
  }, [previewUrl]);

  // Run AI diagnosis (uses refs for selectedFile/previewUrl to keep dependency list stable)
  const runDiagnosis = useCallback(async () => {
    const file = selectedFileRef.current;
    const preview = previewUrlRef.current;
    if (!file || !model) return;

    setIsScanning(true);
    setScanningProgress(15);
    let inferenceImageUrl: string | null = null;

    try {
      const { predictMangoDisease, compressImageForStorage, computeImageHash } =
        await import("@/lib/classifier");

      // 1. Compute SHA-256 hash to check for duplicate gallery photos
      const imageHash = await computeImageHash(file);

      // 2. Search local database for existing duplicate scan
      const existingScan = await db.scans
        .where("image_hash")
        .equals(imageHash)
        .first();
      if (existingScan) {
        console.log(
          "---Duplicate photo detected — opening existing scan report.---",
        );
        setSelectedScan(existingScan);
        if (preview) URL.revokeObjectURL(preview);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsScanning(false);
        setScanningProgress(0);
        return;
      }

      const img = new Image();
      inferenceImageUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = inferenceImageUrl!;
      });

      setScanningProgress(45);
      const { diseaseName, confidence } = await predictMangoDisease(model, img);

      setScanningProgress(75);
      // Compress photo using WebP format (75% quality, ~75KB) before saving
      const storageBlob = await compressImageForStorage(img, 1000, 0.75);

      setScanningProgress(90);

      await createScan(diseaseName, confidence, storageBlob, imageHash);

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsScanning(false);
      setScanningProgress(0);

      const newestScan = await db.scans.orderBy("updated_at").last();
      if (newestScan) {
        setSelectedScan(newestScan);
      }
    } catch (err) {
      console.error("AI classification error:", err);
      setIsScanning(false);
      setScanningProgress(0);
    } finally {
      if (inferenceImageUrl) {
        URL.revokeObjectURL(inferenceImageUrl);
      }
    }
  }, [model, createScan]);

  // Retrieve guideline for a disease
  const getGuidelineForScan = useCallback(
    (
      diseaseName: string,
    ): { en: string; bis: string } => {
      const key = diseaseName.toLowerCase().replace(/\s+/g, "_");
      const matched = guidelineMap[key];

      if (matched) {
        return {
          en: matched.guidelines_en,
          bis: matched.guidelines_bis,
        };
      }

      return (
        FALLBACK_GUIDELINES[key] || {
          en: "No specific guidelines downloaded yet. Keep the mango leaves dry, prune infected twigs, and avoid overhead sprinkler watering.",
          bis: "Wala pay nadownload nga guidelines. Padayon nga pama-un ang mga dahon, putlon ang mga naapektuhang sanga, ug likayi ang pagbisbis nga magbasa sa dahon.",
        }
      );
    },
    [guidelineMap],
  );

  const handleTabChange = useCallback((tab: AppTab) => {
    if (tab === prevTabRef.current) return;
    prevTabRef.current = tab;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewAllHistory = useCallback(
    () => handleTabChange("history"),
    [handleTabChange],
  );

  if (isModelLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f6faf1] text-[#143519] font-sans flex flex-col justify-between">
      <div>
        {/* Top Header: mobile = minimal logo, desktop = full nav */}
        <TopHeader
          language={language}
          showInstallButton={showInstallButton}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLanguageChange={setLanguage}
          onInstall={installApp}
          onLogoClick={() => handleTabChange("home")}
          onScanPress={openScanSheet}
        />

        {/* Hidden file inputs for scan sheet + retake flow */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          id="scan-camera-input"
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          id="scan-gallery-input"
          className="hidden"
        />

        {/* Main Content Area — extra bottom padding for bottom nav */}
        <main className="max-w-7xl mx-auto px-6 py-8 pb-28 md:pb-8 flex flex-col">
          <div key={activeTab} className="tab-panel-fade-in flex flex-col">
            {activeTab === "home" && (
              <HomeTab
                scans={activeScans}
                language={language}
                onSelectScan={setSelectedScan}
                onDeleteScan={deleteScan}
                onViewAllHistory={handleViewAllHistory}
                onScanPress={openScanSheet}
              />
            )}

            {activeTab === "history" && (
              <HistoryTab
                scans={activeScans}
                language={language}
                onSelectScan={setSelectedScan}
                onDeleteScan={deleteScan}
                onScanPress={openScanSheet}
              />
            )}

            {activeTab === "about" && (
              <AboutTab language={language} onScanPress={openScanSheet} />
            )}
          </div>
        </main>
      </div>

      {/* Scan Sheet (bottom sheet triggered by center FAB) */}
      <ScanSheet
        isOpen={isScanSheetOpen}
        language={language}
        onClose={closeScanSheet}
      />

      {/* Photo Preview & AI Scanning Overlay (from DiagnosticScanner) */}
      {previewUrl && (
        <DiagnosticScanner
          previewUrl={previewUrl}
          isScanning={isScanning}
          scanningProgress={scanningProgress}
          language={language}
          onFileChange={handleFileChange}
          onRunDiagnosis={runDiagnosis}
          onRetake={handleRetake}
        />
      )}

      {/* Selected Scan Details Modal */}
      {selectedScan && (
        <ScanDetailsModal
          scan={selectedScan}
          imageUrl={selectedScanImageUrl}
          language={language}
          guidelineText={getGuidelineForScan(selectedScan.disease_name)}
          onLanguageChange={setLanguage}
          onClose={() => setSelectedScan(null)}
        />
      )}

      {/* Legal Privacy Policy & Terms of Service Modal */}
      <LegalModal
        type={legalModalType}
        language={language}
        onClose={() => setLegalModalType(null)}
      />

      {/* Footer */}
      <Footer
        language={language}
        onOpenPrivacy={() => setLegalModalType("privacy")}
        onOpenTerms={() => setLegalModalType("terms")}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        language={language}
        onTabChange={handleTabChange}
        onScanPress={openScanSheet}
        onLanguageToggle={() => setLanguage(language === "en" ? "bis" : "en")}
      />
    </div>
  );
}
