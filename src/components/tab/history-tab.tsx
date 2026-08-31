import { memo } from "react";
import { type ScanRecord } from "@/lib/db";
import { type Language } from "@/lib/translations";
import { ScanHistoryList } from "@/components/scan/scan-history-list";

interface HistoryTabProps {
  scans: ScanRecord[];
  language: Language;
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onScanPress: () => void;
}

export const HistoryTab = memo(function HistoryTab({
  scans,
  language,
  onSelectScan,
  onDeleteScan,
  onScanPress,
}: HistoryTabProps) {
  return (
    <ScanHistoryList
      scans={scans}
      language={language}
      onSelectScan={onSelectScan}
      onDeleteScan={onDeleteScan}
      onScanPress={onScanPress}
      isFullHistoryPage={true}
    />
  );
});
