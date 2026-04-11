import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const sessions = await prisma.healthSession.findMany({
    where: { userId: session.user.id, date: { gte: since } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      borgRpe: true,
      hrZone1Mins: true,
      hrZone2Mins: true,
      hrZone3Mins: true,
      hrZone4Mins: true,
      hrZone5Mins: true,
      activityMins: true,
      steps: true,
      recoveryScore: true,
    },
  });

  const withData = sessions.filter((s) => s.borgRpe != null);
  const avgBorg = withData.length > 0 ? withData.reduce((a, s) => a + (s.borgRpe ?? 0), 0) / withData.length : 0;
  const avgSteps = withData.length > 0 ? withData.reduce((a, s) => a + (s.steps ?? 0), 0) / withData.length : 0;
  const latest = sessions[sessions.length - 1];
  const zone45Mins = (latest?.hrZone4Mins ?? 0) + (latest?.hrZone5Mins ?? 0);

  // Acute:Chronic workload ratio
  const last7 = sessions.slice(-7);
  const last28 = sessions.slice(-28);
  const acuteLoad = last7.reduce((a, s) => a + (s.borgRpe ?? 0), 0) / Math.max(last7.length, 1);
  const chronicLoad = last28.reduce((a, s) => a + (s.borgRpe ?? 0), 0) / Math.max(last28.length, 1);
  const acwr = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 1;

  // Overtraining detection: 3+ consecutive days where strain > recovery
  let consecutiveOverload = 0;
  let overtrainingAlert = false;
  for (let i = sessions.length - 1; i >= 0 && i >= sessions.length - 7; i--) {
    const s = sessions[i];
    const strainPct = ((s.borgRpe ?? 6) / 20) * 100;
    if (strainPct > (s.recoveryScore ?? 100)) {
      consecutiveOverload++;
      if (consecutiveOverload >= 3) { overtrainingAlert = true; break; }
    } else {
      break;
    }
  }

  // Borg RPE label
  function borgLabel(rpe: number): string {
    if (rpe <= 9) return "Very Light";
    if (rpe <= 12) return "Light to Moderate";
    if (rpe <= 15) return "Somewhat Hard";
    if (rpe <= 17) return "Hard";
    return "Very Hard";
  }

  return NextResponse.json({
    summary: {
      borgRpe: Math.round((latest?.borgRpe ?? 0) * 10) / 10,
      borgLabel: borgLabel(latest?.borgRpe ?? 6),
      activityMins: latest?.activityMins ?? 0,
      zone45Mins: Math.round(zone45Mins),
      steps: latest?.steps ?? 0,
      avgSteps: Math.round(avgSteps),
      acwr,
      overtrainingAlert,
    },
    daily: sessions.map((s) => ({
      date: s.date,
      borgRpe: s.borgRpe,
      zone1: s.hrZone1Mins,
      zone2: s.hrZone2Mins,
      zone3: s.hrZone3Mins,
      zone4: s.hrZone4Mins,
      zone5: s.hrZone5Mins,
      activityMins: s.activityMins,
      steps: s.steps,
      recoveryScore: s.recoveryScore,
    })),
  });
}
