import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, skipOnboarding } from "./helpers";

test("Can cook library cards share equal height", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 18);

  const aside = page.locator("aside").first();
  await expect(aside.getByRole("heading", { name: "Can cook" })).toBeVisible();

  // Mark two seed meals known so Can cook has comparable cards
  for (const name of ["Bolognese", "Chicken rice bowl"]) {
    const mark = aside.getByRole("button", { name: `Mark ${name} as known` });
    if (await mark.first().isVisible().catch(() => false)) {
      await mark.first().click();
      await expect(
        aside.getByRole("button", { name: `${name}: marked as known` }).first(),
      ).toBeVisible({ timeout: 15000 });
    }
  }

  const canCookSection = aside
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Can cook" }) });
  const cards = canCookSection.locator('[data-testid="library-meal-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  if (count > 1) {
    const heights: number[] = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const box = await cards.nth(i).boundingBox();
      heights.push(box?.height ?? 0);
    }
    const min = Math.min(...heights);
    const max = Math.max(...heights);
    expect(max - min).toBeLessThan(8);
  }
});
