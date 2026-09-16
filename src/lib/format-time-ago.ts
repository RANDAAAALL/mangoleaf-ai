import { translations, type Language } from "@/lib/translations";

// Fills the {n} placeholder in a relative-time template with its count.
function withCount(template: string, count: number): string {
  return template.replace("{n}", String(count));
}

// Turns a timestamp into relative time in the active language.
export function formatTimeAgo(isoString: string, language: Language): string {
  const t = translations[language];

  const date = new Date(isoString);
  // A bad timestamp makes every comparison below NaN, which would fall through
  // to the date branch and print "NaN".
  if (Number.isNaN(date.getTime())) return t.justNow;

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return withCount(t.minutesAgo, diffMins);
  if (diffHours < 24)
    return withCount(diffHours === 1 ? t.hourAgo : t.hoursAgo, diffHours);
  if (diffDays === 1) return t.yesterday;
  if (diffDays < 7) return withCount(t.daysAgo, diffDays);

  // Month names come from translations, not toLocaleDateString, because browsers
  // have no dependable Cebuano/Bisaya month data.
  return `${t.monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
