import { test, expect, type Page } from "@playwright/test";
import { gotoWeekOffset, login, placeFirst, skipOnboarding } from "./helpers";

/** Day columns are the only `section.sheet` on the board. */
function placedColumn(page: Page) {
  return page.locator("section.sheet").filter({ hasText: "Bolognese" }).first();
}

async function openPlacedDay(page: Page) {
  await placedColumn(page)
    .getByRole("button", { name: /^Bolognese/ })
    .click();
}

/** The worked examples from docs/02-data-and-logic.md, end to end. */
test("portions, protein swap, day off, and the lunch warning", async ({
  page,
}) => {
  test.setTimeout(150000);
  await login(page);
  await skipOnboarding(page);

  const weekStart = await gotoWeekOffset(page, 14);
  await placeFirst(page, "Bolognese");

  const placed = placedColumn(page);
  await expect(placed).toContainText("3 portions");
  await expect(placed).toContainText("Pasta");
  await expect(placed).not.toContainText("Green salad");

  // A library selection must not replace the meal on a filled day.
  await page
    .locator("aside")
    .getByRole("button", { name: /^Lasagne/ })
    .first()
    .click();
  await openPlacedDay(page);
  await expect(
    page.getByRole("heading", { name: "Bolognese", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(placed).toContainText("Bolognese");

  const plus = page.getByRole("button", { name: "+", exact: true });
  await expect(plus).toBeVisible({ timeout: 10000 });
  for (const portions of [4, 5, 6]) {
    await plus.click({ timeout: 20000 });
    await expect(page.getByText(`${portions} portions`)).toBeVisible({
      timeout: 20000,
    });
  }

  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(
    page.locator("li").filter({ hasText: /beef mince/i }).first(),
  ).toContainText("900 g");

  // Same meal, other protein: beef mince leaves, vegan mince arrives scaled.
  await page.goto(`/week/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await openPlacedDay(page);
  await page.getByRole("button", { name: "Vegan mince", exact: true }).click();
  await page.waitForTimeout(1500);

  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/beef mince/i)).toHaveCount(0);
  await expect(
    page.locator("li").filter({ hasText: /vegan mince/i }).first(),
  ).toContainText("720 g");

  // At lunch warns but keeps the meal on the day.
  await page.goto(`/week/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await openPlacedDay(page);
  await page.getByRole("button", { name: "At lunch", exact: true }).click();
  await expect(page.getByText(/Tight for a lunch hour/)).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Close" }).first().click();
  await expect(page.getByText("Bolognese").first()).toBeVisible();

  // Turning the day off drops its ingredients and keeps the meal.
  await placedColumn(page).getByRole("button", { name: "Turn off" }).click();
  await page.waitForTimeout(1500);
  await page.goto(`/list/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/vegan mince/i)).toHaveCount(0);

  await page.goto(`/week/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /^Turn on / }).first().click();
  await expect(page.getByText("Bolognese").first()).toBeVisible({
    timeout: 15000,
  });
});
