"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  X,
  ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
type Column = "recurring" | "backlog" | "in-progress" | "review" | "done";
type Priority = "low" | "medium" | "high" | "urgent";

const COLUMNS: { id: Column; label: string; color: string }[] = [
  { id: "recurring",   label: "Recurring",   color: "#8b5cf6" },
  { id: "backlog",     label: "Backlog",     color: "#6366f1" },
  { id: "in-progress", label: "In Progress", color: "#f59e0b" },
  { id: "review",      label: "Review",      color: "#3b82f6" },
  { id: "done",        label: "Done",        color: "#22c55e" },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "#ef4444",
  high:   "#f97316",
  medium: "#eab308",
  low:    "#6b7280",
};

const ASSIGNEES = ["Basti", "Henry", "Nox", "Codex", "Quill", "Pixel", "Echo", "Scout"];

const AGENT_COLORS: Record<string, string> = {
  Basti:  "linear-gradient(135deg, #ec4899, #f43f5e)",
  Henry:  "linear-gradient(135deg, #f59e0b, #f97316)",
  Nox:    "linear-gradient(135deg, #6366f1, #8b5cf6)",
  Codex:  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  Quill:  "linear-gradient(135deg, #ec4899, #a855f7)",
  Pixel:  "linear-gradient(135deg, #8b5cf6, #6366f1)",
  Echo:   "linear-gradient(135deg, #22c55e, #10b981)",
  Scout:  "linear-gradient(135deg, #14b8a6, #06b6d4)",
};

// ── Stats Header ───────────────────────────────────────────────────────
function StatsHeader() {
  const stats = useQuery(api.tasks.stats);

  const cards = [
    { label: "This week",   value: stats?.thisWeek ?? "–",               icon: TrendingUp, color: "#6366f1" },
    { label: "In progress", value: stats?.inProgress ?? "–",             icon: Clock,      color: "#f59e0b" },
    { label: "Total",       value: stats?.total ?? "–",                  icon: BarChart3,  color: "#3b82f6" },
    { label: "Completion",  value: stats ? `${stats.completion}%` : "–", icon: Target,     color: "#22c55e" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: "var(--bg-secondary)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {c.label}
            </span>
            <c.icon size={16} color={c.color} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────
interface TaskDoc {
  _id: Id<"tasks">;
  title: string;
  description: string;
  column: Column;
  assignee: string;
  priority: Priority;
  tags: string[];
  projectId?: string;
  createdAt: number;
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function TaskCard({
  task,
  index,
  onEdit,
}: {
  task: TaskDoc;
  index: number;
  onEdit: (t: TaskDoc) => void;
}) {
  const timeAgo = getTimeAgo(task.createdAt);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(task)}
          style={{
            background: snapshot.isDragging ? "var(--bg-hover)" : "var(--bg-card)",
            borderRadius: 10,
            padding: "0.85rem",
            marginBottom: "0.5rem",
            border: `1px solid ${snapshot.isDragging ? "#6366f1" : "var(--border)"}`,
            cursor: "pointer",
            transition: "border-color 0.15s",
            ...provided.draggableProps.style,
          }}
        >
          {/* Priority dot + title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.35rem",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: PRIORITY_COLORS[task.priority],
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.3 }}>
              {task.title}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                margin: "0 0 0.5rem 1.1rem",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "0.3rem",
                flexWrap: "wrap",
                marginBottom: "0.5rem",
                marginLeft: "1.1rem",
              }}
            >
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "0.65rem",
                    padding: "0.1rem 0.45rem",
                    borderRadius: 4,
                    background: "rgba(99,102,241,0.15)",
                    color: "#818cf8",
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: avatar + time */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginLeft: "1.1rem",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: AGENT_COLORS[task.assignee] ?? "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontWeight: 700,
              }}
              title={task.assignee}
            >
              {task.assignee[0]}
            </div>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
              {timeAgo}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ── New/Edit Task Modal ────────────────────────────────────────────────
function TaskModal({
  task,
  onClose,
}: {
  task: TaskDoc | null;
  onClose: () => void;
}) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [form, setForm] = useState({
    title:       task?.title ?? "",
    description: task?.description ?? "",
    column:      task?.column ?? ("backlog" as Column),
    assignee:    task?.assignee ?? "Nox",
    priority:    task?.priority ?? ("medium" as Priority),
    tags:        task?.tags?.join(", ") ?? "",
    projectId:   task?.projectId ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const data = {
      title:       form.title,
      description: form.description,
      column:      form.column,
      assignee:    form.assignee,
      priority:    form.priority,
      tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      projectId:   form.projectId || undefined,
    };
    if (task) {
      await updateTask({ id: task._id, ...data });
    } else {
      await createTask(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (task) {
      await removeTask({ id: task._id });
      onClose();
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 16,
          padding: "1.5rem",
          width: 440,
          maxWidth: "90vw",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <input
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ ...fieldStyle, marginBottom: "0.75rem", fontWeight: 600 }}
          required
          autoFocus
        />
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ ...fieldStyle, marginBottom: "0.75rem", minHeight: 70, resize: "vertical" }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem", display: "block" }}>
              Column
            </label>
            <select
              value={form.column}
              onChange={(e) => setForm({ ...form, column: e.target.value as Column })}
              style={fieldStyle}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem", display: "block" }}>
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              style={fieldStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem", display: "block" }}>
              Assignee
            </label>
            <select
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              style={fieldStyle}
            >
              {ASSIGNEES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem", display: "block" }}>
              Project
            </label>
            <input
              placeholder="Project name"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              style={fieldStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem", display: "block" }}>
            Tags (comma separated)
          </label>
          <input
            placeholder="e.g. frontend, bug, urgent"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            style={fieldStyle}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: 8,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            {task ? "Save Changes" : "Create Task"}
          </button>
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: 8,
                border: "1px solid #ef4444",
                background: "transparent",
                color: "#ef4444",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Filter Dropdown ────────────────────────────────────────────────────
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  freeText,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  freeText?: boolean;
}) {
  if (freeText) {
    return (
      <input
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          fontSize: "0.82rem",
          width: 140,
          outline: "none",
        }}
      />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "0.4rem 1.8rem 0.4rem 0.75rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "0.82rem",
          appearance: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="">All {label}s</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-muted)",
        }}
      />
    </div>
  );
}

// ── Kanban Board ───────────────────────────────────────────────────────
function KanbanBoard({
  filterAssignee,
  filterProject,
}: {
  filterAssignee: string;
  filterProject: string;
}) {
  const queryArgs: Record<string, string> = {};
  if (filterAssignee) queryArgs.assignee = filterAssignee;
  if (filterProject) queryArgs.projectId = filterProject;

  const tasks = useQuery(api.tasks.list, queryArgs) as TaskDoc[] | undefined;
  const updateTask = useMutation(api.tasks.update);
  const [editingTask, setEditingTask] = useState<TaskDoc | null>(null);
  const [showNew, setShowNew] = useState(false);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const newColumn = result.destination.droppableId as Column;
      if (newColumn !== result.source.droppableId) {
        updateTask({ id: result.draggableId as Id<"tasks">, column: newColumn });
      }
    },
    [updateTask],
  );

  return (
    <>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Board</h2>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 1rem",
            borderRadius: 8,
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> New task
        </button>
      </div>

      {/* Board columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
            gap: "0.75rem",
            flex: 1,
            minHeight: 0,
          }}
        >
          {COLUMNS.map((col) => {
            const colTasks = (tasks ?? []).filter((t) => t.column === col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    padding: "0.75rem 0.85rem",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: col.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginLeft: "auto",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        overflowY: "auto",
                        minHeight: 80,
                        background: snapshot.isDraggingOver
                          ? "rgba(99,102,241,0.05)"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      {colTasks.map((task, i) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          index={i}
                          onEdit={setEditingTask}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modals */}
      {showNew && <TaskModal task={null} onClose={() => setShowNew(false)} />}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </>
  );
}

// ── Tasks Page ─────────────────────────────────────────────────────────
export default function TasksPage() {
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterProject, setFilterProject] = useState("");

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 2rem",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Tasks</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <FilterDropdown
            label="Assignee"
            value={filterAssignee}
            options={ASSIGNEES}
            onChange={setFilterAssignee}
          />
          <FilterDropdown
            label="Project"
            value={filterProject}
            options={[]}
            onChange={setFilterProject}
            freeText
          />
        </div>
      </div>

      <StatsHeader />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <KanbanBoard
          filterAssignee={filterAssignee}
          filterProject={filterProject}
        />
      </div>
    </div>
  );
}
