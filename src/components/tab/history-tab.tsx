import { memo } from "react";
import { type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import { type Language } from "@/lib/translations";
import { ScanHistoryList } from "@/components/scan/scan-history-list";

interface HistoryTabProps {
  scans: ScanRecord[];
  language: Language;
  getGuidelineColor: (diseaseName: string) => DiseaseGuideline["color"];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
}

export const HistoryTab = memo(function HistoryTab({
  scans,
  language,
  getGuidelineColor,
  onSelectScan,
  onDeleteScan,
}: HistoryTabProps) {
  return (
    <ScanHistoryList
      scans={scans}
      language={language}
      getGuidelineColor={getGuidelineColor}
      onSelectScan={onSelectScan}
      onDeleteScan={onDeleteScan}
      isFullHistoryPage={true}
    />
  );
});
