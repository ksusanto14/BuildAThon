import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { HealthDataRow } from "@/lib/csv/schemas";

// Normalize any date-like input to UTC midnight for consistent storage
function toUtcMidnight(input: string | Date): Date {
  const d = typeof input === "string" ? new Date(input) : new Date(input);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

export async function POST(request: NextRequest) {
  try {
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

    // Build a set of all dates in the incoming rows (UTC midnight)
    const incomingDates = rows.map((r) => toUtcMidnight(r.date));

    // Find existing records that fall on any of those calendar days.
    // We query by range (min..max+1day) to handle records that may have been
    // stored with a non-UTC-midnight timestamp (e.g., from a prior seed run).
    const minDate = new Date(
      Math.min(...incomingDates.map((d) => d.getTime()))
    );
    const maxDate = new Date(
      Math.max(...incomingDates.map((d) => d.getTime())) + 24 * 60 * 60 * 1000
    );

    const existing = await prisma.healthSession.findMany({
      where: {
        userId,
        date: { gte: minDate, lt: maxDate },
      },
      select: { id: true, date: true },
    });

    // Map "YYYY-MM-DD" (UTC) → existing record id
    const existingByDay = new Map<string, string>();
    for (const rec of existing) {
      const key = rec.date.toISOString().slice(0, 10);
      existingByDay.set(key, rec.id);
    }

    let imported = 0;
    let skipped = 0;
    let overwritten = 0;

    for (const row of rows) {
      const date = toUtcMidnight(row.date);
      const dateKey = date.toISOString().slice(0, 10);
      const existingId = existingByDay.get(dateKey);

      if (existingId && mode === "skip") {
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

      if (existingId && mode === "overwrite") {
        await prisma.healthSession.update({
          where: { id: existingId },
          data,
        });
        overwritten++;
      } else {
        await prisma.healthSession.create({ data });
        imported++;
      }
    }

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
  } catch (err) {
    console.error("CSV import error:", err);
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
