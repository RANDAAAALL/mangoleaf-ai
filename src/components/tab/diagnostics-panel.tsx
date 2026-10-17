import { useRef, useState } from "react";
import { useDiagnostics } from "@/hooks/useDiagnostics";
import {
  clearDiagnostics,
  DIAGNOSTICS_MAX_EVENTS,
  formatDiagnostics,
  recordDiagnostic,
  setDiagnosticsEnabled,
} from "@/lib/diagnostics";
import { translations, type Language } from "@/lib/translations";

/** One optional viewer for the recorder shared by the whole application. */
export function DiagnosticsPanel({ language }: { language: Language }) {
  const t = translations[language];
  const snapshot = useDiagnostics();
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<
    "copied" | "copyFailed" | "downloadFailed" | "cleared" | null
  >(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const buttonClass =
    "min-h-11 rounded-xl border border-[#b4d2ac] bg-white px-4 py-2 text-sm font-bold text-[#245f2d] hover:bg-[#edf6e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]";
  const feedbackText = {
    copied: t.diagnosticsCopied,
    copyFailed: t.diagnosticsCopyFailed,
    downloadFailed: t.diagnosticsDownloadFailed,
    cleared: t.diagnosticsCleared,
  };

  async function copyLogs() {
    recordDiagnostic("diagnostics.copy");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(formatDiagnostics());
      setFeedback("copied");
    } catch {
      // Keep manual selection available when mobile clipboard permission fails.
      textRef.current?.focus();
      textRef.current?.select();
      setFeedback("copyFailed");
    }
  }

  function downloadLogs() {
    recordDiagnostic("diagnostics.download");
    let url: string | null = null;
    let link: HTMLAnchorElement | null = null;
    try {
      url = URL.createObjectURL(
        new Blob([formatDiagnostics()], { type: "text/plain;charset=utf-8" }),
      );
      link = document.createElement("a");
      link.href = url;
      link.download = `MangoLeafAI-diagnostics-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      setFeedback(null);
    } catch {
      setFeedback("downloadFailed");
    } finally {
      link?.remove();
      // Give the browser time to consume the download before releasing its URL.
      if (url) {
        const downloadUrl = url;
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    }
  }

  return (
    <section
      aria-labelledby="diagnostics-heading"
      className="rounded-3xl border border-[#cfe2c8] bg-white p-6 sm:p-8"
      lang={language === "en" ? "en" : "ceb"}
    >
      <h2
        id="diagnostics-heading"
        className="text-2xl font-bold tracking-tight text-[#143519]"
      >
        {t.diagnosticsTitle}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#526856]">
        {t.diagnosticsDescription}
      </p>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-[#143519]">
        <input
          type="checkbox"
          checked={snapshot.enabled}
          onChange={(event) => {
            setDiagnosticsEnabled(event.target.checked);
            setFeedback(null);
          }}
          className="h-5 w-5 accent-[#277839]"
        />
        {t.diagnosticsEnable}
      </label>
      <p className="mt-2 text-xs leading-5 text-[#526856]">
        {t.diagnosticsRetention.replace("{n}", String(DIAGNOSTICS_MAX_EVENTS))}
      </p>
      {snapshot.persistence === "unavailable" && (
        <p role="status" className="mt-3 text-sm font-semibold text-[#854d0e]">
          {t.diagnosticsMemoryOnly}
        </p>
      )}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="diagnostics-viewer"
        className={`${buttonClass} mt-4`}
        onClick={() => {
          if (!expanded) recordDiagnostic("diagnostics.open");
          setExpanded(!expanded);
          setFeedback(null);
        }}
      >
        {expanded ? t.diagnosticsHide : t.diagnosticsView}
      </button>
      {expanded && (
        <div id="diagnostics-viewer" className="mt-4">
          <p className="mb-2 text-xs text-[#526856]">
            {t.diagnosticsEventCount.replace(
              "{n}",
              String(snapshot.events.length),
            )}
          </p>
          <textarea
            ref={textRef}
            aria-label={t.diagnosticsLogLabel}
            readOnly
            spellCheck={false}
            value={formatDiagnostics()}
            rows={12}
            className="w-full rounded-xl border border-[#cfe2c8] bg-[#f6faf1] p-3 font-mono text-xs leading-5 text-[#143519] focus-visible:outline-2 focus-visible:outline-[#277839]"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={copyLogs}>
              {t.diagnosticsCopy}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={downloadLogs}
            >
              {t.diagnosticsDownload}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                clearDiagnostics();
                setFeedback("cleared");
              }}
            >
              {t.diagnosticsClear}
            </button>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-3 text-sm text-[#526856]"
          >
            {feedback ? feedbackText[feedback] : ""}
          </p>
        </div>
      )}
    </section>
  );
}
