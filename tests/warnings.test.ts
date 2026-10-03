import { describe, expect, it } from "vitest";
import { timeWarning } from "@/lib/warnings";

describe("timeWarning", () => {
  it("matches the worked table", () => {
    expect(
      timeWarning({
        prepWindow: "SAME_DAY",
        mealActiveMinutes: 40,
        mealTotalMinutes: 40,
        sideActiveMinutes: [],
      }).warn,
    ).toBe(true);

    expect(
      timeWarning({
        prepWindow: "SAME_DAY",
        mealActiveMinutes: 20,
        mealTotalMinutes: 50,
        sideActiveMinutes: [],
      }).warn,
    ).toBe(true);

    expect(
      timeWarning({
        prepWindow: "SAME_DAY",
        mealActiveMinutes: 25,
        mealTotalMinutes: 30,
        sideActiveMinutes: [],
      }).warn,
    ).toBe(false);

    expect(
      timeWarning({
        prepWindow: "EVENING_BEFORE",
        mealActiveMinutes: 70,
        mealTotalMinutes: 70,
        sideActiveMinutes: [],
      }).warn,
    ).toBe(true);

    expect(
      timeWarning({
        prepWindow: "EVENING_BEFORE",
        mealActiveMinutes: 40,
        mealTotalMinutes: 90,
        sideActiveMinutes: [],
      }).warn,
    ).toBe(false);

    expect(
      timeWarning({
        prepWindow: "SAME_DAY",
        mealActiveMinutes: null,
        mealTotalMinutes: null,
        sideActiveMinutes: [],
      }).warn,
    ).toBe(false);
  });
});
