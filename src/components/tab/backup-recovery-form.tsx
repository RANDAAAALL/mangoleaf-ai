import { useState, type RefObject } from "react";
import { translations, type Language } from "@/lib/translations";
import { parseRecoveryCode } from "@/lib/cloud-backup-format";
import { BackupActionButton } from "@/components/tab/backup-action-button";

/** This form only edits typed input; clearing it never disconnects the saved recovery identity. */
export function BackupRecoveryForm({
  language,
  busy,
  value,
  inputRef,
  onChange,
  onRestore,
  codeRejected = false,
}: {
  language: Language;
  busy: boolean;
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onRestore: () => void;
  codeRejected?: boolean;
}) {
  const t = translations[language];
  const [validation, setValidation] = useState<"required" | "invalid" | null>(
    null,
  );
  const problem =
    validation === "required"
      ? t.backupCodeRequired
      : validation === "invalid" || codeRejected
        ? t.backupCodeInvalid
        : "";
  return (
    <form
      className="flex flex-col gap-3"
      aria-busy={busy || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        if (!value.trim()) {
          setValidation("required");
          inputRef.current?.focus();
          return;
        }
        try {
          parseRecoveryCode(value);
        } catch {
          setValidation("invalid");
          inputRef.current?.focus();
          return;
        }
        setValidation(null);
        onRestore();
      }}
    >
      <label className="sr-only" htmlFor="backup-code-input">
        {t.backupRestoreCodeLabel}
      </label>
      <input
        id="backup-code-input"
        ref={inputRef}
        type="password"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={!!problem || undefined}
        aria-describedby={problem ? "backup-code-error" : undefined}
        placeholder={t.backupCodePlaceholder}
        value={value}
        disabled={busy}
        onChange={(event) => {
          setValidation(null);
          onChange(event.target.value);
        }}
        className="min-w-0 w-full rounded-2xl border border-[#c6d9c0] bg-white p-4 text-base"
      />
      {problem && (
        <p
          id="backup-code-error"
          role="alert"
          className="text-sm text-[#99451f]"
        >
          {problem}
        </p>
      )}
      <BackupActionButton type="submit" disabled={busy}>
        {t.backupRestore}
      </BackupActionButton>
    </form>
  );
}
