export type PrepWindow = "EVENING_BEFORE" | "SAME_DAY";

export type WarningInput = {
  prepWindow: PrepWindow | string;
  mealActiveMinutes: number | null | undefined;
  mealTotalMinutes: number | null | undefined;
  sideActiveMinutes: Array<number | null | undefined>;
};

export type WarningResult = {
  warn: boolean;
  active: number;
  total: number;
};

export function timeWarning(input: WarningInput): WarningResult {
  const sideSum = input.sideActiveMinutes.reduce<number>(
    (acc, m) => acc + (m ?? 0),
    0,
  );

  const mealHasTime =
    input.mealActiveMinutes != null || input.mealTotalMinutes != null;
  const sideHasTime = input.sideActiveMinutes.some((m) => m != null);

  if (!mealHasTime && !sideHasTime) {
    return { warn: false, active: 0, total: 0 };
  }

  const active = (input.mealActiveMinutes ?? 0) + sideSum;
  const total = (input.mealTotalMinutes ?? active) + sideSum;

  if (input.prepWindow === "SAME_DAY") {
    return { warn: active > 30 || total > 45, active, total };
  }

  if (input.prepWindow === "EVENING_BEFORE") {
    return { warn: active > 60, active, total };
  }

  return { warn: false, active, total };
}
