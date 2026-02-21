"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load calendar (it uses browser-only APIs)
const CalendarView = dynamic(() => import("./CalendarView"), { ssr: false });

type Status = "todo" | "in-progress" | "done";
type Assignee = "Basti" | "Nox";

const STATUS_LABELS: Record<Status, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const STATUS_COLORS: Record<Status, string> = {
  todo: "#6366f1",
  "in-progress": "#f59e0b",
  done: "#22c55e",
};

// ---------------------------------------------------------------------------
// Tasks panel
// ---------------------------------------------------------------------------
function TasksPanel() {
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [filterAssignee, setFilterAssignee] = useState<Assignee | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "todo" as Status, assignee: "Nox" as Assignee });

  const tasks = useQuery(api.tasks.list, {
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterAssignee ? { assignee: filterAssignee } : {}),
  });
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const resetForm = () => {
    setForm({ title: "", description: "", status: "todo", assignee: "Nox" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) {
      await updateTask({ id: editingId, ...form });
    } else {
      await createTask(form);
    }
    resetForm();
  };

  const startEdit = (task: { _id: Id<"tasks">; title: string; description: string; status: Status; assignee: Assignee }) => {
    setForm({ title: task.title, description: task.description, status: task.status, assignee: task.assignee });
    setEditingId(task._id);
    setShowForm(true);
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | "")} style={selectStyle}>
          <option value="">All Statuses</option>
          {(["todo", "in-progress", "done"] as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value as Assignee | "")} style={selectStyle}>
          <option value="">All Assignees</option>
          <option value="Basti">Basti</option>
          <option value="Nox">Nox</option>
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>+ New Task</button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#1a1a2e", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Edit Task" : "New Task"}</h2>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} style={selectStyle}>
              {(["todo", "in-progress", "done"] as Status[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value as Assignee })} style={selectStyle}>
              <option value="Basti">Basti</option>
              <option value="Nox">Nox</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" style={btnPrimary}>{editingId ? "Save" : "Create"}</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancel</button>
          </div>
        </form>
      )}

      {/* Task List */}
      {tasks === undefined ? (
        <p>Loading…</p>
      ) : tasks.length === 0 ? (
        <p style={{ color: "#888" }}>No tasks found. Create one!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tasks.map((task) => (
            <div key={task._id} style={{ background: "#16213e", borderRadius: 10, padding: "1rem 1.25rem", borderLeft: `4px solid ${STATUS_COLORS[task.status]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 0.25rem" }}>{task.title}</h3>
                  {task.description && <p style={{ margin: "0 0 0.5rem", color: "#aaa", fontSize: "0.9rem" }}>{task.description}</p>}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ ...badge, background: STATUS_COLORS[task.status] }}>{STATUS_LABELS[task.status]}</span>
                    <span style={{ ...badge, background: "#6366f1" }}>{task.assignee}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                  <button onClick={() => startEdit(task)} style={btnSmall}>✏️</button>
                  <button onClick={() => removeTask({ id: task._id })} style={btnSmall}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page with tabs
// ---------------------------------------------------------------------------
type Tab = "tasks" | "calendar";

export default function Home() {
  const [tab, setTab] = useState<Tab>("tasks");

  const tabBtn = (t: Tab, label: string): React.CSSProperties => ({
    padding: "0.5rem 1.25rem",
    borderRadius: "8px 8px 0 0",
    border: "none",
    borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
    background: "transparent",
    color: tab === t ? "#6366f1" : "#888",
    fontSize: "0.95rem",
    fontWeight: tab === t ? 700 : 400,
    cursor: "pointer",
    transition: "color 0.15s",
    outline: "none",
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem", fontFamily: "var(--font-geist-sans)" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>📋 Nox Taskboard</h1>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid #333", marginBottom: "1.5rem" }}>
        <button style={tabBtn("tasks", "Tasks")} onClick={() => setTab("tasks")}>📝 Tasks</button>
        <button style={tabBtn("calendar", "Calendar")} onClick={() => setTab("calendar")}>📅 Calendar</button>
      </div>

      {/* Panels */}
      {tab === "tasks" && <TasksPanel />}
      {tab === "calendar" && <CalendarView />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #333",
  background: "#0f0f23", color: "#eee", fontSize: "0.95rem", marginBottom: "0.75rem", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  padding: "0.5rem 0.8rem", borderRadius: 8, border: "1px solid #333",
  background: "#0f0f23", color: "#eee", fontSize: "0.9rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1.2rem", borderRadius: 8, border: "none",
  background: "#6366f1", color: "#fff", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1.2rem", borderRadius: 8, border: "1px solid #444",
  background: "transparent", color: "#ccc", fontSize: "0.9rem", cursor: "pointer",
};

const btnSmall: React.CSSProperties = {
  padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid #333",
  background: "transparent", cursor: "pointer", fontSize: "0.85rem",
};

const badge: React.CSSProperties = {
  padding: "0.15rem 0.6rem", borderRadius: 12, fontSize: "0.75rem", color: "#fff", fontWeight: 600,
};
