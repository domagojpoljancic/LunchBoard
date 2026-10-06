import { test, expect } from "@playwright/test";
import {
  gotoWeekOffset,
  login,
  placeFirst,
  skipOnboarding,
  weekStartOf,
} from "./helpers";

test("ticking a line this week drops it from next week", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  const weekStart = await gotoWeekOffset(page, 2);
  await placeFirst(page, "Bolognese");

  // Open the following week so it exists, then carry-over applies live.
  const nextStart = await gotoWeekOffset(page, 1);
  expect(nextStart).not.toBe(weekStart);

  await page.goto(`/list/${nextStart}`);
  await expect(page.getByText(/beef mince/i).first()).toBeVisible();

  await page.goto(`/list/${weekStart}`);
  await page
    .locator("li")
    .filter({ hasText: /beef mince/i })
    .first()
    .getByRole("checkbox")
    .check();
  await page.waitForTimeout(2000);

  await page.goto(`/list/${nextStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/beef mince/i)).toHaveCount(0);
});
