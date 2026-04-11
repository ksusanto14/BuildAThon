export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Score rings section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6"
          >
            <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Trend chart placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-48 w-full animate-pulse rounded-md bg-muted" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
