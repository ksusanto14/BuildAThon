"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationDrawer } from "./notification-drawer";
import { ThemeToggle } from "../theme-toggle";

export function TopBar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        {/* Left: Date */}
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>

        {/* Right: Theme + Notifications + User */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* Notification Bell */}
          <button
            onClick={() => {
              setDrawerOpen(true);
              setUnreadCount(0);
            }}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {session?.user?.name ?? "User"}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile & Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
