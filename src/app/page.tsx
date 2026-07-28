"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import type * as tf from "@tensorflow/tfjs";
import { FALLBACK_GUIDELINES } from "@/lib/constants";
import { loadMangoModel, predictMangoDisease, compressImageForStorage, computeImageHash } from "@/lib/classifier";

// Modular UI Components
import { SplashScreen } from "@/components/SplashScreen";
import { Header } from "@/components/Header";
import { DeviceProfileCard } from "@/components/DeviceProfileCard";
import { DiagnosticScanner } from "@/components/DiagnosticScanner";
import { ScanHistoryList } from "@/components/ScanHistoryList";
import dynamic from 'next/dynamic';
const ScanDetailsModal = dynamic(() => import('@/components/ScanDetailsModal').then(mod => ({ default: mod.ScanDetailsModal })));
const SqlSchemaCard = dynamic(() => import('@/components/SqlSchemaCard').then(mod => ({ default: mod.SqlSchemaCard })));

// Module-level flag: persists across React remounts, network reconnections,
// and useSync state updates. Ensures splash screen shows only ONCE per session.
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

  // TensorFlow.js model states
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(!hasInitialized);

  // Load MobileNetV3 model on startup
  useEffect(() => {
    // Skip re-loading if model was already initialized in a previous mount
    if (hasInitialized) return;

    async function initModel() {
      try {
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

  // Active scan state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);

  // History detail modal state
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [modalLanguage, setModalLanguage] = useState<"en" | "bis">("bis");

  // Query local active scans (exclude pending-delete)
  const scans = useLiveQuery(() =>
    db.scans
      .where("_status").notEqual("pending-delete")
      .sortBy("updated_at")
  );
  
  const activeScans = useMemo(() => (scans ? [...scans].reverse() : []), [scans]);

  const activeScanIds = activeScans.map((s) => s.id).join(",");

  const blobUrlMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const scan of activeScans) {
      if (scan.image_blob && scan.image_blob.size > 0) {
        map[scan.id] = URL.createObjectURL(scan.image_blob);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScanIds]);

  // Revoke old Blob URLs when blobUrlMap changes or component unmounts
  useEffect(() => {
    const urls = Object.values(blobUrlMap);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [blobUrlMap]);

  // Query cached guidelines
  const cachedGuidelines = useLiveQuery(() => db.guidelines.toArray(), []);

  // Stable guideline lookup map for useCallback dependency
  const guidelineMap = useMemo(() => {
    const map: Record<string, DiseaseGuideline> = {};
    for (const g of (cachedGuidelines || [])) {
      map[g.id] = g;
    }
    return map;
  }, [cachedGuidelines]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedScan) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedScan]);

  // Handle photo capture / selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  // Run AI diagnosis
  const runDiagnosis = useCallback(async () => {
    if (!selectedFile || !model) return;

    setIsScanning(true);
    setScanningProgress(15);

    try {
      // 1. Compute SHA-256 binary hash to check for duplicate gallery photos
      const imageHash = await computeImageHash(selectedFile);

      // 2. Search local database for existing duplicate scan
      const existingScan = await db.scans.where("image_hash").equals(imageHash).first();
      if (existingScan) {
        console.log("⚡ Duplicate photo detected — opening existing scan report.");
        setSelectedScan(existingScan);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsScanning(false);
        setScanningProgress(0);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(selectedFile);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      setScanningProgress(45);
      const { diseaseName, confidence } = await predictMangoDisease(model, img);
      
      setScanningProgress(75);
      // Compress photo to lightweight ~200KB JPEG before saving to IndexedDB & cloud storage
      const storageBlob = await compressImageForStorage(img, 1000, 0.80);

      setScanningProgress(90);
      URL.revokeObjectURL(img.src);

      await createScan(diseaseName, confidence, storageBlob, imageHash);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
  }, [selectedFile, model, previewUrl, createScan]);

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

  if (isModelLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header Navigation */}
      <Header
        isOnline={isOnline}
        isSyncing={isSyncing}
        showInstallButton={showInstallButton}
        onInstall={installApp}
        onSync={triggerSync}
      />

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Area: Camera & Guidelines Reference */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <DeviceProfileCard deviceId={deviceId} />
          <DiagnosticScanner
            previewUrl={previewUrl}
            isScanning={isScanning}
            scanningProgress={scanningProgress}
            onFileChange={handleFileChange}
            onRunDiagnosis={runDiagnosis}
          />
          <SqlSchemaCard />
        </div>

        {/* Right Area: Scan History */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ScanHistoryList
            scans={activeScans}
            blobUrlMap={blobUrlMap}
            getGuidelineColor={(diseaseName) => getGuidelineForScan(diseaseName).color}
            onSelectScan={setSelectedScan}
            onDeleteScan={deleteScan}
          />
        </div>
      </div>

      {/* Selected Scan Details Modal */}
      {selectedScan && (
        <ScanDetailsModal
          scan={selectedScan}
          imageUrl={blobUrlMap[selectedScan.id] || selectedScan.image_url}
          language={modalLanguage}
          guidelineText={getGuidelineForScan(selectedScan.disease_name)}
          onLanguageChange={setModalLanguage}
          onClose={() => setSelectedScan(null)}
        />
      )}
    </div>
  );
}
