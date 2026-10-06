import { test } from "@playwright/test";
import { mkdirSync } from "fs";
import { login, skipOnboarding } from "./helpers";

const out = "e2e-artifacts/screens";

test("captures board screens at desktop and phone", async ({ page }) => {
  mkdirSync(out, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await skipOnboarding(page);
  await page.screenshot({ path: `${out}/1440-board.png`, fullPage: false });

  await page.getByText("Bolognese", { exact: true }).first().click();
  const place = page.getByRole("button", { name: /Place Bolognese/ }).first();
  if (await place.count()) {
    await place.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: `${out}/1440-placed.png`, fullPage: false });

  const weekStart = page.url().split("/week/")[1]?.split(/[?#]/)[0];
  await page.goto(`/list/${weekStart}`);
  await page.screenshot({ path: `${out}/1440-list.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/week/${weekStart}`);
  await page.waitForLoadState("networkidle");
  await skipOnboarding(page);
  await page.screenshot({ path: `${out}/390-board.png`, fullPage: true });
});
