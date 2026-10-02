"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useScrollLock } from "@/hooks/useScrollLock";
import { computeImageHash } from "@/lib/image-hash";
import type * as tf from "@tensorflow/tfjs";
import { modelVersion, UNCERTAIN_LABEL } from "@/lib/constants";
import { translations, type Language } from "@/lib/translations";

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

// Loaded only when a scan result is opened, which keeps it out of the first
// bundle a farmer downloads.
const ScanDetailsModal = dynamic(() =>
  import("@/components/modal/scan-details-modal").then((mod) => ({
    default: mod.ScanDetailsModal,
  })),
);

// Module scope, not state, so it survives a remount and the 11.33 MB model is
// never loaded twice in one browser session.
let hasInitialized = false;

type AppTab = "home" | "history" | "about";

type PhotoCheck =
  | { status: "idle" | "checking" | "error" }
  | { status: "ready"; hash: string; duplicate: ScanRecord | null };

function findDuplicateScan(imageHash: string) {
  return db.scans
    .where("image_hash")
    .equals(imageHash)
    .filter(
      (scan) =>
        scan._status !== "pending-delete" &&
        // Legacy reports have no reliable model identity; keep them in History.
        scan.model_version === modelVersion,
    )
    .first();
}

export default function Home() {
  const { createScan, deleteScan } = useSync();

  const { showInstallButton, installApp } = usePWAInstall();

  // Which tab is showing
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const prevTabRef = useRef<AppTab>("home");

  // The loaded model, and whether it is still arriving
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isModelLoading, setIsModelLoading] =
    useState<boolean>(!hasInitialized);

  // Start loading the model as soon as the app opens, so it is ready before the
  // first scan. A failure here is logged, never thrown: the rest of the app
  // still works without it.
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

  // The photo being scanned right now
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const photoRequestRef = useRef(0);
  const photoHashRef = useRef<string | null>(null);
  const [photoCheck, setPhotoCheck] = useState<PhotoCheck>({ status: "idle" });
  const photoCheckRef = useRef<PhotoCheck>({ status: "idle" });
  const scanInFlightRef = useRef(false);
  const scanLauncherRef = useRef<HTMLElement | null>(null);
  const restoreReviewFocusRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  const updatePhotoCheck = useCallback((check: PhotoCheck) => {
    photoCheckRef.current = check;
    setPhotoCheck(check);
  }, []);

  useEffect(() => {
    return () => {
      photoRequestRef.current += 1;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);
  const [legalModalType, setLegalModalType] = useState<
    "privacy" | "terms" | null
  >(null);
  const [isScanSheetOpen, setIsScanSheetOpen] = useState(false);
  const closeScanSheet = useCallback(() => setIsScanSheetOpen(false), []);
  const openScanSheet = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      // Capture the persistent launcher before the sheet/native picker takes focus.
      scanLauncherRef.current =
        event?.currentTarget ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      setIsScanSheetOpen(true);
    },
    [],
  );

  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (previewUrl || selectedScan || !restoreReviewFocusRef.current) return;
    restoreReviewFocusRef.current = false;
    const launcher = scanLauncherRef.current;
    const target =
      launcher?.isConnected && launcher !== document.body
        ? launcher
        : mainRef.current;
    target?.focus({ preventScroll: true });
  }, [previewUrl, selectedScan]);

  // Read from localStorage on first render. Bisaya is the default because the
  // intended users read it more comfortably than English.
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "bis";
    const saved = localStorage.getItem("preferred_language");
    return saved === "en" || saved === "bis" ? saved : "bis";
  });

  // Write the choice back to localStorage so it survives a restart
  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_language", newLang);
    }
  }, []);

  // Live query: re-runs by itself whenever IndexedDB changes. Scans awaiting
  // deletion are left out so a deleted scan disappears at once, before the
  // server has confirmed anything.
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

  // Guidelines cached from Supabase, so treatment advice is readable offline
  const cachedGuidelines = useLiveQuery(() => db.guidelines.toArray(), []);

  const guidelineMap = useMemo(() => {
    const map: Record<string, DiseaseGuideline> = {};
    for (const g of cachedGuidelines || []) {
      map[g.id] = g;
    }
    return map;
  }, [cachedGuidelines]);

  useScrollLock(Boolean(previewUrl || selectedScan || legalModalType));

  // Which picker was used last (camera, gallery, desktop), so Retake reopens
  // that same one rather than guessing.
  const lastPickerIdRef = useRef<string | null>(null);

  const clearPhoto = useCallback(() => {
    // Invalidate pending checks before clearing the preview or opening a picker.
    photoRequestRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    selectedFileRef.current = null;
    previewUrlRef.current = null;
    photoHashRef.current = null;
    setPreviewUrl(null);
    updatePhotoCheck({ status: "idle" });
    const picker = document.getElementById(lastPickerIdRef.current ?? "");
    if (picker instanceof HTMLInputElement) picker.value = "";
  }, [updatePhotoCheck]);

  const checkSelectedPhoto = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file || scanInFlightRef.current) return;
    const request = ++photoRequestRef.current;
    updatePhotoCheck({ status: "checking" });
    try {
      // Hash once per selection. Retrying a database lookup reuses these bytes.
      const hash = photoHashRef.current ?? (await computeImageHash(file));
      if (request !== photoRequestRef.current) return;
      photoHashRef.current = hash;
      const duplicate = await findDuplicateScan(hash);
      if (request !== photoRequestRef.current) return;
      updatePhotoCheck({ status: "ready", hash, duplicate: duplicate ?? null });
      if (duplicate) {
        console.log("---Duplicate photo detected — awaiting photo review.---");
      }
    } catch (err) {
      if (request !== photoRequestRef.current) return;
      console.error("Photo duplicate check failed:", err);
      updatePhotoCheck({ status: "error" });
    }
  }, [updatePhotoCheck]);

  // A photo has been taken or chosen
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || scanInFlightRef.current) return;
      restoreReviewFocusRef.current = false;
      clearPhoto();
      lastPickerIdRef.current = e.target.id;
      e.target.value = "";
      selectedFileRef.current = file;
      previewUrlRef.current = URL.createObjectURL(file);
      setPreviewUrl(previewUrlRef.current);
      void checkSelectedPhoto();
    },
    [clearPhoto, checkSelectedPhoto],
  );

  const closePhotoReview = useCallback(() => {
    if (scanInFlightRef.current) return;
    restoreReviewFocusRef.current = true;
    clearPhoto();
  }, [clearPhoto]);

  // Drop the current preview and reopen the same picker
  const handleRetake = useCallback(() => {
    if (scanInFlightRef.current) return;
    const pickerId = lastPickerIdRef.current;
    restoreReviewFocusRef.current = true;
    clearPhoto();
    if (pickerId) {
      const input = document.getElementById(
        pickerId,
      ) as HTMLInputElement | null;
      if (input) {
        input.value = ""; // reset so re-selecting the same file still triggers onChange
        input.click(); // synchronous — preserves the user-activation needed to open the camera
      }
    }
  }, [clearPhoto]);

  const viewSavedResult = useCallback(async () => {
    const check = photoCheckRef.current;
    if (check.status !== "ready" || !check.duplicate || scanInFlightRef.current)
      return;
    const request = ++photoRequestRef.current;
    updatePhotoCheck({ status: "checking" });
    try {
      // Another tab or sync may have deleted the saved report since selection.
      const existingScan = await findDuplicateScan(check.hash);
      if (request !== photoRequestRef.current) return;
      if (existingScan) {
        clearPhoto();
        setSelectedScan(existingScan);
      } else {
        updatePhotoCheck({
          status: "ready",
          hash: check.hash,
          duplicate: null,
        });
      }
    } catch (err) {
      if (request !== photoRequestRef.current) return;
      console.error("Saved photo lookup failed:", err);
      updatePhotoCheck({ status: "error" });
    }
  }, [clearPhoto, updatePhotoCheck]);

  // Recheck the local report index, then infer, compress and save a new photo.
  const runDiagnosis = useCallback(async () => {
    const file = selectedFileRef.current;
    const check = photoCheckRef.current;
    if (
      !file ||
      !model ||
      scanInFlightRef.current ||
      check.status !== "ready" ||
      check.duplicate
    )
      return;

    // Ref guards rapid clicks before React renders the scanning state.
    scanInFlightRef.current = true;
    const request = photoRequestRef.current;
    setIsScanning(true);
    setScanningProgress(15);
    let inferenceImageUrl: string | null = null;

    try {
      // Reports from a different model still need fresh inference. The same
      // current/legacy eligibility rule applies both here and during review.
      let existingScan: ScanRecord | undefined;
      try {
        existingScan = await findDuplicateScan(check.hash);
      } catch (err) {
        if (request === photoRequestRef.current) {
          console.error("Photo duplicate recheck failed:", err);
          updatePhotoCheck({ status: "error" });
        }
        return;
      }
      if (request !== photoRequestRef.current) return;
      if (existingScan) {
        updatePhotoCheck({
          status: "ready",
          hash: check.hash,
          duplicate: existingScan,
        });
        return;
      }

      const { predictMangoDisease, compressImageForStorage } =
        await import("@/lib/classifier");
      if (request !== photoRequestRef.current) return;

      const img = new Image();
      inferenceImageUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = inferenceImageUrl!;
      });
      if (request !== photoRequestRef.current) return;

      setScanningProgress(45);
      const { diseaseName, confidence } = await predictMangoDisease(model, img);
      if (request !== photoRequestRef.current) return;

      setScanningProgress(75);
      // Shrink it before saving. Inference already ran on the full image, so
      // nothing is lost by storing the smaller copy.
      const storageBlob = await compressImageForStorage(img, 1000, 0.75);
      if (request !== photoRequestRef.current) return;

      setScanningProgress(90);

      await createScan(diseaseName, confidence, storageBlob, check.hash);
      if (request !== photoRequestRef.current) return;

      const newestScan = await db.scans.orderBy("updated_at").last();
      if (request !== photoRequestRef.current) return;
      clearPhoto();
      if (newestScan) {
        setSelectedScan(newestScan);
      }
    } catch (err) {
      console.error("AI classification error:", err);
    } finally {
      scanInFlightRef.current = false;
      setIsScanning(false);
      setScanningProgress(0);
      if (inferenceImageUrl) {
        URL.revokeObjectURL(inferenceImageUrl);
      }
    }
  }, [model, createScan, clearPhoto, updatePhotoCheck]);

  // Read downloaded guidance offline. Missing advice gets a status message;
  // treatment text is maintained only in Supabase, not bundled with the app.
  const getGuidelineForScan = useCallback(
    (diseaseName: string): { en: string; bis: string } => {
      // A rejected prediction needs photo guidance, regardless of cached advice.
      if (diseaseName === UNCERTAIN_LABEL) {
        return {
          en: translations.en.uncertainPhotoReminder,
          bis: translations.bis.uncertainPhotoReminder,
        };
      }

      // The local query resolves before we decide whether guidance is missing.
      if (cachedGuidelines === undefined) {
        return {
          en: translations.en.guidelinesLoading,
          bis: translations.bis.guidelinesLoading,
        };
      }

      const classKey = diseaseName.toLowerCase().replace(/\s+/g, "_");
      // Both v4 healthy outputs share the existing general healthy guidance.
      const key =
        classKey === "healthy_leaf" || classKey === "healthy_fruit"
          ? "healthy"
          : classKey;
      const matched = guidelineMap[key];

      // Validate each language separately so blank text cannot hide the other.
      return {
        en:
          matched?.guidelines_en?.trim() ||
          translations.en.guidelinesUnavailable,
        bis:
          matched?.guidelines_bis?.trim() ||
          translations.bis.guidelinesUnavailable,
      };
    },
    [cachedGuidelines, guidelineMap],
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
        <main
          ref={mainRef}
          tabIndex={-1}
          className="max-w-7xl mx-auto px-6 py-8 pb-28 md:pb-8 flex flex-col outline-none"
        >
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
          isCheckingPhoto={photoCheck.status === "checking"}
          photoCheckFailed={photoCheck.status === "error"}
          isDuplicate={
            photoCheck.status === "ready" && Boolean(photoCheck.duplicate)
          }
          canRunDiagnosis={
            Boolean(model) &&
            photoCheck.status === "ready" &&
            !photoCheck.duplicate
          }
          scanningProgress={scanningProgress}
          language={language}
          onFileChange={handleFileChange}
          onRunDiagnosis={runDiagnosis}
          onRetake={handleRetake}
          onClose={closePhotoReview}
          onViewSavedResult={viewSavedResult}
          onRetryPhotoCheck={checkSelectedPhoto}
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
