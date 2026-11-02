import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ScanDetailsModal } from "@/components/modal/scan-details-modal";
import { UNCERTAIN_LABEL, modelVersion } from "@/lib/constants";
import type { Language } from "@/lib/translations";

// Fixed display scores exercise build policy and rejection presentation, not model accuracy.
const rows = [
  { Class: "Healthy Leaf", Probability: "63.0000%" },
  { Class: "Anthracnose", Probability: "14.0000%" },
  { Class: "Bacterial Canker", Probability: "7.0000%" },
  { Class: "Sooty Mold", Probability: "6.0000%" },
  { Class: "Mango Scab", Probability: "4.0000%" },
  { Class: "Bacterial Black Spot", Probability: "3.0000%" },
  { Class: "Healthy Fruit", Probability: "3.0000%" },
];

declare global {
  interface Window {
    predictionDetailsFixture: { showSaved(): void };
  }
}

function PredictionDetailsHarness() {
  const [language, setLanguage] = useState<Language>("en");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    window.predictionDetailsFixture = { showSaved: () => setSaved(true) };
  }, []);
  return (
    <ScanDetailsModal
      scan={{
        id: "controlled-score-result",
        disease_name: UNCERTAIN_LABEL,
        confidence: 0.63,
        image_url: "",
        image_hash: "0".repeat(64),
        updated_at: "2026-11-03T01:00:00.000Z",
        model_version: modelVersion,
      }}
      language={language}
      guidelineText={{
        en: "Controlled display fixture",
        bis: "Controlled display fixture",
      }}
      onLanguageChange={setLanguage}
      onClose={() => {}}
      // Supplying rows even in Release/web proves the modal's independent build guard.
      diagnosedResultTabular={saved ? undefined : rows}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <PredictionDetailsHarness />,
);
