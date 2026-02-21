"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  agentName?: string;
  text: string;
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
  { id: "1", name: "Henry",  avatar: "🧑‍💼", color: "#f97316", status: "working",  task: "Build Council — Sprint Plan", deskPosition: { row: 0, col: 0 }, currentPosition: { row: 0, col: 0 }, model: "claude-opus-4-6" },
  { id: "2", name: "Nox",    avatar: "🤖",   color: "#8b5cf6", status: "working",  task: "Office View — Isometric UI",  deskPosition: { row: 0, col: 2 }, currentPosition: { row: 0, col: 2 }, model: "claude-sonnet-4-6" },
  { id: "3", name: "Alex",   avatar: "👩‍🔬", color: "#ec4899", status: "chatting", task: "API Design Review",           deskPosition: { row: 0, col: 4 }, currentPosition: { row: 0, col: 4 }, model: "claude-sonnet-4-6" },
  { id: "4", name: "Quill",  avatar: "✍️",   color: "#14b8a6", status: "working",  task: "Documentation Update",        deskPosition: { row: 0, col: 6 }, currentPosition: { row: 0, col: 6 }, model: "claude-haiku-4-5" },
  { id: "5", name: "Echo",   avatar: "🔊",   color: "#f59e0b", status: "idle",     task: "Awaiting instructions",       deskPosition: { row: 2, col: 1 }, currentPosition: { row: 2, col: 1 }, model: "claude-haiku-4-5" },
  { id: "6", name: "Scout",  avatar: "🔍",   color: "#06b6d4", status: "working",  task: "Security Audit — Auth",       deskPosition: { row: 2, col: 3 }, currentPosition: { row: 2, col: 3 }, model: "claude-sonnet-4-6" },
  { id: "7", name: "Codex",  avatar: "📖",   color: "#a855f7", status: "working",  task: "Code Review — PR #42",        deskPosition: { row: 2, col: 5 }, currentPosition: { row: 2, col: 5 }, model: "claude-sonnet-4-6" },
  { id: "8", name: "Pixel",  avatar: "🎨",   color: "#10b981", status: "walking",  task: "UI Component Library",        deskPosition: { row: 2, col: 7 }, currentPosition: { row: 2, col: 7 }, model: "claude-haiku-4-5" },
];

const ACTIVITY_ACTIONS = ["Started working on", "Completed review of", "Pushed commit to", "Joined meeting for", "Updated docs for", "Deployed fix for", "Opened PR for", "Ran tests on"];
const ACTIVITY_TARGETS = ["auth module", "dashboard layout", "API endpoints", "database schema", "CI pipeline", "office view", "council page", "notification system"];

function generateActivity(agents: Agent[]): ActivityEvent {
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const action = ACTIVITY_ACTIONS[Math.floor(Math.random() * ACTIVITY_ACTIONS.length)];
  const target = ACTIVITY_TARGETS[Math.floor(Math.random() * ACTIVITY_TARGETS.length)];
  return { id: Math.random().toString(36).substring(2, 9), agent: agent.name, action: `${action} ${target}`, timestamp: new Date() };
}

// Mock agent responses
const AGENT_RESPONSES: Record<string, string[]> = {
  Henry:  ["I'm reviewing the sprint backlog now.", "The council build is progressing well — ETA 2 hours.", "Let me check the latest metrics for you.", "Sure, I'll prioritize that next."],
  Nox:    ["Running diagnostics on the isometric renderer.", "I've optimized the SVG output by 40%.", "The office view is looking sharp!", "On it — deploying the fix now."],
  Alex:   ["The API schema looks solid. Minor feedback on auth endpoints.", "I'd recommend adding rate limiting here.", "Good catch — I'll update the review.", "Let me cross-reference with the docs."],
  Quill:  ["Documentation is 80% complete for this sprint.", "I've added examples for every endpoint.", "The style guide has been updated.", "Sure, I'll draft that section now."],
  Echo:   ["Standing by for instructions.", "Ready to assist — what do you need?", "I can pick up any overflow tasks.", "Monitoring the notification queue."],
  Scout:  ["Security scan complete — no critical issues found.", "I've hardened the auth middleware.", "Reviewing the latest CVE reports now.", "The penetration test passed."],
  Codex:  ["PR #42 has 3 minor issues — mostly style.", "The code quality is improving sprint over sprint.", "I'd suggest extracting this into a utility.", "LGTM with minor changes."],
  Pixel:  ["The component library now has 24 primitives.", "I'm experimenting with new animation curves.", "Color tokens are synced with the design system.", "The responsive breakpoints are tested."],
};

// ── Enhanced Isometric Constants ───────────────────────────────────────────────
const TILE_W = 100;
const TILE_H = 50;
const GRID_COLS = 10;
const GRID_ROWS = 5;
const OFFSET_X = 600;
const OFFSET_Y = 60;

function toIso(row: number, col: number): { x: number; y: number } {
  return {
    x: OFFSET_X + (col - row) * (TILE_W / 2),
    y: OFFSET_Y + (col + row) * (TILE_H / 2),
  };
}

// ── Enhanced Floor with Checkered Pattern ──────────────────────────────────────
function Floor() {
  const tiles: React.JSX.Element[] = [];
  for (let r = -1; r < GRID_ROWS + 1; r++) {
    for (let c = -1; c < GRID_COLS + 1; c++) {
      const { x, y } = toIso(r, c);
      const isDark = (r + c) % 2 === 0;
      tiles.push(
        <polygon
          key={`${r}-${c}`}
          points={`${x},${y} ${x + TILE_W / 2},${y + TILE_H / 2} ${x},${y + TILE_H} ${x - TILE_W / 2},${y + TILE_H / 2}`}
          fill={isDark ? "#1e1e38" : "#16162a"}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      );
    }
  }
  return <>{tiles}</>;
}

// ── Walls (Back walls for 3D depth) ────────────────────────────────────────────
function Walls() {
  const wallHeight = 120;
  // Left wall
  const leftWallPts: string[] = [];
  for (let r = -1; r <= GRID_ROWS; r++) {
    const { x, y } = toIso(r, -1);
    if (r === -1) {
      leftWallPts.push(`${x - TILE_W / 2},${y + TILE_H / 2 - wallHeight}`);
      leftWallPts.push(`${x - TILE_W / 2},${y + TILE_H / 2}`);
    }
  }
  // Back wall
  const backStart = toIso(-1, -1);
  const backEnd = toIso(-1, GRID_COLS);

  return (
    <g>
      {/* Back wall */}
      <polygon
        points={`
          ${backStart.x - TILE_W / 2},${backStart.y + TILE_H / 2 - wallHeight}
          ${backEnd.x + TILE_W / 2},${backEnd.y + TILE_H / 2 - wallHeight}
          ${backEnd.x + TILE_W / 2},${backEnd.y + TILE_H / 2}
          ${backStart.x - TILE_W / 2},${backStart.y + TILE_H / 2}
        `}
        fill="url(#wallGradientBack)"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.5}
      />
      {/* Left wall */}
      <polygon
        points={`
          ${backStart.x - TILE_W / 2},${backStart.y + TILE_H / 2 - wallHeight}
          ${backStart.x - TILE_W / 2},${backStart.y + TILE_H / 2}
          ${toIso(GRID_ROWS, -1).x - TILE_W / 2},${toIso(GRID_ROWS, -1).y + TILE_H / 2}
          ${toIso(GRID_ROWS, -1).x - TILE_W / 2},${toIso(GRID_ROWS, -1).y + TILE_H / 2 - wallHeight}
        `}
        fill="url(#wallGradientLeft)"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.5}
      />
      {/* Window on back wall */}
      {[2, 5, 8].map((c) => {
        const w = toIso(-1, c);
        const wx = (w.x + toIso(-1, c - 1).x) / 2 + 10;
        const wy = w.y + TILE_H / 2 - wallHeight + 20;
        return (
          <g key={`win-${c}`}>
            <rect x={wx - 18} y={wy} width={36} height={50} rx={2} fill="#0a1628" stroke="rgba(100,150,255,0.2)" strokeWidth={1} />
            <rect x={wx - 15} y={wy + 3} width={30} height={44} rx={1} fill="url(#windowGlow)" opacity={0.6} />
            {/* Window panes */}
            <line x1={wx} y1={wy + 3} x2={wx} y2={wy + 47} stroke="rgba(100,150,255,0.15)" strokeWidth={1} />
            <line x1={wx - 15} y1={wy + 25} x2={wx + 15} y2={wy + 25} stroke="rgba(100,150,255,0.15)" strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
}

// ── Enhanced Desk with Monitor Detail ──────────────────────────────────────────
function Desk({ row, col, agent }: { row: number; col: number; agent?: Agent }) {
  const { x, y } = toIso(row, col);
  const deskY = y - 15;
  const deskW = 36;
  const deskH = 18;
  const deskDepth = 14;

  return (
    <g>
      {/* Desk surface */}
      <polygon
        points={`${x},${deskY} ${x + deskW},${deskY + deskH} ${x},${deskY + deskH * 2} ${x - deskW},${deskY + deskH}`}
        fill="#2d2848"
        stroke="#3d3860"
        strokeWidth={1}
      />
      {/* Desk left face */}
      <polygon
        points={`${x - deskW},${deskY + deskH} ${x},${deskY + deskH * 2} ${x},${deskY + deskH * 2 + deskDepth} ${x - deskW},${deskY + deskH + deskDepth}`}
        fill="#242040"
        stroke="#3d3860"
        strokeWidth={0.5}
      />
      {/* Desk right face */}
      <polygon
        points={`${x},${deskY + deskH * 2} ${x + deskW},${deskY + deskH} ${x + deskW},${deskY + deskH + deskDepth} ${x},${deskY + deskH * 2 + deskDepth}`}
        fill="#1e1a38"
        stroke="#3d3860"
        strokeWidth={0.5}
      />
      {/* Monitor */}
      <g>
        {/* Monitor back/frame */}
        <rect x={x - 14} y={deskY - 26} width={28} height={22} rx={2} fill="#111" stroke="#333" strokeWidth={1} />
        {/* Screen */}
        <rect x={x - 12} y={deskY - 24} width={24} height={16} rx={1} fill={agent ? `${agent.color}33` : "#0a1a3a"}>
          {agent?.status === "working" && (
            <animate attributeName="fill" values={`${agent.color}22;${agent.color}44;${agent.color}22`} dur="3s" repeatCount="indefinite" />
          )}
        </rect>
        {/* Screen content lines */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={x - 9} y={deskY - 21 + i * 4} width={10 + Math.random() * 8} height={1.5} rx={0.5} fill={agent ? `${agent.color}66` : "#1a3a6a"} opacity={0.7} />
        ))}
        {/* Monitor stand */}
        <rect x={x - 3} y={deskY - 4} width={6} height={6} fill="#222" />
        <rect x={x - 8} y={deskY + 1} width={16} height={2} rx={1} fill="#333" />
      </g>
      {/* Keyboard */}
      <polygon
        points={`${x - 8},${deskY + 8} ${x + 4},${deskY + 14} ${x},${deskY + 18} ${x - 12},${deskY + 12}`}
        fill="#1a1a2e"
        stroke="#2a2a4a"
        strokeWidth={0.5}
        opacity={0.8}
      />
      {/* Coffee mug */}
      <ellipse cx={x + 18} cy={deskY + 12} rx={4} ry={2.5} fill="#444" />
      <rect x={x + 14} y={deskY + 8} width={8} height={6} rx={1} fill="#3a3a3a" stroke="#555" strokeWidth={0.5} />
    </g>
  );
}

// ── Enhanced Plants ────────────────────────────────────────────────────────────
function Plant({ row, col, variant = 0 }: { row: number; col: number; variant?: number }) {
  const { x, y } = toIso(row, col);
  const py = y - 5;
  if (variant === 1) {
    // Tall plant
    return (
      <g>
        <rect x={x - 8} y={py - 2} width={16} height={14} rx={3} fill="#5c4033" stroke="#7a5a43" strokeWidth={0.5} />
        <ellipse cx={x} cy={py - 2} rx={9} ry={3} fill="#6b4c38" />
        <rect x={x - 1.5} y={py - 30} width={3} height={28} fill="#2d6b3a" />
        <ellipse cx={x} cy={py - 32} rx={12} ry={10} fill="#22c55e" opacity={0.85} />
        <ellipse cx={x - 6} cy={py - 26} rx={7} ry={6} fill="#16a34a" opacity={0.7} />
        <ellipse cx={x + 5} cy={py - 28} rx={8} ry={7} fill="#15803d" opacity={0.7} />
        <ellipse cx={x - 3} cy={py - 36} rx={6} ry={5} fill="#4ade80" opacity={0.5} />
      </g>
    );
  }
  // Short bushy plant
  return (
    <g>
      <rect x={x - 7} y={py} width={14} height={12} rx={3} fill="#6b4c38" stroke="#7a5a43" strokeWidth={0.5} />
      <ellipse cx={x} cy={py} rx={8} ry={3} fill="#7a5a43" />
      <circle cx={x} cy={py - 10} r={10} fill="#22c55e" opacity={0.8} />
      <circle cx={x - 7} cy={py - 5} r={6} fill="#16a34a" opacity={0.7} />
      <circle cx={x + 6} cy={py - 7} r={7} fill="#15803d" opacity={0.7} />
      <circle cx={x - 2} cy={py - 14} r={5} fill="#4ade80" opacity={0.5} />
    </g>
  );
}

// ── Bookshelf ──────────────────────────────────────────────────────────────────
function Bookshelf({ row, col }: { row: number; col: number }) {
  const { x, y } = toIso(row, col);
  const sy = y - 50;
  const bookColors = ["#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#22c55e", "#eab308"];
  return (
    <g>
      {/* Shelf frame */}
      <rect x={x - 20} y={sy} width={40} height={55} rx={2} fill="#2a2040" stroke="#3d3060" strokeWidth={1} />
      {/* Shelves */}
      {[0, 1, 2].map((shelf) => (
        <g key={shelf}>
          <rect x={x - 18} y={sy + 4 + shelf * 18} width={36} height={2} fill="#3d3060" />
          {/* Books */}
          {[0, 1, 2, 3, 4].map((book) => (
            <rect
              key={book}
              x={x - 16 + book * 7}
              y={sy + 6 + shelf * 18}
              width={5}
              height={12 - Math.random() * 3}
              rx={0.5}
              fill={bookColors[(shelf * 5 + book) % bookColors.length]}
              opacity={0.7}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

// ── Conference Table ───────────────────────────────────────────────────────────
function ConferenceTable() {
  const { x, y } = toIso(1, 3.5);
  const ty = y + 5;
  return (
    <g>
      {/* Table top */}
      <polygon
        points={`${x},${ty - 8} ${x + 50},${ty + 17} ${x},${ty + 42} ${x - 50},${ty + 17}`}
        fill="#3a2820"
        stroke="#5a3830"
        strokeWidth={1.5}
      />
      {/* Table left face */}
      <polygon
        points={`${x - 50},${ty + 17} ${x},${ty + 42} ${x},${ty + 50} ${x - 50},${ty + 25}`}
        fill="#2e1e18"
      />
      {/* Table right face */}
      <polygon
        points={`${x},${ty + 42} ${x + 50},${ty + 17} ${x + 50},${ty + 25} ${x},${ty + 50}`}
        fill="#261812"
      />
      {/* Chairs */}
      {[-20, 0, 20].map((offset, i) => (
        <g key={i}>
          <ellipse cx={x + offset - 20} cy={ty + 30 + offset * 0.3} rx={6} ry={3} fill="#333" opacity={0.6} />
          <ellipse cx={x + offset + 25} cy={ty + 5 + offset * 0.3} rx={6} ry={3} fill="#333" opacity={0.6} />
        </g>
      ))}
      {/* Items on table */}
      <circle cx={x - 15} cy={ty + 14} r={3} fill="#666" stroke="#888" strokeWidth={0.5} />
      <circle cx={x + 10} cy={ty + 22} r={3} fill="#666" stroke="#888" strokeWidth={0.5} />
      <rect x={x - 5} y={ty + 16} width={8} height={5} rx={1} fill="#1a3a6a" stroke="#3b82f6" strokeWidth={0.5} opacity={0.8} />
      {/* Label */}
      <text x={x} y={ty + 65} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={10} fontWeight={600}>
        ☕ Watercooler
      </text>
    </g>
  );
}

// ── Whiteboard ─────────────────────────────────────────────────────────────────
function Whiteboard() {
  const { x, y } = toIso(-0.5, 1);
  const wy = y - 80;
  return (
    <g>
      <rect x={x - 30} y={wy} width={60} height={40} rx={3} fill="#f8f8f0" stroke="#ccc" strokeWidth={1} />
      <rect x={x - 27} y={wy + 3} width={54} height={34} fill="#fff" />
      {/* Scribbles */}
      <line x1={x - 22} y1={wy + 10} x2={x + 5} y2={wy + 10} stroke="#e74c3c" strokeWidth={1.5} opacity={0.6} />
      <line x1={x - 22} y1={wy + 16} x2={x + 15} y2={wy + 16} stroke="#3498db" strokeWidth={1.5} opacity={0.6} />
      <line x1={x - 22} y1={wy + 22} x2={x - 2} y2={wy + 22} stroke="#2ecc71" strokeWidth={1.5} opacity={0.6} />
      <rect x={x + 8} y={wy + 20} width={14} height={10} rx={1} fill="#f1c40f" opacity={0.5} />
    </g>
  );
}

// ── Task Tooltip ───────────────────────────────────────────────────────────────
function TaskTooltip({ x, y, task, color }: { x: number; y: number; task: string; color: string }) {
  const label = task.length > 22 ? task.slice(0, 22) + "…" : task;
  const tw = label.length * 5.5 + 16;
  return (
    <g>
      {/* Tooltip bg */}
      <rect x={x - tw / 2} y={y - 22} width={tw} height={20} rx={6} fill="rgba(0,0,0,0.85)" stroke={`${color}66`} strokeWidth={1} />
      {/* Arrow */}
      <polygon points={`${x - 4},${y - 2} ${x + 4},${y - 2} ${x},${y + 3}`} fill="rgba(0,0,0,0.85)" />
      {/* Text */}
      <text x={x} y={y - 9} textAnchor="middle" fill="#e0e0e0" fontSize={9} fontWeight={500} fontFamily="system-ui, -apple-system, sans-serif">
        {label}
      </text>
    </g>
  );
}

// ── Enhanced Agent Sprite ──────────────────────────────────────────────────────
function AgentSprite({ agent, onClick, isHovered, onHover }: {
  agent: Agent;
  onClick: () => void;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
  const { x, y } = toIso(agent.currentPosition.row, agent.currentPosition.col);
  const atDesk = agent.currentPosition.row === agent.deskPosition.row && agent.currentPosition.col === agent.deskPosition.col;
  const spriteY = atDesk ? y - 45 : y - 30;

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Task tooltip on hover */}
      {isHovered && atDesk && (
        <TaskTooltip x={x} y={spriteY - 12} task={agent.task} color={agent.color} />
      )}

      {/* Shadow */}
      <ellipse cx={x} cy={atDesk ? y + 2 : y + 8} rx={14} ry={5} fill="rgba(0,0,0,0.35)" />

      {/* Legs */}
      <rect x={x - 5} y={spriteY + 28} width={4} height={8} rx={1} fill={`${agent.color}cc`} />
      <rect x={x + 1} y={spriteY + 28} width={4} height={8} rx={1} fill={`${agent.color}aa`} />

      {/* Body */}
      <rect x={x - 9} y={spriteY + 12} width={18} height={18} rx={4} fill={agent.color} opacity={0.95} />
      {/* Body highlight */}
      <rect x={x - 9} y={spriteY + 12} width={9} height={18} rx={4} fill="rgba(255,255,255,0.1)" />

      {/* Head */}
      <circle cx={x} cy={spriteY + 5} r={10} fill="#fcd9b6" />
      {/* Hair */}
      <ellipse cx={x} cy={spriteY - 1} rx={10} ry={6} fill={agent.color} opacity={0.6} />

      {/* Avatar emoji */}
      <text x={x} y={spriteY + 9} textAnchor="middle" fontSize={13}>{agent.avatar}</text>

      {/* Status indicator */}
      <circle cx={x + 13} cy={spriteY - 2} r={5} fill={STATUS_COLORS[agent.status]} stroke="#0d0d1a" strokeWidth={2} />
      <circle cx={x + 13} cy={spriteY - 2} r={5} fill={STATUS_COLORS[agent.status]} opacity={0.4}>
        <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Hover glow */}
      {isHovered && (
        <circle cx={x} cy={spriteY + 15} r={24} fill="none" stroke={agent.color} strokeWidth={1.5} opacity={0.4}>
          <animate attributeName="r" values="24;28;24" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Name */}
      <text x={x} y={spriteY + 46} textAnchor="middle" fill={isHovered ? "#fff" : "#bbb"} fontSize={11} fontWeight={700} fontFamily="system-ui, -apple-system, sans-serif">
        {agent.name}
      </text>
    </g>
  );
}

// ── Isometric Office SVG ───────────────────────────────────────────────────────
function IsometricOffice({ agents, onAgentClick }: {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <svg viewBox="0 100 1200 550" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="wallGradientBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1535" />
          <stop offset="100%" stopColor="#12102a" />
        </linearGradient>
        <linearGradient id="wallGradientLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#151030" />
          <stop offset="100%" stopColor="#0f0d25" />
        </linearGradient>
        <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a6a" />
          <stop offset="60%" stopColor="#0a2040" />
          <stop offset="100%" stopColor="#1a2a4a" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient background */}
      <rect x="0" y="100" width="1200" height="550" fill="#0a0a1a" />

      {/* Walls */}
      <Walls />

      {/* Floor tiles */}
      <Floor />

      {/* Whiteboard on back wall */}
      <Whiteboard />

      {/* Conference table */}
      <ConferenceTable />

      {/* Bookshelves */}
      <Bookshelf row={-0.3} col={6} />

      {/* Desks for each agent */}
      {agents.map((a) => (
        <Desk key={`desk-${a.id}`} row={a.deskPosition.row} col={a.deskPosition.col} agent={a} />
      ))}

      {/* Plants — various positions */}
      <Plant row={-0.5} col={-0.3} variant={1} />
      <Plant row={-0.5} col={4.5} variant={0} />
      <Plant row={3.5} col={0} variant={1} />
      <Plant row={3.5} col={8.5} variant={0} />
      <Plant row={1} col={8} variant={1} />
      <Plant row={-0.5} col={8.5} variant={0} />

      {/* Agents — sorted by depth */}
      {[...agents]
        .sort((a, b) => (a.currentPosition.row + a.currentPosition.col) - (b.currentPosition.row + b.currentPosition.col))
        .map((a) => (
          <AgentSprite
            key={a.id}
            agent={a}
            onClick={() => onAgentClick(a)}
            isHovered={hoveredAgent === a.id}
            onHover={(h) => setHoveredAgent(h ? a.id : null)}
          />
        ))}

      {/* Watermark */}
      <text x={600} y={640} textAnchor="middle" fill="rgba(255,255,255,0.04)" fontSize={11} fontFamily="system-ui">
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
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[status], boxShadow: `0 0 6px ${STATUS_COLORS[status]}80` }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{STATUS_LABELS[status]}</span>
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
  return `${Math.floor(secs / 60)}m ago`;
}

function ActivityPanel({ activities }: { activities: ActivityEvent[] }) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
          📡 Live Activity
        </h3>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: 6 }}>
        {activities.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic", padding: "0.5rem" }}>Waiting for activity…</p>
        )}
        {activities.slice(0, 25).map((ev) => (
          <div key={ev.id} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", borderLeft: "3px solid rgba(99,102,241,0.5)" }}>
            <div style={{ fontSize: 13 }}>
              <strong style={{ color: "#a78bfa" }}>{ev.agent}</strong>{" "}
              <span style={{ color: "var(--text-secondary)" }}>{ev.action}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{timeAgo(ev.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat Panel ─────────────────────────────────────────────────────────────────
function ChatPanel({ agent, messages, onSend, onClose, onSwitchAgent, agents }: {
  agent: Agent;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  onSwitchAgent: (agent: Agent) => void;
  agents: Agent[];
}) {
  const [input, setInput] = useState("");
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [agent.id]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const agentMessages = messages.filter(
    (m) => m.agentName === agent.name || m.sender === "user"
  );

  return (
    <div style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: "0.75rem 1rem",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: `${agent.color}08`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <button
            onClick={() => setShowAgentPicker(!showAgentPicker)}
            style={{
              width: 36, height: 36, borderRadius: 10, fontSize: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${agent.color}22`, border: `2px solid ${agent.color}`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {agent.avatar}
          </button>
          {/* Agent picker dropdown */}
          {showAgentPicker && (
            <div style={{
              position: "absolute", top: 44, left: 0, zIndex: 50,
              background: "#1a1a2e", border: "1px solid var(--border)",
              borderRadius: 10, padding: 6, minWidth: 180,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}>
              {agents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onSwitchAgent(a); setShowAgentPicker(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "8px 10px", border: "none",
                    background: a.id === agent.id ? `${a.color}22` : "transparent",
                    borderRadius: 6, cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (a.id !== agent.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { if (a.id !== agent.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 16 }}>{a.avatar}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[a.status] }} />
                      {STATUS_LABELS[a.status]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[agent.status] }} />
              {STATUS_LABELS[agent.status]} · {agent.model.replace("claude-", "").replace("-", " ")}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "0.75rem",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {agentMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{agent.avatar}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Chat with {agent.name}</div>
            <div style={{ fontSize: 11 }}>Send a message to start the conversation</div>
          </div>
        )}
        {agentMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              maxWidth: "85%",
              padding: "8px 12px",
              borderRadius: msg.sender === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: msg.sender === "user" ? "rgba(99,102,241,0.2)" : `${agent.color}15`,
              border: `1px solid ${msg.sender === "user" ? "rgba(99,102,241,0.3)" : `${agent.color}30`}`,
            }}>
              {msg.sender === "agent" && (
                <div style={{ fontSize: 10, color: agent.color, fontWeight: 700, marginBottom: 3 }}>
                  {agent.name}
                </div>
              )}
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>{msg.text}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3, textAlign: "right" }}>
                {timeAgo(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "0.75rem",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex",
        gap: 8,
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Message ${agent.name}...`}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: input.trim() ? agent.color : "rgba(255,255,255,0.05)",
            color: input.trim() ? "#fff" : "var(--text-muted)",
            cursor: input.trim() ? "pointer" : "default",
            fontSize: 13,
            fontWeight: 700,
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ── Control Button ─────────────────────────────────────────────────────────────
function CtrlBtn({ children, onClick, variant = "default" }: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "primary";
}) {
  const colors = {
    default: { border: "var(--border)", bg: "var(--bg-secondary)", color: "var(--text-primary)", hoverBorder: "rgba(99,102,241,0.6)", hoverBg: "rgba(99,102,241,0.08)" },
    danger: { border: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.08)", color: "#ef4444", hoverBorder: "#ef4444", hoverBg: "rgba(239,68,68,0.15)" },
    primary: { border: "rgba(99,102,241,0.5)", bg: "rgba(99,102,241,0.12)", color: "#818cf8", hoverBorder: "#818cf8", hoverBg: "rgba(99,102,241,0.2)" },
  };
  const c = colors[variant];
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.45rem 1rem", borderRadius: 8,
        border: `1px solid ${c.border}`, background: c.bg,
        color: c.color, fontSize: "0.82rem", fontWeight: 600,
        cursor: "pointer", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = c.hoverBorder; (e.currentTarget as HTMLElement).style.background = c.hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.background = c.bg; }}
    >
      {children}
    </button>
  );
}

// ── Office Page ────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const iv = setInterval(() => {
      setActivities((prev) => [generateActivity(agents), ...prev].slice(0, 50));
    }, 3000);
    return () => clearInterval(iv);
  }, [agents]);

  const handleAgentClick = useCallback((agent: Agent) => {
    setChatAgent(agent);
  }, []);

  const handleChatSend = useCallback((text: string) => {
    if (!chatAgent) return;
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      agentName: chatAgent.name,
      text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    // Mock agent response
    const responses = AGENT_RESPONSES[chatAgent.name] ?? ["Acknowledged."];
    const response = responses[Math.floor(Math.random() * responses.length)];
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "agent",
        agentName: chatAgent.name,
        text: response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, agentMsg]);
    }, 800 + Math.random() * 1200);
  }, [chatAgent]);

  const startChat = useCallback(() => {
    setChatAgent(agents[0]);
  }, [agents]);

  // Controls
  const setAllStatus = useCallback((status: AgentStatus) => {
    setAgents((prev) => prev.map((a) => ({ ...a, status, currentPosition: status === "working" ? { ...a.deskPosition } : a.currentPosition })));
    pushActivity("System", `Set all agents to ${status}`);
  }, []);

  const gather = useCallback(() => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: "walking" as AgentStatus, currentPosition: { row: 1, col: 3.5 } })));
    pushActivity("System", "Called all agents to gather");
    setTimeout(() => setAgents((prev) => prev.map((a) => ({ ...a, status: "chatting" as AgentStatus }))), 2000);
  }, []);

  const runMeeting = useCallback(() => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: "chatting" as AgentStatus, currentPosition: { row: 1, col: 3.5 } })));
    pushActivity("System", "Started team meeting");
  }, []);

  const watercooler = useCallback(() => {
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const chatters = new Set(shuffled.slice(0, 3).map((a) => a.id));
    setAgents((prev) => prev.map((a) => chatters.has(a.id) ? { ...a, status: "chatting" as AgentStatus, currentPosition: { row: 1.5, col: 4.5 } } : a));
    pushActivity("System", `${shuffled.slice(0, 3).map((a) => a.name).join(", ")} went to the watercooler`);
  }, [agents]);

  function pushActivity(agent: string, action: string) {
    setActivities((prev) => [{ id: Math.random().toString(36).substring(2, 9), agent, action, timestamp: new Date() }, ...prev].slice(0, 50));
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Header */}
      <div style={{
        padding: "1.25rem 2rem 1rem",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>🏢 The Office</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.2rem 0 0" }}>
              AI team headquarters — live view
            </p>
          </div>
          <CtrlBtn onClick={startChat} variant="primary">
            💬 + Start Chat
          </CtrlBtn>
        </div>
        <StatusLegend />
      </div>

      {/* Controls */}
      <div style={{
        padding: "0.75rem 2rem",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        alignItems: "center",
        background: "rgba(255,255,255,0.01)",
      }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Scene:</span>
        <CtrlBtn onClick={() => setAllStatus("working")}>💻 All Working</CtrlBtn>
        <CtrlBtn onClick={gather}>📢 Gather</CtrlBtn>
        <CtrlBtn onClick={runMeeting}>🗓️ Run Meeting</CtrlBtn>
        <CtrlBtn onClick={watercooler}>☕ Watercooler</CtrlBtn>
        <CtrlBtn onClick={() => { setAgents(INITIAL_AGENTS); setActivities([]); }} variant="danger">🔄 Reset</CtrlBtn>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        {/* Office canvas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: "1.25rem 1.5rem", gap: "1rem", minWidth: 0 }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "0.5rem",
            overflow: "hidden",
          }}>
            <IsometricOffice agents={agents} onAgentClick={handleAgentClick} />
          </div>

          {/* Agent Grid */}
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "1rem",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>
              Team Status
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentClick(agent)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "0.5rem 0.75rem", borderRadius: 8,
                    border: `1px solid ${chatAgent?.id === agent.id ? agent.color : "var(--border)"}`,
                    background: chatAgent?.id === agent.id ? `${agent.color}12` : "var(--bg-secondary)",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = agent.color; (e.currentTarget as HTMLElement).style.background = `${agent.color}12`; }}
                  onMouseLeave={(e) => {
                    if (chatAgent?.id !== agent.id) {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
                    }
                  }}
                >
                  <span style={{ fontSize: 18 }}>{agent.avatar}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {agent.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[agent.status], flexShrink: 0 }} />
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{STATUS_LABELS[agent.status]}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat or Activity */}
        <div style={{
          width: chatAgent ? 340 : 280,
          minWidth: chatAgent ? 340 : 280,
          padding: "1.25rem 1.25rem 1.25rem 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          gap: "0.75rem",
          transition: "width 0.2s",
        }}>
          {chatAgent ? (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatPanel
                  agent={chatAgent}
                  messages={chatMessages.filter((m) => m.agentName === chatAgent.name)}
                  onSend={handleChatSend}
                  onClose={() => setChatAgent(null)}
                  onSwitchAgent={setChatAgent}
                  agents={agents}
                />
              </div>
              {/* Collapsed activity */}
              <div style={{ height: 180, flexShrink: 0 }}>
                <ActivityPanel activities={activities} />
              </div>
            </>
          ) : (
            <ActivityPanel activities={activities} />
          )}
        </div>
      </div>
    </div>
  );
}