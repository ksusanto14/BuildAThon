import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's health session
  const todaySession = await prisma.healthSession.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: today },
    },
    orderBy: { date: "desc" },
  });

  // Get last 7 days for trend
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSessions = await prisma.healthSession.findMany({
    where: {
      userId: session.user.id,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    today: todaySession
      ? {
          sleepScore: Math.round(
            ((todaySession.sleepEfficiency ?? 0) + (todaySession.sleepConsistency ?? 0)) / 2
          ),
          recoveryScore: Math.round(todaySession.recoveryScore ?? 0),
          strainScore: Math.round(
            ((todaySession.borgRpe ?? 6) / 20) * 100
          ),
        }
      : { sleepScore: 0, recoveryScore: 0, strainScore: 0 },
    trend: recentSessions.map((s) => ({
      date: s.date,
      sleep: Math.round(
        ((s.sleepEfficiency ?? 0) + (s.sleepConsistency ?? 0)) / 2
      ),
      recovery: Math.round(s.recoveryScore ?? 0),
      strain: Math.round(((s.borgRpe ?? 6) / 20) * 100),
    })),
  });
}
