interface SplashScreenProps {
  // Can add props if needed in the future
}

export function SplashScreen({}: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 px-6">
      {/* Spinning loader ring */}
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-teal-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg">🥭</span>
        </div>
      </div>

      {/* App title */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
          MangoLeaf AI
        </span>
        {/* <span className="text-[10px] uppercase font-extrabold tracking-widest px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
          Offline-First PWA
        </span> */}
      </div>

      {/* Loading status text */}
      {/* <div className="flex flex-col items-center gap-3 mt-2">
        <div className="flex items-center gap-2.5 text-xs text-teal-400 font-semibold animate-pulse">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Initializing On-Device AI Engine...
        </div>
        <p className="text-[10px] text-slate-600 text-center max-w-xs leading-relaxed">
          Loading MobileNetV3 model and compiling GPU shaders for real-time leaf diagnosis.
        </p>
      </div> */}
    </div>
  );
}
