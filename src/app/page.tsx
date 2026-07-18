"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Task } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function Home() {
  const {
    isOnline,
    isSyncing,
    syncError,
    createTask,
    toggleTask,
    editTask,
    deleteTask,
    triggerSync,
  } = useSync();

  const { showInstallButton, installApp, isInstalled } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    if (isIOS && !isStandalone) {
      setShowIOSHint(true);
    }
  }, []);

  // Reactive IndexedDB query excluding tasks pending deletion
  const tasks = useLiveQuery(() =>
    db.tasks
      .filter((task) => task._status !== "pending-delete")
      .toArray()
  ) || [];

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Edit task states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Filter tasks into completed/active
  const activeTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(title, description);
    setTitle("");
    setDescription("");
  };

  const handleStartEdit = (id: string, currentTitle: string, currentDesc?: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setEditDescription(currentDesc || "");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await editTask(id, editTitle, editDescription);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Dynamic Status Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              OffOnSync PWA
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 text-slate-400">
              Next.js + Bun + Dexie
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* PWA Install Button (Download) */}
            {showInstallButton && (
              <button
                onClick={installApp}
                className="text-xs px-3 py-1 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold rounded-full hover:scale-105 active:scale-98 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
              >
                📥 Install App
              </button>
            )}

            {/* iOS PWA Share Sheet Install Hint */}
            {showIOSHint && (
              <div className="text-[10px] text-slate-400 max-w-[140px] leading-tight text-right hidden sm:block">
                On iOS: tap <span className="font-semibold text-slate-200">Share</span> then <span className="font-semibold text-slate-200">Add to Home Screen</span>
              </div>
            )}

            {/* Syncing Status Indicator */}
            {isSyncing ? (
              <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/40 border border-teal-800/60 px-3 py-1 rounded-full">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing database...
              </div>
            ) : (
              <button
                onClick={triggerSync}
                disabled={!isOnline}
                className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
                  isOnline
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                    : "bg-slate-900/40 border-slate-800 text-slate-550 cursor-not-allowed"
                }`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18.24" />
                </svg>
                Sync Now
              </button>
            )}

            {/* Network Status indicator */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm transition-all duration-300 ${
                isOnline
                  ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-400"
                  : "bg-amber-950/40 border-amber-800/80 text-amber-400"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
              {isOnline ? "ONLINE (Realtime Live)" : "OFFLINE (Local Mode)"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Instructions and Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Create Task Form */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent">
              Add New Task
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement offline database sync"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add additional context or notes..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-98 transition-all text-sm"
              >
                Create Task
              </button>
            </form>
          </div>

          {/* Sync Error Alert */}
          {syncError && (
            <div className="bg-rose-955/30 border border-rose-900/60 p-4 rounded-xl text-rose-450 text-xs flex flex-col gap-2">
              <span className="font-bold uppercase tracking-wider">Sync Error:</span>
              <p className="font-mono break-all">{syncError}</p>
              <p className="mt-1 opacity-80">Make sure your Supabase project keys are configured in your `.env.local` file.</p>
            </div>
          )}

          {/* Supabase SQL Setup Documentation */}
          <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl text-xs text-slate-400">
            <h3 className="font-bold text-slate-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Supabase Table Schema
            </h3>
            <p className="mb-3 leading-relaxed">
              Run this SQL script in your Supabase SQL Editor to support the database operations and enable real-time updates:
            </p>
            <pre className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 text-[10px] font-mono overflow-x-auto text-emerald-450 select-all max-h-48">
{`-- Create Tasks Table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  is_completed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable public RLS policies
alter table tasks enable row level security;
create policy "Public read access" on tasks for select using (true);
create policy "Public insert access" on tasks for insert with check (true);
create policy "Public update access" on tasks for update using (true);
create policy "Public delete access" on tasks for delete using (true);

-- Enable Realtime events
alter publication supabase_realtime add table tasks;`}
            </pre>
          </div>
        </div>

        {/* Right Side: Tasks Display List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent">
                Task Workspace
              </h2>
              <p className="text-xs text-slate-450 mt-1">
                Data acts on client-side IndexedDB first (Dexie) and instantly uploads/syncs in the background.
              </p>
            </div>

            {/* Task sections */}
            <div className="flex flex-col gap-8">
              
              {/* Active Tasks Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  Active Tasks ({activeTasks.length})
                </h3>
                {activeTasks.length === 0 ? (
                  <p className="text-sm text-slate-650 italic py-4 border-2 border-dashed border-slate-900 rounded-xl text-center">
                    No active tasks. Create one to get started!
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        editingId={editingId}
                        editTitle={editTitle}
                        editDescription={editDescription}
                        setEditTitle={setEditTitle}
                        setEditDescription={setEditDescription}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onEditStart={handleStartEdit}
                        onEditSave={handleSaveEdit}
                        onEditCancel={() => setEditingId(null)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Tasks Section */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Completed Tasks ({completedTasks.length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        editingId={editingId}
                        editTitle={editTitle}
                        editDescription={editDescription}
                        setEditTitle={setEditTitle}
                        setEditDescription={setEditDescription}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onEditStart={handleStartEdit}
                        onEditSave={handleSaveEdit}
                        onEditCancel={() => setEditingId(null)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: TaskCard
interface TaskCardProps {
  task: Task;
  editingId: string | null;
  editTitle: string;
  editDescription: string;
  setEditTitle: (val: string) => void;
  setEditDescription: (val: string) => void;
  onToggle: (id: string, is_completed: boolean) => void;
  onDelete: (id: string) => void;
  onEditStart: (id: string, title: string, desc?: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
}

function TaskCard({
  task,
  editingId,
  editTitle,
  editDescription,
  setEditTitle,
  setEditDescription,
  onToggle,
  onDelete,
  onEditStart,
  onEditSave,
  onEditCancel,
}: TaskCardProps) {
  const isEditing = editingId === task.id;

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
      task.is_completed
        ? "bg-slate-950/40 border-slate-900/60 opacity-70"
        : "bg-slate-900/80 border-slate-800/80 hover:border-slate-750"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Complete Toggle Checkbox */}
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={(e) => onToggle(task.id, e.target.checked)}
            className="mt-1.5 h-4.5 w-4.5 rounded-md border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-950 accent-teal-500 cursor-pointer"
          />

          {isEditing ? (
            <div className="flex flex-col gap-2 flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-350 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <span className={`text-sm font-semibold leading-relaxed ${task.is_completed ? "line-through text-slate-500" : "text-slate-100"}`}>
                {task.title}
              </span>
              {task.description && (
                <p className={`text-xs mt-1 font-normal leading-relaxed ${task.is_completed ? "text-slate-600" : "text-slate-400"}`}>
                  {task.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sync Status Badge Icon */}
        <div className="flex items-center gap-2">
          {task._status === "synced" ? (
            <span
              title="Synced with Supabase"
              className="text-[10px] flex items-center gap-1 text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2.5 py-0.5 rounded-full"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Cloud
            </span>
          ) : (
            <span
              title="Cached locally in IndexedDB (Pending Sync)"
              className="text-[10px] flex items-center gap-1 text-teal-400 bg-teal-950/30 border border-teal-900/40 px-2.5 py-0.5 rounded-full animate-pulse"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Local
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-900 pt-2.5 mt-0.5">
        {isEditing ? (
          <>
            <button
              onClick={() => onEditSave(task.id)}
              className="text-xs font-semibold px-2.5 py-1 text-teal-400 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={onEditCancel}
              className="text-xs font-semibold px-2.5 py-1 text-slate-400 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEditStart(task.id, task.title, task.description)}
              className="text-xs font-semibold text-slate-450 hover:text-slate-200 transition-colors"
            >
              Edit
            </button>
            <span className="text-slate-800 text-[10px]">•</span>
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-450 transition-colors"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
