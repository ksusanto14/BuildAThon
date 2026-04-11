"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Check,
  X,
  RefreshCw,
  Loader2,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PROVIDERS = [
  { id: "WHOOP", name: "Whoop", color: "#00b0f0", letter: "W" },
  { id: "GARMIN", name: "Garmin", color: "#007cc3", letter: "G" },
  { id: "OURA", name: "Oura", color: "#d4af37", letter: "O" },
  { id: "APPLE_HEALTH", name: "Apple Health", color: "#ff3b30", letter: "A" },
];

type Connection = {
  id: string;
  provider: string;
  syncStatus: string;
  lastSyncAt: string | null;
  createdAt: string;
};

export default function WearablesPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/wearables");
      if (!res.ok) throw new Error("Failed to fetch connections");
      const data = await res.json();
      setConnections(data);
    } catch {
      toast.error("Failed to load wearable connections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConnections();
  }, []);

  function getConnection(providerId: string): Connection | undefined {
    return connections.find((c) => c.provider === providerId);
  }

  async function handleConnect(providerId: string) {
    setActionLoading(providerId);
    try {
      // For demo: simulate OAuth by directly calling POST with a mock token
      const res = await fetch("/api/wearables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          accessToken: `demo_${providerId.toLowerCase()}_${Date.now()}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Connection failed");
      }
      toast.success(
        `${PROVIDERS.find((p) => p.id === providerId)?.name} connected!`
      );
      await fetchConnections();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect device"
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisconnect(providerId: string) {
    setActionLoading(providerId);
    try {
      const res = await fetch("/api/wearables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Disconnect failed");
      }
      toast.success(
        `${PROVIDERS.find((p) => p.id === providerId)?.name} disconnected`
      );
      await fetchConnections();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect device"
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSync(providerId: string) {
    setActionLoading(`sync-${providerId}`);
    try {
      // Simulate sync delay for demo
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(
        `${PROVIDERS.find((p) => p.id === providerId)?.name} synced successfully`
      );
      await fetchConnections();
    } catch {
      toast.error("Sync failed");
    } finally {
      setActionLoading(null);
    }
  }

  function formatLastSync(dateStr: string | null): string {
    if (!dateStr) return "Never synced";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
          <Link2 className="w-6 h-6 text-primary" />
          Connected Devices
        </h1>
        <p className="text-muted-foreground text-sm">
          Connect your wearables to automatically sync health data
        </p>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROVIDERS.map((provider) => {
          const conn = getConnection(provider.id);
          const isConnected = !!conn;
          const isLoading = actionLoading === provider.id;
          const isSyncing = actionLoading === `sync-${provider.id}`;

          return (
            <div
              key={provider.id}
              className={cn(
                "p-5 rounded-xl border bg-card space-y-4 transition-colors",
                isConnected
                  ? "border-green-500/30"
                  : "border-border"
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: provider.color }}
                >
                  {provider.letter}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{provider.name}</p>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <Check className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Not connected
                    </span>
                  )}
                </div>
              </div>

              {/* Connected State */}
              {isConnected && conn && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Last sync: {formatLastSync(conn.lastSyncAt)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(provider.id)}
                      disabled={isSyncing}
                      className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

              {/* Disconnected State */}
              {!isConnected && (
                <button
                  onClick={() => handleConnect(provider.id)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  {isLoading ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Entry Card */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Manual Entry</p>
            <p className="text-xs text-muted-foreground">
              Enter health data manually if you don&apos;t have a wearable
            </p>
          </div>
        </div>
        <a
          href="/settings/manual-entry"
          className="block w-full px-3 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors text-center"
        >
          Enter Data Manually
        </a>
      </div>
    </div>
  );
}
