import React, { useEffect, memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "@/components/Icon";

interface DiagnosticScannerProps {
  previewUrl: string | null;
  isScanning: boolean;
  scanningProgress: number;
  language: Language;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunDiagnosis: () => void;
  onRetake: () => void;
}

export const DiagnosticScanner = memo(function DiagnosticScanner({
  previewUrl,
  isScanning,
  scanningProgress,
  language,
  onFileChange,
  onRunDiagnosis,
  onRetake,
}: DiagnosticScannerProps) {
  const t = translations[language];

  // Lock body & html scroll when photo preview / AI scanning overlay is active
  useEffect(() => {
    if (previewUrl) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [previewUrl]);

  return (
    <div className="relative">
      {/* DESKTOP VERSION (Single Card: Upload Photo) */}
      <div className="hidden md:block bg-[#277839] text-white p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        {/* Subtle Leaf Decorative Background Graphic */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <svg
            className="w-96 h-96 fill-current text-white"
            viewBox="0 0 24 24"
          >
            <path d="M17.8 2.8C11.4 3.1 6.3 8.3 6 14.7c-.2 4.1 1.7 7.8 4.7 9.8 1.1.7 2.4-1 1.7-2.1-1.8-2.7-1.4-6.4 1.1-8.9 2.7-2.7 7.1-2.7 9.8 0 1.1 1.1 2.8-.2 2.1-1.3-1.9-3.3-4.7-6-7.6-9.4z" />
          </svg>
        </div>

        <div className="max-w-2xl flex flex-col items-start gap-5 relative z-10">
          {/* Main Hero Header (Dedicated Desktop Wording) */}
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {t.desktopHeroHeadline}
          </h2>

          <p className="text-sm lg:text-base text-emerald-100 font-medium leading-relaxed max-w-xl">
            {t.desktopHeroSubtitle}
          </p>

          {/* Desktop Upload Photo Button */}
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            id="desktop-photo-picker"
            className="hidden"
          />
          <label
            htmlFor="desktop-photo-picker"
            className="cursor-pointer px-8 py-3.5 bg-white text-[#277839] hover:bg-[#eef8eb] font-extrabold rounded-2xl transition-all shadow-md flex items-center gap-2.5 text-base mt-2 active:scale-98"
          >
            <Icon name="upload" size={20} strokeWidth={2.5} />
            <span>{t.browseFilesBtn}</span>
          </label>
        </div>
      </div>

      {/* MOBILE VERSION (2 Cards: Take Photo & Upload Photo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {/* Mobile Card 1: Take Photo */}
        <div className="bg-[#277839] text-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#a6f2b1] flex items-center justify-center text-[#1b5e28] shadow-sm">
            <Icon name="camera" size={32} fill="#1b5e28" />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold tracking-tight">
              {t.takePhotoBtn}
            </h3>
            <p className="text-xs text-emerald-100 font-medium leading-tight max-w-[220px]">
              {t.takePhotoSubtext}
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            id="mobile-camera-picker"
            className="hidden"
          />
          <label
            htmlFor="mobile-camera-picker"
            className="cursor-pointer w-full py-3 bg-white text-[#277839] font-bold rounded-xl shadow-xs text-center text-xs flex items-center justify-center active:scale-98 transition-transform mt-1"
          >
            <span>{t.snapCameraBtn}</span>
          </label>
        </div>

        {/* Mobile Card 2: Upload Photo (Uses original gallery icon, text-only button) */}
        <div className="bg-[#f59e2b] text-[#2c1806] p-6 rounded-3xl shadow-md flex flex-col items-center justify-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#3d2008] flex items-center justify-center text-white shadow-sm">
            <Icon name="gallery" size={30} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold tracking-tight text-[#2c1806]">
              {t.uploadPhotoBtn}
            </h3>
            <p className="text-xs text-[#523012] font-medium leading-tight max-w-[220px]">
              {t.uploadPhotoSubtext}
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            id="mobile-gallery-picker"
            className="hidden"
          />
          <label
            htmlFor="mobile-gallery-picker"
            className="cursor-pointer w-full py-3 bg-[#3d2008] text-white font-bold rounded-xl shadow-xs text-center text-xs flex items-center justify-center active:scale-98 transition-transform"
          >
            <span>{t.openGalleryBtn}</span>
          </label>
        </div>
      </div>

      {/* Floating Active Photo Preview & AI Scanning Overlay Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2ebd9] rounded-3xl p-6 max-w-sm w-full flex flex-col items-center gap-5 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-[#143519]">
              {isScanning ? t.runningAI : t.reviewPhotoTitle}
            </h3>

            {/* Photo quality reminder (hidden while scanning) */}
            {!isScanning && (
              <p className="text-xs text-[#526856] font-medium leading-relaxed -mt-2 max-w-[280px]">
                {t.photoCheckHint}
              </p>
            )}

            {/* Photo Thumbnail */}
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-[#277839] shadow-md">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-[#277839]/30 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Scanning Progress Bar */}
            {isScanning ? (
              <div className="w-full flex flex-col gap-2">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#277839] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${scanningProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[#526856]">
                  {t.runningAI} ({scanningProgress}%)
                </span>
              </div>
            ) : (
              /* Action Buttons Container (Responsive stacking on mobile, no text squishing!) */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full pt-1">
                <button
                  onClick={onRunDiagnosis}
                  className="w-full py-3 bg-[#277839] text-white hover:bg-[#1f622d] font-extrabold rounded-xl text-xs transition-colors shadow-md cursor-pointer order-1 sm:order-2"
                >
                  {t.runDiagnosisBtn}
                </button>
                <button
                  onClick={onRetake}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer order-2 sm:order-1 flex items-center justify-center gap-1.5"
                >
                  <Icon name="camera" size={16} fill="currentColor" />
                  <span>{t.retakeBtn}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
