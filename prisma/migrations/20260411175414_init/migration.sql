-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ATHLETE',
    "sportType" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "avatarUrl" TEXT,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HealthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "sleepHours" REAL,
    "sleepEfficiency" REAL,
    "sleepConsistency" REAL,
    "sleepStress" REAL,
    "deepSleepHrs" REAL,
    "remSleepHrs" REAL,
    "lightSleepHrs" REAL,
    "awakeHrs" REAL,
    "hrv" REAL,
    "restingHr" REAL,
    "respiratoryRate" REAL,
    "recoveryScore" REAL,
    "borgRpe" REAL,
    "hrZone1Mins" REAL,
    "hrZone2Mins" REAL,
    "hrZone3Mins" REAL,
    "hrZone4Mins" REAL,
    "hrZone5Mins" REAL,
    "activityMins" REAL,
    "steps" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContextLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealType" TEXT,
    "musicGenre" TEXT,
    "moodScore" INTEGER,
    "stressLevel" INTEGER,
    "timeOfDay" TEXT,
    "performanceRating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContextLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformanceFormula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "formulaText" TEXT NOT NULL,
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "confidenceScore" REAL NOT NULL,
    "sessionsAnalyzed" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceFormula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WearableConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "lastSyncAt" DATETIME,
    "syncStatus" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WearableConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "sessions" TEXT NOT NULL DEFAULT '[]',
    "adjustments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "deadline" DATETIME,
    "progress" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errorReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "HealthSession_userId_date_idx" ON "HealthSession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSession_userId_date_key" ON "HealthSession"("userId", "date");

-- CreateIndex
CREATE INDEX "ContextLog_userId_date_idx" ON "ContextLog"("userId", "date");

-- CreateIndex
CREATE INDEX "PerformanceFormula_userId_idx" ON "PerformanceFormula"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WearableConnection_userId_provider_key" ON "WearableConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "TrainingPlan_userId_weekStartDate_idx" ON "TrainingPlan"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "UserGoal_userId_idx" ON "UserGoal"("userId");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_date_idx" ON "JournalEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "DataImport_userId_idx" ON "DataImport"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");
