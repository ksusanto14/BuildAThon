"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SPORT_TYPES = ["Running", "Cycling", "Swimming", "Strength", "CrossFit", "Yoga", "Rest Day", "Other"];

interface DayData {
  date: string;
  recoveryScore: number | null;
  borgRpe: number | null;
  sessions: Array<{ sportType: string; duration: number; intensity: string; notes?: string }>;
  recommendation: "push" | "active" | "rest";
}

interface CalendarData {
  days: DayData[];
  plans: Array<{ id: string; weekStartDate: string; sessions: unknown[] }>;
}

function getRecoveryColor(recommendation: "push" | "active" | "rest") {
  switch (recommendation) {
    case "push":
      return "bg-green-500";
    case "active":
      return "bg-amber-500";
    case "rest":
      return "bg-red-500";
  }
}

function getRecoveryBadgeClasses(recommendation: "push" | "active" | "rest") {
  switch (recommendation) {
    case "push":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "active":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "rest":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }
}

function getRecoveryLabel(recommendation: "push" | "active" | "rest") {
  switch (recommendation) {
    case "push":
      return "Push";
    case "active":
      return "Active";
    case "rest":
      return "Rest";
  }
}

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formSportType, setFormSportType] = useState(SPORT_TYPES[0]);
  const [formDuration, setFormDuration] = useState(30);
  const [formIntensity, setFormIntensity] = useState<"easy" | "moderate" | "hard">("moderate");
  const [formNotes, setFormNotes] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openModal = (date: string) => {
    setSelectedDate(date);
    setFormSportType(SPORT_TYPES[0]);
    setFormDuration(30);
    setFormIntensity("moderate");
    setFormNotes("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          sportType: formSportType,
          duration: formDuration,
          intensity: formIntensity,
          notes: formNotes,
        }),
      });
      if (res.ok) {
        closeModal();
        fetchData();
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  // Calendar grid helpers
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Adjust to Monday start: 0=Mon, 6=Sun
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Week view helpers
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + mondayOffset);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDayData = (dateStr: string): DayData | undefined => {
    return calendarData?.days.find((d) => d.date === dateStr);
  };

  const formatDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Training Calendar
          </h1>
          <p className="text-muted-foreground text-sm">
            Plan, schedule, and adapt your training week by week
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView("month")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              view === "month"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Month
          </button>
          <button
            onClick={() => setView("week")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              view === "week"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Week
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Today
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading calendar...</p>
          </div>
          {/* Skeleton grid */}
          <div className="mt-6 grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {!loading && view === "month" && (
        <div className="p-4 rounded-xl border border-border bg-card">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-lg" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayData = getDayData(dateStr);
              const isToday = dateStr === todayStr;
              const hasSession = dayData && dayData.sessions.length > 0;

              return (
                <div
                  key={dayNum}
                  onClick={() => openModal(dateStr)}
                  className={cn(
                    "aspect-square rounded-lg border text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative",
                    isToday
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm">{dayNum}</span>
                  <div className="flex items-center gap-1">
                    {dayData && (
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getRecoveryColor(dayData.recommendation)
                        )}
                      />
                    )}
                    {hasSession && (
                      <div className="w-2 h-2 rounded-sm bg-blue-500" title="Has activity" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Push
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Active
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Rest
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-sm bg-blue-500" />
              Activity
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {!loading && view === "week" && (
        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day) => {
            const dateStr = formatDateStr(day);
            const dayData = getDayData(dateStr);
            const isToday = dateStr === todayStr;
            const hasHardOnLowRecovery =
              dayData &&
              dayData.sessions.some((s) => s.intensity === "hard") &&
              dayData.recoveryScore !== null &&
              dayData.recoveryScore < 60;

            return (
              <div
                key={dateStr}
                className={cn(
                  "rounded-xl border p-3 flex flex-col gap-2 min-h-[200px]",
                  isToday
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </div>
                    <div className={cn("text-lg font-semibold", isToday && "text-primary")}>
                      {day.getDate()}
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(dateStr)}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    title="Add session"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Recovery badge */}
                {dayData && dayData.recoveryScore !== null && (
                  <div
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full text-center",
                      getRecoveryBadgeClasses(dayData.recommendation)
                    )}
                  >
                    {Math.round(dayData.recoveryScore)}%
                  </div>
                )}

                {/* Adaptive rescheduling banner */}
                {hasHardOnLowRecovery && (
                  <div className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md px-2 py-1">
                    Consider moving hard session — recovery is low
                  </div>
                )}

                {/* Sessions */}
                <div className="flex-1 space-y-1">
                  {dayData?.sessions.map((session, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-muted rounded-md px-2 py-1"
                    >
                      <div className="font-medium">{session.sportType}</div>
                      <div className="text-muted-foreground">{session.duration}min</div>
                    </div>
                  ))}
                </div>

                {/* Recommendation badge */}
                {dayData && (
                  <div
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full text-center mt-auto",
                      getRecoveryBadgeClasses(dayData.recommendation)
                    )}
                  >
                    {getRecoveryLabel(dayData.recommendation)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Session Scheduling Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 relative">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-1">Schedule Training Session</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedDate}</p>

            {/* Adaptive rescheduling warning */}
            {selectedDate && (() => {
              const dayData = getDayData(selectedDate);
              if (dayData && dayData.recoveryScore !== null && dayData.recoveryScore < 60 && formIntensity === "hard") {
                return (
                  <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
                    Your recovery is at {Math.round(dayData.recoveryScore)}%. Consider a lighter session or rescheduling this hard workout.
                  </div>
                );
              }
              return null;
            })()}

            {/* Sport Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Sport Type</label>
              <select
                value={formSportType}
                onChange={(e) => setFormSportType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SPORT_TYPES.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                max={600}
                value={formDuration}
                onChange={(e) => setFormDuration(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Intensity */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Intensity</label>
              <div className="flex items-center gap-4">
                {(["easy", "moderate", "hard"] as const).map((level) => (
                  <label key={level} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="intensity"
                      value={level}
                      checked={formIntensity === level}
                      onChange={() => setFormIntensity(level)}
                      className="accent-primary"
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes about this session..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "w-full py-2.5 rounded-lg font-medium text-sm transition-colors",
                saving
                  ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Session"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
