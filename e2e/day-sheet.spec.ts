import { test, expect } from "@playwright/test";
import {
  gotoWeekOffset,
  login,
  placeFirst,
  skipOnboarding,
} from "./helpers";

test("day sheet opens as a dialog/modal, not a left column", async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 17);
  await placeFirst(page, "Bolognese");

  // placeFirst may leave the sheet open — close it so we exercise open-from-column
  const close = page.getByRole("button", { name: "Close" }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  }

  await page
    .locator("section.sheet")
    .filter({ hasText: "Bolognese" })
    .first()
    .getByRole("button", { name: /^Bolognese/ })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(
    dialog.getByRole("heading", { name: "Bolognese", exact: true }),
  ).toBeVisible();

  // Modal should be fixed overlay, not a flex left-column panel
  const position = await dialog.evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe("fixed");

  const boardColumns = page.locator("[data-drop-day]");
  await expect(boardColumns.first()).toBeVisible();
  // Dialog is a sibling overlay; day columns remain in the document
  const dialogBox = await dialog.boundingBox();
  const firstCol = await boardColumns.first().boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(firstCol).not.toBeNull();
  // Overlay covers the viewport rather than sitting as a narrow left rail
  expect(dialogBox!.width).toBeGreaterThan(300);
});
