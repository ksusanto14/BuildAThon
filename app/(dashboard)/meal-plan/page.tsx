"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Check,
  RefreshCw,
  Loader2,
  Apple,
  Coffee,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FoodItem {
  item: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  time: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealPlanData {
  date: string;
  trainingDay: boolean;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: Meal[];
  notes: string;
  hydration: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function displayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMealIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("breakfast")) return Coffee;
  if (lower.includes("lunch")) return Sun;
  if (lower.includes("snack") || lower.includes("fuel")) return Apple;
  return Moon;
}

/* ------------------------------------------------------------------ */
/*  Circular Progress Ring                                             */
/* ------------------------------------------------------------------ */

function MacroRing({
  value,
  max,
  color,
  label,
  unit,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-zinc-800"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-zinc-200">
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-xs text-zinc-500">
        {value}/{max}
        {unit}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-zinc-800 rounded" />
        <div className="h-8 w-32 bg-zinc-800 rounded" />
      </div>
      {/* Summary bar */}
      <div className="h-24 bg-zinc-800/50 rounded-xl" />
      {/* Macro rings */}
      <div className="flex justify-center gap-8">
        <div className="h-24 w-20 bg-zinc-800/50 rounded-lg" />
        <div className="h-24 w-20 bg-zinc-800/50 rounded-lg" />
        <div className="h-24 w-20 bg-zinc-800/50 rounded-lg" />
      </div>
      {/* Meal cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-48 bg-zinc-800/50 rounded-xl" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function MealPlanPage() {
  const [plan, setPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eatenMeals, setEatenMeals] = useState<Record<string, boolean>>({});

  const fetchPlan = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meal-plan?date=${formatDate(date)}`);
      if (!res.ok) throw new Error("Failed to fetch meal plan");
      const data = await res.json();
      setPlan(data);
    } catch {
      toast.error("Failed to load meal plan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(currentDate);
  }, [currentDate, fetchPlan]);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
    setEatenMeals({});
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
    setEatenMeals({});
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setEatenMeals({});
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Delete existing plan
      await fetch(`/api/meal-plan?date=${formatDate(currentDate)}`, {
        method: "DELETE",
      });
      // Fetch new plan
      const res = await fetch(`/api/meal-plan?date=${formatDate(currentDate)}`);
      if (!res.ok) throw new Error("Failed to regenerate plan");
      const data = await res.json();
      setPlan(data);
      setEatenMeals({});
      toast.success("Meal plan regenerated!");
    } catch {
      toast.error("Failed to regenerate meal plan");
    } finally {
      setRegenerating(false);
    }
  };

  const toggleMealEaten = (mealName: string) => {
    setEatenMeals((prev) => ({ ...prev, [mealName]: !prev[mealName] }));
  };

  // Calculate consumed totals from eaten meals
  const consumedCalories = plan
    ? plan.meals
        .filter((m) => eatenMeals[m.name])
        .reduce((s, m) => s + m.totalCalories, 0)
    : 0;
  const consumedProtein = plan
    ? plan.meals
        .filter((m) => eatenMeals[m.name])
        .reduce((s, m) => s + m.totalProtein, 0)
    : 0;
  const consumedCarbs = plan
    ? plan.meals
        .filter((m) => eatenMeals[m.name])
        .reduce((s, m) => s + m.totalCarbs, 0)
    : 0;
  const consumedFat = plan
    ? plan.meals
        .filter((m) => eatenMeals[m.name])
        .reduce((s, m) => s + m.totalFat, 0)
    : 0;

  // Pie chart data
  const pieData = plan
    ? [
        { name: "Protein", value: plan.targetProtein * 4, color: "#ef4444" },
        { name: "Carbs", value: plan.targetCarbs * 4, color: "#eab308" },
        { name: "Fat", value: plan.targetFat * 9, color: "#3b82f6" },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center text-zinc-400">
        <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No meal plan available. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Meal Plan</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Date Display */}
      <p className="text-sm text-zinc-500">{displayDate(currentDate)}</p>

      {/* ─── Day Summary Bar ─── */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              plan.trainingDay
                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
            )}
          >
            {plan.trainingDay ? "Training Day" : "Rest Day"}
          </span>
          <div className="flex items-center gap-2 text-zinc-400">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs">Stay hydrated</span>
          </div>
        </div>

        {/* Macro progress bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Calories",
              consumed: consumedCalories,
              target: plan.targetCalories,
              unit: "kcal",
              color: "bg-orange-500",
            },
            {
              label: "Protein",
              consumed: consumedProtein,
              target: plan.targetProtein,
              unit: "g",
              color: "bg-red-500",
            },
            {
              label: "Carbs",
              consumed: consumedCarbs,
              target: plan.targetCarbs,
              unit: "g",
              color: "bg-yellow-500",
            },
            {
              label: "Fat",
              consumed: consumedFat,
              target: plan.targetFat,
              unit: "g",
              color: "bg-blue-500",
            },
          ].map((macro) => (
            <div key={macro.label} className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{macro.label}</span>
                <span>
                  {macro.consumed}/{macro.target}
                  {macro.unit}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", macro.color)}
                  style={{
                    width: `${Math.min((macro.consumed / macro.target) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Macro Rings ─── */}
      <div className="flex justify-center gap-8">
        <MacroRing
          value={consumedProtein}
          max={plan.targetProtein}
          color="#ef4444"
          label="Protein"
          unit="g"
        />
        <MacroRing
          value={consumedCarbs}
          max={plan.targetCarbs}
          color="#eab308"
          label="Carbs"
          unit="g"
        />
        <MacroRing
          value={consumedFat}
          max={plan.targetFat}
          color="#3b82f6"
          label="Fat"
          unit="g"
        />
      </div>

      {/* ─── Meal Cards ─── */}
      <div className="space-y-4">
        {plan.meals.map((meal) => {
          const Icon = getMealIcon(meal.name);
          const eaten = eatenMeals[meal.name] ?? false;

          return (
            <div
              key={meal.name}
              className={cn(
                "bg-zinc-900/70 border rounded-xl p-5 transition-all",
                eaten ? "border-green-500/30 bg-green-500/5" : "border-zinc-800"
              )}
            >
              {/* Meal header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      eaten ? "bg-green-500/15" : "bg-zinc-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        eaten ? "text-green-400" : "text-zinc-400"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-200">{meal.name}</h3>
                    <p className="text-xs text-zinc-500">{meal.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleMealEaten(meal.name)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    eaten
                      ? "bg-green-500/15 text-green-400 border border-green-500/30"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                  {eaten ? "Eaten" : "Mark eaten"}
                </button>
              </div>

              {/* Foods list */}
              <div className="space-y-2 mb-3">
                {meal.foods.map((food, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800/50 last:border-0"
                  >
                    <div className="flex-1">
                      <span className="text-zinc-300">{food.item}</span>
                      <span className="text-zinc-600 ml-2">
                        {food.portion}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-500">
                      <span>{food.calories} cal</span>
                      <span className="text-red-400/70">P:{food.protein}g</span>
                      <span className="text-yellow-400/70">C:{food.carbs}g</span>
                      <span className="text-blue-400/70">F:{food.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal totals */}
              <div className="flex gap-4 pt-2 border-t border-zinc-800/50">
                <span className="text-xs font-medium text-zinc-300">
                  {meal.totalCalories} kcal
                </span>
                <span className="text-xs text-red-400">
                  P: {meal.totalProtein}g
                </span>
                <span className="text-xs text-yellow-400">
                  C: {meal.totalCarbs}g
                </span>
                <span className="text-xs text-blue-400">
                  F: {meal.totalFat}g
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Nutrition Breakdown Donut ─── */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-zinc-200 mb-4">
          Macro Breakdown
        </h3>
        <div className="flex items-center justify-center">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  formatter={((value: number, name: string) => [
                    `${Math.round(value)} kcal`,
                    name,
                  ]) as never}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ml-6 space-y-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-zinc-400">{entry.name}</span>
                <span className="text-sm text-zinc-500 ml-2">
                  {Math.round((entry.value / plan.targetCalories) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Notes & Hydration ─── */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
          <Apple className="w-4 h-4 text-green-400" />
          Notes & Hydration
        </h3>
        {plan.notes && (
          <p className="text-sm text-zinc-400 leading-relaxed">{plan.notes}</p>
        )}
        {plan.hydration && (
          <div className="flex items-start gap-2 bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
            <Droplets className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-sm text-cyan-300">{plan.hydration}</p>
          </div>
        )}
      </div>

      {/* ─── Regenerate Button ─── */}
      <div className="flex justify-center">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors",
            "bg-orange-500/10 text-orange-400 border border-orange-500/30",
            "hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {regenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {regenerating ? "Generating..." : "Regenerate Plan"}
        </button>
      </div>
    </div>
  );
}
