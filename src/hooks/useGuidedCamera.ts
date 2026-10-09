"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  const clearStartupTimer = useCallback(() => {
    if (startupTimerRef.current !== null) {
      clearTimeout(startupTimerRef.current);
      startupTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    // Cancel pending permission and encoding work before releasing hardware.
    requestRef.current += 1;
    playbackReadyRef.current = false;
    capturingRef.current = false;
    clearStartupTimer();

    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) stopTracks(stream);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, [clearStartupTimer]);

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
    setFrameSize((previous) =>
      previous.width === video.videoWidth &&
      previous.height === video.videoHeight
        ? previous
        : { width: video.videoWidth, height: video.videoHeight },
    );
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
      capturingRef.current = true;
      setPhase("capturing");

      try {
        const canvas = document.createElement("canvas");
        // Preserve the full frame. The guide never changes the captured area.
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Camera capture canvas is unavailable.");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

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

        if (
          !mountedRef.current ||
          requestRef.current !== request ||
          isBackgrounded()
        ) {
          return;
        }

        const file = new File([blob], `mangoleaf-camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        stop();
        onCapture(file);
      } catch {
        if (mountedRef.current && requestRef.current === request) {
          fail("capture");
        }
      }
    },
    [fail, stop],
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
    frameSize,
    start,
    stop,
    capture,
    refreshReadiness,
    handleVideoError,
  };
}
