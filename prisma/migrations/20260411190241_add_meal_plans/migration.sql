-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "trainingDay" BOOLEAN NOT NULL DEFAULT true,
    "targetCalories" INTEGER NOT NULL,
    "targetProtein" INTEGER NOT NULL,
    "targetCarbs" INTEGER NOT NULL,
    "targetFat" INTEGER NOT NULL,
    "meals" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MealPlan_userId_date_idx" ON "MealPlan"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_userId_date_key" ON "MealPlan"("userId", "date");
