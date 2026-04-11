import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function avg(values: (number | null | undefined)[]): number {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pctChange(baseline: number, recent: number): number {
  if (baseline === 0) return 0;
  return round2(((recent - baseline) / Math.abs(baseline)) * 100);
}

function formatPeriod(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}`;
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

/* ------------------------------------------------------------------ */
/*  GET Handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch ALL health sessions ordered by date ascending
  const sessions = await prisma.healthSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });

  if (sessions.length < 2) {
    return Response.json(
      { error: "Not enough data to compute improvement. Need at least 2 sessions." },
      { status: 400 }
    );
  }

  // Split into two halves
  const midpoint = Math.floor(sessions.length / 2);
  const baselineSessions = sessions.slice(0, midpoint);
  const recentSessions = sessions.slice(midpoint);

  // Compute period averages
  function computeMetrics(data: typeof sessions) {
    return {
      avgSleepHours: round2(avg(data.map((s) => s.sleepHours))),
      avgSleepEfficiency: round2(avg(data.map((s) => s.sleepEfficiency))),
      avgHrv: round2(avg(data.map((s) => s.hrv))),
      avgRestingHr: round2(avg(data.map((s) => s.restingHr))),
      avgRecoveryScore: round2(avg(data.map((s) => s.recoveryScore))),
      avgBorgRpe: round2(avg(data.map((s) => s.borgRpe))),
      avgSteps: round2(avg(data.map((s) => s.steps))),
    };
  }

  const baseline = computeMetrics(baselineSessions);
  const recent = computeMetrics(recentSessions);

  // Period date ranges
  const baselinePeriod = formatPeriod(
    new Date(baselineSessions[0].date),
    new Date(baselineSessions[baselineSessions.length - 1].date)
  );
  const recentPeriod = formatPeriod(
    new Date(recentSessions[0].date),
    new Date(recentSessions[recentSessions.length - 1].date)
  );

  // Calculate % changes
  // For restingHr and borgRpe, LOWER is better so we invert direction
  const metrics = [
    {
      metric: "Sleep Hours",
      from: baseline.avgSleepHours,
      to: recent.avgSleepHours,
      invertBetter: false,
    },
    {
      metric: "Sleep Efficiency",
      from: baseline.avgSleepEfficiency,
      to: recent.avgSleepEfficiency,
      invertBetter: false,
    },
    {
      metric: "HRV",
      from: baseline.avgHrv,
      to: recent.avgHrv,
      invertBetter: false,
    },
    {
      metric: "Resting HR",
      from: baseline.avgRestingHr,
      to: recent.avgRestingHr,
      invertBetter: true,
    },
    {
      metric: "Recovery Score",
      from: baseline.avgRecoveryScore,
      to: recent.avgRecoveryScore,
      invertBetter: false,
    },
    {
      metric: "Borg RPE",
      from: baseline.avgBorgRpe,
      to: recent.avgBorgRpe,
      invertBetter: true,
    },
    {
      metric: "Steps",
      from: baseline.avgSteps,
      to: recent.avgSteps,
      invertBetter: false,
    },
  ];

  const changes = metrics.map((m) => {
    const change = round2(pctChange(m.from, m.to));
    const direction = change >= 0 ? "up" : "down";
    // For inverted metrics, a decrease is good
    const good = m.invertBetter ? change <= 0 : change >= 0;
    return {
      metric: m.metric,
      from: m.from,
      to: m.to,
      change,
      direction,
      good,
    };
  });

  // Compute composite Improvement Score (0-100)
  // Weighted average of normalized improvements, clamped to 0-100
  const weights = {
    "Sleep Hours": 0.15,
    "Sleep Efficiency": 0.15,
    "HRV": 0.2,
    "Resting HR": 0.15,
    "Recovery Score": 0.15,
    "Borg RPE": 0.1,
    "Steps": 0.1,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const c of changes) {
    const w = weights[c.metric as keyof typeof weights] ?? 0.1;
    // Normalize: treat positive change as improvement (inverted already handled)
    // For inverted metrics, negate the change so positive = improvement
    const improvement = c.good
      ? Math.abs(c.change)
      : -Math.abs(c.change);
    // Scale: 10% improvement = full weight contribution (score of 100 per metric)
    const normalized = Math.min(Math.max((improvement / 10) * 100, -100), 100);
    weightedSum += normalized * w;
    totalWeight += w;
  }

  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  // Map from [-100, 100] to [0, 100]
  const improvementScore = Math.round(Math.min(100, Math.max(0, (rawScore + 100) / 2)));

  // Milestones
  const milestones = [
    {
      name: "Sleep Pro",
      icon: "moon",
      achieved: recent.avgSleepHours > 7.5,
      description: "Averaging 7.5+ hours of sleep",
    },
    {
      name: "Recovery Champion",
      icon: "heart",
      achieved: recent.avgRecoveryScore > 70,
      description: "Recovery score averaging above 70",
    },
    {
      name: "Consistency King",
      icon: "activity",
      achieved: recent.avgSleepEfficiency > 85,
      description: "Sleep efficiency consistently above 85%",
    },
    {
      name: "HRV Rising",
      icon: "activity",
      achieved: pctChange(baseline.avgHrv, recent.avgHrv) > 5,
      description: "HRV improved by more than 5%",
    },
    {
      name: "Step Master",
      icon: "footprints",
      achieved: recent.avgSteps > 8000,
      description: "Averaging over 8,000 steps daily",
    },
    {
      name: "Low Stress",
      icon: "heart",
      achieved: recent.avgRestingHr < baseline.avgRestingHr,
      description: "Resting heart rate has decreased",
    },
  ];

  // Weekly trend data
  const weeklyMap = new Map<
    string,
    { sleep: number[]; recovery: number[]; strain: number[]; date: Date }
  >();

  for (const s of sessions) {
    const weekKey = getWeekStart(new Date(s.date));
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { sleep: [], recovery: [], strain: [], date: new Date(weekKey) });
    }
    const entry = weeklyMap.get(weekKey)!;
    if (s.sleepHours != null) entry.sleep.push(s.sleepHours);
    if (s.recoveryScore != null) entry.recovery.push(s.recoveryScore);
    if (s.borgRpe != null) entry.strain.push(s.borgRpe);
  }

  const weeklyTrend = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => ({
      week: weekLabel(entry.date),
      sleep: round2(avg(entry.sleep)),
      recovery: round2(avg(entry.recovery)),
      strain: round2(avg(entry.strain)),
    }));

  return Response.json({
    improvementScore,
    baseline: {
      period: baselinePeriod,
      avgSleep: baseline.avgSleepHours,
      avgSleepEfficiency: baseline.avgSleepEfficiency,
      avgHrv: baseline.avgHrv,
      avgRestingHr: baseline.avgRestingHr,
      avgRecoveryScore: baseline.avgRecoveryScore,
      avgBorgRpe: baseline.avgBorgRpe,
      avgSteps: baseline.avgSteps,
    },
    recent: {
      period: recentPeriod,
      avgSleep: recent.avgSleepHours,
      avgSleepEfficiency: recent.avgSleepEfficiency,
      avgHrv: recent.avgHrv,
      avgRestingHr: recent.avgRestingHr,
      avgRecoveryScore: recent.avgRecoveryScore,
      avgBorgRpe: recent.avgBorgRpe,
      avgSteps: recent.avgSteps,
    },
    changes,
    milestones,
    weeklyTrend,
  });
}
