import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("library shows Can cook shelf with meal cards", async ({ page }) => {
  test.setTimeout(90000);
  await login(page);
  await skipOnboarding(page);

  const aside = page.locator("aside").first();
  await expect(aside.getByRole("heading", { name: "Can cook" })).toBeVisible();

  // Seed meals default to RECIPE — mark one known so Can cook gets a card
  await aside
    .getByRole("button", { name: "Mark Bolognese as known" })
    .first()
    .click();

  const canCookSection = aside
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Can cook" }) });
  await expect(
    canCookSection.getByRole("button", { name: "Bolognese", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    canCookSection.locator('[data-testid="library-meal-card"]'),
  ).toHaveCount(1, { timeout: 15000 });
});
