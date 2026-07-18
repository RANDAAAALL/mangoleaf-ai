"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Note } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function Home() {
  const {
    isOnline,
    isSyncing,
    syncError,
    deviceId,
    createNote,
    editNote,
    deleteNote,
    triggerSync,
  } = useSync();

  const { showInstallButton, installApp } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<Note["color"]>("yellow");
  const [isPrivate, setIsPrivate] = useState(false);

  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState<Note["color"]>("yellow");

  // Query all local active notes (exclude pending-delete)
  const notes = useLiveQuery(() =>
    db.notes
      .filter((note) => note._status !== "pending-delete")
      .toArray()
  ) || [];

  // Filter notes into Global Corkboard and Private Notebook
  const globalNotes = notes.filter((n) => n.device_id === null);
  const privateNotes = notes.filter((n) => n.device_id !== null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isIOS && !isStandalone) {
      setShowIOSHint(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createNote(title, content, color);
    setTitle("");
    setContent("");
    setColor("yellow");
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || "");
    setEditColor(note.color);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await editNote(id, editTitle, editContent, editColor);
    setEditingId(null);
  };

  // Color helper mappings for Tailwind styling
  const colorStyles: Record<Note["color"], { card: string; badge: string; text: string }> = {
    yellow: {
      card: "bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60 shadow-amber-950/5",
      badge: "bg-amber-950/40 text-amber-300 border-amber-850",
      text: "text-amber-350",
    },
    pink: {
      card: "bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60 shadow-rose-950/5",
      badge: "bg-rose-950/40 text-rose-300 border-rose-850",
      text: "text-rose-350",
    },
    blue: {
      card: "bg-sky-950/20 border-sky-800/40 hover:border-sky-700/60 shadow-sky-950/5",
      badge: "bg-sky-950/40 text-sky-300 border-sky-850",
      text: "text-sky-350",
    },
    green: {
      card: "bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60 shadow-emerald-950/5",
      badge: "bg-emerald-950/40 text-emerald-300 border-emerald-850",
      text: "text-emerald-350",
    },
    purple: {
      card: "bg-purple-950/20 border-purple-800/40 hover:border-purple-700/60 shadow-purple-950/5",
      badge: "bg-purple-950/40 text-purple-300 border-purple-850",
      text: "text-purple-350",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header Panel */}
      <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
              BoardSync PWA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
              DevMode: webpack
            </span>
          </div>

          <div className="flex items-center gap-4">
            {showInstallButton && (
              <button
                onClick={installApp}
                className="text-xs px-3.5 py-1.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-extrabold rounded-full hover:scale-105 active:scale-98 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
              >
                📥 Install App
              </button>
            )}

            {showIOSHint && (
              <div className="text-[9px] text-slate-500 max-w-[140px] leading-tight text-right hidden sm:block">
                On iOS: tap <span className="text-slate-350 font-semibold">Share</span> $\rightarrow$ <span className="text-slate-350 font-semibold">Add to Home Screen</span>
              </div>
            )}

            {isSyncing ? (
              <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/20 border border-teal-900/40 px-3 py-1 rounded-full">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </div>
            ) : (
              <button
                onClick={triggerSync}
                disabled={!isOnline}
                className={`text-xs px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border shadow-sm transition-all duration-300 ${
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

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Sidebar (Workspace Controls + Personal Notes) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Device Profile Badge */}
          <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              My Device Profile
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-[11px] font-mono text-slate-350 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-900 select-all truncate flex-1">
                {deviceId || "Loading..."}
              </span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-1 bg-purple-950/40 border border-purple-800/40 text-purple-400 rounded-lg">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
              This ID is unique to this browser instance and isolates your private tasks.
            </p>
          </div>

          {/* Add Note Form */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent">
              Create New Note
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Corkboard Guidelines"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">
                  Content (Markdown / Text)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note description here..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-655 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>

              {/* Note Colors */}
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                  Sticky Color
                </label>
                <div className="flex items-center gap-3">
                  {(["yellow", "pink", "blue", "green", "purple"] as Note["color"][]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${
                        c === "yellow"
                          ? "bg-amber-400"
                          : c === "pink"
                          ? "bg-rose-400"
                          : c === "blue"
                          ? "bg-sky-400"
                          : c === "green"
                          ? "bg-emerald-400"
                          : "bg-purple-400"
                      } ${color === c ? "border-slate-100 ring-2 ring-teal-500/50" : "border-transparent"}`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-98 transition-all text-sm cursor-pointer"
              >
                Save to My Journal
              </button>
            </form>
          </div>

          {/* Sync Error Indicator */}
          {syncError && (
            <div className="bg-rose-955/20 border border-rose-900/50 p-4 rounded-xl text-rose-450 text-xs flex flex-col gap-1.5">
              <span className="font-bold uppercase tracking-wider">Sync Error:</span>
              <p className="font-mono break-all leading-relaxed">{syncError}</p>
            </div>
          )}

          {/* Setup Documentation */}
          <div className="bg-slate-900/15 border border-slate-900 p-5 rounded-2xl text-[11px] text-slate-450">
            <h3 className="font-bold text-slate-350 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              SQL Corkboard Schema
            </h3>
            <p className="mb-2 leading-relaxed">
              Run this SQL script in your Supabase dashboard to support note syncing and realtime streaming:
            </p>
            <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] font-mono overflow-x-auto text-teal-450 select-all max-h-40">
{`-- Create Notes Table
create table notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  color text default 'yellow' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_id uuid -- null for global bulletins, device uuid for private
);

-- Enable public RLS policies
alter table notes enable row level security;

-- 1. Read-only for global bulletins (device_id is null) but readable by everyone
create policy "Allow public read access" on notes for select using (true);

-- 2. Read-write for private device notes only (device_id is not null)
create policy "Allow insert for private notes" on notes for insert with check (device_id is not null);
create policy "Allow update for private notes" on notes for update using (device_id is not null);
create policy "Allow delete for private notes" on notes for delete using (device_id is not null);

-- Enable Realtime events
alter publication supabase_realtime add table notes;`}
            </pre>
          </div>
        </div>

        {/* RIGHT AREA: Notebook (Private Sidebar) & Corkboard (Global Grid) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Section 1: Private Notebook (Device-specific) */}
          <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-indigo-350 bg-clip-text text-transparent">
                  📱 Personal Notebook Scratchpad
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saved only on this device. These drafts and notepad logs are not shared with the community.
                </p>
              </div>
              <span className="text-xs px-2.5 py-0.5 bg-purple-950/30 border border-purple-900/50 text-purple-400 rounded-full font-bold">
                Local Stack: {privateNotes.length}
              </span>
            </div>

            {privateNotes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-900 rounded-xl bg-slate-955/20 text-slate-550 italic text-sm">
                No personal scratchpad notes. Toggle "Local Device" above to create one!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {privateNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    editingId={editingId}
                    editTitle={editTitle}
                    editContent={editContent}
                    editColor={editColor}
                    setEditTitle={setEditTitle}
                    setEditContent={setEditContent}
                    setEditColor={setEditColor}
                    colorStyles={colorStyles}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Global Announcement Corkboard */}
          <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-sky-200 to-teal-350 bg-clip-text text-transparent">
                  🌐 Public Announcements Board
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shared notice board. Sticky notes are synced instantly across all browsers and devices.
                </p>
              </div>
              <span className="text-xs px-2.5 py-0.5 bg-sky-950/30 border border-sky-900/50 text-sky-400 rounded-full font-bold">
                Shared Notes: {globalNotes.length}
              </span>
            </div>

            {globalNotes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-900 rounded-xl bg-slate-955/20 text-slate-550 italic text-sm">
                Corkboard is empty. Be the first to publish an announcement note!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {globalNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    editingId={editingId}
                    editTitle={editTitle}
                    editContent={editContent}
                    editColor={editColor}
                    setEditTitle={setEditTitle}
                    setEditContent={setEditContent}
                    setEditColor={setEditColor}
                    colorStyles={colorStyles}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Subcomponent: NoteCard
interface NoteCardProps {
  note: Note;
  editingId: string | null;
  editTitle: string;
  editContent: string;
  editColor: Note["color"];
  setEditTitle: (val: string) => void;
  setEditContent: (val: string) => void;
  setEditColor: (val: Note["color"]) => void;
  colorStyles: Record<Note["color"], { card: string; badge: string; text: string }>;
  onStartEdit: (note: Note) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

function NoteCard({
  note,
  editingId,
  editTitle,
  editContent,
  editColor,
  setEditTitle,
  setEditContent,
  setEditColor,
  colorStyles,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: NoteCardProps) {
  const isEditing = editingId === note.id;
  const currentStyles = colorStyles[note.color] || colorStyles.yellow;

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-sm flex flex-col justify-between min-h-[160px] shadow-lg transition-all ${
      isEditing ? (colorStyles[editColor] || colorStyles.yellow).card : currentStyles.card
    }`}>
      {isEditing ? (
        <div className="flex flex-col gap-3 flex-1 mb-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
          />
          {/* Edit Color Palette */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-450 uppercase font-semibold mr-1">Color:</span>
            {(["yellow", "pink", "blue", "green", "purple"] as Note["color"][]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditColor(c)}
                className={`h-4.5 w-4.5 rounded-full border transition-all cursor-pointer ${
                  c === "yellow"
                    ? "bg-amber-400"
                    : c === "pink"
                    ? "bg-rose-400"
                    : c === "blue"
                    ? "bg-sky-400"
                    : c === "green"
                    ? "bg-emerald-400"
                    : "bg-purple-400"
                } ${editColor === c ? "border-slate-100 ring-1 ring-teal-500/40" : "border-transparent"}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-2 mb-4">
          {/* Note Metadata Header */}
          <div className="flex items-start justify-between gap-3">
            <span className={`text-sm font-bold tracking-tight leading-snug ${currentStyles.text}`}>
              {note.title}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Sync Status Badge */}
              {note._status === "synced" ? (
                <span
                  title="Synced with Cloud"
                  className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded"
                >
                  Cloud
                </span>
              ) : (
                <span
                  title="Offline cache (pending sync)"
                  className="text-[8px] font-bold px-1.5 py-0.5 bg-teal-950/40 border border-teal-900/40 text-teal-400 rounded animate-pulse"
                >
                  Local
                </span>
              )}
              {/* Scope Badge */}
              {note.device_id === null ? (
                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-sky-950/40 border border-sky-900/40 text-sky-400 rounded">
                  Global
                </span>
              ) : (
                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-purple-950/40 border border-purple-900/40 text-purple-400 rounded">
                  Private
                </span>
              )}
            </div>
          </div>
          {note.content && (
            <p className="text-xs text-slate-350 leading-relaxed font-normal whitespace-pre-wrap">
              {note.content}
            </p>
          )}
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-1 text-[11px]">
        <span className="text-[9px] text-slate-500 font-mono">
          {new Date(note.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => onSaveEdit(note.id)}
                className="font-bold text-teal-400 hover:text-teal-350 cursor-pointer"
              >
                Save
              </button>
              <span className="text-slate-800 text-[10px]">•</span>
              <button
                onClick={onCancelEdit}
                className="font-bold text-slate-450 hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {note.device_id === null ? (
                <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase select-none">
                  📢 Bulletin
                </span>
              ) : (
                <>
                  <button
                    onClick={() => onStartEdit(note)}
                    className="font-semibold text-slate-450 hover:text-slate-200 cursor-pointer"
                  >
                    Edit
                  </button>
                  <span className="text-slate-800 text-[10px]">•</span>
                  <button
                    onClick={() => onDelete(note.id)}
                    className="font-semibold text-rose-500 hover:text-rose-400 cursor-pointer"
                  >
                    Delete
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
