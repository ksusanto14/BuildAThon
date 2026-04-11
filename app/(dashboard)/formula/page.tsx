"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  History,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCompletion } from "@ai-sdk/react";

interface Condition {
  factor: string;
  optimalRange: string;
  impact: number;
  direction: "+" | "-";
}

interface Formula {
  formulaText: string;
  conditions: string;
  confidenceScore: number;
  sessionsAnalyzed: number;
  version: number;
  createdAt: string;
}

export default function FormulaPage() {
  const [formula, setFormula] = useState<Formula | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Formula Test Predictor state
  const [sleepHours, setSleepHours] = useState(7);
  const [recoveryScore, setRecoveryScore] = useState(65);
  const [mealType, setMealType] = useState("Light");
  const [mood, setMood] = useState(6);
  const [stress, setStress] = useState(4);
  const [timeOfDay, setTimeOfDay] = useState("Morning");
  const [predictedScore, setPredictedScore] = useState<number | null>(null);

  // Streaming completion hook for generate
  const { complete } = useCompletion({
    api: "/api/formula/generate",
    onFinish: () => {
      fetchFormula();
      setGenerating(false);
      toast.success("Formula generated successfully!");
    },
    onError: () => {
      setGenerating(false);
    },
  });

  const fetchFormula = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/formula");
      const data = await res.json();
      setFormula(data.formula || null);
    } catch {
      toast.error("Failed to load formula");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormula();
  }, [fetchFormula]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Try streaming first via useCompletion
      const result = await complete("");

      // If we got a non-streaming JSON response, handle it
      if (!result) {
        const res = await fetch("/api/formula/generate", { method: "POST" });
        if (res.ok) {
          await fetchFormula();
          toast.success("Formula generated successfully!");
        } else {
          toast.error("Failed to generate formula");
        }
        setGenerating(false);
      }
    } catch {
      // Fallback: direct POST for non-streaming
      try {
        const res = await fetch("/api/formula/generate", { method: "POST" });
        if (res.ok) {
          await fetchFormula();
          toast.success("Formula generated successfully!");
        } else {
          toast.error("Failed to generate formula");
        }
      } catch {
        toast.error("Failed to generate formula");
      }
      setGenerating(false);
    }
  };

  const parsedConditions: Condition[] = formula
    ? (() => {
        try {
          return JSON.parse(formula.conditions);
        } catch {
          return [];
        }
      })()
    : [];

  const handlePredict = () => {
    let score = 5;

    // Sleep bonus
    score += (sleepHours - 6) * 0.5;

    // Recovery bonus
    score += (recoveryScore - 50) * 0.04;

    // Mood bonus
    score += (mood - 5) * 0.2;

    // Stress penalty
    score -= (stress - 5) * 0.15;

    // Bonuses from matching top conditions
    const topConditions = parsedConditions.slice(0, 5);
    topConditions.forEach((condition) => {
      const factor = condition.factor.toLowerCase();
      let bonus = 0;

      if (factor.includes("sleep") && sleepHours >= 7 && sleepHours <= 9) {
        bonus = condition.impact * 0.1;
      } else if (factor.includes("recovery") && recoveryScore >= 60) {
        bonus = condition.impact * 0.1;
      } else if (factor.includes("meal") || factor.includes("nutrition")) {
        if (mealType === "Light" || mealType === "Medium") {
          bonus = condition.impact * 0.08;
        }
      } else if (factor.includes("mood") && mood >= 7) {
        bonus = condition.impact * 0.08;
      } else if (factor.includes("stress") && stress <= 4) {
        bonus = condition.impact * 0.08;
      } else if (factor.includes("time") || factor.includes("morning")) {
        if (timeOfDay === "Morning") {
          bonus = condition.impact * 0.08;
        }
      }

      score += condition.direction === "+" ? bonus : -bonus;
    });

    // Clamp to 1-10
    score = Math.max(1, Math.min(10, score));
    setPredictedScore(Math.round(score * 10) / 10);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Performance Formula
          </h1>
          <p className="text-muted-foreground text-sm">
            AI-powered analysis of your peak performance conditions
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-card border border-border animate-pulse" />
          <div className="h-32 rounded-xl bg-card border border-border animate-pulse" />
          <div className="h-24 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-primary" />
          Performance Formula
        </h1>
        <p className="text-muted-foreground text-sm">
          AI-powered analysis of your peak performance conditions
        </p>
      </div>

      {/* Empty State */}
      {!formula && (
        <div className="p-12 rounded-xl border border-dashed border-border bg-card text-center">
          <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">No Formula Yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Import at least 30 days of health data and log 10+ context entries
            to generate your personalized Performance Formula with Claude AI.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate your first formula
              </>
            )}
          </button>
        </div>
      )}

      {/* Formula Card */}
      {formula && (
        <>
          <div className="p-6 rounded-xl border border-border bg-card space-y-6">
            {/* Title + Version */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Performance Formula
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                v{formula.version}
              </span>
            </div>

            {/* Formula Text */}
            <p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg p-4 border border-border">
              {formula.formulaText}
            </p>

            {/* Top 5 Conditions */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Top 5 Conditions
              </h3>
              <div className="grid gap-2">
                {parsedConditions.slice(0, 5).map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {condition.factor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Optimal: {condition.optimalRange}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Impact: {condition.impact}
                      </span>
                      {condition.direction === "+" ? (
                        <ArrowUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Meter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Confidence
                </h3>
                <span className="text-xs text-muted-foreground">
                  Based on {formula.sessionsAnalyzed} sessions
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${formula.confidenceScore}%`,
                    background: `linear-gradient(90deg, ${
                      formula.confidenceScore < 40
                        ? "#ef4444"
                        : formula.confidenceScore < 70
                        ? "#f59e0b"
                        : "#22c55e"
                    }, ${
                      formula.confidenceScore < 40
                        ? "#f59e0b"
                        : formula.confidenceScore < 70
                        ? "#22c55e"
                        : "#16a34a"
                    })`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {formula.confidenceScore}%
              </p>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </>
              )}
            </button>
          </div>

          {/* Formula Test Predictor */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Formula Test Predictor
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your current conditions to predict performance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sleep Hours */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Sleep Hours
                </label>
                <input
                  type="number"
                  min={3}
                  max={12}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Recovery Score */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Recovery Score (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={recoveryScore}
                  onChange={(e) => setRecoveryScore(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Meal Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Meal Type
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option>Fasted</option>
                  <option>Light</option>
                  <option>Medium</option>
                  <option>Heavy</option>
                </select>
              </div>

              {/* Mood */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Mood: {mood}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Stress */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Stress: {stress}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stress}
                  onChange={(e) => setStress(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Time of Day
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option>Morning</option>
                  <option>Midday</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </select>
              </div>
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredict}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Predict
            </button>

            {/* Prediction Result */}
            {predictedScore !== null && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {predictedScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">/ 10</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Predicted Performance
                  </p>
                  <p>
                    Confidence interval: {Math.max(1, predictedScore - 1.5).toFixed(1)} -{" "}
                    {Math.min(10, predictedScore + 1.5).toFixed(1)}
                  </p>
                  <p className="text-xs mt-1">+/- 1.5 range</p>
                </div>
              </div>
            )}
          </div>

          {/* Formula History */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Formula History
            </h2>

            <div className="relative pl-6 border-l-2 border-border space-y-4">
              <div className="relative">
                <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary border-2 border-background" />
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    v{formula.version}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(formula.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Confidence: {formula.confidenceScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
