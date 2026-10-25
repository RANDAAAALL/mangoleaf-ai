import { createRoot } from "react-dom/client";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
import type { Language } from "@/lib/translations";

// This test-only entry renders the real panel/form with a controlled cloud module.
const language: Language = new URLSearchParams(location.search).has("bis")
  ? "bis"
  : "en";
createRoot(document.getElementById("root")!).render(
  <BackupRecoveryPanel language={language} />,
);
