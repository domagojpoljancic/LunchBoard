import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, skipOnboarding } from "./helpers";

test("week’s meals mode plans without day columns", async ({ page }) => {
  test.setTimeout(180000);
  await login(page);
  await skipOnboarding(page);

  const weekStart = await gotoWeekOffset(page, 14);
  await expect(page.locator("[data-drop-day]").first()).toBeVisible();
  await expect(page.getByText("Mon").first()).toBeVisible();

  await page.getByRole("button", { name: "Week’s meals", exact: true }).click();
  await expect(page.getByRole("heading", { name: "This week’s meals" })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator("[data-drop-day]")).toHaveCount(0);

  await page.getByRole("button", { name: "Fill week’s meals" }).click();
  await expect(page.getByText(/of \d/).first()).toBeVisible({
    timeout: 20000,
  });

  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "To buy" })).toBeVisible();
});
