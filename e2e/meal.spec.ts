import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("a meal cannot be saved until every field is filled", async ({ page }) => {
  test.setTimeout(90000);
  await login(page);
  await skipOnboarding(page);

  await page.getByRole("link", { name: "Add a meal" }).click();
  await page.waitForURL(/\/meals\/new/);

  const alert = page.locator("form").getByRole("alert");
  await page.getByRole("button", { name: "Save meal" }).click();
  await expect(alert).toContainText("name");

  await page.getByLabel("Name").fill("Burrata pasta");
  await page.getByRole("button", { name: "Save meal" }).click();
  await expect(alert).toContainText("ingredient");

  await page.getByLabel("Ingredients").fill("burrata 200 g\nbasil");
  await page.getByRole("button", { name: "Save meal" }).click();
  await expect(alert).toContainText("protein");

  await page.getByLabel("Protein").selectOption("VEGETARIAN");
  await page.getByLabel("Hands-on minutes").fill("15");
  await page.getByLabel("Total minutes").fill("5");
  await page.getByRole("button", { name: "Save meal" }).click();
  await expect(alert).toContainText("shorter");

  await page.getByLabel("Total minutes").fill("20");
  await page.getByRole("button", { name: "Save meal" }).click();
  await page.waitForURL(/\/meals\/(?!new)/, { timeout: 15000 });
  await expect(page.getByLabel("Meal name")).toHaveValue("Burrata pasta");
});
