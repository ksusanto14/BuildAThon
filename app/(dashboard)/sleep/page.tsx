"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Moon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DailyEntry = {
  date: string;
  hours: number | null;
  efficiency: number | null;
  consistency: number | null;
  stress: number | null;
  deep: number | null;
  rem: number | null;
  light: number | null;
  awake: number | null;
};

type SleepData = {
  summary: {
    avgSleep: number;
    avgEfficiency: number;
    avgConsistency: number;
    avgStress: number;
  };
  stages: { deep: number; rem: number; light: number; awake: number };
  insights: { factor: string; impact: string; positive: boolean }[];
  daily: DailyEntry[];
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STAGE_COLORS: Record<string, string> = {
  Deep: "#6366f1",   // indigo-500
  REM: "#8b5cf6",    // violet-500
  Light: "#0ea5e9",  // sky-500
  Awake: "#f59e0b",  // amber-500
};

const RANGE_OPTIONS = [7, 30, 90] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(raw: string) {
  const d = new Date(raw);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function rollingAverage(data: { efficiency: number | null }[], window: number) {
  return data.map((_, i, arr) => {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1).filter((d) => d.efficiency != null);
    if (slice.length === 0) return null;
    return (
      slice.reduce((s, d) => s + (d.efficiency ?? 0), 0) / slice.length
    );
  });
}

function barColor(hours: number | null) {
  if (hours == null) return "#6b7280";
  if (hours >= 7.5) return "#22c55e";
  if (hours >= 6.5) return "#f59e0b";
  return "#ef4444";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card animate-pulse">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-7 w-16 bg-muted rounded mt-2" />
        <div className="h-3 w-24 bg-muted rounded mt-2" />
      </div>
    );
  }
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function SleepStageDonut({
  stages,
}: {
  stages: { deep: number; rem: number; light: number; awake: number };
}) {
  const data = [
    { name: "Deep", value: stages.deep },
    { name: "REM", value: stages.rem },
    { name: "Light", value: stages.light },
    { name: "Awake", value: stages.awake },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STAGE_COLORS[entry.name]}
              />
            ))}
          </Pie>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip
            formatter={((value: number, name: string) => [
              `${value.toFixed(1)}h`,
              name,
            ]) as any}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: STAGE_COLORS[d.name] }}
            />
            {d.name} {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : "0%"}
          </span>
        ))}
      </div>
    </div>
  );
}

function SleepVsNeedChart({ daily }: { daily: DailyEntry[] }) {
  const chartData = daily.map((d) => ({
    date: formatDate(d.date),
    hours: d.hours ?? 0,
    fill: barColor(d.hours),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 12]}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip
          formatter={((value: number) => [`${value.toFixed(1)}h`, "Sleep"]) as any}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
          }}
        />
        <ReferenceLine
          y={8}
          stroke="#6366f1"
          strokeDasharray="4 4"
          label={{ value: "8h target", position: "right", fontSize: 10, fill: "#6366f1" }}
        />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ScoreTrendChart({ daily }: { daily: DailyEntry[] }) {
  const rolling = rollingAverage(daily, 14);
  const chartData = daily.map((d, i) => ({
    date: formatDate(d.date),
    efficiency: d.efficiency,
    rolling: rolling[i] != null ? Math.round(rolling[i]! * 10) / 10 : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[50, 100]}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip
          formatter={((value: number, name: string) => [
            `${value.toFixed(1)}%`,
            name === "efficiency" ? "Daily" : "14-day Avg",
          ]) as any}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
          }}
        />
        <Line
          type="monotone"
          dataKey="efficiency"
          stroke="#8b5cf6"
          strokeWidth={1}
          dot={{ r: 2.5, fill: "#8b5cf6" }}
          activeDot={{ r: 4 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="rolling"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StressGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  // Semicircle: angles from 180 (left) to 0 (right), i.e. PI to 0
  const needleAngle = Math.PI - (clamped / 100) * Math.PI;
  const cx = 120;
  const cy = 110;
  const r = 80;

  // Arc helper
  function arcPath(startPct: number, endPct: number) {
    const startAngle = Math.PI - startPct * Math.PI;
    const endAngle = Math.PI - endPct * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy - r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy - r * Math.sin(endAngle);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }

  const needleX = cx + (r - 10) * Math.cos(needleAngle);
  const needleY = cy - (r - 10) * Math.sin(needleAngle);

  const zoneColor =
    clamped <= 30 ? "#22c55e" : clamped <= 70 ? "#f59e0b" : "#ef4444";
  const zoneLabel =
    clamped <= 30 ? "Low" : clamped <= 70 ? "Moderate" : "High";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 140" className="w-full max-w-[240px]">
        {/* Green zone 0-30 */}
        <path
          d={arcPath(0, 0.3)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* Amber zone 31-70 */}
        <path
          d={arcPath(0.3, 0.7)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* Red zone 71-100 */}
        <path
          d={arcPath(0.7, 1)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={zoneColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill={zoneColor} />
        {/* Value label */}
        <text
          x={cx}
          y={cy + 25}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="currentColor"
          fontSize="22"
          fontWeight="bold"
        >
          {clamped}
        </text>
      </svg>
      <span
        className="text-xs font-medium mt-1"
        style={{ color: zoneColor }}
      >
        {zoneLabel} Stress
      </span>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="p-6 rounded-xl border border-border bg-card animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-4" />
      <div className="h-48 bg-muted/50 rounded" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SleepPage() {
  const [data, setData] = useState<SleepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(30);

  const fetchData = useCallback((range: number) => {
    setLoading(true);
    fetch(`/api/sleep?days=${range}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  const summary = data?.summary ?? {
    avgSleep: 0,
    avgEfficiency: 0,
    avgConsistency: 0,
    avgStress: 0,
  };

  const stages = data?.stages ?? { deep: 0, rem: 0, light: 0, awake: 0 };
  const insights = data?.insights ?? [];
  const daily = data?.daily ?? [];

  const efficiencyLabel = useMemo(() => {
    if (summary.avgEfficiency >= 85) return "Good";
    if (summary.avgEfficiency >= 70) return "Fair";
    return "Poor";
  }, [summary.avgEfficiency]);

  const consistencyLabel = useMemo(() => {
    if (summary.avgConsistency >= 80) return "Good";
    if (summary.avgConsistency >= 60) return "Fair";
    return "Poor";
  }, [summary.avgConsistency]);

  const stressLabel = useMemo(() => {
    if (summary.avgStress <= 30) return "Low";
    if (summary.avgStress <= 70) return "Moderate";
    return "High";
  }, [summary.avgStress]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Moon className="w-6 h-6 text-sleep" />
            Sleep
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your sleep stages, efficiency, and consistency
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setDays(opt)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                days === opt
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt}D
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay indicator */}
      {loading && data && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Refreshing data...
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Avg Sleep Hours"
          value={`${summary.avgSleep.toFixed(1)}h`}
          sub="Target: 8h"
          loading={loading && !data}
        />
        <MetricCard
          label="Efficiency"
          value={`${summary.avgEfficiency}%`}
          sub={efficiencyLabel}
          loading={loading && !data}
        />
        <MetricCard
          label="Consistency"
          value={`${summary.avgConsistency}%`}
          sub={consistencyLabel}
          loading={loading && !data}
        />
        <MetricCard
          label="Sleep Stress"
          value={`${summary.avgStress}`}
          sub={stressLabel}
          loading={loading && !data}
        />
      </div>

      {/* Charts Grid */}
      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sleep Stage Donut */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm mb-4">Sleep Stages</h3>
            {stages.deep + stages.rem + stages.light + stages.awake === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No stage data available
              </div>
            ) : (
              <SleepStageDonut stages={stages} />
            )}
          </div>

          {/* Sleep vs Need Bar Chart */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm mb-4">Sleep vs. Need</h3>
            {daily.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No daily data available
              </div>
            ) : (
              <SleepVsNeedChart daily={daily} />
            )}
          </div>

          {/* Score Trend Line */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm mb-2">Efficiency Trend</h3>
            <div className="flex gap-3 mb-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#8b5cf6" }} />
                Daily
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#6366f1" }} />
                14-day Avg
              </span>
            </div>
            {daily.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No trend data available
              </div>
            ) : (
              <ScoreTrendChart daily={daily} />
            )}
          </div>

          {/* Sleep Stress Gauge */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm mb-4">Sleep Stress</h3>
            <StressGauge value={summary.avgStress} />
          </div>
        </div>
      )}

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg border",
                  insight.positive
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                )}
              >
                <span className="text-sm">{insight.factor}</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    insight.positive ? "text-green-500" : "text-red-500"
                  )}
                >
                  {insight.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
