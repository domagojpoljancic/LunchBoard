import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("library shows Can cook shelf with meal cards", async ({ page }) => {
  test.setTimeout(90000);
  await login(page);
  await skipOnboarding(page);

  const aside = page.locator("aside").first();
  await expect(aside.getByRole("heading", { name: "Can cook" })).toBeVisible();

  // Seeded KNOW/PROMPT meals land on Can cook
  const canCookSection = aside
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Can cook" }) });
  await expect(canCookSection.getByRole("button").first()).toBeVisible({
    timeout: 10000,
  });

  // At least one recognizable seed meal should appear in the library
  await expect(
    aside.getByRole("button", { name: /Bolognese|Chili|Lasagne/ }).first(),
  ).toBeVisible();
});
