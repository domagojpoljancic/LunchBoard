import { expect, type Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/week\//, { timeout: 30000 });
}

export async function skipOnboarding(page: Page) {
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await expect(skip).toBeHidden({ timeout: 10000 });
  }
}
