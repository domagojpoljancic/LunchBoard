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

  // Bolognese is still on Needs a recipe here, so the cook view spells out every step.
  await expect(
    page.getByRole("heading", { name: "Steps", exact: true }),
  ).toBeVisible();

  const cooked = page.getByRole("button", { name: "I cooked this" });
  await cooked.click();

  // Logging a cook closes the cook view and returns to the board.
  await page.waitForURL(/\/week\//, { timeout: 15000 });
  await expect(cooked).toHaveCount(0);

  await page.getByRole("link", { name: "Cooked", exact: true }).click();
  await page.waitForURL(/\/cook\//);
  const undo = page.getByRole("button", { name: /Cooked/ });
  await expect(undo).toBeVisible({ timeout: 15000 });
  await undo.click();
  await expect(page.getByRole("button", { name: "I cooked this" })).toBeVisible({
    timeout: 15000,
  });
});

test("a meal the cook knows shows keypoints instead of steps", async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  await page
    .getByRole("button", { name: "Mark Goulash as known", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Goulash: marked as known", exact: true }),
  ).toBeVisible({ timeout: 15000 });

  await gotoWeekOffset(page, 6);
  await placeFirst(page, "Goulash");

  await page.getByRole("link", { name: "Cook", exact: true }).first().click();
  await page.waitForURL(/\/cook\//);
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: "Keypoints", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Steps", exact: true }),
  ).toHaveCount(0);
});
