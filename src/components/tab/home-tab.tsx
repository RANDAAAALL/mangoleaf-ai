import React, { memo, useMemo } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { type Language } from "@/lib/translations";
import { HowItWorksCard } from "@/components/scan/how-it-works-card";
import { DiagnosticScanner } from "@/components/scan/diagnostic-scanner";
import { ScanHistoryList } from "@/components/scan/scan-history-list";

// Recent scans shown on the home screen before the farmer taps "view all".
const HOME_PREVIEW_COUNT = 4;

interface HomeTabProps {
  scans: ScanRecord[];
  language: Language;
  previewUrl: string | null;
  isScanning: boolean;
  scanningProgress: number;
  getGuidelineColor: (diseaseName: string) => DiseaseGuideline["color"];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunDiagnosis: () => void;
  onRetake: () => void;
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onViewAllHistory: () => void;
}

export const HomeTab = memo(function HomeTab({
  scans,
  language,
  previewUrl,
  isScanning,
  scanningProgress,
  getGuidelineColor,
  onFileChange,
  onRunDiagnosis,
  onRetake,
  onSelectScan,
  onDeleteScan,
  onViewAllHistory,
}: HomeTabProps) {
  const homeScans = useMemo(() => scans.slice(0, HOME_PREVIEW_COUNT), [scans]);

  return (
    <>
      {/* How It Works Banner */}
      <HowItWorksCard language={language} />

      {/* Dual Scan Cards Section */}
      <DiagnosticScanner
        previewUrl={previewUrl}
        isScanning={isScanning}
        scanningProgress={scanningProgress}
        language={language}
        onFileChange={onFileChange}
        onRunDiagnosis={onRunDiagnosis}
        onRetake={onRetake}
      />

      {/* Recent scans preview */}
      <ScanHistoryList
        scans={homeScans}
        language={language}
        getGuidelineColor={getGuidelineColor}
        onSelectScan={onSelectScan}
        onDeleteScan={onDeleteScan}
        onViewAllHistory={onViewAllHistory}
        isFullHistoryPage={false}
      />
    </>
  );
});
