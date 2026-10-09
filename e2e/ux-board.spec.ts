import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, placeFirst, skipOnboarding } from "./helpers";

test("planning mode toggle and day sheet modal", async ({ page }) => {
  test.setTimeout(180000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 20);

  await expect(page.getByRole("group", { name: "How you plan this week" })).toBeVisible();
  await expect(page.getByRole("button", { name: "By day", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Week’s meals", exact: true })).toBeVisible();
  await expect(page.getByText("Zoom")).toHaveCount(0);

  await page.getByRole("button", { name: "Week’s meals", exact: true }).click();
  await expect(page.getByRole("heading", { name: "This week’s meals" })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator("[data-drop-day]")).toHaveCount(0);

  await page.getByRole("button", { name: "By day", exact: true }).click();
  await expect(page.locator("[data-drop-day]").first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Mon").first()).toBeVisible();

  await placeFirst(page, "Bolognese");
  // placeFirst closes the sheet — reopen from the day column
  await page
    .locator("section.sheet")
    .filter({ hasText: "Bolognese" })
    .first()
    .getByRole("button", { name: /^Bolognese/ })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15000 });
  await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();
  // Modal is fixed overlay, not a left column sibling of the board.
  await expect(dialog).toHaveCSS("position", "fixed");
});

test("library cards share a minimum height", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 21);

  const cards = page.locator('[data-testid="library-meal-card"]');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(1);
  const heights = [];
  for (let i = 0; i < Math.min(count, 6); i++) {
    const box = await cards.nth(i).boundingBox();
    heights.push(box?.height ?? 0);
  }
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  expect(max - min).toBeLessThan(8);
});

test("confidence toggle does not flash Save meal to Saving", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  await page.locator("aside").getByRole("link", { name: /Edit Bolognese/i }).first().click();
  await page.waitForURL(/\/meals\//);
  const save = page.getByTestId("save-meal");
  await expect(save).toHaveText("Save meal");

  await page.getByRole("button", { name: "I roughly know this" }).click();
  await page.waitForTimeout(200);
  await expect(save).toHaveText("Save meal");
  await page.waitForTimeout(800);
  await expect(save).toHaveText("Save meal");
});
