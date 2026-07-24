import React, { memo } from "react";

interface DiagnosticScannerProps {
  previewUrl: string | null;
  isScanning: boolean;
  scanningProgress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunDiagnosis: () => void;
}

export const DiagnosticScanner = memo(function DiagnosticScanner({
  previewUrl,
  isScanning,
  scanningProgress,
  onFileChange,
  onRunDiagnosis,
}: DiagnosticScannerProps) {
  return (
    <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
      <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
        </span>
        Diagnostic Scanner
      </h2>

      <div className="flex flex-col gap-4">
        {/* Dual Image Capture Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. HTML5 back camera capture picker */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            id="camera-picker"
            className="hidden"
          />
          <label
            htmlFor="camera-picker"
            className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-md text-center flex flex-col items-center justify-center gap-1.5 hover:scale-103 active:scale-98 transition-transform text-xs"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </label>

          {/* 2. Photo Gallery upload picker */}
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            id="gallery-picker"
            className="hidden"
          />
          <label
            htmlFor="gallery-picker"
            className="cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl shadow-md text-center flex flex-col items-center justify-center gap-1.5 hover:scale-103 active:scale-98 transition-transform text-xs"
          >
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose Gallery
          </label>
        </div>

        {/* Photo Preview & AI Trigger */}
        {previewUrl && (
          <div className="mt-2 border border-slate-850 bg-slate-950 p-4 rounded-2xl flex flex-col gap-4 items-center">
            <div className="relative w-full aspect-square overflow-hidden rounded-xl border border-slate-900">
              {/* Render standard square thumbnail preview of the captured photo */}
              <img
                src={previewUrl}
                alt="Captured Preview"
                className={`object-cover w-full h-full transition-transform duration-300 ${isScanning ? "brightness-50 scale-105" : ""}`}
              />
              <div className="absolute inset-4 border-2 border-dashed border-teal-500/40 rounded-lg pointer-events-none" />
              
              {/* Scanning overlay on top of the image */}
              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/60 backdrop-blur-sm">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-teal-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm">🔬</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-teal-400 animate-pulse">
                      {scanningProgress < 30
                        ? "Loading image..."
                        : scanningProgress < 60
                        ? "Running AI classification..."
                        : scanningProgress < 90
                        ? "Saving diagnosis..."
                        : "Finishing up..."}
                    </span>
                    <div className="w-32 bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-400 h-full rounded-full transition-colors duration-500 ease-out"
                        style={{ width: `${scanningProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isScanning ? (
              <button
                onClick={onRunDiagnosis}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl shadow-md transition-colors text-xs cursor-pointer"
              >
                🔬 Run AI Diagnosis
              </button>
            ) : (
              <div className="w-full py-2.5 bg-slate-900 border border-slate-800 text-teal-400 font-bold rounded-xl text-center text-xs animate-pulse">
                Analyzing leaf tissue...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
