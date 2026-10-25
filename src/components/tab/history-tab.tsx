import { memo } from "react";
import { type ScanListRecord } from "@/lib/scan-photo";
import { type Language } from "@/lib/translations";
import { ScanHistoryList } from "@/components/scan/scan-history-list";

interface HistoryTabProps {
  scans: ScanListRecord[];
  language: Language;
  onSelectScan: (scan: ScanListRecord) => void;
  onDeleteScan: (id: string) => Promise<void>;
  onDeleteScans: (ids: string[]) => Promise<void>;
  onScanPress: () => void;
}

export const HistoryTab = memo(function HistoryTab({
  scans,
  language,
  onSelectScan,
  onDeleteScan,
  onDeleteScans,
  onScanPress,
}: HistoryTabProps) {
  return (
    <ScanHistoryList
      scans={scans}
      language={language}
      onSelectScan={onSelectScan}
      onDeleteScan={onDeleteScan}
      onDeleteScans={onDeleteScans}
      onScanPress={onScanPress}
      isFullHistoryPage={true}
    />
  );
});
