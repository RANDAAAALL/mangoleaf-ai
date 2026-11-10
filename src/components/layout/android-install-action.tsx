import type { ReactNode } from "react";
import { useAndroidAppLink } from "@/hooks/useAndroidAppLink";
import { translations, type Language } from "@/lib/translations";

/** Each tap has one destination: a confirmed app, or the installation guide. */
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
        href={installed ? href : "/download"}
        aria-label={label}
        className={className}
        onClick={
          installed
            ? undefined
            : (event) => {
                event.preventDefault();
                onGuide();
              }
        }
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
