import { memo, useMemo } from "react";
import { type ScanRecord } from "@/lib/db";
import { type Language } from "@/lib/translations";
import { HowItWorksSteps } from "@/components/scan/how-it-works-steps";
import { DiseaseCoverageCard } from "@/components/scan/disease-coverage-card";
import { ScanHistoryList } from "@/components/scan/scan-history-list";

const HOME_PREVIEW_COUNT = 4;

interface HomeTabProps {
  scans: ScanRecord[];
  language: Language;
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onViewAllHistory: () => void;
  onScanPress: () => void;
}

export const HomeTab = memo(function HomeTab({
  scans,
  language,
  onSelectScan,
  onDeleteScan,
  onViewAllHistory,
  onScanPress,
}: HomeTabProps) {
  const homeScans = useMemo(() => scans.slice(0, HOME_PREVIEW_COUNT), [scans]);

  return (
    <>
      <HowItWorksSteps language={language} />
      <DiseaseCoverageCard language={language} />
      <ScanHistoryList
        scans={homeScans}
        language={language}
        onSelectScan={onSelectScan}
        onDeleteScan={onDeleteScan}
        onViewAllHistory={onViewAllHistory}
        onScanPress={onScanPress}
        isFullHistoryPage={false}
      />
    </>
  );
});
