"use client";

import { useState } from "react";
import {
  ClipboardEdit,
  Moon,
  Heart,
  Flame,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SectionKey = "sleep" | "recovery" | "strain";

export default function ManualEntryPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    sleep: true,
    recovery: true,
    strain: true,
  });

  // Sleep fields
  const [sleepHours, setSleepHours] = useState("");
  const [sleepEfficiency, setSleepEfficiency] = useState("");
  const [sleepConsistency, setSleepConsistency] = useState("");
  const [sleepStress, setSleepStress] = useState("");
  const [deepSleepHrs, setDeepSleepHrs] = useState("");
  const [remSleepHrs, setRemSleepHrs] = useState("");
  const [lightSleepHrs, setLightSleepHrs] = useState("");
  const [awakeHrs, setAwakeHrs] = useState("");

  // Recovery fields
  const [hrv, setHrv] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [recoveryScore, setRecoveryScore] = useState("");

  // Strain fields
  const [borgRpe, setBorgRpe] = useState("");
  const [hrZone1Mins, setHrZone1Mins] = useState("");
  const [hrZone2Mins, setHrZone2Mins] = useState("");
  const [hrZone3Mins, setHrZone3Mins] = useState("");
  const [hrZone4Mins, setHrZone4Mins] = useState("");
  const [hrZone5Mins, setHrZone5Mins] = useState("");
  const [activityMins, setActivityMins] = useState("");
  const [steps, setSteps] = useState("");

  function toggleSection(key: SectionKey) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toNum(val: string): number | undefined {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return isNaN(n) ? undefined : n;
  }

  async function handleSave() {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    setSaving(true);
    try {
      const row: Record<string, string | number | undefined> = {
        date,
        sleepHours: toNum(sleepHours),
        sleepEfficiency: toNum(sleepEfficiency),
        sleepConsistency: toNum(sleepConsistency),
        sleepStress: toNum(sleepStress),
        deepSleepHrs: toNum(deepSleepHrs),
        remSleepHrs: toNum(remSleepHrs),
        lightSleepHrs: toNum(lightSleepHrs),
        awakeHrs: toNum(awakeHrs),
        hrv: toNum(hrv),
        restingHr: toNum(restingHr),
        respiratoryRate: toNum(respiratoryRate),
        recoveryScore: toNum(recoveryScore),
        borgRpe: toNum(borgRpe),
        hrZone1Mins: toNum(hrZone1Mins),
        hrZone2Mins: toNum(hrZone2Mins),
        hrZone3Mins: toNum(hrZone3Mins),
        hrZone4Mins: toNum(hrZone4Mins),
        hrZone5Mins: toNum(hrZone5Mins),
        activityMins: toNum(activityMins),
        steps: toNum(steps),
      };

      // Remove undefined values
      const cleanRow = Object.fromEntries(
        Object.entries(row).filter(([, v]) => v !== undefined)
      );

      // Check that at least one data field besides date is filled
      if (Object.keys(cleanRow).length <= 1) {
        toast.error("Please fill in at least one data field");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: [cleanRow],
          mode: "overwrite",
          filename: "manual-entry",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const result = await res.json();
      if (result.imported > 0 || result.overwritten > 0) {
        toast.success("Data saved successfully!");
        window.location.href = "/dashboard";
      } else {
        toast.error("No data was saved. Please check your entries.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium mb-1";
  const helpClass = "text-xs text-muted-foreground mt-1";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardEdit className="w-6 h-6 text-primary" />
          Manual Data Entry
        </h1>
        <p className="text-muted-foreground text-sm">
          Manually log your daily health metrics
        </p>
      </div>

      {/* Date Picker */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <label className={labelClass}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
        <p className={helpClass}>
          Select the date these metrics were recorded
        </p>
      </div>

      {/* Sleep Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("sleep")}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-sm">Sleep</h2>
          </div>
          {expanded.sleep ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div
          className={cn(
            "px-5 pb-5 space-y-4 transition-all",
            expanded.sleep ? "block" : "hidden"
          )}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sleep Hours</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="7.5"
                className={inputClass}
              />
              <p className={helpClass}>Total hours of sleep (0-24)</p>
            </div>
            <div>
              <label className={labelClass}>Sleep Efficiency (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={sleepEfficiency}
                onChange={(e) => setSleepEfficiency(e.target.value)}
                placeholder="92"
                className={inputClass}
              />
              <p className={helpClass}>
                Percentage of time in bed spent asleep
              </p>
            </div>
            <div>
              <label className={labelClass}>Sleep Consistency (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={sleepConsistency}
                onChange={(e) => setSleepConsistency(e.target.value)}
                placeholder="85"
                className={inputClass}
              />
              <p className={helpClass}>
                How consistent your sleep/wake times are
              </p>
            </div>
            <div>
              <label className={labelClass}>Sleep Stress (0-100)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={sleepStress}
                onChange={(e) => setSleepStress(e.target.value)}
                placeholder="25"
                className={inputClass}
              />
              <p className={helpClass}>
                Physiological stress during sleep (lower is better)
              </p>
            </div>
          </div>

          <hr className="border-border" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sleep Stages
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Deep Sleep (hrs)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={deepSleepHrs}
                onChange={(e) => setDeepSleepHrs(e.target.value)}
                placeholder="1.5"
                className={inputClass}
              />
              <p className={helpClass}>Hours of deep/slow-wave sleep</p>
            </div>
            <div>
              <label className={labelClass}>REM Sleep (hrs)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={remSleepHrs}
                onChange={(e) => setRemSleepHrs(e.target.value)}
                placeholder="2.0"
                className={inputClass}
              />
              <p className={helpClass}>Hours of rapid eye movement sleep</p>
            </div>
            <div>
              <label className={labelClass}>Light Sleep (hrs)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={lightSleepHrs}
                onChange={(e) => setLightSleepHrs(e.target.value)}
                placeholder="3.5"
                className={inputClass}
              />
              <p className={helpClass}>Hours of light/N1+N2 sleep</p>
            </div>
            <div>
              <label className={labelClass}>Awake (hrs)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={awakeHrs}
                onChange={(e) => setAwakeHrs(e.target.value)}
                placeholder="0.5"
                className={inputClass}
              />
              <p className={helpClass}>Hours awake during sleep period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("recovery")}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-sm">Recovery</h2>
          </div>
          {expanded.recovery ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div
          className={cn(
            "px-5 pb-5 space-y-4 transition-all",
            expanded.recovery ? "block" : "hidden"
          )}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>HRV (ms)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="300"
                value={hrv}
                onChange={(e) => setHrv(e.target.value)}
                placeholder="65"
                className={inputClass}
              />
              <p className={helpClass}>
                Heart rate variability in milliseconds (rMSSD)
              </p>
            </div>
            <div>
              <label className={labelClass}>Resting HR (bpm)</label>
              <input
                type="number"
                step="1"
                min="20"
                max="120"
                value={restingHr}
                onChange={(e) => setRestingHr(e.target.value)}
                placeholder="55"
                className={inputClass}
              />
              <p className={helpClass}>
                Resting heart rate in beats per minute
              </p>
            </div>
            <div>
              <label className={labelClass}>Respiratory Rate</label>
              <input
                type="number"
                step="0.1"
                min="5"
                max="40"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                placeholder="15"
                className={inputClass}
              />
              <p className={helpClass}>Breaths per minute during sleep</p>
            </div>
            <div>
              <label className={labelClass}>Recovery Score (0-100)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={recoveryScore}
                onChange={(e) => setRecoveryScore(e.target.value)}
                placeholder="72"
                className={inputClass}
              />
              <p className={helpClass}>
                Overall recovery percentage (higher is better)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strain Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("strain")}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="font-semibold text-sm">Strain</h2>
          </div>
          {expanded.strain ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div
          className={cn(
            "px-5 pb-5 space-y-4 transition-all",
            expanded.strain ? "block" : "hidden"
          )}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Borg RPE (6-20)</label>
              <input
                type="number"
                step="1"
                min="6"
                max="20"
                value={borgRpe}
                onChange={(e) => setBorgRpe(e.target.value)}
                placeholder="13"
                className={inputClass}
              />
              <p className={helpClass}>
                Borg Rating of Perceived Exertion (6=rest, 20=max effort)
              </p>
            </div>
            <div>
              <label className={labelClass}>Activity Minutes</label>
              <input
                type="number"
                step="1"
                min="0"
                max="1440"
                value={activityMins}
                onChange={(e) => setActivityMins(e.target.value)}
                placeholder="45"
                className={inputClass}
              />
              <p className={helpClass}>
                Total active minutes for the day
              </p>
            </div>
            <div>
              <label className={labelClass}>Steps</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100000"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="8500"
                className={inputClass}
              />
              <p className={helpClass}>Total step count for the day</p>
            </div>
          </div>

          <hr className="border-border" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Heart Rate Zones
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Zone 1 (mins)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="1440"
                value={hrZone1Mins}
                onChange={(e) => setHrZone1Mins(e.target.value)}
                placeholder="30"
                className={inputClass}
              />
              <p className={helpClass}>
                Very light intensity (50-60% max HR)
              </p>
            </div>
            <div>
              <label className={labelClass}>Zone 2 (mins)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="1440"
                value={hrZone2Mins}
                onChange={(e) => setHrZone2Mins(e.target.value)}
                placeholder="20"
                className={inputClass}
              />
              <p className={helpClass}>
                Light intensity (60-70% max HR)
              </p>
            </div>
            <div>
              <label className={labelClass}>Zone 3 (mins)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="1440"
                value={hrZone3Mins}
                onChange={(e) => setHrZone3Mins(e.target.value)}
                placeholder="15"
                className={inputClass}
              />
              <p className={helpClass}>
                Moderate intensity (70-80% max HR)
              </p>
            </div>
            <div>
              <label className={labelClass}>Zone 4 (mins)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="1440"
                value={hrZone4Mins}
                onChange={(e) => setHrZone4Mins(e.target.value)}
                placeholder="10"
                className={inputClass}
              />
              <p className={helpClass}>Hard intensity (80-90% max HR)</p>
            </div>
            <div>
              <label className={labelClass}>Zone 5 (mins)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="1440"
                value={hrZone5Mins}
                onChange={(e) => setHrZone5Mins(e.target.value)}
                placeholder="5"
                className={inputClass}
              />
              <p className={helpClass}>
                Maximum intensity (90-100% max HR)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Entry"}
        </button>
        <a
          href="/settings/wearables"
          className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </a>
      </div>
    </div>
  );
}
