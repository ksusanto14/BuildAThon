"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Watch, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SPORT_TYPES = [
  "Running",
  "Cycling",
  "Triathlon",
  "CrossFit",
  "Strength Training",
  "Swimming",
  "General Fitness",
  "Team Sports",
  "Combat Sports",
  "Other",
];

const MEAL_TYPES = ["Fasted", "Light", "Medium", "Heavy"];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [sportType, setSportType] = useState("");
  const [moodScore, setMoodScore] = useState(7);
  const [stressLevel, setStressLevel] = useState(4);
  const [mealType, setMealType] = useState("");
  const [saving, setSaving] = useState(false);

  const canProceedStep1 = name.length >= 2 && sportType !== "";

  async function completeOnboarding() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sportType,
          onboardingComplete: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      // Optionally save first context log
      if (mealType) {
        await fetch("/api/context-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealType,
            moodScore,
            stressLevel,
            timeOfDay:
              new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 17
                ? "Afternoon"
                : "Evening",
          }),
        });
      }

      toast.success("Welcome to RITE!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto">
            R
          </div>
          <h1 className="text-2xl font-bold mt-4">Welcome to RITE</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let&apos;s get you set up in 3 quick steps
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-10 h-1.5 rounded-full transition-colors",
                s <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Step {currentStep} of 3
        </p>

        {/* ─── Step 1: Identity ─── */}
        {currentStep === 1 && (
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">About You</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Runner"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={50}
              />
              {name.length > 0 && name.length < 2 && (
                <p className="text-xs text-destructive mt-1">
                  Name must be at least 2 characters
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Primary Sport
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SPORT_TYPES.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSportType(sport)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm transition-colors text-left",
                      sportType === sport
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep1}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── Step 2: Wearable ─── */}
        {currentStep === 2 && (
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Watch className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Connect a Wearable</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["Whoop", "Garmin", "Oura", "Apple Health"].map((device) => (
                <button
                  key={device}
                  disabled
                  className="p-4 rounded-lg border border-border text-center opacity-60"
                >
                  <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {device[0]}
                  </div>
                  <p className="text-sm font-medium">{device}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Coming in Sprint 5
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm hover:bg-accent flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 flex items-center justify-center gap-2"
              >
                Skip for now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: First Context Log ─── */}
        {currentStep === 3 && (
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h2 className="font-semibold">Quick Context Log (Optional)</h2>
            <p className="text-sm text-muted-foreground">
              Log how you&apos;re feeling right now — this helps build your
              Performance Formula.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Last Meal
              </label>
              <div className="flex gap-2">
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm transition-colors",
                      mealType === m
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Mood: {moodScore}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Stress Level: {stressLevel}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={stressLevel}
                onChange={(e) => setStressLevel(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm hover:bg-accent flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? "Saving..." : "Finish Setup"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              Skip and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
