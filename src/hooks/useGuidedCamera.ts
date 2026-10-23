"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDiagnosticOperation, recordDiagnostic } from "@/lib/diagnostics";

type CameraPhase = "starting" | "ready" | "capturing" | "paused" | "error";

type CameraError =
  | "unsupported"
  | "permission"
  | "unavailable"
  | "start"
  | "capture"
  | "interrupted";

function stopTracks(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

function isBackgrounded() {
  return document.visibilityState === "hidden";
}

function cameraError(error: unknown): CameraError {
  const name = error instanceof Error ? error.name : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "permission";
  }

  if (
    name === "NotFoundError" ||
    name === "NotReadableError" ||
    name === "OverconstrainedError"
  ) {
    return "unavailable";
  }

  return "start";
}

export function useGuidedCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(false);
  const requestRef = useRef(0);
  const playbackReadyRef = useRef(false);
  const capturingRef = useRef(false);
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<CameraPhase>("starting");
  const [error, setError] = useState<CameraError | null>(null);

  const clearStartupTimer = useCallback(() => {
    if (startupTimerRef.current !== null) {
      clearTimeout(startupTimerRef.current);
      startupTimerRef.current = null;
    }
  }, []);

  const releaseCamera = useCallback(() => {
    playbackReadyRef.current = false;

    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) stopTracks(stream);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, []);

  const stop = useCallback(() => {
    // Cancel pending permission and encoding work before releasing hardware.
    requestRef.current += 1;
    capturingRef.current = false;
    clearStartupTimer();
    releaseCamera();
  }, [clearStartupTimer, releaseCamera]);

  const fail = useCallback(
    (reason: CameraError) => {
      stop();
      if (!mountedRef.current) return;
      setError(reason);
      setPhase("error");
    },
    [stop],
  );

  const refreshReadiness = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (
      !mountedRef.current ||
      !video ||
      !stream ||
      video.srcObject !== stream ||
      !playbackReadyRef.current ||
      video.paused ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth <= 0 ||
      video.videoHeight <= 0 ||
      capturingRef.current
    ) {
      return;
    }

    clearStartupTimer();
    setPhase("ready");
  }, [clearStartupTimer]);

  const pauseForBackground = useCallback(() => {
    stop();
    if (!mountedRef.current) return;
    setError(null);
    setPhase("paused");
  }, [stop]);

  const start = useCallback(async () => {
    if (!mountedRef.current) return;
    stop();
    if (isBackgrounded()) {
      pauseForBackground();
      return;
    }

    setError(null);
    setPhase("starting");

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail("unsupported");
      return;
    }

    const request = requestRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      });

      // A permission dialog can finish after Close, backgrounding, or unmount.
      if (
        !mountedRef.current ||
        requestRef.current !== request ||
        isBackgrounded()
      ) {
        stopTracks(stream);
        return;
      }

      const video = videoRef.current;
      if (!video || stream.getVideoTracks().length === 0) {
        stopTracks(stream);
        fail("unavailable");
        return;
      }

      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener(
          "ended",
          () => {
            if (streamRef.current === stream) fail("interrupted");
          },
          { once: true },
        );
      });
      video.srcObject = stream;

      // Permission prompts have no deadline; an acquired preview does.
      startupTimerRef.current = setTimeout(() => {
        if (requestRef.current === request) fail("start");
      }, 15000);

      await video.play();
      if (!mountedRef.current || requestRef.current !== request) return;
      playbackReadyRef.current = true;
      refreshReadiness();
    } catch (cause) {
      if (mountedRef.current && requestRef.current === request) {
        fail(cameraError(cause));
      }
    }
  }, [fail, pauseForBackground, refreshReadiness, stop]);

  const capture = useCallback(
    async (onCapture: (file: File) => void) => {
      const video = videoRef.current;
      const stream = streamRef.current;

      if (
        capturingRef.current ||
        !mountedRef.current ||
        !video ||
        !stream ||
        !playbackReadyRef.current ||
        video.paused ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
      ) {
        return;
      }

      const request = requestRef.current;
      const operation = createDiagnosticOperation("camera-capture");
      const started = performance.now();
      capturingRef.current = true;
      setPhase("capturing");
      const canvas = document.createElement("canvas");

      try {
        // Match the square preview's centered object-cover crop at capture time.
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sourceX = (video.videoWidth - size) / 2;
        const sourceY = (video.videoHeight - size) / 2;
        canvas.width = size;
        canvas.height = size;
        recordDiagnostic("camera.capture.started", {
          operation,
          width: size,
          height: size,
        });
        const frameStarted = performance.now();
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Camera capture canvas is unavailable.");
        context.drawImage(
          video,
          sourceX,
          sourceY,
          size,
          size,
          0,
          0,
          size,
          size,
        );

        recordDiagnostic("camera.capture.frame.completed", {
          operation,
          durationMs: Math.round(performance.now() - frameStarted),
        });
        // Encoding needs the copied canvas only. Stop video/hardware now instead of keeping
        // the live stream competing for resources throughout a potentially slow JPEG encode.
        releaseCamera();
        const encodingStarted = performance.now();

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (encoded) => {
              if (encoded) resolve(encoded);
              else reject(new Error("Camera photo encoding failed."));
            },
            "image/jpeg",
            0.92,
          );
        });
        recordDiagnostic("camera.capture.encode.completed", {
          operation,
          durationMs: Math.round(performance.now() - encodingStarted),
        });

        if (
          !mountedRef.current ||
          requestRef.current !== request ||
          isBackgrounded()
        ) {
          recordDiagnostic("camera.capture.finished", {
            operation,
            outcome: "cancelled",
            durationMs: Math.round(performance.now() - started),
          });
          return;
        }

        const file = new File([blob], `mangoleaf-camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        stop();
        recordDiagnostic("camera.capture.finished", {
          operation,
          outcome: "complete",
          durationMs: Math.round(performance.now() - started),
        });
        onCapture(file);
      } catch {
        recordDiagnostic("camera.capture.finished", {
          operation,
          outcome: "error",
          durationMs: Math.round(performance.now() - started),
        });
        if (mountedRef.current && requestRef.current === request) {
          fail("capture");
        }
      } finally {
        // Release the full-resolution backing surface after encoding settles, including late cancellation.
        canvas.width = 0;
        canvas.height = 0;
      }
    },
    [fail, releaseCamera, stop],
  );

  const handleVideoError = useCallback(() => {
    if (streamRef.current) fail("start");
  }, [fail]);

  useEffect(() => {
    mountedRef.current = true;
    const request = requestRef.current;
    // Keep React's development mount check from opening two camera requests.
    queueMicrotask(() => {
      if (mountedRef.current && requestRef.current === request) void start();
    });

    const handleVisibility = () => {
      if (isBackgrounded()) pauseForBackground();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", pauseForBackground);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", pauseForBackground);
      stop();
    };
  }, [pauseForBackground, start, stop]);

  return {
    videoRef,
    phase,
    error,
    start,
    stop,
    capture,
    refreshReadiness,
    handleVideoError,
  };
}
