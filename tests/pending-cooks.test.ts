import { describe, expect, it } from "vitest";
import {
  isPendingCookDay,
  listPendingCookDays,
  shouldShowCookPrompt,
  todayInTimezone,
} from "@/lib/pending-cooks";

describe("pending cook query", () => {
  const today = "2026-10-08";

  it("includes past enabled meal days that are unconfirmed", () => {
    expect(
      isPendingCookDay(
        {
          id: "1",
          date: "2026-10-07",
          enabled: true,
          mealId: "m",
          preparedDishId: null,
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
        },
        today,
      ),
    ).toBe(true);
  });

  it("excludes disabled, future, cooked, skipped, and cleared", () => {
    expect(
      isPendingCookDay(
        {
          id: "1",
          date: "2026-10-07",
          enabled: false,
          mealId: "m",
          preparedDishId: null,
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
        },
        today,
      ),
    ).toBe(false);
    expect(
      isPendingCookDay(
        {
          id: "2",
          date: "2026-10-09",
          enabled: true,
          mealId: "m",
          preparedDishId: null,
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
        },
        today,
      ),
    ).toBe(false);
    expect(
      isPendingCookDay(
        {
          id: "3",
          date: "2026-10-07",
          enabled: true,
          mealId: "m",
          preparedDishId: null,
          cookedAt: new Date(),
          skippedAt: null,
          leftoverOfDayId: null,
        },
        today,
      ),
    ).toBe(false);
    expect(
      isPendingCookDay(
        {
          id: "4",
          date: "2026-10-07",
          enabled: true,
          mealId: null,
          preparedDishId: null,
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
        },
        today,
      ),
    ).toBe(false);
  });

  it("sorts oldest first", () => {
    const pending = listPendingCookDays(
      [
        {
          id: "b",
          date: "2026-10-07",
          enabled: true,
          mealId: "m",
          preparedDishId: null,
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
        },
        {
          id: "a",
          date: "2026-10-06",
          enabled: true,
          mealId: "m",
          preparedDishId: null,
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
        },
      ],
      today,
    );
    expect(pending.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("return-visit prompt waits 6 hours unless fresh login", () => {
    const now = new Date("2026-10-08T18:00:00Z");
    expect(
      shouldShowCookPrompt({
        pendingCount: 1,
        lastPromptAt: new Date("2026-10-08T14:00:00Z"),
        now,
        sessionDismissed: false,
        isFreshLogin: false,
      }),
    ).toBe(false);
    expect(
      shouldShowCookPrompt({
        pendingCount: 1,
        lastPromptAt: new Date("2026-10-08T11:00:00Z"),
        now,
        sessionDismissed: false,
        isFreshLogin: false,
      }),
    ).toBe(true);
    expect(
      shouldShowCookPrompt({
        pendingCount: 1,
        lastPromptAt: new Date("2026-10-08T17:30:00Z"),
        now,
        sessionDismissed: false,
        isFreshLogin: true,
      }),
    ).toBe(true);
    expect(
      shouldShowCookPrompt({
        pendingCount: 1,
        lastPromptAt: null,
        now,
        sessionDismissed: true,
        isFreshLogin: true,
      }),
    ).toBe(false);
  });

  it("formats today in timezone", () => {
    expect(todayInTimezone(new Date("2026-10-08T05:00:00Z"), "UTC")).toBe(
      "2026-10-08",
    );
  });
});
