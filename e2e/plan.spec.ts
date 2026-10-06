import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("places Bolognese and shows it on the list", async ({ page }) => {
  test.setTimeout(60000);
  await login(page);
  await skipOnboarding(page);

  await page
    .locator("aside")
    .getByRole("button", { name: /Bolognese/ })
    .first()
    .click();

  const place = page.getByRole("button", { name: "Place Bolognese" });
  await expect(place.first()).toBeVisible({ timeout: 10000 });
  await place.first().click();
  await expect(page.getByText("Cook Sun evening")).toBeVisible({
    timeout: 15000,
  });

  const weekStart = page.url().split("/week/")[1]?.split(/[?#]/)[0];
  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/beef mince/i).first()).toBeVisible();
});
