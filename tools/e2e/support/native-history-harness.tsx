import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ScanHistoryList } from "@/components/scan/scan-history-list";
import { ScanDetailsModal } from "@/components/modal/scan-details-modal";
import { useStorageQuery } from "@/hooks/useStorageQuery";
import { readNativeScans, notifyStorageChange } from "@/lib/native-storage";
import type { ScanListRecord } from "@/lib/scan-photo";

// Synthetic native protocol exercises production readers/components without any database or Auth.
const query = new URLSearchParams(location.search);
let rows = Array.from({ length: 500 }, (_, index) => ({
  id: `fixture-${index}`,
  disease_name: "Healthy Leaf",
  confidence: 0.95,
  image_url: "https://legacy.invalid/never-read",
  updated_at: "2026-10-26T00:00:00Z",
  photoUri:
    query.has("missing") && index === 0
      ? "/_native/photos/missing"
      : query.has("invalid") && index === 0
        ? "https://legacy.invalid/never-read"
        : `/_native/photos/fixture-${index}`,
}));
const calls: string[] = [];
const port: {
  onmessage?: (event: { data: string }) => void;
  postMessage(data: string): void;
} = {
  postMessage(data) {
    const { id, method, payload } = JSON.parse(data);
    calls.push(method);
    if (method === "storage.report.delete") {
      rows = rows.filter((row) => !payload.ids.includes(row.id));
    } else if (method !== "storage.report.list")
      throw Error("Unexpected native method");
    queueMicrotask(() =>
      port.onmessage?.({
        data: JSON.stringify({
          id,
          result: method === "storage.report.list" ? rows : true,
        }),
      }),
    );
  },
};
Object.assign(window, { MangoLeafNative: port, historyFixture: { calls } });

/** Exercise the real photo/list lifecycle, including metadata refresh and deletion. */
function Harness() {
  const { data } = useStorageQuery(readNativeScans, "reports");
  const [full, setFull] = useState(false);
  const [selected, setSelected] = useState<ScanListRecord | null>(null);
  const remove = async (ids: string[]) => {
    rows = rows.filter((row) => !ids.includes(row.id));
    notifyStorageChange("reports");
  };
  return (
    <>
      <button onClick={() => setFull(false)}>Home fixture</button>
      <button onClick={() => setFull(true)}>History fixture</button>
      <button onClick={() => notifyStorageChange("reports")}>
        Refresh reports fixture
      </button>
      <button onClick={() => notifyStorageChange("guidelines")}>
        Refresh guidelines fixture
      </button>
      <output>{data?.length ?? 0}</output>
      <ScanHistoryList
        key={String(full)}
        scans={data ?? []}
        language="en"
        onSelectScan={setSelected}
        onDeleteScan={(id) => remove([id])}
        onDeleteScans={remove}
        isFullHistoryPage={full}
      />
      {selected && (
        <ScanDetailsModal
          scan={selected}
          language="en"
          guidelineText={{ en: "Fixture advice", bis: "Fixture advice" }}
          onLanguageChange={() => {}}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
