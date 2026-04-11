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
      sleepHours: true,
      sleepEfficiency: true,
      sleepConsistency: true,
      sleepStress: true,
      deepSleepHrs: true,
      remSleepHrs: true,
      lightSleepHrs: true,
      awakeHrs: true,
    },
  });

  // Compute aggregates
  const withData = sessions.filter((s) => s.sleepHours != null);
  const avgSleep = withData.length > 0 ? withData.reduce((a, s) => a + (s.sleepHours ?? 0), 0) / withData.length : 0;
  const avgEfficiency = withData.length > 0 ? withData.reduce((a, s) => a + (s.sleepEfficiency ?? 0), 0) / withData.length : 0;
  const avgConsistency = withData.length > 0 ? withData.reduce((a, s) => a + (s.sleepConsistency ?? 0), 0) / withData.length : 0;
  const avgStress = withData.length > 0 ? withData.reduce((a, s) => a + (s.sleepStress ?? 0), 0) / withData.length : 0;

  // Latest night's stages
  const latest = sessions[sessions.length - 1];
  const stages = latest
    ? {
        deep: latest.deepSleepHrs ?? 0,
        rem: latest.remSleepHrs ?? 0,
        light: latest.lightSleepHrs ?? 0,
        awake: latest.awakeHrs ?? 0,
      }
    : { deep: 0, rem: 0, light: 0, awake: 0 };

  // Insights: compare last night to averages
  const insights = [];
  if (latest?.sleepHours != null) {
    const diff = latest.sleepHours - avgSleep;
    insights.push({
      factor: diff >= 0 ? "Above average sleep duration" : "Below average sleep duration",
      impact: diff >= 0 ? `+${(diff * 10).toFixed(0)}%` : `${(diff * 10).toFixed(0)}%`,
      positive: diff >= 0,
    });
  }
  if (latest?.sleepStress != null) {
    insights.push({
      factor: latest.sleepStress < 40 ? "Low sleep stress" : "Elevated sleep stress",
      impact: latest.sleepStress < 40 ? "+8%" : "-12%",
      positive: latest.sleepStress < 40,
    });
  }
  if (latest?.sleepEfficiency != null) {
    insights.push({
      factor: latest.sleepEfficiency > 85 ? "Good sleep efficiency" : "Low sleep efficiency",
      impact: latest.sleepEfficiency > 85 ? "+5%" : "-8%",
      positive: latest.sleepEfficiency > 85,
    });
  }

  return NextResponse.json({
    summary: {
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgEfficiency: Math.round(avgEfficiency),
      avgConsistency: Math.round(avgConsistency),
      avgStress: Math.round(avgStress),
    },
    stages,
    insights,
    daily: sessions.map((s) => ({
      date: s.date,
      hours: s.sleepHours,
      efficiency: s.sleepEfficiency,
      consistency: s.sleepConsistency,
      stress: s.sleepStress,
      deep: s.deepSleepHrs,
      rem: s.remSleepHrs,
      light: s.lightSleepHrs,
      awake: s.awakeHrs,
    })),
  });
}
