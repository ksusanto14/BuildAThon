"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceArea,
} from "recharts";
import { Flame, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Summary {
  borgRpe: number;
  borgLabel: string;
  activityMins: number;
  zone45Mins: number;
  steps: number;
  avgSteps: number;
  acwr: number;
  overtrainingAlert: boolean;
}

interface DailyEntry {
  date: string;
  borgRpe: number | null;
  zone1: number | null;
  zone2: number | null;
  zone3: number | null;
  zone4: number | null;
  zone5: number | null;
  activityMins: number | null;
  steps: number | null;
  recoveryScore: number | null;
}

interface StrainData {
  summary: Summary;
  daily: DailyEntry[];
}

export default function StrainPage() {
  const [data, setData] = useState<StrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/strain?days=${days}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [days]);

  const stepsWithAvg = useMemo(() => {
    if (!data) return [];
    return data.daily.map((entry, idx, arr) => {
      const window = arr.slice(Math.max(0, idx - 6), idx + 1);
      const avg =
        window.reduce((sum, d) => sum + (d.steps ?? 0), 0) / window.length;
      return {
        date: formatDate(entry.date),
        steps: entry.steps ?? 0,
        avg: Math.round(avg),
      };
    });
  }, [data]);

  const scatterData = useMemo(() => {
    if (!data) return [];
    return data.daily
      .filter((d) => d.recoveryScore != null && d.borgRpe != null)
      .map((d) => ({
        recovery: d.recoveryScore!,
        strain: d.borgRpe!,
      }));
  }, [data]);

  const zoneData = useMemo(() => {
    if (!data) return [];
    return data.daily.map((d) => ({
      date: formatDate(d.date),
      zone1: d.zone1 ?? 0,
      zone2: d.zone2 ?? 0,
      zone3: d.zone3 ?? 0,
      zone4: d.zone4 ?? 0,
      zone5: d.zone5 ?? 0,
    }));
  }, [data]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Failed to load strain data.
      </div>
    );
  }

  const { summary } = data;
  const stepsDiff = summary.steps - summary.avgSteps;
  const stepsDiffStr =
    stepsDiff >= 0
      ? `+${(stepsDiff / 1000).toFixed(1)}k vs avg`
      : `${(stepsDiff / 1000).toFixed(1)}k vs avg`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-strain" />
            Strain
          </h1>
          <p className="text-muted-foreground text-sm">
            Measure training load, HR zones, and activity volume
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/50">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                days === d
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Overtraining Alert */}
      {summary.overtrainingAlert && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-500">
              Overtraining Risk Detected
            </p>
            <p className="text-xs text-red-400">
              Your strain has exceeded recovery for 3+ consecutive days.
              Consider reducing intensity or adding a rest day.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Borg RPE"
          value={summary.borgRpe.toFixed(1)}
          sub={summary.borgLabel}
        />
        <MetricCard
          label="Activity Mins"
          value={String(summary.activityMins)}
          sub={`Zone 4-5: ${summary.zone45Mins} min`}
        />
        <MetricCard
          label="Steps"
          value={summary.steps.toLocaleString()}
          sub={stepsDiffStr}
        />
        <MetricCard
          label="Training Load"
          value={acwrLabel(summary.acwr)}
          sub={`ACWR: ${summary.acwr}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HR Zone Stacked Bar */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">HR Zone Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData} stackOffset="none">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="zone1"
                  stackId="zones"
                  fill="#22c55e"
                  name="Zone 1"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="zone2"
                  stackId="zones"
                  fill="#84cc16"
                  name="Zone 2"
                />
                <Bar
                  dataKey="zone3"
                  stackId="zones"
                  fill="#eab308"
                  name="Zone 3"
                />
                <Bar
                  dataKey="zone4"
                  stackId="zones"
                  fill="#f97316"
                  name="Zone 4"
                />
                <Bar
                  dataKey="zone5"
                  stackId="zones"
                  fill="#ef4444"
                  name="Zone 5"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Borg RPE Scale */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Borg RPE Scale</h3>
          <div className="h-56 flex flex-col items-center justify-center">
            <BorgRpeGauge value={summary.borgRpe} label={summary.borgLabel} />
          </div>
        </div>

        {/* Steps Trend */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Steps Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stepsWithAvg}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="steps"
                  fill="#f97316"
                  opacity={0.7}
                  name="Steps"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="7-day Avg"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strain vs Recovery Scatter */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Strain vs Recovery</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="recovery"
                  domain={[0, 100]}
                  name="Recovery"
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Recovery",
                    position: "insideBottom",
                    offset: -5,
                    fontSize: 10,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="strain"
                  domain={[6, 20]}
                  name="Borg RPE"
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Borg RPE",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                  }}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <ReferenceArea
                  x1={60}
                  x2={100}
                  y1={10}
                  y2={16}
                  fill="#22c55e"
                  fillOpacity={0.1}
                  stroke="#22c55e"
                  strokeOpacity={0.3}
                  strokeDasharray="3 3"
                  label={{
                    value: "Optimal Zone",
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "#22c55e",
                  }}
                />
                <Scatter data={scatterData} fill="#f97316">
                  {scatterData.map((entry, index) => {
                    const inOptimal =
                      entry.recovery >= 60 &&
                      entry.recovery <= 100 &&
                      entry.strain >= 10 &&
                      entry.strain <= 16;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={inOptimal ? "#22c55e" : "#f97316"}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function BorgRpeGauge({ value, label }: { value: number; label: string }) {
  const min = 6;
  const max = 20;
  const pct = ((value - min) / (max - min)) * 100;
  const barWidth = 280;
  const markerX = (pct / 100) * barWidth;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="text-center">
        <span className="text-4xl font-bold text-strain">{value}</span>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
      <svg width={barWidth + 20} height={60} className="overflow-visible">
        <defs>
          <linearGradient id="borg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Background bar */}
        <rect
          x={10}
          y={15}
          width={barWidth}
          height={16}
          rx={8}
          fill="url(#borg-gradient)"
          opacity={0.85}
        />
        {/* Marker triangle */}
        <polygon
          points={`${markerX + 10},12 ${markerX + 5},2 ${markerX + 15},2`}
          fill="currentColor"
          className="text-foreground"
        />
        {/* Marker line */}
        <line
          x1={markerX + 10}
          y1={14}
          x2={markerX + 10}
          y2={32}
          stroke="currentColor"
          strokeWidth={2}
          className="text-foreground"
        />
        {/* Scale labels */}
        <text x={10} y={48} fontSize={10} fill="currentColor" className="text-muted-foreground">
          6
        </text>
        <text x={barWidth / 2 + 5} y={48} fontSize={10} fill="currentColor" textAnchor="middle" className="text-muted-foreground">
          13
        </text>
        <text x={barWidth + 5} y={48} fontSize={10} fill="currentColor" textAnchor="end" className="text-muted-foreground">
          20
        </text>
      </svg>
      <div className="flex justify-between w-full text-[10px] text-muted-foreground px-3">
        <span>Very Light</span>
        <span>Moderate</span>
        <span>Hard</span>
        <span>Max</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="w-6 h-6 text-strain" />
          Strain
        </h1>
        <p className="text-muted-foreground text-sm">
          Measure training load, HR zones, and activity volume
        </p>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading strain data...</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-border bg-card animate-pulse"
          >
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-7 w-12 bg-muted rounded mt-2" />
            <div className="h-3 w-20 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl border border-border bg-card animate-pulse"
          >
            <div className="h-4 w-32 bg-muted rounded mb-4" />
            <div className="h-48 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function acwrLabel(acwr: number): string {
  if (acwr < 0.8) return "Low";
  if (acwr <= 1.3) return "Medium";
  if (acwr <= 1.5) return "High";
  return "Very High";
}
