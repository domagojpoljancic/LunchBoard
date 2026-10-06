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

export function weekStartOf(page: Page): string {
  return page.url().split("/week/")[1]?.split(/[?#]/)[0] ?? "";
}

export function shiftWeekStart(weekStart: string, weeks: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

/**
 * Specs share one seeded database, so each one works on its own week to keep
 * placements independent. Navigating by URL keeps this deterministic.
 */
export async function gotoWeekOffset(page: Page, weeks: number) {
  const target = shiftWeekStart(weekStartOf(page), weeks);
  await page.goto(`/week/${target}`);
  await page.waitForLoadState("networkidle");
  await skipOnboarding(page);
  expect(weekStartOf(page)).toBe(target);
  return target;
}

export async function placeFirst(page: Page, name: string) {
  await page
    .locator("aside")
    .getByRole("button", { name: new RegExp(name) })
    .first()
    .click();

  const place = page.getByRole("button", { name: `Place ${name}` });
  await expect(place.first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(400);
  await place.first().click({ timeout: 20000 });
  await expect(page.getByText("Cook Sun evening")).toBeVisible({
    timeout: 20000,
  });
  const close = page.getByRole("button", { name: "Close" }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  }
}
