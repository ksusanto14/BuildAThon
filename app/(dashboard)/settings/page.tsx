"use client";

import { useEffect, useState } from "react";
import { Settings, User, Bell, Palette, Link2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type UserProfile = {
  name: string;
  email: string;
  sportType: string | null;
  timezone: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [sportType, setSportType] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name ?? "");
        setSportType(data.sportType ?? "");
        setTimezone(data.timezone ?? "UTC");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sportType, timezone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, preferences, and connected devices
        </p>
      </div>

      {/* Profile Section */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Profile</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {name.length > 0 && name.length < 2 && (
              <p className="text-xs text-destructive mt-1">
                Name must be at least 2 characters
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Sport Type
            </label>
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a sport</option>
              {[
                "Running",
                "Cycling",
                "Triathlon",
                "CrossFit",
                "Strength Training",
                "Swimming",
                "General Fitness",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {[
                "America/New_York",
                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "Europe/London",
                "UTC",
              ].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || name.length < 2}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Notifications</h2>
        </div>
        {[
          { label: "Recovery Alerts", desc: "When HRV drops below baseline" },
          { label: "Formula Updates", desc: "When your formula is regenerated" },
          {
            label: "Strain Warnings",
            desc: "When training load exceeds recovery",
          },
          { label: "Weekly Digest", desc: "Monday summary email" },
        ].map((pref) => (
          <label
            key={pref.label}
            className="flex items-center justify-between py-2"
          >
            <div>
              <p className="text-sm font-medium">{pref.label}</p>
              <p className="text-xs text-muted-foreground">{pref.desc}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-primary"
            />
          </label>
        ))}
      </div>

      {/* Wearable Connections */}
      <a href="/settings/wearables" className="block p-6 rounded-xl border border-border bg-card space-y-2 hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Connected Devices</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect Whoop, Garmin, Oura, or Apple Health
        </p>
      </a>

      {/* Data Export */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Data Management</h2>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/export/user-data"
            download
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Export All Data (CSV)
          </a>
          <a
            href="/settings/manual-entry"
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Manual Data Entry
          </a>
        </div>
      </div>

      {/* Appearance */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Appearance</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the sun/moon toggle in the top bar to switch between light and dark mode. Your preference is saved automatically.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-destructive" />
          <h2 className="font-semibold text-sm text-destructive">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Delete your account and all associated data. This action has a 30-day
          grace period.
        </p>
        <button className="px-4 py-2 border border-destructive text-destructive rounded-lg font-medium text-sm hover:bg-destructive hover:text-white transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}
