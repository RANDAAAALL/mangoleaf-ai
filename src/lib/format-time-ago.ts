import { translations, type Language } from "@/lib/translations";

// Substitutes the {n} placeholder in a relative-time template with its count.
function withCount(template: string, count: number): string {
  return template.replace("{n}", String(count));
}

// Formats a timestamp into human readable relative time in the active language.
export function formatTimeAgo(isoString: string, language: Language): string {
  const t = translations[language];

  const date = new Date(isoString);
  // An unparseable timestamp yields NaN from every comparison below, which would
  // otherwise fall through to the absolute-date branch and render "NaN".
  if (Number.isNaN(date.getTime())) return t.justNow;

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return withCount(t.minutesAgo, diffMins);
  if (diffHours < 24) return withCount(diffHours === 1 ? t.hourAgo : t.hoursAgo, diffHours);
  if (diffDays === 1) return t.yesterday;
  if (diffDays < 7) return withCount(t.daysAgo, diffDays);

  // Month names come from translations rather than toLocaleDateString because
  // browsers have no reliable Cebuano/Bisaya month data to fall back on.
  return `${t.monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
