import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, placeFirst, skipOnboarding } from "./helpers";

test("cooking a day counts once and can be undone", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  await gotoWeekOffset(page, 5);
  await placeFirst(page, "Bolognese");

  await page.getByRole("link", { name: "Cook", exact: true }).first().click();
  await page.waitForURL(/\/cook\//);
  await page.waitForLoadState("networkidle");

  const cooked = page.getByRole("button", { name: "I cooked this" });
  await cooked.click();

  const undo = page.getByRole("button", { name: /Cooked/ });
  await expect(undo).toBeVisible({ timeout: 15000 });
  // The log button is gone, so a repeat tap cannot count a second cook.
  await expect(cooked).toHaveCount(0);

  await undo.click();
  await expect(page.getByRole("button", { name: "I cooked this" })).toBeVisible({
    timeout: 15000,
  });
});
