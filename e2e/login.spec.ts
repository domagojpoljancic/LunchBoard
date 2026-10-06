import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("signs in to the current Monday week", async ({ page }) => {
  await login(page);
  await skipOnboarding(page);
  await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/);
  await expect(page.getByText("LunchBoard")).toBeVisible();
});
