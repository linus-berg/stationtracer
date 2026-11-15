const pad = (n: number) => String(n).padStart(2, '0');

/** 24-hour HH:MM in local time. */
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const formatWeekday = (d: Date, style: 'long' | 'short' = 'long') =>
  d.toLocaleDateString('en-GB', { weekday: style });

/** e.g. "Sunday 15 November" */
export const formatLongDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes());

/** ISO-8601 week number (the one used on Swedish calendars). */
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** "5 min ago", "2 h ago", or a clock time / date for anything older. */
export function formatAge(then: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (isSameDay(then, now)) return `at ${formatTime(then)}`;
  return `${then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${formatTime(then)}`;
}

export type Countdown =
  | { kind: 'now' }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'clock'; text: string };

/** Same convention as SL's own signs: "Now", then whole minutes, then a clock time from 60 min. */
export function countdown(target: Date, now: Date): Countdown {
  const seconds = (target.getTime() - now.getTime()) / 1000;
  if (seconds < 60) return { kind: 'now' };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { kind: 'minutes', minutes };
  return { kind: 'clock', text: formatTime(target) };
}
