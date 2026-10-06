import { test, expect } from "@playwright/test";
import {
  gotoWeekOffset,
  login,
  placeFirst,
  skipOnboarding,
} from "./helpers";

test("places Bolognese and shows it on the list", async ({ page }) => {
  test.setTimeout(90000);
  await login(page);
  await skipOnboarding(page);

  const weekStart = await gotoWeekOffset(page, 11);
  await placeFirst(page, "Bolognese");

  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/beef mince/i).first()).toBeVisible();
});
