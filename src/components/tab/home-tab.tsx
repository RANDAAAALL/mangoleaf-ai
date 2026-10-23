import { memo, useMemo } from "react";
import { type ScanRecord } from "@/lib/db";
import { type Language } from "@/lib/translations";
import { HowItWorksSteps } from "@/components/scan/how-it-works-steps";
import { DiseaseCoverageCard } from "@/components/scan/disease-coverage-card";
import { ScanHistoryList } from "@/components/scan/scan-history-list";
import { DownloadPromptCard } from "@/components/scan/download-prompt-card";
import { isAndroidBuild } from "@/lib/native-bridge";

// Pass up to four newest reports. The list shows only one below 768px.
const HOME_PREVIEW_COUNT = 4;

interface HomeTabProps {
  scans: ScanRecord[];
  language: Language;
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => Promise<void>;
  onViewAllHistory: () => void;
  onScanPress: () => void;
  onDownload: () => void;
}

export const HomeTab = memo(function HomeTab({
  scans,
  language,
  onSelectScan,
  onDeleteScan,
  onViewAllHistory,
  onScanPress,
  onDownload,
}: HomeTabProps) {
  const homeScans = useMemo(() => scans.slice(0, HOME_PREVIEW_COUNT), [scans]);

  return (
    <>
      <HowItWorksSteps language={language} />
      <DiseaseCoverageCard language={language} />
      <div className={isAndroidBuild() ? "" : "md:hidden"}>
        <ScanHistoryList
          scans={homeScans}
          language={language}
          onSelectScan={onSelectScan}
          onDeleteScan={onDeleteScan}
          onViewAllHistory={onViewAllHistory}
          onScanPress={onScanPress}
          isFullHistoryPage={false}
        />
      </div>
      <div className={isAndroidBuild() ? "hidden" : "hidden md:block"}>
        <DownloadPromptCard language={language} onDownload={onDownload} />
      </div>
    </>
  );
});
