import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { HealthDataRow } from "@/lib/csv/schemas";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { rows, mode } = body as {
    rows: HealthDataRow[];
    mode: "skip" | "overwrite";
  };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No valid rows" }, { status: 400 });
  }

  const userId = session.user.id;

  // Check for duplicate dates
  const dates = rows.map((r) => {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const existing = await prisma.healthSession.findMany({
    where: {
      userId,
      date: { in: dates },
    },
    select: { date: true },
  });
  const existingDates = new Set(
    existing.map((e) => e.date.toISOString().split("T")[0])
  );

  let imported = 0;
  let skipped = 0;
  let overwritten = 0;

  for (const row of rows) {
    const date = new Date(row.date);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split("T")[0];
    const isDuplicate = existingDates.has(dateKey);

    if (isDuplicate && mode === "skip") {
      skipped++;
      continue;
    }

    const data = {
      userId,
      date,
      sleepHours: row.sleepHours ?? null,
      sleepEfficiency: row.sleepEfficiency ?? null,
      sleepConsistency: row.sleepConsistency ?? null,
      sleepStress: row.sleepStress ?? null,
      deepSleepHrs: row.deepSleepHrs ?? null,
      remSleepHrs: row.remSleepHrs ?? null,
      lightSleepHrs: row.lightSleepHrs ?? null,
      awakeHrs: row.awakeHrs ?? null,
      hrv: row.hrv ?? null,
      restingHr: row.restingHr ?? null,
      respiratoryRate: row.respiratoryRate ?? null,
      recoveryScore: row.recoveryScore ?? null,
      borgRpe: row.borgRpe ?? null,
      hrZone1Mins: row.hrZone1Mins ?? null,
      hrZone2Mins: row.hrZone2Mins ?? null,
      hrZone3Mins: row.hrZone3Mins ?? null,
      hrZone4Mins: row.hrZone4Mins ?? null,
      hrZone5Mins: row.hrZone5Mins ?? null,
      activityMins: row.activityMins ?? null,
      steps: row.steps ?? null,
    };

    if (isDuplicate && mode === "overwrite") {
      await prisma.healthSession.update({
        where: { userId_date: { userId, date } },
        data,
      });
      overwritten++;
    } else {
      await prisma.healthSession.create({ data });
      imported++;
    }
  }

  // Record the import
  await prisma.dataImport.create({
    data: {
      userId,
      filename: body.filename ?? "upload.csv",
      rowCount: imported + overwritten,
      importStatus: "COMPLETED",
    },
  });

  return NextResponse.json({
    imported,
    skipped,
    overwritten,
    total: rows.length,
  });
}
