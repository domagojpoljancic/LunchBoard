-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "catalogKey" TEXT,
    "name" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'RECIPE',
    "activeMinutes" INTEGER,
    "totalMinutes" INTEGER,
    "method" TEXT NOT NULL DEFAULT 'OTHER',
    "cuisine" TEXT,
    "baseServings" INTEGER NOT NULL DEFAULT 3,
    "completePlate" BOOLEAN NOT NULL DEFAULT false,
    "cookCount" INTEGER NOT NULL DEFAULT 0,
    "nudgeDismissedAtCookCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProteinVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "proteinGroup" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProteinVariant_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT,
    "variantId" TEXT,
    "sideId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "role" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Ingredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ingredient_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProteinVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ingredient_sideId_fkey" FOREIGN KEY ("sideId") REFERENCES "Side" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Side" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "catalogKey" TEXT,
    "name" TEXT NOT NULL,
    "activeMinutes" INTEGER,
    CONSTRAINT "Side_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealSide" (
    "mealId" TEXT NOT NULL,
    "sideId" TEXT NOT NULL,
    "defaultSelected" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("mealId", "sideId"),
    CONSTRAINT "MealSide_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealSide_sideId_fkey" FOREIGN KEY ("sideId") REFERENCES "Side" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "diversityNudgeDismissed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Week_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DayPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mealId" TEXT,
    "variantId" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 3,
    "prepWindow" TEXT NOT NULL DEFAULT 'EVENING_BEFORE',
    CONSTRAINT "DayPlan_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DayPlan_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProteinVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DayPlanSide" (
    "dayPlanId" TEXT NOT NULL,
    "sideId" TEXT NOT NULL,

    PRIMARY KEY ("dayPlanId", "sideId"),
    CONSTRAINT "DayPlanSide_dayPlanId_fkey" FOREIGN KEY ("dayPlanId") REFERENCES "DayPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DayPlanSide_sideId_fkey" FOREIGN KEY ("sideId") REFERENCES "Side" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "origin" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ShoppingItem_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PantryItem_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Step_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_userId_catalogKey_key" ON "Meal"("userId", "catalogKey");

-- CreateIndex
CREATE UNIQUE INDEX "Side_userId_catalogKey_key" ON "Side"("userId", "catalogKey");

-- CreateIndex
CREATE UNIQUE INDEX "Week_userId_weekStart_key" ON "Week"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "DayPlan_weekId_date_key" ON "DayPlan"("weekId", "date");
