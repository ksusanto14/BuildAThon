"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ComposedChart,
  Area,
  Line,
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Summary {
  recoveryScore: number;
  zone: string;
  recommendation: string;
  avgHrv: number;
  stdHrv: number;
  avgRhr: number;
  avgResp: number;
}

interface HrvAlert {
  drop: number;
  current: number;
  baseline: number;
}

interface WeeklyEntry {
  day: string;
  avgHrv: number;
}

interface DailyEntry {
  date: string;
  hrv: number | null;
  restingHr: number | null;
  respiratoryRate: number | null;
  recoveryScore: number | null;
  sleepScore: number | null;
  hrvBaseline: number;
  hrvUpper: number;
  hrvLower: number;
}

interface RecoveryData {
  summary: Summary;
  hrvAlert: HrvAlert | null;
  weeklyPattern: WeeklyEntry[];
  daily: DailyEntry[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const RANGE_OPTIONS = [7, 30, 90] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

function zoneColor(zone: string) {
  if (zone === "Push") return { bg: "bg-green-500/15", text: "text-green-500", border: "border-green-500/30" };
  if (zone === "Rest") return { bg: "bg-red-500/15", text: "text-red-500", border: "border-red-500/30" };
  return { bg: "bg-amber-500/15", text: "text-amber-500", border: "border-amber-500/30" };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Compute a simple rolling average for RHR */
function withRollingAvg(daily: DailyEntry[], window = 7) {
  return daily.map((entry, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = daily.slice(start, i + 1).filter((e) => e.restingHr != null);
    const avg = slice.length > 0 ? slice.reduce((s, e) => s + (e.restingHr ?? 0), 0) / slice.length : null;
    return {
      ...entry,
      dateLabel: formatDate(entry.date),
      rhrAvg: avg != null ? Math.round(avg * 10) / 10 : null,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Recovery Score Gauge (SVG semicircle)                              */
/* ------------------------------------------------------------------ */

function RecoveryGauge({ score }: { score: number }) {
  const cx = 120;
  const cy = 110;
  const r = 90;
  const startAngle = Math.PI;
  const endAngle = 0;

  // Three arc zones
  const zones: { from: number; to: number; color: string }[] = [
    { from: 0, to: 33, color: "#ef4444" },
    { from: 33, to: 66, color: "#f59e0b" },
    { from: 66, to: 100, color: "#22c55e" },
  ];

  function polarToCart(angle: number) {
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  }

  function arcPath(fromPct: number, toPct: number) {
    const a1 = startAngle - (fromPct / 100) * Math.PI;
    const a2 = startAngle - (toPct / 100) * Math.PI;
    const p1 = polarToCart(a1);
    const p2 = polarToCart(a2);
    const largeArc = toPct - fromPct > 50 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  }

  // Needle position
  const clamped = Math.max(0, Math.min(100, score));
  const needleAngle = startAngle - (clamped / 100) * Math.PI;
  const needleTip = polarToCart(needleAngle);
  const needleLen = r - 18;
  const needleTipInner = {
    x: cx + needleLen * Math.cos(needleAngle),
    y: cy - needleLen * Math.sin(needleAngle),
  };

  return (
    <svg viewBox="0 0 240 140" className="w-full max-w-[280px] mx-auto">
      {/* Background track */}
      <path d={arcPath(0, 100)} fill="none" stroke="currentColor" strokeWidth={16} className="text-muted/20" strokeLinecap="round" />
      {/* Colored zones */}
      {zones.map((z) => (
        <path key={z.from} d={arcPath(z.from, z.to)} fill="none" stroke={z.color} strokeWidth={16} strokeLinecap="butt" opacity={0.7} />
      ))}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleTipInner.x} y2={needleTipInner.y} stroke="currentColor" strokeWidth={3} className="text-foreground" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="currentColor" className="text-foreground" />
      {/* Score text */}
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-3xl font-bold" fontSize={36} fontWeight={700}>
        {score}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded mt-2" />
      </div>
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-7 w-16 bg-muted rounded mt-2" />
            <div className="h-3 w-24 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>
      {/* Chart skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-card">
            <div className="h-4 w-40 bg-muted rounded mb-4" />
            <div className="h-48 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Recharts tooltip                                            */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.stroke }}>
          {p.name}: {p.value != null ? (typeof p.value === "number" ? p.value.toFixed(1) : p.value) : "N/A"}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function RecoveryPage() {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<RangeOption>(30);

  const fetchData = useCallback(async (d: RangeOption) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recovery?days=${d}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RecoveryData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message ?? "Failed to load recovery data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading recovery data...</span>
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
            <Heart className="w-6 h-6 text-recovery" />
            Recovery
          </h1>
        </div>
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error ?? "No data available"}</p>
          <button onClick={() => fetchData(days)} className="mt-3 text-xs underline text-red-400 hover:text-red-300">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, hrvAlert, weeklyPattern, daily } = data;
  const zc = zoneColor(summary.zone);

  /* Prepare chart data */
  const hrvChartData = daily.map((d) => ({
    dateLabel: formatDate(d.date),
    hrv: d.hrv,
    hrvBaseline: d.hrvBaseline,
    hrvUpper: d.hrvUpper,
    hrvLower: d.hrvLower,
    bandRange: [d.hrvLower, d.hrvUpper],
    isAnomaly: d.hrv != null && (d.hrv > d.hrvUpper || d.hrv < d.hrvLower),
  }));

  const rhrChartData = withRollingAvg(daily);

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-recovery" />
            Recovery
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor HRV, resting heart rate, and recovery readiness
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

      {/* ---- HRV Alert Banner ---- */}
      {hrvAlert && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-500">
              HRV Alert: {hrvAlert.drop}% below baseline
            </p>
            <p className="text-xs text-red-400 mt-0.5">
              Current {hrvAlert.current}ms vs baseline {hrvAlert.baseline}ms — Consider rest or reduced intensity.
            </p>
          </div>
        </div>
      )}

      {/* ---- Top Metric Cards ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Recovery Score */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground">Recovery Score</p>
          <p className="text-2xl font-bold mt-1">{summary.recoveryScore}</p>
          <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", zc.bg, zc.text, zc.border, "border")}>
            {summary.zone}
          </span>
        </div>
        {/* HRV */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground">HRV</p>
          <p className="text-2xl font-bold mt-1">{summary.avgHrv}<span className="text-sm font-normal text-muted-foreground">ms</span></p>
          <p className="text-xs text-muted-foreground mt-1">&sigma; {summary.stdHrv}ms</p>
        </div>
        {/* Resting HR */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground">Resting HR</p>
          <p className="text-2xl font-bold mt-1">{summary.avgRhr}<span className="text-sm font-normal text-muted-foreground">bpm</span></p>
          <p className="text-xs text-muted-foreground mt-1">{days}-day avg</p>
        </div>
        {/* Resp Rate */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground">Resp. Rate</p>
          <p className="text-2xl font-bold mt-1">{summary.avgResp}<span className="text-sm font-normal text-muted-foreground">br/m</span></p>
          <p className="text-xs text-muted-foreground mt-1">{days}-day avg</p>
        </div>
      </div>

      {/* ---- Recovery Recommendation Card ---- */}
      <div className={cn("p-5 rounded-xl border", zc.bg, zc.border)}>
        <div className="flex items-center gap-2 mb-1">
          <Heart className={cn("w-5 h-5", zc.text)} />
          <h3 className={cn("font-semibold text-sm", zc.text)}>Recovery Recommendation</h3>
        </div>
        <p className="text-sm text-foreground">{summary.recommendation}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Based on your latest recovery score of {summary.recoveryScore} and HRV trends.
        </p>
      </div>

      {/* ---- Charts Grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* HRV Trend with Baseline Band */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">HRV Trend with Baseline</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hrvChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip content={<ChartTooltip />} />
                {/* Baseline band (area between lower and upper) */}
                <Area
                  dataKey="bandRange"
                  stroke="none"
                  fill="#22c55e"
                  fillOpacity={0.1}
                  name="Baseline Band"
                  isAnimationActive={false}
                />
                {/* HRV line */}
                <Line
                  dataKey="hrv"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx: dotCx, cy: dotCy, payload } = props;
                    if (dotCx == null || dotCy == null) return <circle key={props.key} r={0} />;
                    if (payload.isAnomaly) {
                      return (
                        <circle
                          key={props.key}
                          cx={dotCx}
                          cy={dotCy}
                          r={4}
                          fill="#ef4444"
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                      );
                    }
                    return (
                      <circle
                        key={props.key}
                        cx={dotCx}
                        cy={dotCy}
                        r={3}
                        fill="#22c55e"
                        stroke="#22c55e"
                        strokeWidth={1}
                      />
                    );
                  }}
                  name="HRV"
                  connectNulls
                />
                {/* Baseline reference line */}
                <Line
                  dataKey="hrvBaseline"
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Baseline"
                  opacity={0.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recovery Score Gauge */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Recovery Score Gauge</h3>
          <div className="h-56 flex flex-col items-center justify-center">
            <RecoveryGauge score={summary.recoveryScore} />
            <div className="mt-2 text-center">
              <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-semibold", zc.bg, zc.text, zc.border, "border")}>
                {summary.zone}
              </span>
            </div>
          </div>
        </div>

        {/* Resting HR Trend */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Resting HR Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rhrChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  domain={["dataMin - 3", "dataMax + 3"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  dataKey="restingHr"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#ef4444" }}
                  name="Resting HR"
                  connectNulls
                />
                <Line
                  dataKey="rhrAvg"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="7-day Avg"
                  opacity={0.5}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly HRV Pattern */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Weekly HRV Pattern</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPattern} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  domain={[0, "dataMax + 10"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="avgHrv"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Avg HRV"
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
