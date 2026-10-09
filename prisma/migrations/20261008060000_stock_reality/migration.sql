-- AlterTable User
ALTER TABLE "User" ADD COLUMN "lastCookPromptAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "defaultPlanningMode" TEXT NOT NULL DEFAULT 'BY_DAY';
ALTER TABLE "User" ADD COLUMN "defaultDaysView" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "defaultWeekendExpanded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "defaultPoolTarget" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "User" ADD COLUMN "addPurchaseToInventory" BOOLEAN;

-- AlterTable Week
ALTER TABLE "Week" ADD COLUMN "planningMode" TEXT NOT NULL DEFAULT 'BY_DAY';
ALTER TABLE "Week" ADD COLUMN "daysView" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Week" ADD COLUMN "weekendExpanded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Week" ADD COLUMN "poolTarget" INTEGER NOT NULL DEFAULT 5;

-- InventoryItem
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT NOT NULL DEFAULT '',
    "roleHint" TEXT,
    "notes" TEXT,
    "warnBelow" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InventoryItem_userId_nameKey_unit_location_key" ON "InventoryItem"("userId", "nameKey", "unit", "location");
CREATE INDEX "InventoryItem_userId_location_idx" ON "InventoryItem"("userId", "location");

-- PreparedDish
CREATE TABLE "PreparedDish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "portionsRemaining" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "linkedMealId" TEXT,
    "madeOn" TEXT,
    "eatBy" TEXT,
    "notes" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreparedDish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreparedDish_linkedMealId_fkey" FOREIGN KEY ("linkedMealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- DayPlan: add skippedAt, cookKind, preparedDishId
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
    "skippedAt" DATETIME,
    "cookKind" TEXT NOT NULL DEFAULT 'RECIPE',
    "preparedDishId" TEXT,
    "fillReason" TEXT,
    "leftoverOfDayId" TEXT,
    CONSTRAINT "DayPlan_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProteinVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_preparedDishId_fkey" FOREIGN KEY ("preparedDishId") REFERENCES "PreparedDish" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_leftoverOfDayId_fkey" FOREIGN KEY ("leftoverOfDayId") REFERENCES "DayPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DayPlan" ("id", "weekId", "date", "enabled", "mealId", "variantId", "servings", "prepWindow", "cookedAt", "fillReason", "leftoverOfDayId")
SELECT "id", "weekId", "date", "enabled", "mealId", "variantId", "servings", "prepWindow", "cookedAt", "fillReason", "leftoverOfDayId" FROM "DayPlan";
DROP TABLE "DayPlan";
ALTER TABLE "new_DayPlan" RENAME TO "DayPlan";
CREATE UNIQUE INDEX "DayPlan_weekId_date_key" ON "DayPlan"("weekId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- PoolEntry
CREATE TABLE "PoolEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "mealId" TEXT,
    "variantId" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 3,
    "prepWindow" TEXT NOT NULL DEFAULT 'EVENING_BEFORE',
    "preparedDishId" TEXT,
    "pinnedDayPlanId" TEXT,
    CONSTRAINT "PoolEntry_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PoolEntry_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PoolEntry_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProteinVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PoolEntry_preparedDishId_fkey" FOREIGN KEY ("preparedDishId") REFERENCES "PreparedDish" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PoolEntry_pinnedDayPlanId_fkey" FOREIGN KEY ("pinnedDayPlanId") REFERENCES "DayPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PoolEntry_pinnedDayPlanId_key" ON "PoolEntry"("pinnedDayPlanId");

CREATE TABLE "PoolEntrySide" (
    "poolEntryId" TEXT NOT NULL,
    "sideId" TEXT NOT NULL,
    CONSTRAINT "PoolEntrySide_poolEntryId_fkey" FOREIGN KEY ("poolEntryId") REFERENCES "PoolEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PoolEntrySide_sideId_fkey" FOREIGN KEY ("sideId") REFERENCES "Side" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("poolEntryId", "sideId")
);

CREATE TABLE "PoolCookInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolEntryId" TEXT NOT NULL,
    "cookedDate" TEXT NOT NULL,
    "cookedAt" DATETIME,
    "skippedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PoolCookInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PoolCookInstance_poolEntryId_fkey" FOREIGN KEY ("poolEntryId") REFERENCES "PoolEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CookConfirmation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayPlanId" TEXT,
    "poolCookId" TEXT,
    "status" TEXT NOT NULL,
    "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" DATETIME,
    CONSTRAINT "CookConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CookConfirmation_dayPlanId_fkey" FOREIGN KEY ("dayPlanId") REFERENCES "DayPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CookConfirmation_poolCookId_fkey" FOREIGN KEY ("poolCookId") REFERENCES "PoolCookInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CookConfirmation_dayPlanId_key" ON "CookConfirmation"("dayPlanId");
CREATE UNIQUE INDEX "CookConfirmation_poolCookId_key" ON "CookConfirmation"("poolCookId");

CREATE TABLE "InventoryMutation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "delta" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "cookConfirmationId" TEXT,
    "shoppingItemId" TEXT,
    "shortfall" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversibleUntil" DATETIME,
    "reversedAt" DATETIME,
    CONSTRAINT "InventoryMutation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryMutation_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryMutation_cookConfirmationId_fkey" FOREIGN KEY ("cookConfirmationId") REFERENCES "CookConfirmation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "InventoryMutation_cookConfirmationId_idx" ON "InventoryMutation"("cookConfirmationId");
CREATE INDEX "InventoryMutation_inventoryItemId_createdAt_idx" ON "InventoryMutation"("inventoryItemId", "createdAt");

CREATE TABLE "PreparedMutation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preparedDishId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "cookConfirmationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversibleUntil" DATETIME,
    "reversedAt" DATETIME,
    CONSTRAINT "PreparedMutation_preparedDishId_fkey" FOREIGN KEY ("preparedDishId") REFERENCES "PreparedDish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
