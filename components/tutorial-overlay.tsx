"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Welcome! This is your Dashboard",
    description:
      "RITE gives you a personalized overview of your health and performance. Let us show you around.",
  },
  {
    title: "Your Pillar Scores",
    description:
      "These rings show your Sleep, Recovery, and Strain scores at a glance. Tap any ring to dive deeper.",
  },
  {
    title: "Track your trends",
    description:
      "The 7-day trend chart helps you spot patterns in your health data over time.",
  },
  {
    title: "Import your data",
    description:
      "Use Quick Actions to import CSVs, generate your AI formula, plan on the calendar, and more.",
  },
  {
    title: "You're all set!",
    description:
      "You're ready to start optimizing your performance. Explore and make RITE your own.",
  },
];

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const complete = localStorage.getItem("rite-tutorial-complete");
    if (complete !== "true") {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("rite-tutorial-complete", "true");
    setVisible(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Close / Skip button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Skip tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold">{current.title}</h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {current.description}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step
                  ? "w-6 bg-primary"
                  : i < step
                  ? "w-3 bg-primary/50"
                  : "w-3 bg-muted"
              )}
            />
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {step + 1}/{steps.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={dismiss}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {step < steps.length - 1 ? "Next" : "Get Started"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
