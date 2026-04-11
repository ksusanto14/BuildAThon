"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Moon,
  Heart,
  Flame,
  Footprints,
  Activity,
  ArrowUp,
  ArrowDown,
  Check,
  Trophy,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Change {
  metric: string;
  from: number;
  to: number;
  change: number;
  direction: string;
  good: boolean;
}

interface Milestone {
  name: string;
  icon: string;
  achieved: boolean;
  description: string;
}

interface WeeklyEntry {
  week: string;
  sleep: number;
  recovery: number;
  strain: number;
}

interface PeriodData {
  period: string;
  avgSleep: number;
  avgSleepEfficiency: number;
  avgHrv: number;
  avgRestingHr: number;
  avgRecoveryScore: number;
  avgBorgRpe: number;
  avgSteps: number;
}

interface ImprovementData {
  improvementScore: number;
  baseline: PeriodData;
  recent: PeriodData;
  changes: Change[];
  milestones: Milestone[];
  weeklyTrend: WeeklyEntry[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RANGE_OPTIONS = [30, 60, 90] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const MILESTONE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  moon: Moon,
  heart: Heart,
  flame: Flame,
  footprints: Footprints,
  activity: Activity,
};

/* ------------------------------------------------------------------ */
/*  Score Ring Component                                                */
/* ------------------------------------------------------------------ */

function ScoreRing({ score }: { score: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score > 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold transition-all duration-1000"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-1">out of 100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loader                                                     */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded mt-2" />
      </div>
      <div className="flex justify-center">
        <div className="h-[200px] w-[200px] rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-card">
            <div className="h-5 w-32 bg-muted rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 w-full bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="h-56 bg-muted rounded" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                      */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.stroke }}>
          {p.name}: {p.value != null ? p.value.toFixed(1) : "N/A"}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                 */
/* ------------------------------------------------------------------ */

export default function ImprovementPage() {
  const [data, setData] = useState<ImprovementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<RangeOption>(90);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/improvement");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json: ImprovementData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message ?? "Failed to load improvement data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Analyzing your improvement...</span>
        </div>
        <Skeleton />
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Your Improvement
          </h1>
        </div>
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
          <p className="text-sm text-red-400">{error ?? "No data available"}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-xs underline text-red-400 hover:text-red-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { improvementScore, baseline, recent, changes, milestones, weeklyTrend } = data;

  const scoreColor =
    improvementScore > 70
      ? "text-green-500"
      : improvementScore >= 40
        ? "text-amber-500"
        : "text-red-500";

  const motivationalMessage =
    improvementScore > 70
      ? "Outstanding progress! You're on fire."
      : improvementScore >= 40
        ? "Good progress! Keep pushing toward your goals."
        : "Every journey starts somewhere. Stay consistent!";

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Your Improvement
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track how your health metrics have improved over time
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setDays(opt)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                days === opt
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      {/* ---- Improvement Score Card ---- */}
      <div className="p-6 rounded-xl border border-border bg-card text-center">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          Composite Improvement Score
        </h2>
        <ScoreRing score={improvementScore} />
        <p className={cn("text-sm font-medium mt-4", scoreColor)}>
          {motivationalMessage}
        </p>
      </div>

      {/* ---- Before vs After Cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Period */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Baseline Period</h3>
            <span className="text-xs text-muted-foreground">{baseline.period}</span>
          </div>
          <div className="space-y-3">
            <MetricRow label="Sleep" value={`${baseline.avgSleep}h`} />
            <MetricRow label="Sleep Efficiency" value={`${baseline.avgSleepEfficiency}%`} />
            <MetricRow label="HRV" value={`${baseline.avgHrv}ms`} />
            <MetricRow label="Resting HR" value={`${baseline.avgRestingHr}bpm`} />
            <MetricRow label="Recovery" value={`${baseline.avgRecoveryScore}`} />
            <MetricRow label="Borg RPE" value={`${baseline.avgBorgRpe}`} />
            <MetricRow label="Steps" value={`${Math.round(baseline.avgSteps)}`} />
          </div>
        </div>

        {/* Recent Period */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Period</h3>
            <span className="text-xs text-muted-foreground">{recent.period}</span>
          </div>
          <div className="space-y-3">
            {changes.map((c) => (
              <div key={c.metric} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.to}{metricUnit(c.metric)}</span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      c.good ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {c.direction === "up" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {Math.abs(c.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Changes Grid ---- */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Metric Changes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {changes.map((c) => (
            <div
              key={c.metric}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <p className="text-xs text-muted-foreground mb-1">{c.metric}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{c.to}</span>
                <span className="text-xs text-muted-foreground">{metricUnit(c.metric)}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  from {c.from}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 mt-2 text-xs font-medium",
                  c.good ? "text-green-500" : "text-red-500"
                )}
              >
                {c.direction === "up" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {Math.abs(c.change).toFixed(1)}%
                <span className="text-muted-foreground ml-1">
                  {c.good ? "improved" : "declined"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Milestones Section ---- */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          Milestones
        </h2>
        <div className="flex flex-wrap gap-3">
          {milestones.map((m) => {
            const IconComponent = MILESTONE_ICONS[m.icon] || Activity;
            return (
              <div
                key={m.name}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  m.achieved
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-card opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    m.achieved ? "bg-green-500/15" : "bg-muted"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "w-5 h-5",
                      m.achieved ? "text-green-500" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    {m.achieved && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Weekly Trend Chart ---- */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h3 className="font-semibold text-sm mb-4">Weekly Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyTrend}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                dataKey="sleep"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6366f1" }}
                name="Sleep (hrs)"
                connectNulls
              />
              <Line
                dataKey="recovery"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22c55e" }}
                name="Recovery"
                connectNulls
              />
              <Line
                dataKey="strain"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f97316" }}
                name="Strain (RPE)"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground">Sleep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Recovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Strain</span>
          </div>
        </div>
      </div>

      {/* ---- Motivational Footer ---- */}
      <div
        className={cn(
          "p-5 rounded-xl border text-center",
          improvementScore > 70
            ? "border-green-500/30 bg-green-500/5"
            : improvementScore >= 40
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-red-500/30 bg-red-500/5"
        )}
      >
        <Trophy
          className={cn(
            "w-8 h-8 mx-auto mb-2",
            improvementScore > 70
              ? "text-green-500"
              : improvementScore >= 40
                ? "text-amber-500"
                : "text-red-500"
          )}
        />
        <p className={cn("text-sm font-semibold", scoreColor)}>
          {motivationalMessage}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Based on {changes.length} health metrics tracked across your sessions
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper Components                                                   */
/* ------------------------------------------------------------------ */

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function metricUnit(metric: string): string {
  switch (metric) {
    case "Sleep Hours":
      return "h";
    case "Sleep Efficiency":
      return "%";
    case "HRV":
      return "ms";
    case "Resting HR":
      return "bpm";
    case "Steps":
      return "";
    default:
      return "";
  }
}
