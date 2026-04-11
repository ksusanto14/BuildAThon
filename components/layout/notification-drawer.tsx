"use client";

import { useEffect, useState } from "react";
import { X, Bell, CheckCheck, Heart, FlaskConical, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  status: string;
  createdAt: string;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  RECOVERY_READY: Heart,
  STRAIN_WARNING: AlertTriangle,
  FORMULA_UPDATE: FlaskConical,
};

const TYPE_COLORS: Record<string, string> = {
  RECOVERY_READY: "text-recovery",
  STRAIN_WARNING: "text-strain",
  FORMULA_UPDATE: "text-primary",
};

export function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" }))
    );
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-accent"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse p-3 rounded-lg bg-muted/30"
                >
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded mt-2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                const color = TYPE_COLORS[n.type] ?? "text-muted-foreground";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "p-3 rounded-lg transition-colors hover:bg-accent/50",
                      n.status === "unread" && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm truncate",
                              n.status === "unread"
                                ? "font-semibold"
                                : "font-medium"
                            )}
                          >
                            {n.title}
                          </p>
                          {n.status === "unread" && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
