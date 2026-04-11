"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="text-2xl font-bold tracking-tight text-primary">
          RITE
        </div>

        <h1 className="text-4xl font-bold text-foreground">
          Something went wrong
        </h1>

        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or navigate back to
          the dashboard.
        </p>

        <div className="flex gap-4">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
