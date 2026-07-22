interface HeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  showInstallButton: boolean;
  onInstall: () => void;
  onSync: () => void;
}

export function Header({
  isOnline,
  isSyncing,
  showInstallButton,
  onInstall,
  onSync,
}: HeaderProps) {
  return (
    <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
            MangoLeaf AI
          </span>
          <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
            Offline-First PWA
          </span>
        </div>

        <div className="flex items-center gap-4">
          {showInstallButton && (
            <button
              onClick={onInstall}
              className="text-xs px-3.5 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold rounded-full hover:scale-105 active:scale-98 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              📥 Install App
            </button>
          )}

          {isSyncing ? (
            <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/20 border border-teal-900/40 px-3.5 py-1 rounded-full font-semibold">
              <svg className="animate-spin h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing Database...
            </div>
          ) : (
            <button
              onClick={onSync}
              disabled={!isOnline}
              className={`text-xs px-3.5 py-1 rounded-full border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                isOnline
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-750"
                  : "bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18.24" />
              </svg>
              Sync
            </button>
          )}

          <div
            className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm transition-all duration-300 ${
              isOnline
                ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                : "bg-amber-950/30 border-amber-900/50 text-amber-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </span>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>
        </div>
      </div>
    </div>
  );
}
