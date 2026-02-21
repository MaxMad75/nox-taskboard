"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useMemo, useState } from "react";
import { CronExpressionParser } from "cron-parser";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isToday,
  formatDistanceToNowStrict,
  isBefore,
} from "date-fns";
import { Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Schedule {
  _id: string;
  name: string;
  cronExpression: string;
  nextRunTime: number;
  description?: string;
  enabled?: boolean;
  timezone?: string;
  sourceJobId?: string;
}

interface ScheduledOccurrence {
  schedule: Schedule;
  time: Date;
}

// ---------------------------------------------------------------------------
// Color palette for task categories
// ---------------------------------------------------------------------------
const COLORS = [
  { bg: "#7c3aed20", border: "#7c3aed", dot: "#7c3aed", text: "#c4b5fd" }, // purple
  { bg: "#f59e0b20", border: "#f59e0b", dot: "#f59e0b", text: "#fcd34d" }, // amber
  { bg: "#ef444420", border: "#ef4444", dot: "#ef4444", text: "#fca5a5" }, // red
  { bg: "#06b6d420", border: "#06b6d4", dot: "#06b6d4", text: "#67e8f9" }, // cyan
  { bg: "#10b98120", border: "#10b981", dot: "#10b981", text: "#6ee7b7" }, // emerald
  { bg: "#6366f120", border: "#6366f1", dot: "#6366f1", text: "#a5b4fc" }, // indigo
  { bg: "#ec489920", border: "#ec4899", dot: "#ec4899", text: "#f9a8d4" }, // pink
  { bg: "#8b5cf620", border: "#8b5cf6", dot: "#8b5cf6", text: "#c4b5fd" }, // violet
];

function getColor(index: number) {
  return COLORS[index % COLORS.length];
}

// Hash schedule name to a stable color index
function colorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % COLORS.length;
}

// ---------------------------------------------------------------------------
// Cron helpers
// ---------------------------------------------------------------------------
function isAlwaysRunning(cron: string): boolean {
  // Crons that run every minute or very frequently (< 5 min intervals)
  try {
    const parts = cron.trim().split(/\s+/);
    // "* * * * *" or "*/1 * * * *" → always running
    if (parts[0] === "*" || parts[0] === "*/1") return true;
    return false;
  } catch {
    return false;
  }
}

function getOccurrencesInRange(
  schedule: Schedule,
  start: Date,
  end: Date
): ScheduledOccurrence[] {
  if (isAlwaysRunning(schedule.cronExpression)) return [];
  const results: ScheduledOccurrence[] = [];
  try {
    const interval = CronExpressionParser.parse(schedule.cronExpression, {
      currentDate: new Date(start.getTime() - 1),
      tz: schedule.timezone || "Europe/Berlin",
    });
    let next = interval.next();
    let safety = 0;
    while (next.getTime() <= end.getTime() && safety < 200) {
      results.push({ schedule, time: new Date(next.getTime()) });
      next = interval.next();
      safety++;
    }
  } catch {
    // fallback: just use nextRunTime
    const t = new Date(schedule.nextRunTime);
    if (t >= start && t <= end) {
      results.push({ schedule, time: t });
    }
  }
  return results;
}

function getNextUpItems(
  schedules: Schedule[],
  limit = 8
): { schedule: Schedule; time: Date; eta: string }[] {
  const now = new Date();
  const upcoming: { schedule: Schedule; time: Date }[] = [];

  for (const s of schedules) {
    if (s.enabled === false) continue;
    if (isAlwaysRunning(s.cronExpression)) continue;
    try {
      const interval = CronExpressionParser.parse(s.cronExpression, {
        currentDate: now,
        tz: s.timezone || "Europe/Berlin",
      });
      const next = interval.next();
      upcoming.push({ schedule: s, time: new Date(next.getTime()) });
    } catch {
      upcoming.push({ schedule: s, time: new Date(s.nextRunTime) });
    }
  }

  upcoming.sort((a, b) => a.time.getTime() - b.time.getTime());

  return upcoming.slice(0, limit).map((item) => ({
    ...item,
    eta: "in " + formatDistanceToNowStrict(item.time, { addSuffix: false }),
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CalendarWeekView() {
  const schedules = useQuery(api.schedules.list) as Schedule[] | undefined;
  const [weekOffset, setWeekOffset] = useState(0);
  const [showToday, setShowToday] = useState(true);

  const now = new Date();
  const baseDate = addDays(now, weekOffset * 7);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group occurrences by day
  const { dayOccurrences, alwaysRunning, nextUp } = useMemo(() => {
    if (!schedules) return { dayOccurrences: new Map(), alwaysRunning: [], nextUp: [] };

    const always = schedules.filter(
      (s) => s.enabled !== false && isAlwaysRunning(s.cronExpression)
    );

    const allOccurrences: ScheduledOccurrence[] = [];
    for (const s of schedules) {
      if (s.enabled === false) continue;
      allOccurrences.push(...getOccurrencesInRange(s, weekStart, weekEnd));
    }

    const byDay = new Map<string, ScheduledOccurrence[]>();
    for (const occ of allOccurrences) {
      const key = format(occ.time, "yyyy-MM-dd");
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(occ);
    }
    // Sort each day's occurrences by time
    for (const [, occs] of byDay) {
      occs.sort((a, b) => a.time.getTime() - b.time.getTime());
    }

    const next = getNextUpItems(schedules);

    return { dayOccurrences: byDay, alwaysRunning: always, nextUp: next };
  }, [schedules, weekStart, weekEnd]);

  if (!schedules) {
    return (
      <div style={{ color: "#8892b0", padding: "2rem" }}>Loading schedules…</div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Scheduled Tasks
          </h1>
          <p style={{ color: "#8892b0", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            Nox&apos;s automated routines
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Week navigation */}
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            style={navBtn}
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              ...navBtn,
              background: weekOffset === 0 ? "#6366f1" : "#1e2345",
              color: weekOffset === 0 ? "#fff" : "#8892b0",
            }}
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            style={navBtn}
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
          <span
            style={{
              fontSize: "0.85rem",
              color: "#8892b0",
              marginLeft: "0.5rem",
            }}
          >
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Always Running */}
      {alwaysRunning.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#5a6380",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            Always Running
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {alwaysRunning.map((s) => (
              <span
                key={s._id}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: 20,
                  background: "#2a2f4e",
                  border: "1px solid #3a4070",
                  color: "#8892b0",
                  fontSize: "0.8rem",
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
          flex: 1,
          minHeight: 0,
        }}
      >
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const occs = dayOccurrences.get(key) || [];
          const today = isToday(day);

          return (
            <div
              key={key}
              style={{
                background: today ? "#6366f108" : "#111528",
                borderRadius: 12,
                border: today ? "1px solid #6366f140" : "1px solid #1e2345",
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                overflow: "hidden",
              }}
            >
              {/* Day header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    color: today ? "#a5b4fc" : "#5a6380",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  {format(day, "EEE")}
                </span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: today ? 700 : 500,
                    color: today ? "#fff" : "#8892b0",
                    ...(today
                      ? {
                          background: "#6366f1",
                          borderRadius: "50%",
                          width: 24,
                          height: 24,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }
                      : {}),
                  }}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Task blocks */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  overflow: "auto",
                  flex: 1,
                }}
              >
                {occs.length === 0 && (
                  <span style={{ color: "#2a2f4e", fontSize: "0.75rem", fontStyle: "italic" }}>
                    —
                  </span>
                )}
                {occs.map((occ: ScheduledOccurrence, i: number) => {
                  const color = getColor(colorIndex(occ.schedule.name));
                  return (
                    <div
                      key={`${occ.schedule._id}-${i}`}
                      style={{
                        background: color.bg,
                        borderLeft: `3px solid ${color.border}`,
                        borderRadius: 6,
                        padding: "0.35rem 0.5rem",
                        fontSize: "0.75rem",
                      }}
                      title={`${occ.schedule.name}\n${occ.schedule.cronExpression}\n${occ.schedule.description || ""}`}
                    >
                      <div
                        style={{
                          color: color.text,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {occ.schedule.name}
                      </div>
                      <div style={{ color: "#5a6380", fontSize: "0.65rem" }}>
                        {format(occ.time, "h:mm a")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Up */}
      {nextUp.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#5a6380",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            Next Up
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {nextUp.map((item, i) => {
              const color = getColor(colorIndex(item.schedule.name));
              return (
                <div
                  key={`${item.schedule._id}-next-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0.75rem",
                    background: "#111528",
                    borderRadius: 8,
                    border: "1px solid #1e2345",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color.dot,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#e2e8f0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.schedule.name}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#5a6380",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.eta}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const navBtn: React.CSSProperties = {
  padding: "0.4rem 0.7rem",
  borderRadius: 8,
  border: "1px solid #1e2345",
  background: "#1e2345",
  color: "#8892b0",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.85rem",
};
