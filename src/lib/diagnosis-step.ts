import {
  createDiagnosticOperation,
  diagnosticErrorName,
  recordDiagnostic,
} from "@/lib/diagnostics";

export type DiagnosisStage = "prepare" | "analyze" | "process" | "save";
export type DiagnosisError =
  "failed" | "timeout" | "cancelled" | "inference-pending";

/** Recovery deadlines, not expected completion times or measured progress. */
export const DIAGNOSIS_STEP_TIMEOUT_MS: Record<DiagnosisStage, number> = {
  prepare: 20_000,
  analyze: 60_000,
  process: 20_000,
  save: 15_000,
};

export class DiagnosisTimeoutError extends Error {
  constructor(public readonly stage: DiagnosisStage) {
    super(`Diagnosis ${stage} exceeded its recovery deadline.`);
    this.name = "DiagnosisTimeoutError";
  }
}

/** Stops awaiting stalled work; callers must also guard/cancel its side effects. */
export async function runDiagnosisStep<T>(
  controller: AbortController,
  stage: DiagnosisStage,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const { signal } = controller;
  signal.throwIfAborted();
  const started = performance.now();
  const diagnosticOperation = createDiagnosticOperation("stage");
  recordDiagnostic("diagnosis.stage.started", {
    operation: diagnosticOperation,
    stage,
  });
  const limit = DIAGNOSIS_STEP_TIMEOUT_MS[stage];
  let outcome = "failed";
  try {
    const result = await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        controller.abort(new DiagnosisTimeoutError(stage));
      }, limit);
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        cleanup();
        reject(signal.reason);
      };
      signal.addEventListener("abort", onAbort, { once: true });

      // Yield between stages so React can paint the status before synchronous work.
      Promise.resolve()
        .then(() => new Promise<void>((resume) => setTimeout(resume, 0)))
        .then(() => {
          signal.throwIfAborted();
          return operation(signal);
        })
        .then(
          (value) => {
            // A synchronous stall can delay timers; do not accept its late result.
            if (!signal.aborted && performance.now() - started >= limit) {
              controller.abort(new DiagnosisTimeoutError(stage));
            }
            cleanup();
            if (signal.aborted) reject(signal.reason);
            else resolve(value);
          },
          (error: unknown) => {
            cleanup();
            reject(error);
          },
        );
    });
    signal.throwIfAborted();
    outcome = "complete";
    return result;
  } catch (error) {
    recordDiagnostic("diagnosis.stage.error", {
      operation: diagnosticOperation,
      stage,
      errorName: diagnosticErrorName(error),
    });
    throw error;
  } finally {
    recordDiagnostic("diagnosis.stage.finished", {
      operation: diagnosticOperation,
      stage,
      outcome: signal.aborted
        ? signal.reason instanceof DiagnosisTimeoutError
          ? "timeout"
          : "cancelled"
        : outcome,
      durationMs: Math.round(performance.now() - started),
    });
    console.log(
      `[Diagnosis] stage=${stage} outcome=${signal.aborted ? "aborted" : outcome} durationMs=${Math.round(performance.now() - started)}`,
    );
  }
}

/** Release detached decoders on abort and ignore late load/error callbacks. */
export function loadDiagnosisImage(
  url: string,
  signal: AbortSignal,
): Promise<HTMLImageElement> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      image.removeAttribute("src");
      reject(signal.reason);
    };
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error("Diagnosis photo could not be decoded."));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    image.src = url;
    if (signal.aborted) onAbort();
  });
}
