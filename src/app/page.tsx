"use client";

import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import * as tf from "@tensorflow/tfjs";
import { CLASSES, FALLBACK_GUIDELINES } from "@/lib/constants";
import { loadMangoModel, predictMangoDisease } from "@/lib/classifier";

export default function Home() {
  const {
    isOnline,
    isSyncing,
    syncError,
    deviceId,
    createScan,
    deleteScan,
    triggerSync,
  } = useSync();

  const { showInstallButton, installApp } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  // TensorFlow.js model states
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);

  // Load the compiled MobileNetV3-Large TensorFlow.js model on browser startup
  useEffect(() => {
    async function initModel() {
      try {
        const loadedModel = await loadMangoModel();
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Error loading TensorFlow.js model:", err);
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
  const [modalLanguage, setModalLanguage] = useState<"en" | "bis">("bis"); // Default to Bisaya for local farmers

  // Query all local active scans (exclude pending-delete)
  const scans = useLiveQuery(() =>
    db.scans
      .filter((scan) => scan._status !== "pending-delete")
      .sortBy("updated_at")
  ) || [];
  
  // Reverse scans to show newest first
  const activeScans = [...scans].reverse();

  // Cache blob URLs so they aren't recreated on every React re-render (prevents memory leaks)
  const blobUrlMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const scan of activeScans) {
      if (scan.image_blob && scan.image_blob.size > 0) {
        map[scan.id] = URL.createObjectURL(scan.image_blob);
      }
    }
    // Cleanup: revoke all blob URLs when the scans array changes
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScans.map(s => s.id).join()]);

  // Query cached guidelines
  const cachedGuidelines = useLiveQuery(() => db.guidelines.toArray()) || [];

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isIOS && !isStandalone) {
      setShowIOSHint(true);
    }
  }, []);

  // Lock background body scroll when scan details modal is open
  useEffect(() => {
    if (selectedScan) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    // Clean up scroll lock when component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedScan]);

  // Handle file capture selection (camera or gallery)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  // Run on-device AI classification using the loaded TensorFlow.js model
  const runDiagnosis = async () => {
    if (!selectedFile || !model) return;

    setIsScanning(true);
    setScanningProgress(15);

    try {
      // 1. Create a virtual Image element to load the user's snapshot
      const img = new Image();
      img.src = URL.createObjectURL(selectedFile);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      setScanningProgress(45);

      // 2. Perform prediction using our modularized helper utility
      const { diseaseName, confidence } = await predictMangoDisease(model, img);

      setScanningProgress(80);

      // Clean up temporary image object URL
      URL.revokeObjectURL(img.src);

      // 3. Save the diagnostic log (with raw photo Blob) to the local scan history
      await createScan(diseaseName, confidence, selectedFile);

      // Reset active selections
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsScanning(false);
      setScanningProgress(0);

      // Automatically open the details view modal for the new scan
      const latestScans = await db.scans.toArray();
      if (latestScans.length > 0) {
        const newest = latestScans.reduce((prev, current) => 
          (new Date(prev.updated_at) > new Date(current.updated_at)) ? prev : current
        );
        setSelectedScan(newest);
      }
    } catch (err) {
      console.error("On-device AI classification error:", err);
      setIsScanning(false);
      setScanningProgress(0);
    }
  };

  // Retrieve guidelines for a specific disease (synced from Supabase or fallback default)
  const getGuidelineForScan = (diseaseName: string): { en: string; bis: string; color: DiseaseGuideline["color"] } => {
    // 1. Check if we have the guideline cached from Supabase
    const key = diseaseName.toLowerCase().replace(/\s+/g, "_");
    const matched = cachedGuidelines.find((g) => g.id === key);

    if (matched) {
      return {
        en: matched.guidelines_en,
        bis: matched.guidelines_bis,
        color: matched.color,
      };
    }

    // 2. Default fallback guidelines loaded from constants
    return FALLBACK_GUIDELINES[key] || {
      en: "No specific guidelines downloaded yet. Keep the mango leaves dry, prune infected twigs, and avoid overhead sprinkler watering.",
      bis: "Wala pay nadownload nga guidelines. Padayon nga pama-un ang mga dahon, putlon ang mga naapektuhang sanga, ug likayi ang pagbisbis nga magbasa sa dahon.",
      color: "yellow",
    };
  };

  const getCardColor = (diseaseName: string) => {
    return getGuidelineForScan(diseaseName).color;
  };

  // --- Full-Screen Startup Splash (while AI model loads) ---
  if (isModelLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 px-6">
        {/* Spinning loader ring */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-teal-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">🥭</span>
          </div>
        </div>

        {/* App title */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
            MangoLeaf AI
          </span>
        </div>

        {/* Loading status text */}
        {/* <div className="flex flex-col items-center gap-3 mt-2">
          <div className="flex items-center gap-2.5 text-xs text-teal-400 font-semibold animate-pulse">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Initializing On-Device AI Engine...
          </div>
          <p className="text-[10px] text-slate-600 text-center max-w-xs leading-relaxed">
            Loading MobileNetV3 model and compiling GPU shaders for real-time leaf diagnosis.
          </p>
        </div> */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* Premium Dark Header Bar */}
      <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
              MangoLeaf AI
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
              Offline-First PWA
            </span>
          </div>

          <div className="flex items-center gap-4">
            {showInstallButton && (
              <button
                onClick={installApp}
                className="text-xs px-3.5 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold rounded-full hover:scale-105 active:scale-98 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                📥 Install App
              </button>
            )}

            {isSyncing ? (
              <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/20 border border-teal-900/40 px-3.5 py-1 rounded-full font-semibold">
                <svg className="animate-spin h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing Database...
              </div>
            ) : (
              <button
                onClick={triggerSync}
                disabled={!isOnline}
                className={`text-xs px-3.5 py-1 rounded-full border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  isOnline
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-750"
                    : "bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18.24" />
                </svg>
                Sync
              </button>
            )}

            <div
              className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm transition-all duration-300 ${
                isOnline
                  ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                  : "bg-amber-950/30 border-amber-900/50 text-amber-400"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Camera Scanner & Pre-Treatment Dictionary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Device Profile Card */}
          <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              My Device Profile
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-[11px] font-mono text-slate-350 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-900 select-all truncate flex-1">
                {deviceId || "Loading..."}
              </span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-1 bg-teal-950/40 border border-teal-800/40 text-teal-400 rounded-lg">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
              Scan logs will be stored on this device and synced to Supabase.
            </p>
          </div>

          {/* Diagnostic Scanner Hub */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Diagnostic Scanner
            </h2>

            <div className="flex flex-col gap-4">
              {/* Dual Image Capture Buttons */}
              <div className="grid grid-cols-2 gap-3">
                  {/* 1. HTML5 back camera capture picker */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    id="camera-picker"
                    className="hidden"
                  />
                  <label
                    htmlFor="camera-picker"
                    className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-md text-center flex flex-col items-center justify-center gap-1.5 hover:scale-103 active:scale-98 transition-all text-xs"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </label>

                  {/* 2. Photo Gallery upload picker */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="gallery-picker"
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-picker"
                    className="cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl shadow-md text-center flex flex-col items-center justify-center gap-1.5 hover:scale-103 active:scale-98 transition-all text-xs"
                  >
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose Gallery
                  </label>
                </div>

              {/* Photo Preview & AI Trigger */}
              {previewUrl && (
                <div className="mt-2 border border-slate-850 bg-slate-950 p-4 rounded-2xl flex flex-col gap-4 items-center">
                  <div className="relative w-full aspect-square overflow-hidden rounded-xl border border-slate-900">
                    {/* Render standard square thumbnail preview of the captured photo */}
                    <img
                      src={previewUrl}
                      alt="Captured Preview"
                      className={`object-cover w-full h-full transition-all duration-300 ${isScanning ? "brightness-50 scale-105" : ""}`}
                    />
                    <div className="absolute inset-4 border-2 border-dashed border-teal-500/40 rounded-lg pointer-events-none" />
                    
                    {/* Scanning overlay on top of the image */}
                    {isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/60 backdrop-blur-sm">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-teal-400 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm">🔬</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-teal-400 animate-pulse">
                            {scanningProgress < 30
                              ? "Loading image..."
                              : scanningProgress < 60
                              ? "Running AI classification..."
                              : scanningProgress < 90
                              ? "Saving diagnosis..."
                              : "Finishing up..."}
                          </span>
                          <div className="w-32 bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-400 h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${scanningProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isScanning ? (
                    <button
                      onClick={runDiagnosis}
                      className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer"
                    >
                      🔬 Run AI Diagnosis
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-slate-900 border border-slate-800 text-teal-400 font-bold rounded-xl text-center text-xs animate-pulse">
                      Analyzing leaf tissue...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guidelines Offline Documentation */}
          <div className="bg-slate-900/15 border border-slate-900 p-5 rounded-2xl text-[11px] text-slate-450">
            <h3 className="font-bold text-slate-350 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              SQL Scans Schema
            </h3>
            <p className="mb-2 leading-relaxed">
              Run this SQL script in your Supabase dashboard to support PWA image storage uploads and log entries:
            </p>
            <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] font-mono overflow-x-auto text-teal-450 select-all max-h-40">
{`-- Create Scans Table
create table scans (
  id uuid primary key,
  disease_name text not null,
  confidence float8 not null,
  image_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_id uuid not null
);

-- Create Guidelines Table
create table guidelines (
  id text primary key, -- e.g., 'anthracnose'
  disease_name text not null,
  guidelines_en text not null,
  guidelines_bis text not null,
  color text default 'yellow' not null
);

-- Enable public RLS policies
alter table scans enable row level security;
alter table guidelines enable row level security;

create policy "Allow read guidelines" on guidelines for select using (true);
create policy "Allow insert scans" on scans for insert with check (true);
create policy "Allow read scans" on scans for select using (true);
create policy "Allow delete scans" on scans for delete using (true);`}
            </pre>
          </div>
        </div>

        {/* RIGHT AREA: Diagnostics Scan History */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent">
                  📸 Diagnostic Scan History
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diagnosis is done locally. Photos are cached in IndexedDB and uploaded to Supabase Storage when online.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-950 border border-slate-850 text-slate-400 rounded-full font-bold">
                Logs Count: {activeScans.length}
              </span>
            </div>

            {activeScans.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-900 rounded-xl bg-slate-955/20 text-slate-550 italic text-sm">
                Scan History is empty. Snap a photo of a mango leaf or fruit to run a diagnosis!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeScans.map((scan) => {
                  const isHealthy = scan.disease_name === "Healthy";
                  const isUncertain = scan.confidence < 0.70;
                  const guideline = getGuidelineForScan(scan.disease_name);

                  // Color style mapping for borders/badges
                  const cardBorderColors = {
                    yellow: "border-amber-800/40 hover:border-amber-700/60 bg-amber-950/5",
                    pink: "border-rose-800/40 hover:border-rose-700/60 bg-rose-950/5",
                    blue: "border-sky-800/40 hover:border-sky-700/60 bg-sky-950/5",
                    green: "border-emerald-800/40 hover:border-emerald-700/60 bg-emerald-950/5",
                    purple: "border-purple-800/40 hover:border-purple-700/60 bg-purple-950/5",
                  };

                  return (
                    <div
                      key={scan.id}
                      onClick={() => setSelectedScan(scan)}
                      className={`p-4 rounded-xl border backdrop-blur-sm cursor-pointer flex gap-4 transition-all duration-300 ${
                        cardBorderColors[guideline.color]
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="h-20 w-20 rounded-lg overflow-hidden border border-slate-900 flex-shrink-0 relative">
                        {(blobUrlMap[scan.id] || scan.image_url) ? (
                          <img
                            src={blobUrlMap[scan.id] || scan.image_url || ""}
                            alt={scan.disease_name}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-650 font-bold">
                            Missing
                          </div>
                        )}
                      </div>

                      {/* Diagnostic details */}
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold tracking-tight truncate text-slate-100">
                              {scan.disease_name}
                            </span>
                            
                            {/* Sync Status Badge */}
                            {scan._status === "synced" ? (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded">
                                Cloud
                              </span>
                            ) : (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.5 bg-teal-950/40 border border-teal-900/40 text-teal-400 rounded animate-pulse">
                                Local
                              </span>
                            )}
                          </div>
                          
                          {/* Confidence level badge */}
                          <span className={`text-[10px] font-bold ${
                            isUncertain ? "text-rose-400" : isHealthy ? "text-emerald-400" : "text-amber-400"
                          }`}>
                            Confidence: {Math.round(scan.confidence * 100)}%
                          </span>
                        </div>

                        {/* Date and Delete actions */}
                        <div className="flex items-center justify-between text-[10px] border-t border-slate-900 pt-2 mt-1">
                          <span className="text-slate-500 font-mono">
                            {new Date(scan.updated_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid opening modal when clicking delete
                              deleteScan(scan.id);
                            }}
                            className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Diagnostic Scan Details Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Image Header */}
            <div className="w-full aspect-[4/3] bg-slate-950 relative border-b border-slate-850 flex-shrink-0">
              {(blobUrlMap[selectedScan.id] || selectedScan.image_url) ? (
                <img
                  src={blobUrlMap[selectedScan.id] || selectedScan.image_url || ""}
                  alt={selectedScan.disease_name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
                  No Image Available Offline
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedScan(null)}
                className="absolute top-4 right-4 h-8 w-8 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer font-black"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto min-h-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-black tracking-tight text-slate-100">
                    Diagnosis: {selectedScan.disease_name}
                  </h3>
                  <span className="text-xs font-bold text-slate-450 font-mono">
                    Scanned on {new Date(selectedScan.updated_at).toLocaleString()}
                  </span>
                </div>

                {/* Score badge */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 bg-slate-950 border border-slate-850 text-slate-400 rounded-lg">
                    Score: {Math.round(selectedScan.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Guidelines Segment */}
              <div className="border-t border-slate-850 pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Pre-treatment Guidelines
                  </span>

                  {/* English/Bisaya Language Toggle */}
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                    <button
                      onClick={() => setModalLanguage("bis")}
                      className={`text-[9px] font-extrabold px-2 py-1 rounded-md transition-all cursor-pointer ${
                        modalLanguage === "bis"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Bisaya
                    </button>
                    <button
                      onClick={() => setModalLanguage("en")}
                      className={`text-[9px] font-extrabold px-2 py-1 rounded-md transition-all cursor-pointer ${
                        modalLanguage === "en"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Render the pre-treatment guidelines text (loaded from BAFS guidelines) */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal bg-slate-950 p-4 rounded-xl border border-slate-850 whitespace-pre-wrap">
                  {modalLanguage === "en" 
                    ? getGuidelineForScan(selectedScan.disease_name).en 
                    : getGuidelineForScan(selectedScan.disease_name).bis
                  }
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-850 bg-slate-950/40 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedScan(null)}
                className="text-xs px-4 py-2 bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
