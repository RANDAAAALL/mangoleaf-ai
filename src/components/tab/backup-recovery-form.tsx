import type { RefObject } from "react";
import { translations, type Language } from "@/lib/translations";

/** This form only edits typed input; clearing it never disconnects the saved recovery identity. */
export function BackupRecoveryForm({
  language,
  busy,
  value,
  inputRef,
  onChange,
  onRestore,
}: {
  language: Language;
  busy: boolean;
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onRestore: () => void;
}) {
  const t = translations[language];
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() && !busy) onRestore();
      }}
    >
      <label
        className="flex flex-col gap-2 text-sm font-semibold"
        htmlFor="backup-code-input"
      >
        {t.backupRestoreCodeLabel}
      </label>
      <input
        id="backup-code-input"
        ref={inputRef}
        type="password"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        disabled={busy}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 rounded-xl border border-[#b8d7b5] p-3 font-mono text-sm"
      />
      <p className="text-sm leading-relaxed">{t.backupMergeHint}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy || !value}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="min-h-11 rounded-xl border border-[#277839] px-4 py-3 font-semibold text-[#1c682d] disabled:opacity-50"
        >
          {t.backupClearInput}
        </button>
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="min-h-11 rounded-xl border border-[#277839] px-4 py-3 font-semibold text-[#1c682d] disabled:opacity-50"
        >
          {t.backupRestore}
        </button>
      </div>
    </form>
  );
}
