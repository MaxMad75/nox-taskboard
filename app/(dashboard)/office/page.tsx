"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type AgentStatus = "working" | "chatting" | "walking" | "idle";

interface Agent {
  id: string;
  name: string;
  avatar: string;
  color: string;
  status: AgentStatus;
  task: string;
  deskPosition: { row: number; col: number };
  currentPosition: { row: number; col: number };
  model: string;
}

interface ActivityEvent {
  id: string;
  agent: string;
  action: string;
  timestamp: Date;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  working: "#22c55e",
  chatting: "#eab308",
  walking: "#3b82f6",
  idle: "#6b7280",
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  working: "Working",
  chatting: "Chatting",
  walking: "Walking",
  idle: "Idle",
};

// ── Mock Data ──────────────────────────────────────────────────────────────────
const INITIAL_AGENTS: Agent[] = [
  { id: "1", name: "Henry",  avatar: "🧑‍💼", color: "#f97316", status: "working",  task: "Build Council — Sprint Plan", deskPosition: { row: 0, col: 0 }, currentPosition: { row: 0, col: 0 }, model: "claude-opus-4-6"   },
  { id: "2", name: "Nox",    avatar: "🤖",   color: "#8b5cf6", status: "working",  task: "Office View — Isometric UI",  deskPosition: { row: 0, col: 1 }, currentPosition: { row: 0, col: 1 }, model: "claude-sonnet-4-6" },
  { id: "3", name: "Alex",   avatar: "👩‍🔬", color: "#ec4899", status: "chatting", task: "API Design Review",           deskPosition: { row: 0, col: 2 }, currentPosition: { row: 0, col: 2 }, model: "claude-sonnet-4-6" },
  { id: "4", name: "Quill",  avatar: "✍️",   color: "#14b8a6", status: "working",  task: "Documentation Update",        deskPosition: { row: 0, col: 3 }, currentPosition: { row: 0, col: 3 }, model: "claude-haiku-4-5"  },
  { id: "5", name: "Echo",   avatar: "🔊",   color: "#f59e0b", status: "idle",     task: "Awaiting instructions",       deskPosition: { row: 1, col: 0 }, currentPosition: { row: 1, col: 0 }, model: "claude-haiku-4-5"  },
  { id: "6", name: "Scout",  avatar: "🔍",   color: "#06b6d4", status: "working",  task: "Security Audit — Auth",       deskPosition: { row: 1, col: 1 }, currentPosition: { row: 1, col: 1 }, model: "claude-sonnet-4-6" },
  { id: "7", name: "Codex",  avatar: "📖",   color: "#a855f7", status: "working",  task: "Code Review — PR #42",        deskPosition: { row: 1, col: 2 }, currentPosition: { row: 1, col: 2 }, model: "claude-sonnet-4-6" },
  { id: "8", name: "Pixel",  avatar: "🎨",   color: "#10b981", status: "walking",  task: "UI Component Library",        deskPosition: { row: 1, col: 3 }, currentPosition: { row: 1, col: 3 }, model: "claude-haiku-4-5"  },
];

const ACTIVITY_ACTIONS = [
  "Started working on",
  "Completed review of",
  "Pushed commit to",
  "Joined meeting for",
  "Updated docs for",
  "Deployed fix for",
  "Opened PR for",
  "Ran tests on",
];

const ACTIVITY_TARGETS = [
  "auth module",
  "dashboard layout",
  "API endpoints",
  "database schema",
  "CI pipeline",
  "office view",
  "council page",
  "notification system",
];

function generateActivity(agents: Agent[]): ActivityEvent {
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const action = ACTIVITY_ACTIONS[Math.floor(Math.random() * ACTIVITY_ACTIONS.length)];
  const target = ACTIVITY_TARGETS[Math.floor(Math.random() * ACTIVITY_TARGETS.length)];
  return {
    id: Math.random().toString(36).substring(2, 9),
    agent: agent.name,
    action: `${action} ${target}`,
    timestamp: new Date(),
  };
}

// ── Isometric Office SVG ───────────────────────────────────────────────────────
const TILE_W = 120;
const TILE_H = 60;
const GRID_COLS = 4;
const GRID_ROWS = 2;
const OFFSET_X = 500;
const OFFSET_Y = 80;

function toIso(row: number, col: number): { x: number; y: number } {
  return {
    x: OFFSET_X + (col - row) * (TILE_W / 2),
    y: OFFSET_Y + (col + row) * (TILE_H / 2),
  };
}

function Floor() {
  const tiles: React.JSX.Element[] = [];
  for (let r = -1; r < GRID_ROWS + 1; r++) {
    for (let c = -1; c < GRID_COLS + 2; c++) {
      const { x, y } = toIso(r, c);
      const isDark = (r + c) % 2 === 0;
      tiles.push(
        <polygon
          key={`${r}-${c}`}
          points={`${x},${y} ${x + TILE_W / 2},${y + TILE_H / 2} ${x},${y + TILE_H} ${x - TILE_W / 2},${y + TILE_H / 2}`}
          fill={isDark ? "#1a1a2e" : "#16162a"}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      );
    }
  }
  return <>{tiles}</>;
}

function Desk({ row, col }: { row: number; col: number }) {
  const { x, y } = toIso(row, col);
  const deskY = y - 10;
  return (
    <g>
      {/* Desk surface */}
      <polygon
        points={`${x},${deskY} ${x + 30},${deskY + 15} ${x},${deskY + 30} ${x - 30},${deskY + 15}`}
        fill="#2a2a4a"
        stroke="#3a3a5a"
        strokeWidth={1}
      />
      {/* Left face */}
      <polygon
        points={`${x - 30},${deskY + 15} ${x},${deskY + 30} ${x},${deskY + 40} ${x - 30},${deskY + 25}`}
        fill="#222244"
        stroke="#3a3a5a"
        strokeWidth={1}
      />
      {/* Right face */}
      <polygon
        points={`${x},${deskY + 30} ${x + 30},${deskY + 15} ${x + 30},${deskY + 25} ${x},${deskY + 40}`}
        fill="#1e1e3e"
        stroke="#3a3a5a"
        strokeWidth={1}
      />
      {/* Monitor */}
      <rect x={x - 10} y={deskY - 18} width={20} height={16} rx={2} fill="#1a3a6a" stroke="#3b82f6" strokeWidth={1} />
      {/* Screen glow */}
      <rect x={x - 8} y={deskY - 16} width={16} height={12} rx={1} fill="#2563eb" opacity={0.6} />
      {/* Monitor stand */}
      <rect x={x - 2} y={deskY - 2} width={4} height={4} fill="#444" />
    </g>
  );
}

function Plant({ row, col }: { row: number; col: number }) {
  const { x, y } = toIso(row, col);
  return (
    <g>
      <rect x={x - 6} y={y - 5} width={12} height={10} rx={2} fill="#5c4033" />
      <circle cx={x} cy={y - 12} r={8} fill="#22c55e" opacity={0.8} />
      <circle cx={x - 5} cy={y - 9} r={5} fill="#16a34a" opacity={0.7} />
      <circle cx={x + 4} cy={y - 10} r={6} fill="#15803d" opacity={0.7} />
    </g>
  );
}

function ConferenceTable() {
  const { x, y } = toIso(0.5, 1.5);
  const ty = y + 10;
  return (
    <g>
      {/* Table top */}
      <polygon
        points={`${x},${ty - 5} ${x + 40},${ty + 15} ${x},${ty + 35} ${x - 40},${ty + 15}`}
        fill="#3a2820"
        stroke="#5a3830"
        strokeWidth={1.5}
      />
      {/* Coffee cups */}
      <circle cx={x - 10} cy={ty + 12} r={3} fill="#888" />
      <circle cx={x + 8} cy={ty + 18} r={3} fill="#888" />
      {/* Label */}
      <text x={x} y={ty + 52} textAnchor="middle" fill="#555" fontSize={10}>
        ☕ Watercooler
      </text>
    </g>
  );
}

function AgentSprite({
  agent,
  onClick,
}: {
  agent: Agent;
  onClick: () => void;
}) {
  const { x, y } = toIso(agent.currentPosition.row, agent.currentPosition.col);
  const atDesk =
    agent.currentPosition.row === agent.deskPosition.row &&
    agent.currentPosition.col === agent.deskPosition.col;
  const spriteY = atDesk ? y - 35 : y - 20;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Shadow */}
      <ellipse
        cx={x}
        cy={atDesk ? y + 5 : y + 10}
        rx={12}
        ry={4}
        fill="rgba(0,0,0,0.3)"
      />
      {/* Body */}
      <rect
        x={x - 8}
        y={spriteY + 12}
        width={16}
        height={18}
        rx={3}
        fill={agent.color}
        opacity={0.9}
      />
      {/* Head */}
      <circle cx={x} cy={spriteY + 6} r={9} fill="#fcd9b6" />
      {/* Avatar emoji */}
      <text x={x} y={spriteY + 10} textAnchor="middle" fontSize={14}>
        {agent.avatar}
      </text>
      {/* Status indicator */}
      <circle
        cx={x + 12}
        cy={spriteY}
        r={5}
        fill={STATUS_COLORS[agent.status]}
        stroke="#0a0a1a"
        strokeWidth={2}
      />
      {/* Glow pulse */}
      <circle cx={x + 12} cy={spriteY} r={5} fill={STATUS_COLORS[agent.status]} opacity={0.4}>
        <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Name */}
      <text x={x} y={spriteY + 40} textAnchor="middle" fill="#ccc" fontSize={11} fontWeight={600}>
        {agent.name}
      </text>
      {/* Task (only at desk) */}
      {atDesk && (
        <text x={x} y={spriteY + 52} textAnchor="middle" fill="#666" fontSize={9}>
          {agent.task.length > 20 ? agent.task.slice(0, 20) + "…" : agent.task}
        </text>
      )}
    </g>
  );
}

function IsometricOffice({
  agents,
  onAgentClick,
}: {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}) {
  return (
    <svg
      viewBox="0 0 1000 500"
      style={{ width: "100%", maxWidth: 1000, height: "auto" }}
    >
      <defs>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </defs>

      {/* Floor tiles */}
      <Floor />

      {/* Conference / watercooler table */}
      <ConferenceTable />

      {/* Desks for each agent */}
      {agents.map((a) => (
        <Desk key={`desk-${a.id}`} row={a.deskPosition.row} col={a.deskPosition.col} />
      ))}

      {/* Corner plants */}
      <Plant row={-0.5} col={-0.5} />
      <Plant row={-0.5} col={4} />
      <Plant row={2} col={-0.5} />
      <Plant row={2} col={4} />

      {/* Agents — sorted by depth (y) for correct overlap */}
      {[...agents]
        .sort(
          (a, b) =>
            a.currentPosition.row +
            a.currentPosition.col -
            (b.currentPosition.row + b.currentPosition.col)
        )
        .map((a) => (
          <AgentSprite key={a.id} agent={a} onClick={() => onAgentClick(a)} />
        ))}

      {/* Watermark */}
      <text
        x={500}
        y={470}
        textAnchor="middle"
        fill="rgba(255,255,255,0.06)"
        fontSize={12}
      >
        Mission Control — Office Floor
      </text>
    </svg>
  );
}

// ── Status Legend ──────────────────────────────────────────────────────────────
function StatusLegend() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      {(Object.keys(STATUS_COLORS) as AgentStatus[]).map((status) => (
        <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: STATUS_COLORS[status],
              boxShadow: `0 0 6px ${STATUS_COLORS[status]}80`,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Activity Panel ─────────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

function ActivityPanel({ activities }: { activities: ActivityEvent[] }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.85rem 1rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            margin: 0,
          }}
        >
          📡 Live Activity
        </h3>
      </div>

      {/* Feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {activities.length === 0 && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              fontStyle: "italic",
              padding: "0.5rem",
            }}
          >
            Waiting for activity…
          </p>
        )}
        {activities.slice(0, 25).map((ev) => (
          <div
            key={ev.id}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              borderLeft: "3px solid rgba(99,102,241,0.5)",
            }}
          >
            <div style={{ fontSize: 13 }}>
              <strong style={{ color: "#a78bfa" }}>{ev.agent}</strong>{" "}
              <span style={{ color: "var(--text-secondary)" }}>{ev.action}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {timeAgo(ev.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Model abbrev helper ────────────────────────────────────────────────────────
const MODEL_ABBREV: Record<string, string> = {
  "claude-opus-4-6":   "O4",
  "claude-sonnet-4-6": "S4",
  "claude-haiku-4-5":  "H5",
};

// ── Agent Click Modal ──────────────────────────────────────────────────────────
function AgentModal({
  agent,
  activities,
  onClose,
}: {
  agent: Agent;
  activities: ActivityEvent[];
  onClose: () => void;
}) {
  const awayFromDesk =
    agent.currentPosition.row !== agent.deskPosition.row ||
    agent.currentPosition.col !== agent.deskPosition.col;

  // Filter last 3 activities for this agent
  const agentActivities = activities.filter((a) => a.agent === agent.name).slice(0, 3);
  const latest = agentActivities[0] ?? null;

  // Derive action verb and purpose from latest activity text
  function parseActivity(action: string): { verb: string; purpose: string } {
    const parts = action.split(" ");
    const verb = parts[0] ?? "Monitoring";
    const target = parts.slice(1).join(" ");
    const purposeMap: Record<string, string> = {
      "auth module":           "Harden authentication security",
      "dashboard layout":      "Improve UI consistency",
      "API endpoints":         "Ensure API reliability",
      "database schema":       "Optimize data structure",
      "CI pipeline":           "Accelerate deployment cycles",
      "office view":           "Enhance team visibility",
      "council page":          "Coordinate team planning",
      "notification system":   "Improve real-time alerts",
    };
    return {
      verb: verb.replace(/ed$/, "ing").replace(/Completed/, "Completing").replace(/Started/, "Starting").replace(/Opened/, "Opening").replace(/Ran/, "Running").replace(/Pushed/, "Pushing").replace(/Joined/, "Joining").replace(/Updated/, "Updating").replace(/Deployed/, "Deploying"),
      purpose: purposeMap[target] ?? `Complete ${target}`,
    };
  }

  const parsed = latest ? parseActivity(latest.action) : null;
  const abbrev = MODEL_ABBREV[agent.model] ?? agent.model;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 16,
          padding: 28,
          width: 400,
          maxWidth: "90vw",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Agent header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              fontSize: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${agent.color}22`,
              border: `2px solid ${agent.color}`,
              flexShrink: 0,
            }}
          >
            {agent.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: "var(--text-primary)", fontSize: 20, margin: 0 }}>
              {agent.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: STATUS_COLORS[agent.status],
                  boxShadow: `0 0 6px ${STATUS_COLORS[agent.status]}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Model badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "0.25rem 0.7rem",
            borderRadius: 8,
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 11, color: "#818cf8" }}>⬡</span>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "#a5b4fc", fontWeight: 600 }}>
            {agent.model}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6366f1",
              background: "rgba(99,102,241,0.2)",
              borderRadius: 3,
              padding: "0 4px",
              letterSpacing: "0.04em",
            }}
          >
            {abbrev}
          </span>
        </div>

        {/* Current task */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 5,
            }}
          >
            Current Task
          </div>
          <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{agent.task}</div>
        </div>

        {/* Live Activity section */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ color: "#f59e0b" }}>⚡</span> Live Activity
          </div>

          {latest ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Task name */}
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                ⚡ {agent.task.length > 32 ? agent.task.slice(0, 32) + "…" : agent.task}
              </div>

              {/* Action */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 52, textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: 1 }}>
                  Action
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {parsed?.verb ?? "Monitoring"} {latest.action.split(" ").slice(1).join(" ")}
                </span>
              </div>

              {/* Purpose */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 52, textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: 1 }}>
                  Purpose
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {parsed?.purpose ?? "Maintain system reliability"}
                </span>
              </div>

              {/* Timestamp */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 52, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Updated
                </span>
                <span style={{ fontSize: 12, color: "#6366f1" }}>
                  {timeAgo(latest.timestamp)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
              No recent activity recorded yet…
            </div>
          )}
        </div>

        {/* Position */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            padding: 12,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 5,
            }}
          >
            Position
          </div>
          <div style={{ fontSize: 14, color: "var(--text-primary)" }}>
            Desk {agent.deskPosition.row + 1}-{agent.deskPosition.col + 1}
            {awayFromDesk && (
              <span style={{ color: STATUS_COLORS[agent.status], marginLeft: 6 }}>
                → Away
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            width: "100%",
            padding: "10px 0",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 8,
            color: "#818cf8",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Demo Control Button ────────────────────────────────────────────────────────
function CtrlBtn({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.45rem 1rem",
        borderRadius: 8,
        border: variant === "danger" ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border)",
        background: variant === "danger" ? "rgba(239,68,68,0.08)" : "var(--bg-secondary)",
        color: variant === "danger" ? "#ef4444" : "var(--text-primary)",
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          variant === "danger" ? "#ef4444" : "rgba(99,102,241,0.6)";
        (e.currentTarget as HTMLElement).style.background =
          variant === "danger" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          variant === "danger" ? "rgba(239,68,68,0.4)" : "var(--border)";
        (e.currentTarget as HTMLElement).style.background =
          variant === "danger" ? "rgba(239,68,68,0.08)" : "var(--bg-secondary)";
      }}
    >
      {children}
    </button>
  );
}

// ── Agent Status Grid ──────────────────────────────────────────────────────────
function AgentGrid({
  agents,
  onAgentClick,
}: {
  agents: Agent[];
  onAgentClick: (a: Agent) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.5rem",
      }}
    >
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onAgentClick(agent)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = agent.color;
            (e.currentTarget as HTMLElement).style.background = `${agent.color}12`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
          }}
        >
          <span style={{ fontSize: 18 }}>{agent.avatar}</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {agent.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: STATUS_COLORS[agent.status],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Office Page ────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Live activity feed — fires every 3s
  useEffect(() => {
    const iv = setInterval(() => {
      setActivities((prev) => {
        const event = generateActivity(agents);
        return [event, ...prev].slice(0, 50);
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [agents]);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const setAllStatus = useCallback((status: AgentStatus) => {
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status,
        currentPosition:
          status === "working" ? { ...a.deskPosition } : a.currentPosition,
      }))
    );
    pushActivity("System", `Set all agents to ${status}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gather = useCallback(() => {
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: "walking" as AgentStatus,
        currentPosition: { row: 0.5, col: 1.5 },
      }))
    );
    pushActivity("System", "Called all agents to gather");
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: "chatting" as AgentStatus }))
      );
    }, 2000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runMeeting = useCallback(() => {
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: "chatting" as AgentStatus,
        currentPosition: { row: 0.5, col: 1.5 },
      }))
    );
    pushActivity("System", "Started team meeting");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const watercooler = useCallback(() => {
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const chatters = new Set(shuffled.slice(0, 3).map((a) => a.id));
    setAgents((prev) =>
      prev.map((a) =>
        chatters.has(a.id)
          ? { ...a, status: "chatting" as AgentStatus, currentPosition: { row: 1.5, col: 3.5 } }
          : a
      )
    );
    const names = shuffled
      .slice(0, 3)
      .map((a) => a.name)
      .join(", ");
    pushActivity("System", `${names} went to the watercooler`);
  }, [agents]);

  const reset = useCallback(() => {
    setAgents(INITIAL_AGENTS);
    setActivities([]);
  }, []);

  function pushActivity(agent: string, action: string) {
    setActivities((prev) =>
      [{ id: Math.random().toString(36).substring(2, 9), agent, action, timestamp: new Date() }, ...prev].slice(0, 50)
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "1.25rem 2rem 1rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
            🏢 The Office
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              margin: "0.2rem 0 0",
            }}
          >
            AI team headquarters — live view
          </p>
        </div>
        <StatusLegend />
      </div>

      {/* ── Demo Controls ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "0.75rem 2rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginRight: 4,
          }}
        >
          Scene:
        </span>
        <CtrlBtn onClick={() => setAllStatus("working")}>💻 All Working</CtrlBtn>
        <CtrlBtn onClick={gather}>📢 Gather</CtrlBtn>
        <CtrlBtn onClick={runMeeting}>🗓️ Run Meeting</CtrlBtn>
        <CtrlBtn onClick={watercooler}>☕ Watercooler</CtrlBtn>
        <CtrlBtn onClick={reset} variant="danger">🔄 Reset</CtrlBtn>
      </div>

      {/* ── Main Content: Office SVG + Side Panel ───────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Office canvas */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            padding: "1.25rem 1.5rem",
            gap: "1rem",
            minWidth: 0,
          }}
        >
          {/* SVG office */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "1rem",
              overflow: "hidden",
            }}
          >
            <IsometricOffice agents={agents} onAgentClick={setSelectedAgent} />
          </div>

          {/* Agent status grid */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "0.75rem",
              }}
            >
              Team Status
            </div>
            <AgentGrid agents={agents} onAgentClick={setSelectedAgent} />
          </div>
        </div>

        {/* Activity panel */}
        <div
          style={{
            width: 280,
            minWidth: 280,
            padding: "1.25rem 1.25rem 1.25rem 0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ActivityPanel activities={activities} />
        </div>
      </div>

      {/* ── Agent Modal ─────────────────────────────────────────────────────── */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          activities={activities}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
