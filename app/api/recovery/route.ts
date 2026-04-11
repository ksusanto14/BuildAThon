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
      hrv: true,
      restingHr: true,
      respiratoryRate: true,
      recoveryScore: true,
      sleepHours: true,
      sleepEfficiency: true,
    },
  });

  const withHrv = sessions.filter((s) => s.hrv != null);
  const avgHrv = withHrv.length > 0 ? withHrv.reduce((a, s) => a + (s.hrv ?? 0), 0) / withHrv.length : 0;
  const stdHrv = withHrv.length > 1
    ? Math.sqrt(withHrv.reduce((a, s) => a + Math.pow((s.hrv ?? 0) - avgHrv, 2), 0) / (withHrv.length - 1))
    : 10;
  const avgRhr = withHrv.length > 0 ? withHrv.reduce((a, s) => a + (s.restingHr ?? 0), 0) / withHrv.length : 0;
  const avgResp = withHrv.length > 0 ? withHrv.reduce((a, s) => a + (s.respiratoryRate ?? 0), 0) / withHrv.length : 0;
  const latest = sessions[sessions.length - 1];
  const latestRecovery = latest?.recoveryScore ?? 0;

  // Recovery zone
  let zone: string;
  let recommendation: string;
  if (latestRecovery >= 67) {
    zone = "Push";
    recommendation = "Full training — capitalize on high readiness";
  } else if (latestRecovery >= 34) {
    zone = "Active Recovery";
    recommendation = "Light training — reduce intensity today";
  } else {
    zone = "Rest";
    recommendation = "Rest day — active recovery only";
  }

  // HRV alert check
  const hrvAlert = latest?.hrv != null && latest.hrv < avgHrv * 0.8
    ? { drop: Math.round((1 - latest.hrv / avgHrv) * 100), current: latest.hrv, baseline: Math.round(avgHrv) }
    : null;

  // Weekly pattern (avg HRV per day of week)
  const dayBuckets: Record<number, number[]> = {};
  for (const s of withHrv) {
    const dow = new Date(s.date).getDay();
    if (!dayBuckets[dow]) dayBuckets[dow] = [];
    dayBuckets[dow].push(s.hrv ?? 0);
  }
  const weeklyPattern = Array.from({ length: 7 }, (_, i) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    avgHrv: dayBuckets[i] ? Math.round(dayBuckets[i].reduce((a, b) => a + b, 0) / dayBuckets[i].length) : 0,
  }));

  return NextResponse.json({
    summary: {
      recoveryScore: Math.round(latestRecovery),
      zone,
      recommendation,
      avgHrv: Math.round(avgHrv * 10) / 10,
      stdHrv: Math.round(stdHrv * 10) / 10,
      avgRhr: Math.round(avgRhr * 10) / 10,
      avgResp: Math.round(avgResp * 10) / 10,
    },
    hrvAlert,
    weeklyPattern,
    daily: sessions.map((s) => ({
      date: s.date,
      hrv: s.hrv,
      restingHr: s.restingHr,
      respiratoryRate: s.respiratoryRate,
      recoveryScore: s.recoveryScore,
      sleepScore: s.sleepEfficiency != null && s.sleepHours != null
        ? Math.round(((s.sleepEfficiency + (s.sleepHours / 10) * 100) / 2))
        : null,
      hrvBaseline: Math.round(avgHrv),
      hrvUpper: Math.round(avgHrv + stdHrv),
      hrvLower: Math.round(Math.max(0, avgHrv - stdHrv)),
    })),
  });
}
