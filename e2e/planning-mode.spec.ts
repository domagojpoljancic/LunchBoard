import { test, expect } from "@playwright/test";
import { gotoWeekOffset, login, skipOnboarding } from "./helpers";

test("planning mode toggle switches By day ↔ Week’s meals (pool)", async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page);
  await skipOnboarding(page);
  await gotoWeekOffset(page, 16);

  const group = page.getByRole("group", { name: "How you plan this week" });
  await expect(group).toBeVisible();

  const byDay = group.getByRole("button", { name: "By day" });
  const pool = group.getByRole("button", { name: "Week’s meals" });

  await expect(byDay).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Monday").first()).toBeVisible();

  await pool.click();
  await expect(pool).toHaveAttribute("aria-pressed", "true", { timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: "This week’s meals" }),
  ).toBeVisible({ timeout: 15000 });
  // Pool mode with daysView off hides weekday columns
  await expect(page.getByText("Monday")).toHaveCount(0);

  await byDay.click();
  await expect(byDay).toHaveAttribute("aria-pressed", "true", { timeout: 15000 });
  await expect(page.getByText("Monday").first()).toBeVisible({
    timeout: 15000,
  });
});
