"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CronExpressionParser } from "cron-parser";

// ---------------------------------------------------------------------------
// Localizer
// ---------------------------------------------------------------------------
const locales = { de };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Schedule {
  _id: Id<"schedules">;
  name: string;
  cronExpression: string;
  nextRunTime: number;
  description?: string;
  enabled?: boolean;
  timezone?: string;
  sourceJobId?: string;
}

interface CalEvent {
  id: Id<"schedules">;
  title: string;
  start: Date;
  end: Date;
  resource: Schedule;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcNextRun(expr: string, tz?: string): number {
  try {
    const interval = CronExpressionParser.parse(expr, { currentDate: new Date(), tz: tz || "UTC" });
    return interval.next().getTime();
  } catch {
    return Date.now() + 3600_000;
  }
}

const EMPTY_FORM = {
  name: "",
  cronExpression: "0 8 * * 1-5",
  description: "",
  timezone: "Europe/Berlin",
  enabled: true,
};

// ---------------------------------------------------------------------------
// Modal styles
// ---------------------------------------------------------------------------
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center",
};
const modal: React.CSSProperties = {
  background: "#1a1a2e", borderRadius: 14, padding: "2rem", width: "min(480px, 94vw)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)", color: "#eee",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #333",
  background: "#0f0f23", color: "#eee", fontSize: "0.95rem", marginBottom: "0.75rem",
  boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1.2rem", borderRadius: 8, border: "none",
  background: "#6366f1", color: "#fff", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1.2rem", borderRadius: 8, border: "1px solid #444",
  background: "transparent", color: "#ccc", fontSize: "0.9rem", cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  padding: "0.5rem 1.2rem", borderRadius: 8, border: "none",
  background: "#ef4444", color: "#fff", fontSize: "0.9rem", cursor: "pointer",
};

// ---------------------------------------------------------------------------
// Schedule Form Modal
// ---------------------------------------------------------------------------
function ScheduleModal({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: Schedule | null;
  onSave: (data: typeof EMPTY_FORM) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          cronExpression: initial.cronExpression,
          description: initial.description ?? "",
          timezone: initial.timezone ?? "Europe/Berlin",
          enabled: initial.enabled ?? true,
        }
      : { ...EMPTY_FORM }
  );
  const [cronError, setCronError] = useState("");

  const validateCron = (expr: string) => {
    try {
      CronExpressionParser.parse(expr);
      setCronError("");
      return true;
    } catch {
      setCronError("Invalid cron expression");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!validateCron(form.cronExpression)) return;
    onSave(form);
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ marginTop: 0, marginBottom: "1.25rem" }}>
          {initial ? "Edit Schedule" : "New Schedule"}
        </h2>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: "0.8rem", color: "#aaa" }}>Name</label>
          <input
            placeholder="Morning briefing"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            required
          />
          <label style={{ fontSize: "0.8rem", color: "#aaa" }}>Cron Expression</label>
          <input
            placeholder="0 8 * * 1-5"
            value={form.cronExpression}
            onChange={(e) => {
              setForm({ ...form, cronExpression: e.target.value });
              if (e.target.value) validateCron(e.target.value);
            }}
            style={{ ...inputStyle, borderColor: cronError ? "#ef4444" : "#333" }}
          />
          {cronError && <p style={{ color: "#ef4444", margin: "-0.5rem 0 0.75rem", fontSize: "0.8rem" }}>{cronError}</p>}
          <label style={{ fontSize: "0.8rem", color: "#aaa" }}>Timezone</label>
          <input
            placeholder="Europe/Berlin"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            style={inputStyle}
          />
          <label style={{ fontSize: "0.8rem", color: "#aaa" }}>Description</label>
          <textarea
            placeholder="What does this job do?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            <label htmlFor="enabled" style={{ fontSize: "0.9rem" }}>Enabled</label>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit" style={btnPrimary}>{initial ? "Save" : "Create"}</button>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancel</button>
            {initial && onDelete && (
              <button type="button" onClick={onDelete} style={{ ...btnDanger, marginLeft: "auto" }}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event detail popup
// ---------------------------------------------------------------------------
function EventPopup({
  event,
  onEdit,
  onClose,
}: {
  event: CalEvent;
  onEdit: () => void;
  onClose: () => void;
}) {
  const s = event.resource;
  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ marginTop: 0 }}>{s.name}</h2>
        {s.description && <p style={{ color: "#aaa" }}>{s.description}</p>}
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Cron:</strong> <code style={{ background: "#0f0f23", padding: "2px 6px", borderRadius: 4 }}>{s.cronExpression}</code>
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Next run:</strong> {new Date(s.nextRunTime).toLocaleString()}
        </p>
        {s.timezone && <p style={{ margin: "0.25rem 0" }}><strong>Timezone:</strong> {s.timezone}</p>}
        {s.sourceJobId && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "#666" }}>
            Synced from jobs.json · ID: {s.sourceJobId}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button onClick={onEdit} style={btnPrimary}>✏️ Edit</button>
          <button onClick={onClose} style={btnSecondary}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CalendarView
// ---------------------------------------------------------------------------
export default function CalendarView() {
  const schedules = useQuery(api.schedules.list);
  const createSchedule = useMutation(api.schedules.create);
  const updateSchedule = useMutation(api.schedules.update);
  const removeSchedule = useMutation(api.schedules.remove);
  const upsertSchedule = useMutation(api.schedules.upsertBySourceJobId);

  const [showCreate, setShowCreate] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [view, setView] = useState<(typeof Views)[keyof typeof Views]>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // ---- build calendar events from schedules ----
  const events: CalEvent[] = useMemo(() => {
    if (!schedules) return [];
    return schedules.map((s) => {
      const start = new Date(s.nextRunTime);
      const end = new Date(s.nextRunTime + 30 * 60 * 1000); // 30min block
      return {
        id: s._id,
        title: (s.enabled === false ? "⏸ " : "⏰ ") + s.name,
        start,
        end,
        resource: s,
      };
    });
  }, [schedules]);

  // ---- sync from jobs.json ----
  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync-cron");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      for (const job of data.jobs) {
        await upsertSchedule(job);
      }
      setSyncMsg(`✅ Synced ${data.jobs.length} job(s) from jobs.json`);
    } catch (e) {
      setSyncMsg(`❌ Sync failed: ${e}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 4000);
    }
  }, [upsertSchedule]);

  // Auto-sync on first mount
  useEffect(() => {
    handleSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- handlers ----
  const handleCreate = async (form: typeof EMPTY_FORM) => {
    await createSchedule({
      ...form,
      nextRunTime: calcNextRun(form.cronExpression, form.timezone),
    });
    setShowCreate(false);
  };

  const handleUpdate = async (form: typeof EMPTY_FORM) => {
    if (!editingSchedule) return;
    await updateSchedule({
      id: editingSchedule._id,
      ...form,
      nextRunTime: calcNextRun(form.cronExpression, form.timezone),
    });
    setEditingSchedule(null);
    setSelectedEvent(null);
  };

  const handleDelete = async () => {
    if (!editingSchedule) return;
    await removeSchedule({ id: editingSchedule._id });
    setEditingSchedule(null);
    setSelectedEvent(null);
  };

  const handleSelectEvent = useCallback((event: CalEvent) => {
    setSelectedEvent(event);
  }, []);

  const eventStyleGetter = useCallback((event: CalEvent) => {
    const enabled = event.resource.enabled !== false;
    return {
      style: {
        background: enabled ? "#6366f1" : "#555",
        borderRadius: "6px",
        border: "none",
        opacity: enabled ? 1 : 0.65,
        color: "#fff",
        fontSize: "0.8rem",
        padding: "2px 6px",
      },
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ New Schedule</button>
        <button onClick={handleSync} disabled={syncing} style={btnSecondary}>
          {syncing ? "Syncing…" : "🔄 Sync jobs.json"}
        </button>
        {syncMsg && (
          <span style={{ fontSize: "0.85rem", color: syncMsg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>
            {syncMsg}
          </span>
        )}
      </div>

      {/* Schedule list (sidebar) */}
      {schedules && schedules.length > 0 && (
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {schedules.map((s) => (
            <span
              key={s._id}
              onClick={() => setEditingSchedule(s)}
              style={{
                padding: "0.3rem 0.75rem", borderRadius: 20, cursor: "pointer",
                background: s.enabled !== false ? "#6366f120" : "#33333388",
                border: `1px solid ${s.enabled !== false ? "#6366f1" : "#555"}`,
                color: "#ccc", fontSize: "0.8rem",
              }}
              title={s.cronExpression}
            >
              {s.enabled === false ? "⏸ " : "⏰ "}{s.name}
            </span>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div style={{ background: "#16213e", borderRadius: 12, padding: "1rem", minHeight: 600 }}>
        <style>{`
          .rbc-calendar { color: #eee; background: #16213e; }
          .rbc-toolbar button { color: #ccc; background: #0f0f23; border: 1px solid #333; border-radius: 6px; padding: 4px 10px; }
          .rbc-toolbar button:hover { background: #6366f140; }
          .rbc-toolbar button.rbc-active { background: #6366f1; color: #fff; }
          .rbc-toolbar-label { font-weight: 700; color: #eee; }
          .rbc-header { background: #0f0f23; color: #aaa; border-color: #333 !important; padding: 6px; }
          .rbc-month-view, .rbc-time-view { border-color: #333 !important; }
          .rbc-day-bg { background: #16213e; }
          .rbc-off-range-bg { background: #111827; }
          .rbc-today { background: #6366f115 !important; }
          .rbc-event { cursor: pointer; }
          .rbc-date-cell { color: #aaa; padding: 4px 6px; }
          .rbc-show-more { color: #6366f1; }
          .rbc-time-slot { border-color: #222 !important; color: #666; }
          .rbc-timeslot-group { border-color: #333 !important; }
          .rbc-time-header-content { border-color: #333 !important; }
          .rbc-allday-cell { background: #0f0f23; }
          .rbc-time-content { border-color: #333 !important; }
        `}</style>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          popup
        />
      </div>

      {/* Modals */}
      {showCreate && (
        <ScheduleModal
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editingSchedule && !selectedEvent && (
        <ScheduleModal
          initial={editingSchedule}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setEditingSchedule(null)}
        />
      )}
      {selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onEdit={() => {
            setEditingSchedule(selectedEvent.resource);
            setSelectedEvent(null);
          }}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
