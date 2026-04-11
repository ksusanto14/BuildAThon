"use client";

import { cn } from "@/lib/utils";

type RiteLogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  showSubtitle?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function RiteLogo({
  size = "md",
  showSubtitle = false,
  showTagline = false,
  className,
}: RiteLogoProps) {
  const sizeStyles = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    hero: "text-7xl sm:text-8xl md:text-9xl",
  };

  const subtitleSize = {
    sm: "text-[8px] tracking-[0.25em]",
    md: "text-xs tracking-[0.3em]",
    lg: "text-sm tracking-[0.35em]",
    hero: "text-base sm:text-lg tracking-[0.4em]",
  };

  const taglineSize = {
    sm: "text-[8px]",
    md: "text-xs",
    lg: "text-sm",
    hero: "text-sm sm:text-base",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* RITE wordmark */}
      <span
        className={cn(
          sizeStyles[size],
          "font-extralight tracking-[0.05em] leading-none text-foreground select-none"
        )}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        RITE
      </span>

      {showSubtitle && (
        <div className="mt-3 space-y-1">
          <p
            className={cn(
              subtitleSize[size],
              "font-bold uppercase text-foreground leading-none"
            )}
          >
            Performance
          </p>
          <p
            className={cn(
              subtitleSize[size],
              "font-bold uppercase text-primary leading-none"
            )}
          >
            Intelligence
          </p>
        </div>
      )}

      {showTagline && (
        <p
          className={cn(
            taglineSize[size],
            "italic text-muted-foreground mt-4"
          )}
        >
          Learning what makes YOU perform at your best.
        </p>
      )}
    </div>
  );
}
