"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import type { ScanListRecord } from "@/lib/scan-photo";
import { useStorageQuery } from "@/hooks/useStorageQuery";
import {
  readStoredScans,
  readStoredGuidelines,
  findStoredScan,
} from "@/lib/app-storage";
import {
  isAndroidBuild,
  connectionHint,
  subscribeConnection,
  initializeNativeRuntime,
  nativeRequest,
} from "@/lib/native-bridge";
import { startCloudBackup, setCloudBackupBusy } from "@/lib/cloud-backup";
import { useSync } from "@/hooks/useSync";
import { useInstallGuide } from "@/hooks/useInstallGuide";
import { useScrollLock } from "@/hooks/useScrollLock";
import { computeImageHash } from "@/lib/image-hash";
import { compressImageForStorage } from "@/lib/image-storage";
import { isStorageQuotaError, prepareLocalScan } from "@/lib/local-scans";
import {
  DiagnosisTimeoutError,
  loadDiagnosisImage,
  runDiagnosisStep,
  type DiagnosisStage,
  type DiagnosisError,
} from "@/lib/diagnosis-step";
import type { DiagnosisResult } from "@/lib/classifier";
import type * as tf from "@tensorflow/tfjs";
import { modelVersion, UNCERTAIN_LABEL } from "@/lib/constants";
import { translations, type Language } from "@/lib/translations";
import {
  createDiagnosticOperation,
  diagnosticErrorName,
  initializeDiagnostics,
  recordDiagnostic,
} from "@/lib/diagnostics";

// Modular UI Components matching Figma Design System
import { SplashScreen } from "@/components/layout/splash-screen";
import { TopHeader } from "@/components/layout/top-header";
import { ModelStatusBanner } from "@/components/layout/model-status-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeTab } from "@/components/tab/home-tab";
import { HistoryTab } from "@/components/tab/history-tab";
import { AboutTab } from "@/components/tab/about-tab";
import { DiagnosticsPanel } from "@/components/tab/diagnostics-panel";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
import { LegalModal } from "@/components/modal/legal-modal";
import { AndroidUpdateModal } from "@/components/modal/android-update-modal";
import { StorageFullModal } from "@/components/modal/storage-full-modal";
import { UnsavedScanNotice } from "@/components/scan/unsaved-scan-notice";
import { ScanSheet } from "@/components/modal/scan-sheet";
import { InstallGuideOverlay } from "@/components/modal/install-guide-overlay";
import { DiagnosticScanner } from "@/components/scan/diagnostic-scanner";
import { GuidedCamera } from "@/components/scan/guided-camera";
import { Footer } from "@/components/layout/footer";
// The first result must not suspend the APK entry into its full-screen startup splash.
import { ScanDetailsModal } from "@/components/modal/scan-details-modal";

// Module scope keeps the initialization flag across page remounts. The
// classifier also shares its model-loading promise during an in-flight load.
let hasInitialized = false;

type AppTab = "home" | "history" | "about";

// Probability rows exist only for the selected fresh result;
// they are not saved to History.
type SelectedScanRecord = ScanListRecord & {
  diagnosedResultTabular?: DiagnosisResult["diagnosedResultTabular"];
};

type PhotoCheck =
  | { status: "idle" | "checking" | "error" }
  | { status: "ready"; hash: string; duplicate: ScanRecord | null };

function findDuplicateScan(imageHash: string) {
  return findStoredScan(imageHash, modelVersion);
}

// APK orchestration also supports isolated compatibility regressions; websites never mount it.
export function Application() {
  useEffect(startCloudBackup, []);
  const { createScan, deleteScan, deleteScans } = useSync();

  const {
    isOpen: isInstallGuideOpen,
    openGuide: openInstallGuide,
    closeGuide: closeInstallGuide,
  } = useInstallGuide();

  // Which tab is showing
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const prevTabRef = useRef<AppTab>("home");

  // The loaded model, and whether it is still arriving
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const [isModelLoading, setIsModelLoading] =
    useState<boolean>(!hasInitialized);

  useEffect(() => {
    initializeDiagnostics();
    recordDiagnostic("app.opened", {
      online: connectionHint(),
      visibility: document.visibilityState,
      standalone: window.matchMedia("(display-mode: standalone)").matches,
    });
    const onVisibility = () =>
      recordDiagnostic("app.visibility", {
        visibility: document.visibilityState,
      });
    const onConnectivity = () =>
      recordDiagnostic("app.connectivity", { online: connectionHint() });
    const onError = (event: ErrorEvent) =>
      recordDiagnostic("app.error", {
        errorName: diagnosticErrorName(event.error),
      });
    const onRejection = (event: PromiseRejectionEvent) =>
      recordDiagnostic("app.unhandled-rejection", {
        errorName: diagnosticErrorName(event.reason),
      });
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribe = subscribeConnection(onConnectivity);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  // Start loading the model as soon as the app opens, so it is ready before the
  // first scan. A failure leaves History available and offers reload recovery.
  useEffect(() => {
    let cancelled = false;

    async function initModel() {
      try {
        const { loadMangoModel } = await import("@/lib/classifier");
        const loadedModel = await loadMangoModel();
        if (cancelled) return;
        setModel(loadedModel);
        hasInitialized = true;
      } catch (err) {
        recordDiagnostic("app.model.failed", {
          errorName: diagnosticErrorName(err),
        });
        console.error("Error loading TensorFlow.js model:", err);
        if (!cancelled) setModelLoadFailed(true);
      } finally {
        if (!cancelled) setIsModelLoading(false);
      }
    }
    initModel();
    return () => {
      cancelled = true;
    };
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
  const scanAbortRef = useRef<AbortController | null>(null);
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
      scanAbortRef.current?.abort(
        new DOMException("Diagnosis view closed.", "AbortError"),
      );
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);
  const [scanningStage, setScanningStage] = useState<DiagnosisStage>("prepare");
  const [scanError, setScanError] = useState<DiagnosisError | null>(null);
  const [unsavedScan, setUnsavedScan] = useState<ScanRecord | null>(null);
  const [isStorageFullOpen, setIsStorageFullOpen] = useState(false);
  const [isRetryingSave, setIsRetryingSave] = useState(false);
  const [saveRetryError, setSaveRetryError] = useState<
    "quota" | "failed" | "timeout" | null
  >(null);
  const [legalModalType, setLegalModalType] = useState<
    "privacy" | "terms" | null
  >(null);
  const [isScanSheetOpen, setIsScanSheetOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  useEffect(() => {
    if (!isAndroidBuild()) return;
    const busy = isScanning || isCameraOpen || isRetryingSave;
    setCloudBackupBusy(busy);
    // One combined flag prevents a camera-close event from clearing an active diagnosis.
    void nativeRequest("app.busy", { busy }).catch(() => {});
  }, [isScanning, isCameraOpen, isRetryingSave]);
  const closeScanSheet = useCallback(() => {
    recordDiagnostic("scan-sheet.closed");
    setIsScanSheetOpen(false);
  }, []);
  const openScanSheet = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      recordDiagnostic("scan.requested");
      if (unsavedScan) {
        setIsStorageFullOpen(true);
        return;
      }
      // Wider layouts direct new scans to the phone installation guide.
      if (
        !isAndroidBuild() &&
        window.matchMedia("(min-width: 48rem)").matches
      ) {
        openInstallGuide(event);
        return;
      }
      // Capture the persistent launcher before the sheet/native picker takes focus.
      scanLauncherRef.current =
        event?.currentTarget ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      setIsScanSheetOpen(true);
    },
    [openInstallGuide, unsavedScan],
  );

  useEffect(() => {
    if (!isScanSheetOpen || isAndroidBuild()) return;
    const desktop = window.matchMedia("(min-width: 48rem)");
    const handleWidthChange = () => {
      if (!desktop.matches) return;
      setIsScanSheetOpen(false);
      openInstallGuide();
    };
    handleWidthChange();
    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", handleWidthChange);
    } else {
      desktop.addListener(handleWidthChange);
    }
    return () => {
      if (typeof desktop.removeEventListener === "function") {
        desktop.removeEventListener("change", handleWidthChange);
      } else {
        desktop.removeListener(handleWidthChange);
      }
    };
  }, [isScanSheetOpen, openInstallGuide]);

  const [selectedScan, setSelectedScan] = useState<SelectedScanRecord | null>(
    null,
  );

  useEffect(() => {
    if (
      previewUrl ||
      selectedScan ||
      isCameraOpen ||
      isStorageFullOpen ||
      !restoreReviewFocusRef.current
    )
      return;
    restoreReviewFocusRef.current = false;
    const launcher = scanLauncherRef.current;
    const target =
      launcher?.isConnected && launcher !== document.body
        ? launcher
        : mainRef.current;
    target?.focus({ preventScroll: true });
  }, [previewUrl, selectedScan, isCameraOpen, isStorageFullOpen]);

  // Read from localStorage on first render. Bisaya is the default because the
  // intended users read it more comfortably than English.
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "bis";
    const saved = localStorage.getItem("preferred_language");
    return saved === "en" || saved === "bis" ? saved : "bis";
  });

  // Write the choice back to localStorage so it survives a restart
  const setLanguage = useCallback((newLang: Language) => {
    recordDiagnostic("language.changed", { language: newLang });
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_language", newLang);
    }
  }, []);

  // SQLite lists metadata only; cards/details load their own private photos.
  // Legacy deletion tombstones remain hidden and date ordering uses the index.
  const { data: scansQuery, error: scansError } = useStorageQuery(
    readStoredScans,
    "reports",
  );
  const activeScans = useMemo(() => scansQuery ?? [], [scansQuery]);

  useEffect(() => {
    if (scansQuery !== undefined)
      recordDiagnostic("history.loaded", { count: scansQuery.length });
  }, [scansQuery]);

  useEffect(() => {
    if (!previewUrl) return;
    // Readiness explains disabled Run without logging the selected photo or hash.
    recordDiagnostic("photo.review.state", {
      status: photoCheck.status,
      reason: !model
        ? modelLoadFailed
          ? "model-failed"
          : "model-not-ready"
        : photoCheck.status !== "ready"
          ? "photo-not-ready"
          : photoCheck.duplicate
            ? "duplicate"
            : "ready",
    });
  }, [previewUrl, photoCheck, model, modelLoadFailed]);

  useEffect(() => {
    recordDiagnostic("ui.state", {
      source: "overlays",
      status: isCameraOpen
        ? "camera"
        : isStorageFullOpen
          ? "storage-full"
          : isInstallGuideOpen
            ? "install-guide"
            : legalModalType
              ? "legal"
              : selectedScan
                ? "scan-details"
                : previewUrl
                  ? isScanning
                    ? "analyzing"
                    : "photo-review"
                  : isScanSheetOpen
                    ? "scan-sheet"
                    : "none",
    });
  }, [
    isCameraOpen,
    isStorageFullOpen,
    isInstallGuideOpen,
    legalModalType,
    selectedScan,
    previewUrl,
    isScanning,
    isScanSheetOpen,
  ]);

  // Guidelines cached from Supabase, so treatment advice is readable offline
  const { data: cachedGuidelines, error: guidelinesError } = useStorageQuery(
    readStoredGuidelines,
    "guidelines",
  );
  const [nativeFailed, setNativeFailed] = useState(false);
  const nativeMarkedHealthy = useRef(false);
  useEffect(() => {
    if (
      !isAndroidBuild() ||
      !model ||
      scansQuery === undefined ||
      cachedGuidelines === undefined ||
      nativeMarkedHealthy.current
    )
      return;
    // A new OTA bundle is healthy only after the model and both SQLite readers work.
    let active = true;
    void initializeNativeRuntime()
      .then(() => nativeRequest("app.ready"))
      .then(() => {
        nativeMarkedHealthy.current = true;
      })
      .catch(() => {
        if (active) setNativeFailed(true);
      });
    return () => {
      active = false;
    };
  }, [model, scansQuery, cachedGuidelines]);

  const guidelineMap = useMemo(() => {
    const map: Record<string, DiseaseGuideline> = {};
    for (const g of cachedGuidelines || []) {
      map[g.id] = g;
    }
    return map;
  }, [cachedGuidelines]);

  useScrollLock(
    Boolean(
      previewUrl ||
      selectedScan ||
      legalModalType ||
      isCameraOpen ||
      isStorageFullOpen,
    ),
  );

  // Retake reopens the live camera or the same file picker used last.
  const lastPickerIdRef = useRef<string | null>(null);

  const clearPhoto = useCallback(() => {
    // Invalidate pending checks before clearing the preview or opening a picker.
    photoRequestRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    selectedFileRef.current = null;
    previewUrlRef.current = null;
    photoHashRef.current = null;
    setPreviewUrl(null);
    setScanError(null);
    updatePhotoCheck({ status: "idle" });
    const picker = document.getElementById(lastPickerIdRef.current ?? "");
    if (picker instanceof HTMLInputElement) picker.value = "";
  }, [updatePhotoCheck]);

  const checkSelectedPhoto = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file || scanInFlightRef.current) return;
    const request = ++photoRequestRef.current;
    const operation = createDiagnosticOperation("photo-check");
    const started = performance.now();
    recordDiagnostic("photo.check.started", { operation });
    updatePhotoCheck({ status: "checking" });
    try {
      // Hash once per selection. Retrying a database lookup reuses these bytes.
      recordDiagnostic("photo.hash.started", { operation });
      const hash = photoHashRef.current ?? (await computeImageHash(file));
      recordDiagnostic("photo.hash.completed", { operation });
      if (request !== photoRequestRef.current) return;
      photoHashRef.current = hash;
      recordDiagnostic("photo.duplicate-lookup.started", { operation });
      const duplicate = await findDuplicateScan(hash);
      recordDiagnostic("photo.duplicate-lookup.completed", {
        operation,
        status: duplicate ? "duplicate" : "new",
      });
      if (request !== photoRequestRef.current) return;
      updatePhotoCheck({ status: "ready", hash, duplicate: duplicate ?? null });
      recordDiagnostic("photo.check.completed", {
        operation,
        durationMs: Math.round(performance.now() - started),
      });
      if (duplicate) {
        console.log("---Duplicate photo detected — awaiting photo review.---");
      }
    } catch (err) {
      recordDiagnostic("photo.check.failed", {
        operation,
        errorName: diagnosticErrorName(err),
        durationMs: Math.round(performance.now() - started),
      });
      if (request !== photoRequestRef.current) return;
      console.error("Photo duplicate check failed:", err);
      updatePhotoCheck({ status: "error" });
    }
  }, [updatePhotoCheck]);

  // Captured photos and uploads share duplicate checking and photo review.
  const selectPhoto = useCallback(
    (file: File, source: string) => {
      if (scanInFlightRef.current) return;
      if (unsavedScan) {
        setIsStorageFullOpen(true);
        return;
      }
      restoreReviewFocusRef.current = false;
      clearPhoto();
      lastPickerIdRef.current = source;
      recordDiagnostic("photo.selected", {
        source: source === "guided-camera" ? "camera" : "upload",
      });
      setIsCameraOpen(false);
      selectedFileRef.current = file;
      previewUrlRef.current = URL.createObjectURL(file);
      setPreviewUrl(previewUrlRef.current);
      void checkSelectedPhoto();
    },
    [clearPhoto, checkSelectedPhoto, unsavedScan],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || scanInFlightRef.current) return;
      const pickerId = event.target.id;
      event.target.value = "";
      selectPhoto(file, pickerId);
    },
    [selectPhoto],
  );

  const openGuidedCamera = useCallback(() => {
    recordDiagnostic("camera.requested");
    if (scanInFlightRef.current) return;
    if (unsavedScan) {
      setIsStorageFullOpen(true);
      return;
    }
    restoreReviewFocusRef.current = false;
    clearPhoto();
    setIsScanSheetOpen(false);
    setIsCameraOpen(true);
  }, [clearPhoto, unsavedScan]);

  const closeGuidedCamera = useCallback(() => {
    recordDiagnostic("camera.closed");
    restoreReviewFocusRef.current = true;
    setIsCameraOpen(false);
  }, []);

  const handleCameraCapture = useCallback(
    (file: File) => selectPhoto(file, "guided-camera"),
    [selectPhoto],
  );

  const closePhotoReview = useCallback(() => {
    if (scanInFlightRef.current) return;
    recordDiagnostic("photo.review.closed");
    restoreReviewFocusRef.current = true;
    clearPhoto();
  }, [clearPhoto]);

  // Drop the current preview and reopen the same picker
  const handleRetake = useCallback(() => {
    if (scanInFlightRef.current) return;
    recordDiagnostic("photo.retake");
    const pickerId = lastPickerIdRef.current;
    restoreReviewFocusRef.current = true;
    clearPhoto();
    if (pickerId === "guided-camera") {
      restoreReviewFocusRef.current = false;
      setIsCameraOpen(true);
      return;
    }
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
    const operation = createDiagnosticOperation("saved-result");
    recordDiagnostic("saved-result.lookup.started", { operation });
    updatePhotoCheck({ status: "checking" });
    try {
      // Another tab may have deleted the saved report since selection.
      const existingScan = await findDuplicateScan(check.hash);
      recordDiagnostic("saved-result.lookup.completed", {
        operation,
        status: existingScan ? "found" : "missing",
      });
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
      recordDiagnostic("saved-result.lookup.failed", {
        operation,
        errorName: diagnosticErrorName(err),
      });
      if (request !== photoRequestRef.current) return;
      console.error("Saved photo lookup failed:", err);
      updatePhotoCheck({ status: "error" });
    }
  }, [clearPhoto, updatePhotoCheck]);

  const cancelDiagnosis = useCallback(() => {
    recordDiagnostic("diagnosis.cancel.requested");
    scanAbortRef.current?.abort(
      new DOMException("Diagnosis cancelled.", "AbortError"),
    );
  }, []);

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
    ) {
      recordDiagnostic("diagnosis.blocked", {
        reason: !file
          ? "no-photo"
          : !model
            ? "model-not-ready"
            : scanInFlightRef.current
              ? "busy"
              : check.status !== "ready"
                ? "photo-not-ready"
                : "duplicate",
      });
      return;
    }

    // Ref guards rapid clicks before React renders the scanning state.
    const operation = createDiagnosticOperation("diagnosis");
    const started = performance.now();
    recordDiagnostic("diagnosis.started", { operation });
    scanInFlightRef.current = true;
    const request = photoRequestRef.current;
    const controller = new AbortController();
    scanAbortRef.current = controller;
    setScanError(null);
    setIsScanning(true);
    setScanningStage("prepare");
    setScanningProgress(15);
    let inferenceImageUrl: string | null = null;
    const photoResource: { image: HTMLImageElement | null } = { image: null };
    let inferencePending: (() => boolean) | undefined;
    let preparedScan: ScanRecord | null = null;

    try {
      // Reports from a different model still need fresh inference. The same
      // current/legacy eligibility rule applies both here and during review.
      const prepared = await runDiagnosisStep(
        controller,
        "prepare",
        async (signal) => {
          const existingScan = await findDuplicateScan(check.hash);
          signal.throwIfAborted();
          if (existingScan)
            return { existingScan, classifier: null, image: null };
          const classifier = await import("@/lib/classifier");
          signal.throwIfAborted();
          inferencePending = classifier.isMangoInferencePending;
          inferenceImageUrl = URL.createObjectURL(file);
          const image = await loadDiagnosisImage(inferenceImageUrl, signal);
          photoResource.image = image;
          return { existingScan: null, classifier, image };
        },
      );
      if (request !== photoRequestRef.current) return;
      if (prepared.existingScan) {
        updatePhotoCheck({
          status: "ready",
          hash: check.hash,
          duplicate: prepared.existingScan,
        });
        return;
      }

      if (!prepared.classifier || !prepared.image) return;
      const { predictMangoDisease } = prepared.classifier;
      const img = prepared.image;

      setScanningStage("analyze");
      setScanningProgress(45);
      const { diseaseName, confidence, diagnosedResultTabular } =
        await runDiagnosisStep(controller, "analyze", (signal) =>
          predictMangoDisease(model, img, signal),
        );
      if (request !== photoRequestRef.current) return;

      setScanningStage("process");
      setScanningProgress(75);
      // Shrink it before saving. Inference already ran on the full image, so
      // nothing is lost by storing the smaller copy.
      const storageBlob = await runDiagnosisStep(
        controller,
        "process",
        (signal) => compressImageForStorage(img, 1000, 0.75, signal),
      );
      if (request !== photoRequestRef.current) return;

      setScanningStage("save");
      setScanningProgress(90);
      const scanToSave = prepareLocalScan({
        diseaseName,
        confidence,
        imageBlob: storageBlob,
        imageHash: check.hash,
      });
      preparedScan = scanToSave;

      const savedScan = await runDiagnosisStep(controller, "save", (signal) =>
        createScan(scanToSave, signal),
      );
      if (request !== photoRequestRef.current) return;

      // The committed record identifies this exact save without another DB lookup.
      // clearPhoto invalidates the request; finish its UI state before doing so.
      setIsScanning(false);
      setScanningProgress(0);
      clearPhoto();
      if (savedScan) {
        setSelectedScan({
          ...savedScan,
          diagnosedResultTabular,
        });
      }
      recordDiagnostic("diagnosis.result.opened", { operation });
    } catch (err) {
      recordDiagnostic("diagnosis.caller.failed", {
        operation,
        errorName: diagnosticErrorName(err),
      });
      if (request !== photoRequestRef.current) return;
      if (preparedScan && isStorageQuotaError(err)) {
        // Keep only the compressed photo/result for a same-ID save retry.
        // Releasing the original preview also keeps the two dialogs separate.
        setIsScanning(false);
        setScanningProgress(0);
        clearPhoto();
        setUnsavedScan(preparedScan);
        setSaveRetryError(null);
        setIsStorageFullOpen(true);
        console.warn(
          "[Diagnosis] local storage quota reached; result unsaved.",
        );
        return;
      }
      const isPending =
        inferencePending?.() ||
        (err instanceof Error &&
          "code" in err &&
          err.code === "INFERENCE_BUSY");
      const cancelled =
        err instanceof DOMException && err.name === "AbortError";
      setScanError(
        isPending
          ? "inference-pending"
          : err instanceof DiagnosisTimeoutError
            ? "timeout"
            : cancelled
              ? "cancelled"
              : "failed",
      );
      if (!cancelled) console.error("[Diagnosis] failed:", err);
    } finally {
      // Caller release is separate from any GPU operation still settling.
      recordDiagnostic("diagnosis.caller.released", {
        operation,
        durationMs: Math.round(performance.now() - started),
      });
      scanInFlightRef.current = false;
      if (scanAbortRef.current === controller) scanAbortRef.current = null;
      if (request === photoRequestRef.current) {
        setIsScanning(false);
        setScanningProgress(0);
      }
      photoResource.image?.removeAttribute("src");
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
    recordDiagnostic("navigation.changed", { tab });
    prevTabRef.current = tab;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewAllHistory = useCallback(
    () => handleTabChange("history"),
    [handleTabChange],
  );

  const manageStorage = useCallback(() => {
    if (scanInFlightRef.current) return;
    recordDiagnostic("storage.manage.requested");
    setIsStorageFullOpen(false);
    handleTabChange("history");
    requestAnimationFrame(() =>
      mainRef.current?.focus({ preventScroll: true }),
    );
  }, [handleTabChange]);

  const discardUnsavedScan = useCallback(() => {
    if (scanInFlightRef.current) return;
    recordDiagnostic("storage.draft.discarded");
    restoreReviewFocusRef.current = true;
    setUnsavedScan(null);
    setIsStorageFullOpen(false);
    setSaveRetryError(null);
  }, []);

  const retryUnsavedScan = useCallback(async () => {
    if (!unsavedScan || scanInFlightRef.current) return;
    recordDiagnostic("storage.retry.started");
    scanInFlightRef.current = true;
    const controller = new AbortController();
    scanAbortRef.current = controller;
    setIsStorageFullOpen(true);
    setIsRetryingSave(true);
    setSaveRetryError(null);
    try {
      const savedScan = await runDiagnosisStep(controller, "save", (signal) =>
        createScan(unsavedScan, signal),
      );
      setUnsavedScan(null);
      setIsStorageFullOpen(false);
      setSelectedScan(savedScan);
      recordDiagnostic("storage.retry.completed");
    } catch (error) {
      recordDiagnostic("storage.retry.failed", {
        errorName: diagnosticErrorName(error),
      });
      if (
        controller.signal.aborted &&
        !(error instanceof DiagnosisTimeoutError)
      )
        return;
      setSaveRetryError(
        isStorageQuotaError(error)
          ? "quota"
          : error instanceof DiagnosisTimeoutError
            ? "timeout"
            : "failed",
      );
      console.warn("[Diagnosis] retry could not save the local result:", error);
    } finally {
      scanInFlightRef.current = false;
      if (scanAbortRef.current === controller) scanAbortRef.current = null;
      setIsRetryingSave(false);
    }
  }, [unsavedScan, createScan]);

  if (isModelLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f6faf1] text-[#143519] font-sans flex flex-col justify-between">
      <div inert={isInstallGuideOpen}>
        {/* Top Header: mobile = minimal logo, desktop = full nav */}
        <TopHeader
          language={language}
          showInstallButton={!isAndroidBuild()}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLanguageChange={setLanguage}
          onInstall={openInstallGuide}
          onLogoClick={() => handleTabChange("home")}
        />

        {/* Hidden gallery input for the scan sheet and upload retake flow. */}
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
          {isAndroidBuild() &&
            (nativeFailed || scansError || guidelinesError) && (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-red-300 p-4"
              >
                {translations[language].nativeStartupError}
              </p>
            )}
          {modelLoadFailed && (
            <ModelStatusBanner
              language={language}
              onReload={() => window.location.reload()}
            />
          )}
          {unsavedScan && (
            <UnsavedScanNotice
              language={language}
              onRetry={retryUnsavedScan}
              onDiscard={discardUnsavedScan}
            />
          )}
          <div key={activeTab} className="tab-panel-fade-in flex flex-col">
            {activeTab === "home" && (
              <HomeTab
                scans={activeScans}
                language={language}
                onSelectScan={setSelectedScan}
                onDeleteScan={deleteScan}
                onViewAllHistory={handleViewAllHistory}
                onScanPress={openScanSheet}
                onDownload={openInstallGuide}
              />
            )}

            {activeTab === "history" && (
              <HistoryTab
                scans={activeScans}
                language={language}
                onSelectScan={setSelectedScan}
                onDeleteScan={deleteScan}
                onDeleteScans={deleteScans}
                onScanPress={openScanSheet}
              />
            )}

            {activeTab === "about" && (
              <AboutTab language={language} onScanPress={openScanSheet}>
                {/* Load these with the APK entry so first About navigation cannot suspend the app. */}
                <DiagnosticsPanel language={language} />
                {isAndroidBuild() && (
                  <BackupRecoveryPanel language={language} />
                )}
              </AboutTab>
            )}
          </div>
        </main>
      </div>

      {/* Scan Sheet (bottom sheet triggered by center FAB) */}
      {!isInstallGuideOpen && (
        <ScanSheet
          isOpen={isScanSheetOpen}
          language={language}
          onClose={closeScanSheet}
          onCamera={openGuidedCamera}
        />
      )}

      {isInstallGuideOpen && (
        <InstallGuideOverlay language={language} onClose={closeInstallGuide} />
      )}

      {isCameraOpen && (
        <GuidedCamera
          language={language}
          onCapture={handleCameraCapture}
          onClose={closeGuidedCamera}
        />
      )}

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
          scanningStage={scanningStage}
          scanError={scanError}
          language={language}
          onRunDiagnosis={runDiagnosis}
          onCancelDiagnosis={cancelDiagnosis}
          onReloadApp={() => window.location.reload()}
          onRetake={handleRetake}
          onClose={closePhotoReview}
          onViewSavedResult={viewSavedResult}
          onRetryPhotoCheck={checkSelectedPhoto}
        />
      )}

      {/* Selected Scan Details Modal */}
      {unsavedScan && isStorageFullOpen && (
        <StorageFullModal
          language={language}
          isSaving={isRetryingSave}
          error={saveRetryError}
          onManageHistory={manageStorage}
          onRetry={retryUnsavedScan}
          onDiscard={discardUnsavedScan}
        />
      )}

      {selectedScan && (
        <ScanDetailsModal
          scan={selectedScan}
          // diagnosedResultTabular={selectedScan.diagnosedResultTabular}
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
      {isAndroidBuild() && (
        <AndroidUpdateModal
          language={language}
          blocked={Boolean(
            previewUrl ||
            selectedScan ||
            legalModalType ||
            isCameraOpen ||
            isScanSheetOpen ||
            isStorageFullOpen ||
            unsavedScan ||
            isScanning ||
            isRetryingSave ||
            isInstallGuideOpen,
          )}
        />
      )}
      <div inert={isInstallGuideOpen}>
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
    </div>
  );
}
