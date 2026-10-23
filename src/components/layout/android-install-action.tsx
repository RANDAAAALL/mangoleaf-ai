import type { ReactNode } from "react";
import { useAndroidAppLink } from "@/hooks/useAndroidAppLink";
import { translations, type Language } from "@/lib/translations";

/** Keep intent navigation in the original tap; never wait for detection or start a timed download. */
export function AndroidInstallAction({
  language,
  onGuide,
  className,
  labelClassName,
  children,
}: {
  language: Language;
  onGuide: () => void;
  className: string;
  labelClassName?: string;
  children?: ReactNode;
}) {
  const t = translations[language];
  const { href, installed } = useAndroidAppLink();
  const label = href
    ? installed
      ? t.androidOpenApp
      : t.androidOpenOrInstall
    : t.downloadApp;
  const content = (
    <>
      {children}
      <span className={labelClassName}>{label}</span>
    </>
  );
  if (href)
    return (
      <a
        href={href}
        aria-label={label}
        className={className}
        onClick={installed ? undefined : () => onGuide()}
      >
        {content}
      </a>
    );
  return (
    <button
      type="button"
      onClick={onGuide}
      aria-label={label}
      className={className}
    >
      {content}
    </button>
  );
}
