import { test, expect, type Locator, type Page } from "@playwright/test";
import { gotoWeekOffset, login, skipOnboarding } from "./helpers";

async function drag(page: Page, from: Locator, to: Locator) {
  await from.scrollIntoViewIfNeeded();
  await to.scrollIntoViewIfNeeded();
  const source = await from.boundingBox();
  const target = await to.boundingBox();
  if (!source || !target) throw new Error("missing box");
  await page.mouse.move(source.x + 36, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    target.x + target.width / 2,
    target.y + Math.min(80, target.height / 2),
    { steps: 18 },
  );
  await page.mouse.up();
}

test("drag a meal onto a day, then across to another day", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 17);

  const days = page.locator("[data-drop-day]");
  await drag(
    page,
    page.locator("aside").getByRole("button", { name: /^Bolognese/ }),
    days.first(),
  );
  await expect(days.first()).toContainText("Cook Sun evening", {
    timeout: 15000,
  });

  await drag(page, page.locator("[data-drag-from]").first(), days.nth(1));
  await expect(days.nth(1)).toContainText("Bolognese", { timeout: 15000 });
  await expect(days.first()).not.toContainText("Bolognese");
});
