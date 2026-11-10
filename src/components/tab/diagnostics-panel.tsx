import { useEffect, useMemo, useRef, useState } from "react";
import { useDiagnostics } from "@/hooks/useDiagnostics";
import {
  clearDiagnostics,
  DIAGNOSTICS_MAX_EVENTS,
  formatDiagnostics,
  recordDiagnostic,
  setDiagnosticsEnabled,
} from "@/lib/diagnostics";
import { translations, type Language } from "@/lib/translations";
import { downloadDiagnosticLog } from "@/lib/diagnostics-export";

/** Production never mounts the log viewer, including through stale navigation state. */
export function DiagnosticsPanel({
  language,
  embedded = false,
}: {
  language: Language;
  embedded?: boolean;
}) {
  if (
    process.env.NEXT_PUBLIC_APP_TARGET === "android" &&
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT !== "testing"
  )
    return null;
  return <DiagnosticsViewer language={language} embedded={embedded} />;
}

function DiagnosticsViewer({
  language,
  embedded,
}: {
  language: Language;
  embedded: boolean;
}) {
  const t = translations[language];
  const snapshot = useDiagnostics();
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<
    "copied" | "copyFailed" | "downloadFailed" | "cleared" | null
  >(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const mounted = useRef(false);
  const feedbackRevision = useRef(0);
  const downloadPending = useRef(false);
  const copyPending = useRef(false);
  // Feedback-only renders reuse the same bounded log; exports still format fresh evidence on demand.
  const logText = useMemo(
    () => (expanded ? formatDiagnostics(snapshot) : ""),
    [expanded, snapshot],
  );

  useEffect(() => {
    mounted.current = true;
    const inactive = () => {
      feedbackRevision.current++;
      if (mounted.current) setFeedback(null);
    };
    const visibility = () => {
      if (document.visibilityState !== "visible") inactive();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", inactive);
    return () => {
      mounted.current = false;
      inactive();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", inactive);
    };
  }, []);

  function current(revision: number) {
    return (
      mounted.current &&
      feedbackRevision.current === revision &&
      document.visibilityState === "visible"
    );
  }
  const buttonClass =
    "min-h-11 rounded-xl border border-[#b4d2ac] bg-white px-4 py-2 text-sm font-bold text-[#245f2d] hover:bg-[#edf6e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]";
  const feedbackText = {
    copied: t.diagnosticsCopied,
    copyFailed: t.diagnosticsCopyFailed,
    downloadFailed: t.diagnosticsDownloadFailed,
    cleared: t.diagnosticsCleared,
  };

  async function copyLogs() {
    if (copyPending.current) return;
    copyPending.current = true;
    setCopying(true);
    const revision = ++feedbackRevision.current;
    recordDiagnostic("diagnostics.copy");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(formatDiagnostics());
      if (current(revision)) setFeedback("copied");
    } catch {
      // Keep manual selection available when mobile clipboard permission fails.
      if (current(revision)) {
        textRef.current?.focus();
        textRef.current?.select();
        setFeedback("copyFailed");
      }
    } finally {
      copyPending.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  async function downloadLogs() {
    if (downloadPending.current) return;
    downloadPending.current = true;
    const revision = ++feedbackRevision.current;
    setDownloading(true);
    recordDiagnostic("diagnostics.download");
    try {
      await downloadDiagnosticLog(formatDiagnostics());
      if (current(revision)) setFeedback(null);
    } catch {
      if (current(revision)) setFeedback("downloadFailed");
    } finally {
      downloadPending.current = false;
      if (mounted.current) setDownloading(false);
    }
  }

  return (
    <section
      aria-label={embedded ? t.diagnosticsTitle : undefined}
      aria-labelledby={embedded ? undefined : "diagnostics-heading"}
      className="rounded-3xl border border-[#cfe2c8] bg-white p-6 sm:p-8"
      lang={language === "en" ? "en" : "ceb"}
    >
      {!embedded && (
        <h2
          id="diagnostics-heading"
          className="text-2xl font-bold tracking-tight text-[#143519]"
        >
          {t.diagnosticsTitle}
        </h2>
      )}
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#526856]">
        {t.diagnosticsDescription}
      </p>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-[#143519]">
        <input
          type="checkbox"
          checked={snapshot.enabled}
          onChange={(event) => {
            feedbackRevision.current++;
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
          feedbackRevision.current++;
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
            value={logText}
            rows={12}
            className="w-full rounded-xl border border-[#cfe2c8] bg-[#f6faf1] p-3 font-mono text-xs leading-5 text-[#143519] focus-visible:outline-2 focus-visible:outline-[#277839]"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={copyLogs}
              disabled={copying}
              aria-busy={copying}
            >
              {t.diagnosticsCopy}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => void downloadLogs()}
              disabled={downloading}
              aria-busy={downloading}
            >
              {t.diagnosticsDownload}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                // A late clipboard/export result must not overwrite this newer Clear action.
                feedbackRevision.current++;
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
