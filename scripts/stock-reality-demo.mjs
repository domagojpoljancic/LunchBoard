import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const OUT = "/cursor/stores/self/media/stock-reality";
const ART = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

async function shot(page, name) {
  const file = `${name}.png`;
  const p1 = path.join(OUT, file);
  const p2 = path.join(ART, file);
  await page.screenshot({ path: p1, fullPage: true });
  fs.copyFileSync(p1, p2);
  console.log("shot", p1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto("http://127.0.0.1:3000/login");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/week/, { timeout: 60000 });
await page.waitForTimeout(2000);
if (!page.url().match(/\/week\/\d{4}/)) {
  await page.goto("http://127.0.0.1:3000/week");
  await page.waitForURL(/\/week\/\d{4}/, { timeout: 60000 });
}
const skip = page.getByRole("button", { name: "Skip" });
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(800);
await shot(page, "01-board-desktop");

await page.goto("http://127.0.0.1:3000/home");
await page.waitForLoadState("networkidle");
await page.getByPlaceholder("Pasta").fill("pasta");
await page.getByPlaceholder("800").fill("800");
await page.getByRole("button", { name: "Save" }).first().click();
await page.waitForTimeout(1000);
await shot(page, "02-at-home-inventory");

await page.getByRole("button", { name: "Prepared" }).click();
await page.getByPlaceholder("Your name for it").fill("Batch chili");
await page.getByLabel("Portions remaining").fill("4");
await page.getByRole("button", { name: "Save" }).click();
await page.waitForTimeout(1000);
await shot(page, "03-at-home-prepared");

await page.locator("a.btn-text", { hasText: /^Board$/ }).first().click();
await page.waitForURL(/\/week\//);
await page.getByRole("button", { name: "Week settings" }).click();
await page.waitForTimeout(400);
await page.locator("select").first().selectOption("POOL");
await page.waitForTimeout(1200);
await shot(page, "04-pool-mode");

const fill = page.getByRole("button", { name: "Fill pool" });
if (await fill.isVisible().catch(() => false)) {
  await fill.click();
  await page.waitForTimeout(1500);
  await shot(page, "05-pool-filled");
}

// back to by-day for place + cook
await page.locator("select").first().selectOption("BY_DAY").catch(() => {});
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Close" }).click().catch(() => {});

const weekStart = page.url().split("/week/")[1]?.split(/[?#]/)[0];
await page
  .locator("aside")
  .getByRole("button", { name: /Bolognese/ })
  .first()
  .click();
await page.waitForTimeout(400);
const place = page.getByRole("button", { name: /Place Bolognese/ }).first();
if (await place.isVisible().catch(() => false)) {
  await place.click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Close" }).first().click().catch(() => {});
}
await shot(page, "06-board-with-meal");

await page.goto(`http://127.0.0.1:3000/list/${weekStart}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
await shot(page, "07-list-advisories");

await page.goto(`http://127.0.0.1:3000/week/${weekStart}?login=1`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
const later = page.getByRole("button", { name: "Later" });
if (await later.isVisible().catch(() => false)) {
  await shot(page, "08-confirm-sheet");
  await later.click();
  await page.waitForTimeout(400);
}
const cook = page.getByRole("link", { name: "Cook", exact: true }).first();
if (await cook.isVisible().catch(() => false)) {
  await cook.click();
  await page.waitForURL(/\/cook\//);
  await shot(page, "09-cook-view");
  await page.getByRole("button", { name: /I cooked this|I heated this/ }).click();
  await page.waitForURL(/\/week\//, { timeout: 20000 });
}

await page.goto("http://127.0.0.1:3000/home");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
const later2 = page.getByRole("button", { name: "Later" });
if (await later2.isVisible().catch(() => false)) await later2.click();
await shot(page, "10-inventory-after-cook");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`http://127.0.0.1:3000/week/${weekStart}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
const later3 = page.getByRole("button", { name: "Later" });
if (await later3.isVisible().catch(() => false)) await later3.click();
await shot(page, "11-board-mobile");

await page.goto("http://127.0.0.1:3000/home");
await page.waitForLoadState("networkidle");
await shot(page, "12-at-home-mobile");

await browser.close();
console.log("done");
