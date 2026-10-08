import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("prepared dish CRUD and At home prepared tab", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);

  await page.goto("/home");
  await page.getByRole("button", { name: "Prepared" }).click();
  await expect(
    page.getByRole("heading", { name: "Add prepared dish" }),
  ).toBeVisible();

  await page.getByPlaceholder("Your name for it").fill("Batch chili");
  await page.getByLabel("Portions remaining").fill("4");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Batch chili")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/4 portions/)).toBeVisible();

  await page.getByRole("button", { name: "Ate one" }).click();
  await expect(page.getByText(/3 portions/)).toBeVisible({ timeout: 15000 });
});
