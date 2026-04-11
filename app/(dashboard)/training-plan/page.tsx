"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dumbbell,
  Calendar,
  Check,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Session {
  day: string;
  date: string;
  type: string;
  duration: number;
  intensity: "easy" | "moderate" | "hard" | "rest";
  description: string;
  completed: boolean;
}

interface CurrentWeek {
  weekStart: string;
  weekNumber: number;
  phase: string;
  sessions: Session[];
}

interface MesocycleWeek {
  week: number;
  phase: string;
  totalLoad: string;
  focus: string;
}

interface RecoveryStatus {
  score: number;
  recommendation: string;
  avgStrain: number;
}

interface TrainingPlanData {
  currentWeek: CurrentWeek;
  mesocycle: MesocycleWeek[];
  recoveryStatus: RecoveryStatus;
  sportType: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function phaseColor(phase: string) {
  switch (phase) {
    case "Base":
      return { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" };
    case "Build":
      return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" };
    case "Peak":
      return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" };
    case "Deload":
      return { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" };
    default:
      return { bg: "bg-zinc-500/15", text: "text-zinc-400", border: "border-zinc-500/30" };
  }
}

function intensityColor(intensity: string) {
  switch (intensity) {
    case "easy":
      return { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" };
    case "moderate":
      return { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" };
    case "hard":
      return { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" };
    case "rest":
      return { bg: "bg-zinc-500/10", text: "text-zinc-500", dot: "bg-zinc-500" };
    default:
      return { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" };
  }
}

function recoveryBarColor(score: number) {
  if (score >= 67) return "bg-green-500";
  if (score >= 34) return "bg-amber-500";
  return "bg-red-500";
}

function recoveryTextColor(score: number) {
  if (score >= 67) return "text-green-400";
  if (score >= 34) return "text-amber-400";
  return "text-red-400";
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getPhaseTips(phase: string): string[] {
  switch (phase) {
    case "Base":
      return [
        "Focus on building aerobic foundation with easy, consistent volume",
        "Keep 80% of sessions at conversational pace",
        "Prioritize sleep and nutrition to support adaptation",
        "Introduce strength work gradually to prevent injury",
      ];
    case "Build":
      return [
        "Build phase: Focus on tempo work at lactate threshold",
        "Increase training load by 10-15% from base week",
        "Monitor recovery closely - back off if HRV drops significantly",
        "Quality over quantity in your harder sessions",
      ];
    case "Peak":
      return [
        "Peak week: Race-specific intensity with adequate recovery between efforts",
        "Reduce total volume but maintain high-end intensity",
        "Practice your race-day routine and nutrition strategy",
        "Sleep is your superpower - aim for 8+ hours this week",
      ];
    case "Deload":
      return [
        "Deload week: Let your body absorb the training from previous weeks",
        "Reduce volume by 40-50% but keep some light movement",
        "Use this time for mobility work and addressing tight areas",
        "Trust the process - adaptation happens during recovery",
      ];
    default:
      return [
        "Listen to your body and adjust intensity accordingly",
        "Stay consistent with your training schedule",
        "Prioritize post-workout nutrition and hydration",
      ];
  }
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                    */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-zinc-800" />
        <div className="h-8 w-48 rounded bg-zinc-800" />
        <div className="h-6 w-20 rounded-full bg-zinc-800 ml-2" />
        <div className="h-6 w-16 rounded-full bg-zinc-800" />
      </div>

      {/* Recovery bar skeleton */}
      <div className="h-20 rounded-xl bg-zinc-800/50 border border-zinc-800" />

      {/* Weekly grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-zinc-800/50 border border-zinc-800" />
        ))}
      </div>

      {/* Mesocycle skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-zinc-800/50 border border-zinc-800" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function TrainingPlanPage() {
  const [data, setData] = useState<TrainingPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/training-plan");
      if (!res.ok) throw new Error("Failed to fetch training plan");
      const json = await res.json();
      setData(json);

      // Initialize completed state from fetched data
      const completed: Record<string, boolean> = {};
      json.currentWeek.sessions.forEach((s: Session) => {
        completed[s.date] = s.completed;
      });
      setCompletedSessions(completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleSession = useCallback(
    async (date: string) => {
      if (!data) return;

      const newCompleted = { ...completedSessions, [date]: !completedSessions[date] };
      setCompletedSessions(newCompleted);

      // Update sessions with new completed state
      const updatedSessions = data.currentWeek.sessions.map((s) => ({
        ...s,
        completed: newCompleted[s.date] ?? s.completed,
      }));

      // Save to backend
      try {
        await fetch("/api/training-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekStart: data.currentWeek.weekStart,
            sessions: updatedSessions,
          }),
        });
      } catch {
        // Revert on error
        setCompletedSessions(completedSessions);
      }
    },
    [data, completedSessions]
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <p>{error || "Failed to load training plan"}</p>
        </div>
      </div>
    );
  }

  const { currentWeek, mesocycle, recoveryStatus, sportType } = data;
  const phase = currentWeek.phase;
  const pColor = phaseColor(phase);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-indigo-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Training Plan</h1>
        </div>
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          {sportType}
        </span>
        <span
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full border",
            pColor.bg,
            pColor.text,
            pColor.border
          )}
        >
          Week {currentWeek.weekNumber} - {phase}
        </span>
      </div>

      {/* ─── Recovery Status Bar ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-4 w-4", recoveryTextColor(recoveryStatus.score))} />
            <span className="text-sm font-medium text-zinc-300">Recovery Status</span>
          </div>
          <span className={cn("text-sm font-semibold", recoveryTextColor(recoveryStatus.score))}>
            {recoveryStatus.score}/100
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", recoveryBarColor(recoveryStatus.score))}
            style={{ width: `${recoveryStatus.score}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-400">{recoveryStatus.recommendation}</p>
      </div>

      {/* ─── Weekly Schedule ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-200">This Week</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {currentWeek.sessions.map((session) => {
            const iColor = intensityColor(session.intensity);
            const today = isToday(session.date);
            const completed = completedSessions[session.date] ?? session.completed;
            const lowRecoveryWarning =
              recoveryStatus.score < 50 && session.intensity === "hard";

            return (
              <div
                key={session.date}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  today
                    ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20"
                    : "border-zinc-800 bg-zinc-900/60",
                  completed && "opacity-70"
                )}
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={cn("text-sm font-semibold", today ? "text-indigo-400" : "text-zinc-200")}>
                      {session.day}
                    </p>
                    <p className="text-xs text-zinc-500">{formatShortDate(session.date)}</p>
                  </div>
                  {today && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Session type */}
                <p className={cn("text-base font-medium mb-1", completed ? "line-through text-zinc-500" : "text-zinc-100")}>
                  {session.type}
                </p>

                {/* Duration + Intensity */}
                <div className="flex items-center gap-2 mb-2">
                  {session.duration > 0 && (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {session.duration} min
                    </span>
                  )}
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] uppercase font-semibold rounded-full",
                      iColor.bg,
                      iColor.text
                    )}
                  >
                    {session.intensity}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{session.description}</p>

                {/* Low recovery warning */}
                {lowRecoveryWarning && (
                  <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="text-[11px] text-amber-400">Consider reducing intensity</span>
                  </div>
                )}

                {/* Completed toggle */}
                {session.intensity !== "rest" && (
                  <button
                    onClick={() => toggleSession(session.date)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      completed
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300"
                    )}
                  >
                    <Check className={cn("h-3.5 w-3.5", completed ? "text-green-400" : "text-zinc-600")} />
                    {completed ? "Completed" : "Mark Complete"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4-Week Mesocycle Overview ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-200">4-Week Mesocycle</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {mesocycle.map((week) => {
            const wColor = phaseColor(week.phase);
            const isCurrent = week.week === currentWeek.weekNumber;

            return (
              <div
                key={week.week}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  isCurrent
                    ? cn("ring-1 ring-offset-0", wColor.border, wColor.bg, "ring-" + week.phase.toLowerCase() + "-500/20 border-" + week.phase.toLowerCase() + "-500/40")
                    : "border-zinc-800 bg-zinc-900/60"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-xs font-bold uppercase tracking-wider", isCurrent ? wColor.text : "text-zinc-500")}>
                    Week {week.week}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400">
                      Current
                    </span>
                  )}
                </div>
                <p className={cn("text-sm font-semibold mb-1", isCurrent ? wColor.text : "text-zinc-300")}>
                  {week.phase}
                </p>
                <p className="text-xs text-zinc-500 capitalize">Load: {week.totalLoad}</p>
                <p className="text-xs text-zinc-500 mt-1">{week.focus}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Training Tips ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-200">Training Tips</h2>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <ul className="space-y-3">
            {getPhaseTips(phase).map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-sm text-zinc-400">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
