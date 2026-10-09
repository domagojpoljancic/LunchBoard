import { formatInTimeZone } from "date-fns-tz";

export const COOK_PROMPT_RETURN_HOURS = 6;

export type PendingDayCandidate = {
  id: string;
  date: string;
  enabled: boolean;
  mealId: string | null;
  preparedDishId: string | null;
  cookedAt: Date | null;
  skippedAt: Date | null;
  leftoverOfDayId: string | null;
  mealName?: string | null;
  preparedName?: string | null;
};

export function todayInTimezone(now: Date, timezone: string): string {
  try {
    return formatInTimeZone(now, timezone || "UTC", "yyyy-MM-dd");
  } catch {
    return formatInTimeZone(now, "UTC", "yyyy-MM-dd");
  }
}

export function isPendingCookDay(
  day: PendingDayCandidate,
  today: string,
): boolean {
  if (!day.enabled) return false;
  if (day.date >= today) return false;
  if (day.cookedAt) return false;
  if (day.skippedAt) return false;
  if (day.leftoverOfDayId) {
    // Leftovers can still be confirmed, but only if they have a meal/prepared link
  }
  const hasTarget = Boolean(day.mealId || day.preparedDishId);
  if (!hasTarget) return false;
  return true;
}

export function listPendingCookDays(
  days: PendingDayCandidate[],
  today: string,
): PendingDayCandidate[] {
  return days
    .filter((d) => isPendingCookDay(d, today))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function shouldShowCookPrompt(input: {
  pendingCount: number;
  lastPromptAt: Date | null;
  now: Date;
  sessionDismissed: boolean;
  isFreshLogin: boolean;
}): boolean {
  if (input.pendingCount <= 0) return false;
  if (input.sessionDismissed) return false;
  if (input.isFreshLogin) return true;
  if (!input.lastPromptAt) return true;
  const elapsed = input.now.getTime() - input.lastPromptAt.getTime();
  return elapsed >= COOK_PROMPT_RETURN_HOURS * 60 * 60 * 1000;
}
