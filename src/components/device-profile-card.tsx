interface DeviceProfileCardProps {
  deviceId: string;
}

export function DeviceProfileCard({ deviceId }: DeviceProfileCardProps) {
  return (
    <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        My Device Profile
      </span>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-[11px] font-mono text-slate-350 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-900 select-all truncate flex-1">
          {deviceId || "Loading..."}
        </span>
        <span className="text-[9px] font-extrabold uppercase px-2 py-1 bg-teal-950/40 border border-teal-800/40 text-teal-400 rounded-lg">
          Active
        </span>
      </div>
      <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
        Scan logs will be stored on this device and synced to Supabase.
      </p>
    </div>
  );
}
