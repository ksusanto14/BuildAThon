import Link from "next/link";
import { Moon, Heart, Flame, FlaskConical, ArrowRight } from "lucide-react";
import { RiteLogo } from "@/components/rite-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-border">
        <RiteLogo size="sm" />
        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <RiteLogo size="hero" showSubtitle showTagline className="items-center" />
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            RITE synthesizes your wearable data, lifestyle context, and AI
            analysis to unlock your unique Performance Formula.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <Moon className="w-8 h-8 text-sleep mx-auto mb-3" />
              <h3 className="font-semibold">Sleep</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track stages, efficiency, and consistency
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <Heart className="w-8 h-8 text-recovery mx-auto mb-3" />
              <h3 className="font-semibold">Recovery</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor HRV, resting HR, and readiness
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <Flame className="w-8 h-8 text-strain mx-auto mb-3" />
              <h3 className="font-semibold">Strain</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Measure training load and HR zones
              </p>
            </div>
          </div>

          {/* Formula callout */}
          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 mt-4">
            <FlaskConical className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold">AI Performance Formula</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Claude AI analyzes your data to reveal the exact conditions
              behind your peak performance days
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border">
        RITE &middot; BUILDATHON 2026
      </footer>
    </div>
  );
}
