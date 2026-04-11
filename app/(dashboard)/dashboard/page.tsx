"use client";

import { useEffect, useState } from "react";
import { Moon, Heart, Flame, Lightbulb, Utensils, BedDouble, Dumbbell } from "lucide-react";
import Link from "next/link";

type DashboardData = {
  today: { sleepScore: number; recoveryScore: number; strainScore: number };
  trend: { date: string; sleep: number; recovery: number; strain: number }[];
};

function ScoreRing({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const progress = (animatedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="100" height="100" className="transform -rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke="currentColor" strokeWidth="6"
            className="text-muted/20"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function getScoreLevel(score: number): "low" | "mid" | "high" {
  if (score <= 33) return "low";
  if (score <= 66) return "mid";
  return "high";
}

function getRecommendations(sleep: number, recovery: number, strain: number) {
  const tips: { icon: React.ElementType; title: string; text: string; color: string }[] = [];
  const sleepLevel = getScoreLevel(sleep);
  const recoveryLevel = getScoreLevel(recovery);
  const strainLevel = getScoreLevel(strain);

  // Sleep-driven recommendations
  if (sleepLevel === "low") {
    tips.push({
      icon: BedDouble,
      title: "Sleep needs attention",
      text: "Your sleep was poor. Avoid caffeine after 2pm, eat magnesium-rich foods (bananas, dark chocolate, almonds) at dinner, and keep your room below 67°F. Skip intense training today.",
      color: "var(--sleep)",
    });
  } else if (sleepLevel === "mid") {
    tips.push({
      icon: BedDouble,
      title: "Sleep was okay",
      text: "Decent rest but room to improve. Try a consistent bedtime, limit screens 1hr before bed, and have chamomile tea or tart cherry juice tonight.",
      color: "var(--sleep)",
    });
  }

  // Recovery-driven recommendations
  if (recoveryLevel === "low") {
    tips.push({
      icon: Utensils,
      title: "Focus on recovery meals",
      text: "Your body needs repair. Prioritize protein (salmon, eggs, Greek yogurt), anti-inflammatory foods (berries, leafy greens, turmeric), and hydrate with electrolytes. Keep training light.",
      color: "var(--recovery)",
    });
  } else if (recoveryLevel === "mid" && strainLevel === "high") {
    tips.push({
      icon: Utensils,
      title: "Refuel properly",
      text: "Moderate recovery with high strain — eat a carb + protein meal within 30 min of training. Think rice bowl with chicken, or a smoothie with oats, banana, and whey.",
      color: "var(--recovery)",
    });
  }

  // Strain-driven recommendations
  if (strainLevel === "high" && recoveryLevel === "low") {
    tips.push({
      icon: Dumbbell,
      title: "Scale back today",
      text: "You pushed hard but your body hasn't recovered. Do mobility work, yoga, or a light walk instead. Overtraining here risks injury and will tank tomorrow's scores.",
      color: "var(--strain)",
    });
  } else if (strainLevel === "low" && recoveryLevel === "high") {
    tips.push({
      icon: Dumbbell,
      title: "You're primed to push",
      text: "High recovery + low recent strain = green light. Today is ideal for a hard workout. Pick high-energy music and go for a PR.",
      color: "var(--strain)",
    });
  }

  // Connected insight
  if (sleepLevel === "low" && recoveryLevel === "low") {
    tips.push({
      icon: Lightbulb,
      title: "Everything connects",
      text: "Poor sleep led to poor recovery. Break the cycle: light dinner tonight (soup or salad), no alcohol, 10 min of stretching before bed, and set an alarm to wind down at 9:30pm.",
      color: "var(--primary)",
    });
  }

  // Good day
  if (sleepLevel === "high" && recoveryLevel === "high") {
    tips.push({
      icon: Lightbulb,
      title: "You're firing on all cylinders",
      text: "Great sleep and recovery. Whatever you did yesterday — keep doing it. This is your peak performance window. Train hard, compete, or tackle your biggest challenge.",
      color: "var(--primary)",
    });
  }

  // Always show at least one tip
  if (tips.length === 0) {
    tips.push({
      icon: Lightbulb,
      title: "Steady state",
      text: "Your numbers look balanced. Stay consistent with hydration, eat whole foods, and get 7-9 hours of sleep tonight to keep the momentum.",
      color: "var(--primary)",
    });
  }

  return tips;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = data?.today ?? { sleepScore: 0, recoveryScore: 0, strainScore: 0 };
  const recommendations = getRecommendations(today.sleepScore, today.recoveryScore, today.strainScore);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="text-muted-foreground text-sm">
          How your body is doing right now
        </p>
      </div>

      {/* Score Rings — all 3 in one row */}
      <div className="p-6 rounded-xl border border-border bg-card">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex justify-around">
            <ScoreRing label="Sleep" value={today.sleepScore} color="var(--sleep)" icon={Moon} />
            <ScoreRing label="Recovery" value={today.recoveryScore} color="var(--recovery)" icon={Heart} />
            <ScoreRing label="Strain" value={today.strainScore} color="var(--strain)" icon={Flame} />
          </div>
        )}
      </div>

      {/* AI Recommendations — connected insights */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          What to do about it
        </h2>
        {!loading && recommendations.map((tip, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${tip.color} 15%, transparent)` }}
            >
              <tip.icon className="w-5 h-5" style={{ color: tip.color }} />
            </div>
            <div>
              <p className="font-semibold text-sm">{tip.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick link to music */}
      <Link
        href="/music"
        className="block p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1ed760]/15 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 496 512" fill="#1ed760">
              <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm27.8-55.6c-5.7 0-8.7-2.6-12.5-4.9-65-39.2-145.8-50.1-225.4-29.5-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 20.3-19.4 20.3zm31.1-64.3c-5.2 0-8.7-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Training Music</p>
            <p className="text-xs text-muted-foreground">Pick your playlist — what you listen to impacts how you perform</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
