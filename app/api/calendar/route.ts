import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRecommendation(recoveryScore: number | null): "push" | "active" | "rest" {
  if (recoveryScore == null) return "active";
  if (recoveryScore >= 67) return "push";
  if (recoveryScore >= 34) return "active";
  return "rest";
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = request.nextUrl.searchParams.get("month");
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ error: "Invalid month parameter. Use YYYY-MM format." }, { status: 400 });
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Fetch all HealthSessions for the user in that month
  const healthSessions = await prisma.healthSession.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    orderBy: { date: "asc" },
  });

  // Fetch TrainingPlans for weeks overlapping this month
  // A week overlaps the month if weekStartDate is within [monthStart - 6 days, monthEnd]
  const planSearchStart = new Date(startOfMonth);
  planSearchStart.setDate(planSearchStart.getDate() - 6);

  const trainingPlans = await prisma.trainingPlan.findMany({
    where: {
      userId: session.user.id,
      weekStartDate: { gte: planSearchStart, lte: endOfMonth },
    },
    orderBy: { weekStartDate: "asc" },
  });

  // Build days array
  const daysInMonth = endOfMonth.getDate();
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    // Find health session for this day
    const daySessions = healthSessions.filter((hs) => {
      const hsDate = new Date(hs.date);
      return hsDate.getFullYear() === year && hsDate.getMonth() === month && hsDate.getDate() === d;
    });

    const recoveryScore = daySessions.length > 0 ? daySessions[0].recoveryScore : null;
    const borgRpe = daySessions.length > 0 ? daySessions[0].borgRpe : null;

    // Find training sessions from plans for this day
    const weekStart = getWeekStart(currentDate);
    const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1; // Mon=0, Sun=6

    const matchingPlan = trainingPlans.find((plan) => {
      const planStart = new Date(plan.weekStartDate);
      return planStart.getTime() === weekStart.getTime();
    });

    let plannedSessions: Array<{ sportType: string; duration: number; intensity: string; notes?: string }> = [];
    if (matchingPlan) {
      try {
        const allSessions = JSON.parse(matchingPlan.sessions);
        plannedSessions = allSessions.filter(
          (s: { dayOfWeek?: number }) => s.dayOfWeek === dayOfWeek
        );
      } catch {
        // Invalid JSON, ignore
      }
    }

    const recommendation = getRecommendation(recoveryScore);

    days.push({
      date: dateStr,
      recoveryScore,
      borgRpe,
      sessions: plannedSessions,
      recommendation,
    });
  }

  // Serialize plans
  const plans = trainingPlans.map((plan) => ({
    id: plan.id,
    weekStartDate: plan.weekStartDate,
    sessions: JSON.parse(plan.sessions || "[]"),
    adjustments: plan.adjustments,
  }));

  return NextResponse.json({ days, plans });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date: string; sportType: string; duration: number; intensity: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { date, sportType, duration, intensity, notes } = body;

  if (!date || !sportType || !duration || !intensity) {
    return NextResponse.json({ error: "Missing required fields: date, sportType, duration, intensity" }, { status: 400 });
  }

  const sessionDate = new Date(date);
  if (isNaN(sessionDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Calculate week start (Monday)
  const weekStart = getWeekStart(sessionDate);
  const dayOfWeek = sessionDate.getDay() === 0 ? 6 : sessionDate.getDay() - 1; // Mon=0, Sun=6

  const newSession = {
    dayOfWeek,
    date,
    sportType,
    duration,
    intensity,
    notes: notes || "",
  };

  // Find or create training plan for this week
  const existingPlan = await prisma.trainingPlan.findFirst({
    where: {
      userId: session.user.id,
      weekStartDate: weekStart,
    },
  });

  let plan;
  if (existingPlan) {
    const existingSessions = JSON.parse(existingPlan.sessions || "[]");
    existingSessions.push(newSession);
    plan = await prisma.trainingPlan.update({
      where: { id: existingPlan.id },
      data: { sessions: JSON.stringify(existingSessions) },
    });
  } else {
    plan = await prisma.trainingPlan.create({
      data: {
        userId: session.user.id,
        weekStartDate: weekStart,
        sessions: JSON.stringify([newSession]),
      },
    });
  }

  return NextResponse.json({ success: true, session: newSession, planId: plan.id }, { status: 201 });
}
