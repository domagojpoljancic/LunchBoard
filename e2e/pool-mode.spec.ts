import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, skipOnboarding } from "./helpers";

test("default week stays by-day; pool mode can plan lunches", async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page);
  await skipOnboarding(page);

  const weekStart = await gotoWeekOffset(page, 14);
  // Default board shows weekday columns
  await expect(page.getByText("Monday").first()).toBeVisible();

  await page.getByRole("button", { name: "Week settings" }).click();
  await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();

  await page.locator("select").first().selectOption("POOL");
  await expect(page.getByText("Lunch pool").first()).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole("button", { name: "Fill pool" }).click();
  await expect(page.getByText(/lunches/i).first()).toBeVisible({
    timeout: 20000,
  });

  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "To buy" })).toBeVisible();
});
