import { test, expect } from "@playwright/test";
import {
  gotoWeekOffset,
  login,
  skipOnboarding,
} from "./helpers";

test("day sheet opens as a dialog/modal, not a left column", async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 17);

  await page
    .locator("aside")
    .getByRole("button", { name: /Bolognese/ })
    .first()
    .click();

  const place = page.getByRole("button", { name: "Place Bolognese" });
  await expect(place.first()).toBeVisible({ timeout: 10000 });
  await place.first().click({ timeout: 20000 });

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 20000 });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(
    dialog.getByRole("heading", { name: "Bolognese", exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();

  // Modal is a fixed overlay, not a flex left-column panel
  await expect(dialog).toHaveCSS("position", "fixed");

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.width).toBeGreaterThan(300);

  // Day columns stay in the document under the overlay
  await expect(page.locator("[data-drop-day]").first()).toBeVisible();
});
