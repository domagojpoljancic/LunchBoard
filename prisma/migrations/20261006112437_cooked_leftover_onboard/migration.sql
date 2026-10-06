-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DayPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mealId" TEXT,
    "variantId" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 3,
    "prepWindow" TEXT NOT NULL DEFAULT 'EVENING_BEFORE',
    "cookedAt" DATETIME,
    "fillReason" TEXT,
    "leftoverOfDayId" TEXT,
    CONSTRAINT "DayPlan_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProteinVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_leftoverOfDayId_fkey" FOREIGN KEY ("leftoverOfDayId") REFERENCES "DayPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DayPlan" ("date", "enabled", "id", "mealId", "prepWindow", "servings", "variantId", "weekId") SELECT "date", "enabled", "id", "mealId", "prepWindow", "servings", "variantId", "weekId" FROM "DayPlan";
DROP TABLE "DayPlan";
ALTER TABLE "new_DayPlan" RENAME TO "DayPlan";
CREATE UNIQUE INDEX "DayPlan_weekId_date_key" ON "DayPlan"("weekId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
