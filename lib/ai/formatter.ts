import { prisma } from "@/lib/prisma";

interface DailySummary {
  date: string;
  sleepHours: number | null;
  sleepEfficiency: number | null;
  hrv: number | null;
  recoveryScore: number | null;
  strain: number | null;
  context: {
    mealType: string | null;
    musicGenre: string | null;
    moodScore: number | null;
    stressLevel: number | null;
  } | null;
}

interface WeeklyTrend {
  weekStart: string;
  avgSleepHours: number;
  avgHrv: number;
  avgRecovery: number;
  avgStrain: number;
  sessionCount: number;
}

interface PerformanceDay {
  date: string;
  recoveryScore: number;
  sleepHours: number | null;
  hrv: number | null;
}

interface ContextPattern {
  highPerformanceDays: {
    commonMealTypes: string[];
    commonMusicGenres: string[];
    avgMood: number | null;
  };
  lowPerformanceDays: {
    commonMealTypes: string[];
    commonMusicGenres: string[];
    avgMood: number | null;
  };
}

export async function formatUserDataForAI(userId: string): Promise<{
  systemPrompt: string;
  userPrompt: string;
  sessionCount: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Fetch health sessions, context logs, and latest formula in parallel
  const [healthSessions, contextLogs, latestFormula] = await Promise.all([
    prisma.healthSession.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.contextLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.performanceFormula.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Build daily summaries
  const dailySummaries: DailySummary[] = healthSessions.map((session) => {
    const sessionDate = new Date(session.date).toISOString().split("T")[0];
    const dayContext = contextLogs.find(
      (cl) => new Date(cl.date).toISOString().split("T")[0] === sessionDate
    );

    const totalZoneMins =
      (session.hrZone1Mins ?? 0) +
      (session.hrZone2Mins ?? 0) +
      (session.hrZone3Mins ?? 0) +
      (session.hrZone4Mins ?? 0) +
      (session.hrZone5Mins ?? 0);

    return {
      date: sessionDate,
      sleepHours: session.sleepHours,
      sleepEfficiency: session.sleepEfficiency,
      hrv: session.hrv,
      recoveryScore: session.recoveryScore,
      strain: totalZoneMins > 0 ? totalZoneMins : session.borgRpe,
      context: dayContext
        ? {
            mealType: dayContext.mealType,
            musicGenre: dayContext.musicGenre,
            moodScore: dayContext.moodScore,
            stressLevel: dayContext.stressLevel,
          }
        : null,
    };
  });

  // Weekly trends
  const weeklyTrends: WeeklyTrend[] = [];
  const weekBuckets: Record<string, DailySummary[]> = {};

  for (const day of dailySummaries) {
    const d = new Date(day.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    if (!weekBuckets[key]) weekBuckets[key] = [];
    weekBuckets[key].push(day);
  }

  for (const [weekStart, days] of Object.entries(weekBuckets)) {
    const sleepDays = days.filter((d) => d.sleepHours != null);
    const hrvDays = days.filter((d) => d.hrv != null);
    const recoveryDays = days.filter((d) => d.recoveryScore != null);
    const strainDays = days.filter((d) => d.strain != null);

    weeklyTrends.push({
      weekStart,
      avgSleepHours:
        sleepDays.length > 0
          ? Math.round(
              (sleepDays.reduce((a, d) => a + (d.sleepHours ?? 0), 0) /
                sleepDays.length) *
                10
            ) / 10
          : 0,
      avgHrv:
        hrvDays.length > 0
          ? Math.round(
              hrvDays.reduce((a, d) => a + (d.hrv ?? 0), 0) / hrvDays.length
            )
          : 0,
      avgRecovery:
        recoveryDays.length > 0
          ? Math.round(
              recoveryDays.reduce((a, d) => a + (d.recoveryScore ?? 0), 0) /
                recoveryDays.length
            )
          : 0,
      avgStrain:
        strainDays.length > 0
          ? Math.round(
              strainDays.reduce((a, d) => a + (d.strain ?? 0), 0) /
                strainDays.length
            )
          : 0,
      sessionCount: days.length,
    });
  }

  // Best/worst performance days
  const withRecovery = dailySummaries.filter((d) => d.recoveryScore != null);
  const sorted = [...withRecovery].sort(
    (a, b) => (b.recoveryScore ?? 0) - (a.recoveryScore ?? 0)
  );
  const bestDays: PerformanceDay[] = sorted.slice(0, 3).map((d) => ({
    date: d.date,
    recoveryScore: d.recoveryScore!,
    sleepHours: d.sleepHours,
    hrv: d.hrv,
  }));
  const worstDays: PerformanceDay[] = sorted
    .slice(-3)
    .reverse()
    .map((d) => ({
      date: d.date,
      recoveryScore: d.recoveryScore!,
      sleepHours: d.sleepHours,
      hrv: d.hrv,
    }));

  // Context patterns
  const highPerfDays = sorted.slice(0, Math.max(3, Math.floor(sorted.length * 0.3)));
  const lowPerfDays = sorted.slice(-Math.max(3, Math.floor(sorted.length * 0.3)));

  function extractPatterns(days: DailySummary[]) {
    const meals: Record<string, number> = {};
    const music: Record<string, number> = {};
    const moods: number[] = [];

    for (const day of days) {
      if (day.context?.mealType) {
        meals[day.context.mealType] = (meals[day.context.mealType] ?? 0) + 1;
      }
      if (day.context?.musicGenre) {
        music[day.context.musicGenre] =
          (music[day.context.musicGenre] ?? 0) + 1;
      }
      if (day.context?.moodScore != null) {
        moods.push(day.context.moodScore);
      }
    }

    const sortedMeals = Object.entries(meals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    const sortedMusic = Object.entries(music)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    const avgMood =
      moods.length > 0
        ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) /
          10
        : null;

    return {
      commonMealTypes: sortedMeals,
      commonMusicGenres: sortedMusic,
      avgMood,
    };
  }

  const contextPatterns: ContextPattern = {
    highPerformanceDays: extractPatterns(highPerfDays),
    lowPerformanceDays: extractPatterns(lowPerfDays),
  };

  // Build the data payload
  const dataPayload = {
    dailySummaries,
    weeklyTrends,
    bestPerformanceDays: bestDays,
    worstPerformanceDays: worstDays,
    contextPatterns,
    previousFormula: latestFormula
      ? {
          formulaText: latestFormula.formulaText,
          conditions: JSON.parse(latestFormula.conditions),
          confidenceScore: latestFormula.confidenceScore,
          version: latestFormula.version,
        }
      : null,
  };

  const systemPrompt = `You are RITE's AI Performance Analyst. Analyze the athlete's health and performance data to identify their unique Performance Formula — the specific conditions under which they perform best.

Return ONLY valid JSON with this exact structure:
{
  "conditions": [
    {
      "factor": "string (e.g., 'Sleep Duration', 'HRV', 'Pre-workout Meal')",
      "optimalRange": "string (e.g., '7.5-8.5 hours', '> 65ms')",
      "impact": "string (brief explanation of why this matters)",
      "direction": "string ('higher_better' | 'lower_better' | 'range_optimal')"
    }
  ],
  "formulaText": "string (2-3 sentence natural language summary of their peak performance conditions)",
  "confidenceScore": number (0-100, based on data volume and consistency),
  "recommendations": ["string (actionable recommendation based on the analysis)"]
}

Rules:
- Return exactly 5 conditions in the conditions array, ranked by impact
- The confidenceScore should reflect data volume: <14 sessions = low (30-50), 14-21 = medium (50-70), 21+ = high (70-90)
- If a previous formula exists, note evolution and changes in the formulaText
- Keep recommendations specific and actionable (3-5 recommendations)
- Base analysis on actual patterns in the data, not generic advice`;

  const userPrompt = `Analyze this athlete's performance data from the last 30 days and generate their Performance Formula:

${JSON.stringify(dataPayload, null, 1)}`;

  return {
    systemPrompt,
    userPrompt,
    sessionCount: healthSessions.length,
  };
}
