import { formatInTimeZone } from "date-fns-tz";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function parseUtcDate(iso: string): Date | null {
  if (!ISO_DATE.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = utcDate(year, month, day);
  if (formatInTimeZone(date, "UTC", "yyyy-MM-dd") !== iso) return null;
  return date;
}

export function isIsoDate(value: string): boolean {
  return parseUtcDate(value) != null;
}

/** Monday of the calendar week containing `date` in `timeZone`. */
export function mondayOf(date: Date | string, timeZone = "UTC"): string {
  const instant = typeof date === "string" ? new Date(date) : date;
  const ymd = formatInTimeZone(instant, timeZone, "yyyy-MM-dd");
  const weekday = Number(formatInTimeZone(instant, timeZone, "i"));
  const [year, month, day] = ymd.split("-").map(Number);
  const monday = utcDate(year, month, day);
  monday.setUTCDate(monday.getUTCDate() - (weekday - 1));
  return formatInTimeZone(monday, "UTC", "yyyy-MM-dd");
}

/** If `value` is a real date, return the Monday of that week. Otherwise null. */
export function normalizeWeekStart(value: string): string | null {
  const date = parseUtcDate(value);
  if (!date) return null;
  return mondayOf(date, "UTC");
}

export function weekDates(weekStart: string): string[] {
  const start = parseUtcDate(weekStart);
  if (!start) return [];
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    return formatInTimeZone(day, "UTC", "yyyy-MM-dd");
  });
}

export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const start = parseUtcDate(weekStart);
  if (!start) return weekStart;
  start.setUTCDate(start.getUTCDate() + deltaWeeks * 7);
  return formatInTimeZone(start, "UTC", "yyyy-MM-dd");
}

export function formatWeekRange(weekStart: string): string {
  const start = parseUtcDate(weekStart);
  if (!start) return weekStart;
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const left = formatInTimeZone(start, "UTC", "d MMM");
  const right = formatInTimeZone(end, "UTC", "d MMM");
  return `${left} – ${right}`;
}

export function weekdayLabel(date: string): string {
  const parsed = parseUtcDate(date);
  if (!parsed) return date;
  return formatInTimeZone(parsed, "UTC", "EEE");
}

export function dayNumber(date: string): string {
  const parsed = parseUtcDate(date);
  if (!parsed) return date;
  return formatInTimeZone(parsed, "UTC", "d");
}
