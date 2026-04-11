import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="text-2xl font-bold tracking-tight text-primary">
          RITE
        </div>

        <h1 className="text-8xl font-extrabold text-foreground">404</h1>

        <p className="text-lg text-muted-foreground">
          Page not found
        </p>

        <p className="max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
