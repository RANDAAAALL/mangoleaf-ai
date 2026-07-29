"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import type * as tf from "@tensorflow/tfjs";
import { FALLBACK_GUIDELINES } from "@/lib/constants";
import { translations, type Language } from "@/lib/translations";

// Modular UI Components matching Figma Design System
import { SplashScreen } from "@/components/SplashScreen";
import { Header } from "@/components/Header";
import { DiagnosticScanner } from "@/components/DiagnosticScanner";
import { InfoCalloutCard } from "@/components/InfoCalloutCard";
import { LegalModal } from "@/components/LegalModal";
import { ScanHistoryList } from "@/components/ScanHistoryList";
import { Footer } from "@/components/Footer";
import dynamic from 'next/dynamic';
const ScanDetailsModal = dynamic(() => import('@/components/ScanDetailsModal').then(mod => ({ default: mod.ScanDetailsModal })));

let hasInitialized = false;

export default function Home() {
  const {
    isOnline,
    isSyncing,
    deviceId,
    createScan,
    deleteScan,
    triggerSync,
  } = useSync();

  const { showInstallButton, installApp } = usePWAInstall();

  // Navigation tab state ("home" | "history" | "about")
  const [activeTab, setActiveTab] = useState<"home" | "history" | "about">("home");

  // TensorFlow.js model states
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(!hasInitialized);

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
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms" | null>(null);

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

  const t = translations[language];

  // Query local active scans
  const scansQuery = useLiveQuery(() =>
    db.scans
      .where("_status").notEqual("pending-delete")
      .sortBy("updated_at")
      .then(results => results.reverse())
  , []);
  const activeScans = useMemo(() => scansQuery ?? [], [scansQuery]);

  const selectedScanImageUrl = useMemo(() => {
    if (selectedScan?.image_blob && selectedScan.image_blob.size > 0) {
      return URL.createObjectURL(selectedScan.image_blob);
    }
    return selectedScan?.image_url || null;
  }, [selectedScan]);

  useEffect(() => {
    return () => {
      if (selectedScanImageUrl && selectedScanImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(selectedScanImageUrl);
      }
    };
  }, [selectedScanImageUrl]);

  // Query cached guidelines
  const cachedGuidelines = useLiveQuery(() => db.guidelines.toArray(), []);

  const guidelineMap = useMemo(() => {
    const map: Record<string, DiseaseGuideline> = {};
    for (const g of (cachedGuidelines || [])) {
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

  // Handle photo capture / selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  // Cancel preview selection
  const handleCancelPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  // Run AI diagnosis (uses refs for selectedFile/previewUrl to keep dependency list stable)
  const runDiagnosis = useCallback(async () => {
    const file = selectedFileRef.current;
    const preview = previewUrlRef.current;
    if (!file || !model) return;

    setIsScanning(true);
    setScanningProgress(15);

    try {
      const { predictMangoDisease, compressImageForStorage, computeImageHash } = await import("@/lib/classifier");

      // 1. Compute SHA-256 hash to check for duplicate gallery photos
      const imageHash = await computeImageHash(file);

      // 2. Search local database for existing duplicate scan
      const existingScan = await db.scans.where("image_hash").equals(imageHash).first();
      if (existingScan) {
        console.log("⚡ Duplicate photo detected — opening existing scan report.");
        setSelectedScan(existingScan);
        if (preview) URL.revokeObjectURL(preview);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsScanning(false);
        setScanningProgress(0);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      setScanningProgress(45);
      const { diseaseName, confidence } = await predictMangoDisease(model, img);
      
      setScanningProgress(75);
      // Compress photo using WebP format (75% quality, ~75KB) before saving
      const storageBlob = await compressImageForStorage(img, 1000, 0.75);

      setScanningProgress(90);
      URL.revokeObjectURL(img.src);

      await createScan(diseaseName, confidence, storageBlob, imageHash);

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsScanning(false);
      setScanningProgress(0);

      const newestScan = await db.scans.orderBy('updated_at').last();
      if (newestScan) {
        setSelectedScan(newestScan);
      }
    } catch (err) {
      console.error("AI classification error:", err);
      setIsScanning(false);
      setScanningProgress(0);
    }
  }, [model, createScan]);

  // Retrieve guideline for a disease
  const getGuidelineForScan = useCallback((diseaseName: string): { en: string; bis: string; color: DiseaseGuideline["color"] } => {
    const key = diseaseName.toLowerCase().replace(/\s+/g, "_");
    const matched = guidelineMap[key];

    if (matched) {
      return {
        en: matched.guidelines_en,
        bis: matched.guidelines_bis,
        color: matched.color,
      };
    }

    return (
      FALLBACK_GUIDELINES[key] || {
        en: "No specific guidelines downloaded yet. Keep the mango leaves dry, prune infected twigs, and avoid overhead sprinkler watering.",
        bis: "Wala pay nadownload nga guidelines. Padayon nga pama-un ang mga dahon, putlon ang mga naapektuhang sanga, ug likayi ang pagbisbis nga magbasa sa dahon.",
        color: "yellow",
      }
    );
  }, [guidelineMap]);

  // Stabilized props for ScanHistoryList memo (#4)
  const getGuidelineColor = useCallback(
    (diseaseName: string) => getGuidelineForScan(diseaseName).color,
    [getGuidelineForScan]
  );
  const handleViewAllHistory = useCallback(() => setActiveTab("history"), []);
  const homeScans = useMemo(() => activeScans.slice(0, 4), [activeScans]);

  if (isModelLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f6faf1] text-[#143519] font-sans flex flex-col justify-between">
      <div>
        {/* Figma Top Navigation Bar */}
        <Header
          showInstallButton={showInstallButton}
          language={language}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLanguageChange={setLanguage}
          onInstall={installApp}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-10">
          {activeTab === "home" && (
            <>
              {/* Dual Scan Cards Section */}
              <DiagnosticScanner
                previewUrl={previewUrl}
                isScanning={isScanning}
                scanningProgress={scanningProgress}
                language={language}
                onFileChange={handleFileChange}
                onRunDiagnosis={runDiagnosis}
                onCancelPreview={handleCancelPreview}
              />

              {/* Informational Tip Banner */}
              <InfoCalloutCard language={language} />

              {/* Recent Scans (Limited to 4 items on Home Screen) */}
              <ScanHistoryList
                scans={homeScans}
                language={language}
                getGuidelineColor={getGuidelineColor}
                onSelectScan={setSelectedScan}
                onDeleteScan={deleteScan}
                onViewAllHistory={handleViewAllHistory}
                isFullHistoryPage={false}
              />
            </>
          )}

          {activeTab === "history" && (
            <ScanHistoryList
              scans={activeScans}
              language={language}
              getGuidelineColor={getGuidelineColor}
              onSelectScan={setSelectedScan}
              onDeleteScan={deleteScan}
              isFullHistoryPage={true}
            />
          )}

          {activeTab === "about" && (
            <div className="bg-white border border-[#e2ebd9] p-6 sm:p-8 rounded-3xl shadow-xs flex flex-col gap-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-[#143519]">{t.aboutTitle}</h2>
              <p
                lang={language === "en" ? "en" : "ceb"}
                className="text-sm text-[#3b523f] leading-relaxed text-justify [text-justify:inter-word] break-words hyphens-auto"
              >
                {t.aboutDesc}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 bg-[#f6faf1] rounded-2xl border border-[#e2ebd9] flex flex-col gap-2">
                  <h4 className="font-bold text-[#143519] text-base">{t.aiEngineTitle}</h4>
                  <p
                    lang={language === "en" ? "en" : "ceb"}
                    className="text-xs text-[#526856] leading-relaxed text-justify [text-justify:inter-word] break-words hyphens-auto"
                  >
                    {t.aiEngineDesc}
                  </p>
                </div>
                <div className="p-5 bg-[#f6faf1] rounded-2xl border border-[#e2ebd9] flex flex-col gap-2">
                  <h4 className="font-bold text-[#143519] text-base">{t.offlineSyncTitle}</h4>
                  <p
                    lang={language === "en" ? "en" : "ceb"}
                    className="text-xs text-[#526856] leading-relaxed text-justify [text-justify:inter-word] break-words hyphens-auto"
                  >
                    {t.offlineSyncDesc}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
    </div>
  );
}
