import { describe, expect, it } from "vitest";
import { mondayOf, normalizeWeekStart, weekDates } from "@/lib/weeks";

describe("mondayOf", () => {
  it("returns the same Monday", () => {
    expect(mondayOf(new Date("2026-10-05T12:00:00Z"), "UTC")).toBe("2026-10-05");
  });

  it("walks Saturday back to Monday", () => {
    expect(mondayOf(new Date("2026-10-03T18:00:00Z"), "UTC")).toBe("2026-09-28");
  });

  it("uses the timezone wall clock", () => {
    // 2026-10-04 16:00 UTC is Monday 2026-10-05 in Tokyo (UTC+9).
    expect(mondayOf(new Date("2026-10-04T16:00:00Z"), "Asia/Tokyo")).toBe(
      "2026-10-05",
    );
  });
});

describe("normalizeWeekStart", () => {
  it("snaps a Wednesday to Monday", () => {
    expect(normalizeWeekStart("2026-10-07")).toBe("2026-10-05");
  });

  it("rejects junk", () => {
    expect(normalizeWeekStart("not-a-date")).toBeNull();
    expect(normalizeWeekStart("2026-02-31")).toBeNull();
  });
});

describe("weekDates", () => {
  it("lists seven days from Monday", () => {
    expect(weekDates("2026-10-05")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });
});
