import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, placeFirst, skipOnboarding } from "./helpers";

test("fill keeps a placed day and fills the rest", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  for (const name of ["Bolognese", "Bean and tuna salad"]) {
    const mark = page.getByRole("button", { name: `Mark ${name} as known` });
    if (await mark.count()) {
      await mark.first().click();
      await page.waitForTimeout(600);
    }
  }

  await gotoWeekOffset(page, 8);
  await placeFirst(page, "Bolognese");

  const before = await page.getByText("Place a meal").count();
  expect(before).toBeGreaterThan(0);

  await page.getByRole("button", { name: /Fill/ }).first().click();
  await page.waitForTimeout(3000);

  const after = await page.getByText("Place a meal").count();
  expect(after).toBeLessThan(before);
  await expect(page.getByText("Bolognese").first()).toBeVisible();
});
