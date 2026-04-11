import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Training Plan Templates by Sport Type                              */
/* ------------------------------------------------------------------ */

interface SessionTemplate {
  day: string;
  type: string;
  duration: number;
  intensity: "easy" | "moderate" | "hard" | "rest";
  description: string;
}

type PhaseKey = "Base" | "Build" | "Peak" | "Deload";

const PHASE_MULTIPLIERS: Record<PhaseKey, number> = {
  Base: 0.85,
  Build: 1.0,
  Peak: 1.15,
  Deload: 0.6,
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTemplates(sportType: string): Record<PhaseKey, SessionTemplate[]> {
  switch (sportType) {
    case "Running":
      return {
        Base: [
          { day: "Monday", type: "Easy Run", duration: 30, intensity: "easy", description: "Recovery pace, keep HR in zone 1-2" },
          { day: "Tuesday", type: "Strength", duration: 40, intensity: "moderate", description: "Lower body strength and core stability" },
          { day: "Wednesday", type: "Easy Run", duration: 35, intensity: "easy", description: "Aerobic base building, conversational pace" },
          { day: "Thursday", type: "Cross Training", duration: 30, intensity: "easy", description: "Cycling or swimming for active recovery" },
          { day: "Friday", type: "Tempo Run", duration: 35, intensity: "moderate", description: "Steady-state at lactate threshold pace" },
          { day: "Saturday", type: "Long Run", duration: 60, intensity: "moderate", description: "Progressive long run, build aerobic endurance" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest or gentle walking" },
        ],
        Build: [
          { day: "Monday", type: "Easy Run", duration: 35, intensity: "easy", description: "Recovery pace, keep HR in zone 1-2" },
          { day: "Tuesday", type: "Strength", duration: 45, intensity: "moderate", description: "Full body strength circuit" },
          { day: "Wednesday", type: "Intervals", duration: 40, intensity: "hard", description: "6x800m at 5K pace with 400m jog recovery" },
          { day: "Thursday", type: "Easy Run", duration: 30, intensity: "easy", description: "Shake-out run, easy effort" },
          { day: "Friday", type: "Tempo Run", duration: 45, intensity: "hard", description: "20 min tempo at threshold, bookended by easy miles" },
          { day: "Saturday", type: "Long Run", duration: 75, intensity: "moderate", description: "Long run with last 15 min at marathon pace" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest or light stretching" },
        ],
        Peak: [
          { day: "Monday", type: "Easy Run", duration: 30, intensity: "easy", description: "Recovery jog, keep effort minimal" },
          { day: "Tuesday", type: "VO2 Max Intervals", duration: 45, intensity: "hard", description: "5x1000m at VO2max pace, 3 min recovery" },
          { day: "Wednesday", type: "Easy Run", duration: 35, intensity: "easy", description: "Easy aerobic run" },
          { day: "Thursday", type: "Race Pace", duration: 50, intensity: "hard", description: "Race-specific pace work, simulate race conditions" },
          { day: "Friday", type: "Easy Run", duration: 25, intensity: "easy", description: "Pre-long run shakeout" },
          { day: "Saturday", type: "Long Run", duration: 90, intensity: "hard", description: "Peak long run with goal-pace segments" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest, prioritize sleep" },
        ],
        Deload: [
          { day: "Monday", type: "Easy Run", duration: 25, intensity: "easy", description: "Very easy recovery run" },
          { day: "Tuesday", type: "Mobility", duration: 30, intensity: "easy", description: "Yoga and dynamic stretching" },
          { day: "Wednesday", type: "Easy Run", duration: 25, intensity: "easy", description: "Gentle aerobic maintenance" },
          { day: "Thursday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest day" },
          { day: "Friday", type: "Easy Run", duration: 20, intensity: "easy", description: "Short easy run, strides at end" },
          { day: "Saturday", type: "Easy Run", duration: 30, intensity: "easy", description: "Relaxed long-ish run at easy pace" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recover" },
        ],
      };

    case "Cycling":
      return {
        Base: [
          { day: "Monday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest or light walk" },
          { day: "Tuesday", type: "Endurance Ride", duration: 60, intensity: "easy", description: "Zone 2 steady ride, spin easy" },
          { day: "Wednesday", type: "Strength", duration: 45, intensity: "moderate", description: "Leg strength and core work" },
          { day: "Thursday", type: "Endurance Ride", duration: 60, intensity: "easy", description: "Aerobic endurance, flat terrain" },
          { day: "Friday", type: "Tempo Ride", duration: 50, intensity: "moderate", description: "20 min tempo intervals at FTP 80-85%" },
          { day: "Saturday", type: "Long Ride", duration: 90, intensity: "moderate", description: "Long steady ride building aerobic base" },
          { day: "Sunday", type: "Recovery Ride", duration: 30, intensity: "easy", description: "Easy spin, active recovery" },
        ],
        Build: [
          { day: "Monday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Tuesday", type: "Sweet Spot", duration: 60, intensity: "moderate", description: "2x20 min at 88-93% FTP" },
          { day: "Wednesday", type: "Strength", duration: 45, intensity: "moderate", description: "Heavy leg day and plyometrics" },
          { day: "Thursday", type: "Endurance Ride", duration: 60, intensity: "easy", description: "Easy spin with cadence drills" },
          { day: "Friday", type: "Threshold Intervals", duration: 60, intensity: "hard", description: "4x10 min at FTP with 5 min recovery" },
          { day: "Saturday", type: "Long Ride", duration: 120, intensity: "moderate", description: "Long ride with climbing repeats" },
          { day: "Sunday", type: "Recovery Ride", duration: 35, intensity: "easy", description: "Active recovery spin" },
        ],
        Peak: [
          { day: "Monday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest" },
          { day: "Tuesday", type: "VO2 Max Intervals", duration: 60, intensity: "hard", description: "5x4 min at 110-120% FTP" },
          { day: "Wednesday", type: "Easy Ride", duration: 40, intensity: "easy", description: "Recovery ride" },
          { day: "Thursday", type: "Race Simulation", duration: 75, intensity: "hard", description: "Simulate race surges and attacks" },
          { day: "Friday", type: "Easy Ride", duration: 30, intensity: "easy", description: "Legs open spin" },
          { day: "Saturday", type: "Long Ride", duration: 150, intensity: "hard", description: "Peak long ride with race-pace segments" },
          { day: "Sunday", type: "Recovery Ride", duration: 30, intensity: "easy", description: "Easy spin flush legs" },
        ],
        Deload: [
          { day: "Monday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Tuesday", type: "Easy Ride", duration: 40, intensity: "easy", description: "Easy spin" },
          { day: "Wednesday", type: "Mobility", duration: 30, intensity: "easy", description: "Stretching and foam rolling" },
          { day: "Thursday", type: "Easy Ride", duration: 35, intensity: "easy", description: "Short easy ride" },
          { day: "Friday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Saturday", type: "Easy Ride", duration: 50, intensity: "easy", description: "Relaxed ride" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recover" },
        ],
      };

    case "CrossFit":
      return {
        Base: [
          { day: "Monday", type: "MetCon", duration: 45, intensity: "moderate", description: "AMRAP 20: row, box jumps, push-ups" },
          { day: "Tuesday", type: "Olympic Lifting", duration: 50, intensity: "moderate", description: "Snatch and clean technique at 60-70%" },
          { day: "Wednesday", type: "Active Recovery", duration: 30, intensity: "easy", description: "Mobility work and light rowing" },
          { day: "Thursday", type: "Strength", duration: 50, intensity: "moderate", description: "Back squat 5x5, strict press 4x6" },
          { day: "Friday", type: "WOD", duration: 40, intensity: "hard", description: "For time: thrusters, pull-ups, burpees" },
          { day: "Saturday", type: "Endurance", duration: 45, intensity: "easy", description: "30 min run/row + skill work" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest" },
        ],
        Build: [
          { day: "Monday", type: "Strength + MetCon", duration: 60, intensity: "hard", description: "Deadlift 5x3 heavy, then 12 min AMRAP" },
          { day: "Tuesday", type: "Olympic Lifting", duration: 55, intensity: "moderate", description: "Clean & Jerk complexes at 75-80%" },
          { day: "Wednesday", type: "Active Recovery", duration: 30, intensity: "easy", description: "Yoga and gymnastics skill practice" },
          { day: "Thursday", type: "WOD", duration: 50, intensity: "hard", description: "Chipper: 50-40-30-20-10 mixed movements" },
          { day: "Friday", type: "Strength", duration: 55, intensity: "moderate", description: "Front squat 4x4, bench press 4x5" },
          { day: "Saturday", type: "Competition WOD", duration: 60, intensity: "hard", description: "Partner WOD with heavy loading" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and meal prep" },
        ],
        Peak: [
          { day: "Monday", type: "Heavy Strength", duration: 60, intensity: "hard", description: "1RM testing: squat, deadlift" },
          { day: "Tuesday", type: "High-Intensity WOD", duration: 45, intensity: "hard", description: "Sprint WODs with short rest" },
          { day: "Wednesday", type: "Active Recovery", duration: 25, intensity: "easy", description: "Light movement and stretching" },
          { day: "Thursday", type: "Olympic Lifting", duration: 55, intensity: "hard", description: "Heavy singles and doubles" },
          { day: "Friday", type: "Competition Prep", duration: 60, intensity: "hard", description: "Simulate competition event pacing" },
          { day: "Saturday", type: "Mock Competition", duration: 75, intensity: "hard", description: "3 events back to back, competition intensity" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest and recovery" },
        ],
        Deload: [
          { day: "Monday", type: "Light MetCon", duration: 30, intensity: "easy", description: "Easy pace AMRAP with light loads" },
          { day: "Tuesday", type: "Skill Work", duration: 35, intensity: "easy", description: "Gymnastics skills and mobility" },
          { day: "Wednesday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Thursday", type: "Light Strength", duration: 35, intensity: "easy", description: "50-60% loads, focus on form" },
          { day: "Friday", type: "Easy WOD", duration: 25, intensity: "easy", description: "Low-intensity movement flow" },
          { day: "Saturday", type: "Active Recovery", duration: 30, intensity: "easy", description: "Hike, swim, or play sport" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recharge" },
        ],
      };

    case "Strength Training":
      return {
        Base: [
          { day: "Monday", type: "Upper Body", duration: 50, intensity: "moderate", description: "Bench 4x8, rows 4x8, shoulders 3x10" },
          { day: "Tuesday", type: "Lower Body", duration: 50, intensity: "moderate", description: "Squat 4x8, RDL 4x8, lunges 3x10" },
          { day: "Wednesday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest or light cardio" },
          { day: "Thursday", type: "Push", duration: 50, intensity: "moderate", description: "OHP 4x8, incline press 3x10, triceps" },
          { day: "Friday", type: "Pull", duration: 50, intensity: "moderate", description: "Deadlift 4x6, pull-ups 4x8, biceps" },
          { day: "Saturday", type: "Accessories", duration: 40, intensity: "easy", description: "Isolation work and weak point training" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest" },
        ],
        Build: [
          { day: "Monday", type: "Heavy Upper", duration: 60, intensity: "hard", description: "Bench 5x5 at 80%, heavy rows 4x6" },
          { day: "Tuesday", type: "Heavy Lower", duration: 60, intensity: "hard", description: "Squat 5x5 at 80%, RDL 4x6" },
          { day: "Wednesday", type: "Active Recovery", duration: 20, intensity: "easy", description: "Light cardio and stretching" },
          { day: "Thursday", type: "Volume Upper", duration: 55, intensity: "moderate", description: "OHP 4x6, dips 4x8, lateral raises 4x12" },
          { day: "Friday", type: "Volume Lower", duration: 55, intensity: "moderate", description: "Front squat 4x6, leg press 4x10, calves" },
          { day: "Saturday", type: "Weak Points", duration: 40, intensity: "moderate", description: "Target lagging muscle groups" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recover" },
        ],
        Peak: [
          { day: "Monday", type: "Max Effort Upper", duration: 65, intensity: "hard", description: "Bench work up to heavy 2-3 rep max" },
          { day: "Tuesday", type: "Max Effort Lower", duration: 65, intensity: "hard", description: "Squat/Deadlift heavy singles and doubles" },
          { day: "Wednesday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Thursday", type: "Dynamic Upper", duration: 50, intensity: "moderate", description: "Speed bench 8x3 at 60%, assistance work" },
          { day: "Friday", type: "Dynamic Lower", duration: 50, intensity: "moderate", description: "Speed squat 8x2 at 60%, posterior chain" },
          { day: "Saturday", type: "Competition Prep", duration: 60, intensity: "hard", description: "Practice competition lifts, peak openers" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest" },
        ],
        Deload: [
          { day: "Monday", type: "Light Upper", duration: 35, intensity: "easy", description: "All lifts at 50-60%, high rep" },
          { day: "Tuesday", type: "Light Lower", duration: 35, intensity: "easy", description: "Squat and deadlift at 50-60%" },
          { day: "Wednesday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Thursday", type: "Mobility", duration: 30, intensity: "easy", description: "Foam rolling and stretching" },
          { day: "Friday", type: "Light Full Body", duration: 30, intensity: "easy", description: "Light compounds, technique focus" },
          { day: "Saturday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recover" },
        ],
      };

    case "Swimming":
      return {
        Base: [
          { day: "Monday", type: "Endurance Swim", duration: 45, intensity: "easy", description: "2000m continuous at easy pace, focus on form" },
          { day: "Tuesday", type: "Drills", duration: 40, intensity: "easy", description: "Catch-up, finger drag, sculling drills" },
          { day: "Wednesday", type: "Strength", duration: 45, intensity: "moderate", description: "Dryland: lat pulldowns, core, shoulders" },
          { day: "Thursday", type: "Endurance Swim", duration: 50, intensity: "moderate", description: "Pull set with paddles, build aerobic engine" },
          { day: "Friday", type: "Kick Set", duration: 35, intensity: "moderate", description: "1500m kick with board and fins" },
          { day: "Saturday", type: "Long Swim", duration: 60, intensity: "moderate", description: "3000m mixed stroke, steady effort" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
        ],
        Build: [
          { day: "Monday", type: "Threshold Set", duration: 50, intensity: "hard", description: "10x100m at CSS pace, 15s rest" },
          { day: "Tuesday", type: "Drills + Speed", duration: 45, intensity: "moderate", description: "Drill work followed by 8x50m fast" },
          { day: "Wednesday", type: "Strength", duration: 50, intensity: "moderate", description: "Heavy dryland: pull-ups, rows, deadlifts" },
          { day: "Thursday", type: "IM Training", duration: 50, intensity: "moderate", description: "Individual medley sets, all 4 strokes" },
          { day: "Friday", type: "Speed Work", duration: 40, intensity: "hard", description: "12x25m sprint with full rest" },
          { day: "Saturday", type: "Long Swim", duration: 70, intensity: "moderate", description: "3500m with descending effort" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and stretch" },
        ],
        Peak: [
          { day: "Monday", type: "Race Pace", duration: 55, intensity: "hard", description: "Broken race-pace sets with short rest" },
          { day: "Tuesday", type: "Sprint Training", duration: 40, intensity: "hard", description: "16x25m all-out with 45s rest" },
          { day: "Wednesday", type: "Easy Swim", duration: 30, intensity: "easy", description: "Easy 1500m recovery swim" },
          { day: "Thursday", type: "Race Simulation", duration: 50, intensity: "hard", description: "Full race simulation with dive start" },
          { day: "Friday", type: "Taper Swim", duration: 30, intensity: "easy", description: "Short easy swim with race-pace 50s" },
          { day: "Saturday", type: "Time Trial", duration: 45, intensity: "hard", description: "Time trial at goal race pace" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest before next week" },
        ],
        Deload: [
          { day: "Monday", type: "Easy Swim", duration: 30, intensity: "easy", description: "1500m easy, focus on technique" },
          { day: "Tuesday", type: "Drills Only", duration: 25, intensity: "easy", description: "Technique drills, no hard effort" },
          { day: "Wednesday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Thursday", type: "Easy Swim", duration: 25, intensity: "easy", description: "1000m easy mixed strokes" },
          { day: "Friday", type: "Mobility", duration: 25, intensity: "easy", description: "Shoulder mobility and stretching" },
          { day: "Saturday", type: "Easy Swim", duration: 30, intensity: "easy", description: "Short easy swim" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recover" },
        ],
      };

    default: // General Fitness
      return {
        Base: [
          { day: "Monday", type: "Cardio", duration: 30, intensity: "easy", description: "Easy jog, bike, or elliptical in zone 2" },
          { day: "Tuesday", type: "Full Body Strength", duration: 40, intensity: "moderate", description: "Compound movements: squat, press, row" },
          { day: "Wednesday", type: "Active Recovery", duration: 25, intensity: "easy", description: "Walking, yoga, or light stretching" },
          { day: "Thursday", type: "HIIT", duration: 30, intensity: "moderate", description: "Circuit training: 30s on, 30s off x 20" },
          { day: "Friday", type: "Strength", duration: 40, intensity: "moderate", description: "Upper/lower split with moderate loads" },
          { day: "Saturday", type: "Outdoor Activity", duration: 45, intensity: "easy", description: "Hike, bike ride, or recreational sport" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest and recovery" },
        ],
        Build: [
          { day: "Monday", type: "Cardio Intervals", duration: 35, intensity: "moderate", description: "5 min warm-up, 5x3 min hard, 2 min easy" },
          { day: "Tuesday", type: "Upper Body", duration: 45, intensity: "moderate", description: "Push/pull supersets with progressive overload" },
          { day: "Wednesday", type: "Cardio", duration: 30, intensity: "easy", description: "Steady-state zone 2 aerobic work" },
          { day: "Thursday", type: "Lower Body", duration: 45, intensity: "hard", description: "Heavy squats, lunges, and posterior chain" },
          { day: "Friday", type: "HIIT", duration: 35, intensity: "hard", description: "Tabata intervals + core finisher" },
          { day: "Saturday", type: "Long Cardio", duration: 50, intensity: "moderate", description: "Extended steady-state cardio activity" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recover" },
        ],
        Peak: [
          { day: "Monday", type: "Sprint Intervals", duration: 30, intensity: "hard", description: "10x30s all-out sprints, 90s recovery" },
          { day: "Tuesday", type: "Heavy Strength", duration: 50, intensity: "hard", description: "Low rep, high weight compound lifts" },
          { day: "Wednesday", type: "Active Recovery", duration: 25, intensity: "easy", description: "Light movement and mobility" },
          { day: "Thursday", type: "HIIT Circuit", duration: 40, intensity: "hard", description: "Complex circuit with compound movements" },
          { day: "Friday", type: "Strength", duration: 50, intensity: "moderate", description: "Moderate volume accessory work" },
          { day: "Saturday", type: "Challenge Workout", duration: 60, intensity: "hard", description: "Personal best attempt or fitness test" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Complete rest" },
        ],
        Deload: [
          { day: "Monday", type: "Light Cardio", duration: 25, intensity: "easy", description: "Easy walk or gentle bike ride" },
          { day: "Tuesday", type: "Light Strength", duration: 30, intensity: "easy", description: "50% loads, focus on movement quality" },
          { day: "Wednesday", type: "Rest Day", duration: 0, intensity: "rest", description: "Full rest" },
          { day: "Thursday", type: "Yoga", duration: 30, intensity: "easy", description: "Gentle yoga or stretching session" },
          { day: "Friday", type: "Light Activity", duration: 25, intensity: "easy", description: "Easy movement, nothing strenuous" },
          { day: "Saturday", type: "Outdoor Walk", duration: 30, intensity: "easy", description: "Relaxed walk in nature" },
          { day: "Sunday", type: "Rest Day", duration: 0, intensity: "rest", description: "Rest and recharge" },
        ],
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = start of week
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekNumber(startDate: Date): number {
  // Determine which week of the 4-week mesocycle we are in
  // Use epoch-based calculation to get consistent cycling
  const epoch = new Date("2026-01-05"); // A known Monday
  const diffMs = startDate.getTime() - epoch.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return (((diffWeeks % 4) + 4) % 4) + 1; // 1-4
}

function getPhase(weekNumber: number): PhaseKey {
  switch (weekNumber) {
    case 1: return "Base";
    case 2: return "Build";
    case 3: return "Peak";
    case 4: return "Deload";
    default: return "Base";
  }
}

function adjustForRecovery(sessions: SessionTemplate[], recoveryScore: number): SessionTemplate[] {
  // High recovery (>= 75): allow more hard sessions
  // Medium recovery (50-74): keep plan as is
  // Low recovery (< 50): downgrade hard sessions to moderate, moderate to easy
  if (recoveryScore >= 75) {
    return sessions; // Can handle full load
  }

  if (recoveryScore >= 50) {
    return sessions; // Moderate, keep as designed
  }

  // Low recovery: reduce intensity
  return sessions.map((s) => {
    if (s.intensity === "hard") {
      return { ...s, intensity: "moderate" as const, duration: Math.round(s.duration * 0.8), description: s.description + " (reduced due to low recovery)" };
    }
    if (s.intensity === "moderate") {
      return { ...s, intensity: "easy" as const, duration: Math.round(s.duration * 0.85) };
    }
    return s;
  });
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getRecoveryRecommendation(score: number): string {
  if (score >= 75) return "High readiness - push hard today";
  if (score >= 60) return "Moderate intensity today";
  if (score >= 40) return "Consider lighter training today";
  return "Low recovery - prioritize rest or easy movement";
}

/* ------------------------------------------------------------------ */
/*  GET Handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sportType: true },
  });

  const sportType = user?.sportType || "General Fitness";

  // Calculate current week start (Monday)
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekNumber = getWeekNumber(weekStart);
  const phase = getPhase(weekNumber);

  // Check if a TrainingPlan already exists for this week
  const existingPlan = await prisma.trainingPlan.findFirst({
    where: {
      userId: session.user.id,
      weekStartDate: weekStart,
    },
  });

  // Get latest recovery score
  const latestHealth = await prisma.healthSession.findFirst({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    select: { recoveryScore: true },
  });

  // Get avg strain from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentSessions = await prisma.healthSession.findMany({
    where: {
      userId: session.user.id,
      date: { gte: sevenDaysAgo },
    },
    select: { borgRpe: true },
  });

  const avgStrain = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.borgRpe ?? 0), 0) / recentSessions.length
    : 5;

  const recoveryScore = latestHealth?.recoveryScore ?? 70;

  let sessions: Array<{
    day: string;
    date: string;
    type: string;
    duration: number;
    intensity: string;
    description: string;
    completed: boolean;
  }>;

  if (existingPlan) {
    // Use existing plan
    sessions = JSON.parse(existingPlan.sessions);
  } else {
    // Auto-generate plan
    const templates = getTemplates(sportType);
    const phaseTemplate = templates[phase];
    const adjusted = adjustForRecovery(phaseTemplate, recoveryScore);

    // Apply phase multiplier to durations
    const multiplier = PHASE_MULTIPLIERS[phase];
    sessions = adjusted.map((s, idx) => ({
      day: s.day,
      date: formatDateStr(new Date(weekStart.getTime() + idx * 24 * 60 * 60 * 1000)),
      type: s.type,
      duration: Math.round(s.duration * multiplier),
      intensity: s.intensity,
      description: s.description,
      completed: false,
    }));

    // Save auto-generated plan
    await prisma.trainingPlan.create({
      data: {
        userId: session.user.id,
        weekStartDate: weekStart,
        sessions: JSON.stringify(sessions),
      },
    });
  }

  // Build mesocycle overview
  const mesocycle = [
    { week: 1, phase: "Base", totalLoad: "moderate", focus: "Aerobic foundation" },
    { week: 2, phase: "Build", totalLoad: "high", focus: "Tempo and threshold" },
    { week: 3, phase: "Peak", totalLoad: "very high", focus: "Race-specific intensity" },
    { week: 4, phase: "Deload", totalLoad: "low", focus: "Recovery and adaptation" },
  ];

  return NextResponse.json({
    currentWeek: {
      weekStart: formatDateStr(weekStart),
      weekNumber,
      phase,
      sessions,
    },
    mesocycle,
    recoveryStatus: {
      score: Math.round(recoveryScore),
      recommendation: getRecoveryRecommendation(recoveryScore),
      avgStrain: Math.round(avgStrain * 10) / 10,
    },
    sportType,
  });
}

/* ------------------------------------------------------------------ */
/*  POST Handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { weekStart, sessions } = body;

  if (!weekStart || !sessions) {
    return NextResponse.json({ error: "weekStart and sessions are required" }, { status: 400 });
  }

  const weekStartDate = new Date(weekStart);
  weekStartDate.setHours(0, 0, 0, 0);

  // Upsert: update if exists, create if not
  const existing = await prisma.trainingPlan.findFirst({
    where: {
      userId: session.user.id,
      weekStartDate,
    },
  });

  let plan;
  if (existing) {
    plan = await prisma.trainingPlan.update({
      where: { id: existing.id },
      data: { sessions: JSON.stringify(sessions) },
    });
  } else {
    plan = await prisma.trainingPlan.create({
      data: {
        userId: session.user.id,
        weekStartDate,
        sessions: JSON.stringify(sessions),
      },
    });
  }

  return NextResponse.json({ success: true, plan: { id: plan.id, weekStartDate: plan.weekStartDate, sessions: JSON.parse(plan.sessions) } });
}
