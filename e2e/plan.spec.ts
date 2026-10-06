import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("places Bolognese and shows it on the list", async ({ page }) => {
  test.setTimeout(60000);
  await login(page);
  await skipOnboarding(page);

  const mark = page.getByRole("button", { name: /Mark Bolognese as known/ });
  if (await mark.count()) {
    await mark.first().click();
    await page.waitForTimeout(600);
  }

  await page.getByText("Bolognese", { exact: true }).first().click();
  await page.waitForTimeout(300);

  const place = page.getByRole("button", { name: /Place Bolognese/ });
  await expect(place.first()).toBeVisible({ timeout: 10000 });
  await place.first().click();
  await expect(page.getByText("Cook Sun evening")).toBeVisible({
    timeout: 15000,
  });

  const weekStart = page.url().split("/week/")[1]?.split(/[?#]/)[0];
  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/beef mince|vegan mince/i).first()).toBeVisible();
});
