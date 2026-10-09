import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("confidence toggle does not flip Save meal label to Saving…", async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  await page.getByRole("link", { name: "Add a meal" }).click();
  await page.waitForURL(/\/meals\/new/);

  await page.getByLabel("Name").fill("Confidence save check");
  await page.getByLabel("Ingredients").fill("tofu 200 g\nrice 150 g");
  await page.getByLabel("Protein").selectOption("VEGETARIAN");
  await page.getByLabel("Hands-on minutes").fill("15");
  await page.getByLabel("Total minutes").fill("25");
  await page.getByRole("button", { name: "Save meal" }).click();
  await page.waitForURL(/\/meals\/(?!new)/, { timeout: 15000 });

  const save = page.getByTestId("save-meal");
  await expect(save).toHaveText("Save meal");

  const roughly = page.getByRole("button", {
    name: "I roughly know this",
  });
  await roughly.click();
  await expect(roughly).toHaveAttribute("aria-pressed", "true", {
    timeout: 10000,
  });

  // Confidence uses a separate transition — Save must not say Saving…
  await expect(save).toHaveText("Save meal");
  await expect(save).not.toHaveText("Saving…");

  const recipe = page.getByRole("button", { name: "I need the recipe" });
  await recipe.click();
  await expect(recipe).toHaveAttribute("aria-pressed", "true", {
    timeout: 10000,
  });
  await expect(save).toHaveText("Save meal");
});
