"use client";

import { useState, useEffect } from "react";
import { Clock, Check, ChevronDown, ChevronUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContextLoggerProps {
  className?: string;
  compact?: boolean;
}

const mealOptions = ["Fasted", "Light", "Medium", "Heavy"] as const;
const musicOptions = [
  "None",
  "Lo-fi",
  "Hip-hop",
  "Rock",
  "EDM",
  "Classical",
  "Podcast",
] as const;

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 14) return "Midday";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function ContextLogger({ className, compact = false }: ContextLoggerProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [mealType, setMealType] = useState<string>("Light");
  const [music, setMusic] = useState<string>("None");
  const [mood, setMood] = useState(6);
  const [stress, setStress] = useState(4);
  const [timeOfDay, setTimeOfDay] = useState("Morning");
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [performanceRating, setPerformanceRating] = useState<number | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
  }, []);

  const handleLog = async () => {
    setLogging(true);
    try {
      const res = await fetch("/api/context-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          music,
          mood,
          stress,
          timeOfDay,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLogId(data.id || null);
        setLogged(true);
        toast.success("Logged!");
      } else {
        toast.error("Failed to log context");
      }
    } catch {
      toast.error("Failed to log context");
    } finally {
      setLogging(false);
    }
  };

  const handlePerformanceRating = async (rating: number) => {
    setPerformanceRating(rating);
    if (!logId) return;

    setRatingSubmitting(true);
    try {
      const res = await fetch("/api/context-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: logId,
          performanceRating: rating,
        }),
      });

      if (res.ok) {
        toast.success("Performance rating saved!");
      } else {
        toast.error("Failed to save rating");
      }
    } catch {
      toast.error("Failed to save rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleReset = () => {
    setLogged(false);
    setLogId(null);
    setPerformanceRating(null);
    setMealType("Light");
    setMusic("None");
    setMood(6);
    setStress(4);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          compact && "cursor-pointer hover:bg-muted/50 transition-colors"
        )}
        onClick={compact ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Quick Context Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
            {timeOfDay}
          </span>
          {compact && (
            <button className="text-muted-foreground">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          {!logged ? (
            <>
              {/* Meal Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Meal
                </label>
                <div className="flex gap-1.5">
                  {mealOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setMealType(option)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        mealType === option
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Music */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Music
                </label>
                <select
                  value={music}
                  onChange={(e) => setMusic(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {musicOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Mood
                  </label>
                  <span className="text-xs font-semibold text-primary">
                    {mood}
                  </span>
                </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Stress
                  </label>
                  <span className="text-xs font-semibold text-primary">
                    {stress}
                  </span>
                </div>
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

              {/* Log Button */}
              <button
                onClick={handleLog}
                disabled={logging}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {logging ? (
                  <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  "Log"
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="flex items-center gap-2 text-green-500">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Context Logged!</span>
              </div>

              {/* Post-workout Performance Rating */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  How did you perform? Rate your workout:
                </label>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                    <button
                      key={star}
                      onClick={() => handlePerformanceRating(star)}
                      disabled={ratingSubmitting}
                      className={cn(
                        "p-1 rounded transition-colors",
                        performanceRating !== null && star <= performanceRating
                          ? "text-yellow-500"
                          : "text-muted-foreground/40 hover:text-yellow-400"
                      )}
                    >
                      <Star
                        className="w-5 h-5"
                        fill={
                          performanceRating !== null && star <= performanceRating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  ))}
                </div>
                {performanceRating && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rating: {performanceRating}/10
                  </p>
                )}
              </div>

              {/* Log Another Button */}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
              >
                Log Another
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
