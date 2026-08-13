import React from "react";
import { Logo } from "@/components/logo";

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#f6faf1] text-[#143519] flex flex-col items-center justify-center gap-6 px-6 font-sans">
      {/* Brand Icon & Spinning Loader */}
      <div className="relative flex items-center justify-center">
        {/* Outer spinner ring */}
        <div className="h-20 w-20 rounded-full border-4 border-[#e2ebd9] border-t-[#277839] animate-spin" />
        {/* Centered Brand Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Logo width={32} height={32} fill="#277839" />
        </div>
      </div>

      {/* App Title & Subtitle */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#143519]">
          MangoLeaf AI
        </h1>
        {/* <span className="text-xs font-semibold text-[#526856]">
          On-Device Mango Disease Classifier
        </span> */}
      </div>

      {/* Loading Status Indicator */}
      {/* <div className="flex items-center gap-2 text-xs font-semibold text-[#277839] bg-white px-4 py-2 rounded-full border border-[#e2ebd9] shadow-xs animate-pulse">
        <svg className="animate-spin h-4 w-4 text-[#277839]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Initializing AI Engine...</span>
      </div> */}
    </div>
  );
}
