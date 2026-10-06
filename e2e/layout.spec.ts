import { test, expect } from "@playwright/test";
import { login, skipOnboarding } from "./helpers";

test("selected toggles keep contrast and phone does not scroll sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await skipOnboarding(page);

  const contrast = await page.evaluate(() => {
    const el = document.querySelector(".seg-active");
    if (!el) return null;
    const s = getComputedStyle(el);
    return { color: s.color, bg: s.backgroundColor };
  });
  expect(contrast).not.toBeNull();
  expect(contrast!.color).not.toBe(contrast!.bg);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await skipOnboarding(page);
  const scroll = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth + 1);
});
