import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function mondayOf(date: Date | string, timeZone = "UTC"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, timeZone);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function weekDates(weekStart: string): string[] {
  const start = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd"),
  );
}

export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  return format(addDays(parseISO(weekStart), deltaWeeks * 7), "yyyy-MM-dd");
}

export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  const left = format(start, "d MMM");
  const right = format(end, "d MMM");
  return `${left} – ${right}`;
}

export function weekdayLabel(date: string): string {
  return format(parseISO(date), "EEE");
}

export function dayNumber(date: string): string {
  return format(parseISO(date), "d");
}

/** Ensure Auth.js / Prisma get a Date for comparisons if needed. */
export function weekStartUtcNoon(weekStart: string): Date {
  return fromZonedTime(`${weekStart}T12:00:00`, "UTC");
}
