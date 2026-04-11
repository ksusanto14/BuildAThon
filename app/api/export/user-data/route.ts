import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CSV_HEADERS = [
  "id",
  "userId",
  "date",
  "sleepHours",
  "sleepEfficiency",
  "sleepConsistency",
  "sleepStress",
  "deepSleepHrs",
  "remSleepHrs",
  "lightSleepHrs",
  "awakeHrs",
  "hrv",
  "restingHr",
  "respiratoryRate",
  "recoveryScore",
  "borgRpe",
  "hrZone1Mins",
  "hrZone2Mins",
  "hrZone3Mins",
  "hrZone4Mins",
  "hrZone5Mins",
  "activityMins",
  "steps",
  "createdAt",
] as const;

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.healthSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });

  const rows = records.map((record) =>
    CSV_HEADERS.map((header) => escapeCSV(record[header as keyof typeof record])).join(",")
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");

  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rite-export-${today}.csv"`,
    },
  });
}
