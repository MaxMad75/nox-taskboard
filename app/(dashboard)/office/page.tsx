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
const OFFSET_Y = 120;

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
      const isCenter = r > 0 && r < 3 && c > 2 && c < 7;
      tiles.push(
        <polygon
          key={`${r}-${c}`}
          points={`${x},${y} ${x + TILE_W / 2},${y + TILE_H / 2} ${x},${y + TILE_H} ${x - TILE_W / 2},${y + TILE_H / 2}`}
          fill={isDark ? "#2a2a4a" : "#1f1f3a"}
          stroke={isCenter ? "rgba(74,222,128,0.2)" : "rgba(200,150,255,0.08)"}
          strokeWidth={isCenter ? 0.8 : 0.5}
          opacity={0.95}
        />
      );
    }
  }
  return <>{tiles}</>;
}

// ── Walls (Back walls for 3D depth) ────────────────────────────────────────────
function Walls() {
  const wallHeight = 140;
  // Back wall
  const backStart = toIso(-1, -1);
  const backEnd = toIso(-1, GRID_COLS);

  return (
    <g>
      {/* Back wall main */}
      <polygon
        points={`
          ${backStart.x - TILE_W / 2},${backStart.y + TILE_H / 2 - wallHeight}
          ${backEnd.x + TILE_W / 2},${backEnd.y + TILE_H / 2 - wallHeight}
          ${backEnd.x + TILE_W / 2},${backEnd.y + TILE_H / 2}
          ${backStart.x - TILE_W / 2},${backStart.y + TILE_H / 2}
        `}
        fill="url(#wallGradientBack)"
        stroke="rgba(200,150,255,0.15)"
        strokeWidth={1}
        filter="url(#shadowFilter)"
      />
      {/* Back wall neon accent stripe */}
      <rect
        x={backStart.x - TILE_W / 2}
        y={backStart.y + TILE_H / 2 - 60}
        width={backEnd.x - backStart.x + TILE_W}
        height={8}
        fill="#4ade80"
        opacity={0.15}
        filter="url(#neonFilter)"
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
        stroke="rgba(150,100,255,0.15)"
        strokeWidth={1}
        filter="url(#shadowFilter)"
      />
      
      {/* Windows on back wall with neon glow */}
      {[2, 5, 8].map((c) => {
        const w = toIso(-1, c);
        const wx = (w.x + toIso(-1, c - 1).x) / 2 + 10;
        const wy = w.y + TILE_H / 2 - wallHeight + 20;
        return (
          <g key={`win-${c}`}>
            {/* Glow around window */}
            <rect x={wx - 22} y={wy - 2} width={44} height={54} rx={3} fill="none" stroke="#2a5aff" opacity={0.2} strokeWidth={1.5} filter="url(#neonFilter)" />
            {/* Window frame */}
            <rect x={wx - 18} y={wy} width={36} height={50} rx={2} fill="#051428" stroke="#2a5aff" strokeWidth={1} filter="url(#shadowFilter)" />
            {/* Screen glow */}
            <rect x={wx - 15} y={wy + 3} width={30} height={44} rx={1} fill="url(#windowGlow)" opacity={0.8} />
            {/* Window panes */}
            <line x1={wx} y1={wy + 3} x2={wx} y2={wy + 47} stroke="#1a4aff" strokeWidth={1} opacity={0.4} />
            <line x1={wx - 15} y1={wy + 25} x2={wx + 15} y2={wy + 25} stroke="#1a4aff" strokeWidth={1} opacity={0.4} />
            {/* Scanline effect */}
            <g opacity={0.3}>
              <line x1={wx - 15} y1={wy + 8} x2={wx + 15} y2={wy + 8} stroke="#0aff00" strokeWidth={0.5} />
              <line x1={wx - 15} y1={wy + 16} x2={wx + 15} y2={wy + 16} stroke="#0aff00" strokeWidth={0.5} />
              <line x1={wx - 15} y1={wy + 24} x2={wx + 15} y2={wy + 24} stroke="#0aff00" strokeWidth={0.5} />
              <line x1={wx - 15} y1={wy + 32} x2={wx + 15} y2={wy + 32} stroke="#0aff00" strokeWidth={0.5} />
              <line x1={wx - 15} y1={wy + 40} x2={wx + 15} y2={wy + 40} stroke="#0aff00" strokeWidth={0.5} />
            </g>
          </g>
        );
      })}
      
      {/* Posters on back wall */}
      {[1, 4, 7].map((c, i) => {
        const p = toIso(-1, c);
        const px = (p.x + toIso(-1, c - 1).x) / 2 + 8;
        const py = p.y + TILE_H / 2 - 45;
        const colors = ["#ef4444", "#3b82f6", "#8b5cf6"];
        return (
          <g key={`poster-${c}`}>
            <rect x={px - 12} y={py} width={24} height={32} rx={1} fill={colors[i]} opacity={0.2} stroke={colors[i]} strokeWidth={1} filter="url(#shadowFilter)" />
            <rect x={px - 11} y={py + 2} width={6} height={10} fill="rgba(255,255,255,0.1)" />
            <rect x={px - 3} y={py + 2} width={6} height={10} fill="rgba(255,255,255,0.08)" />
            <rect x={px + 5} y={py + 2} width={6} height={10} fill="rgba(255,255,255,0.06)" />
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
      {/* Desk surface with gradient */}
      <defs>
        <linearGradient id={`deskGrad-${col}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3555" />
          <stop offset="100%" stopColor="#2a2040" />
        </linearGradient>
      </defs>
      {/* Desk surface */}
      <polygon
        points={`${x},${deskY} ${x + deskW},${deskY + deskH} ${x},${deskY + deskH * 2} ${x - deskW},${deskY + deskH}`}
        fill={`url(#deskGrad-${col})`}
        stroke="rgba(74,222,128,0.2)"
        strokeWidth={1.2}
        filter="url(#shadowFilter)"
      />
      {/* Desk left face */}
      <polygon
        points={`${x - deskW},${deskY + deskH} ${x},${deskY + deskH * 2} ${x},${deskY + deskH * 2 + deskDepth} ${x - deskW},${deskY + deskH + deskDepth}`}
        fill="#1a1530"
        stroke="rgba(100,100,150,0.2)"
        strokeWidth={0.5}
      />
      {/* Desk right face */}
      <polygon
        points={`${x},${deskY + deskH * 2} ${x + deskW},${deskY + deskH} ${x + deskW},${deskY + deskH + deskDepth} ${x},${deskY + deskH * 2 + deskDepth}`}
        fill="#0f0a1a"
        stroke="rgba(100,100,150,0.2)"
        strokeWidth={0.5}
      />
      {/* Monitor */}
      <g filter="url(#shadowFilter)">
        {/* Monitor back/frame */}
        <rect x={x - 14} y={deskY - 26} width={28} height={22} rx={2} fill="#0a0515" stroke={agent ? agent.color : "#4ade80"} strokeWidth={1.5} opacity={0.9} />
        {/* Monitor glow */}
        <rect x={x - 14} y={deskY - 26} width={28} height={22} rx={2} fill="none" stroke={agent ? agent.color : "#4ade80"} strokeWidth={2} opacity={0.3} filter="url(#neonFilter)" />
        {/* Screen with agent color */}
        <defs>
          <linearGradient id={`screenGrad-${col}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={agent ? `${agent.color}44` : "#0a2a4a"} />
            <stop offset="100%" stopColor={agent ? `${agent.color}22` : "#0a1a3a"} />
          </linearGradient>
        </defs>
        <rect x={x - 12} y={deskY - 24} width={24} height={16} rx={1} fill={`url(#screenGrad-${col})`}>
          {agent?.status === "working" && (
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite" />
          )}
        </rect>
        {/* Screen content lines - more detailed */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={x - 9} y={deskY - 21 + i * 4} width={10 + (i * 2)} height={1} rx={0.5} fill={agent ? agent.color : "#4ade80"} opacity={0.6} />
            {agent?.status === "working" && (
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            )}
          </g>
        ))}
        {/* Monitor stand */}
        <rect x={x - 3} y={deskY - 4} width={6} height={6} fill="#1a1a2e" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
        <rect x={x - 8} y={deskY + 1} width={16} height={2} rx={1} fill="#2a2a4a" stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
      </g>
      {/* Keyboard with better detail */}
      <polygon
        points={`${x - 8},${deskY + 8} ${x + 4},${deskY + 14} ${x},${deskY + 18} ${x - 12},${deskY + 12}`}
        fill="#0f0a1a"
        stroke="rgba(74,222,128,0.15)"
        strokeWidth={0.5}
        opacity={0.9}
      />
      {/* Keyboard keys detail */}
      <g opacity={0.4}>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={x - 8 + i * 4} y={deskY + 10} width={3} height={2} rx={0.5} fill={agent ? agent.color : "#4ade80"} />
        ))}
      </g>
      {/* Coffee mug */}
      <ellipse cx={x + 18} cy={deskY + 12} rx={4} ry={2.5} fill="#5a4a3a" opacity={0.7} filter="url(#shadowFilter)" />
      <rect x={x + 14} y={deskY + 8} width={8} height={6} rx={1} fill="#4a3a2a" stroke="rgba(200,150,100,0.3)" strokeWidth={0.5} opacity={0.8} />
      {/* Mug steam */}
      {[0, 1].map((i) => (
        <path key={i} d={`M ${x + 18 + i * 1} ${deskY + 7} Q ${x + 17 + i} ${deskY + 2} ${x + 19 + i} ${deskY - 1}`} stroke={agent ? agent.color : "#4ade80"} strokeWidth={0.5} fill="none" opacity={0.3}>
          <animate attributeName="opacity" values="0;0.4;0" dur="2.5s" repeatCount="indefinite" />
        </path>
      ))}
    </g>
  );
}

// ── Enhanced Plants ────────────────────────────────────────────────────────────
function Plant({ row, col, variant = 0 }: { row: number; col: number; variant?: number }) {
  const { x, y } = toIso(row, col);
  const py = y - 5;
  if (variant === 1) {
    // Tall plant with neon glow
    return (
      <g filter="url(#shadowFilter)">
        <rect x={x - 8} y={py - 2} width={16} height={14} rx={3} fill="#6b5a4a" stroke="rgba(74,222,128,0.3)" strokeWidth={0.8} />
        <ellipse cx={x} cy={py - 2} rx={9} ry={3} fill="#7a6a5a" />
        <rect x={x - 1.5} y={py - 30} width={3} height={28} fill="#3a7a4a" />
        {/* Main leaves with glow */}
        <ellipse cx={x} cy={py - 32} rx={12} ry={10} fill="#22c55e" opacity={0.9} filter="url(#neonFilter)" />
        <ellipse cx={x} cy={py - 32} rx={12} ry={10} fill="none" stroke="#4ade80" strokeWidth={1} opacity={0.4} />
        <ellipse cx={x - 6} cy={py - 26} rx={7} ry={6} fill="#16a34a" opacity={0.85} filter="url(#neonFilter)" />
        <ellipse cx={x + 5} cy={py - 28} rx={8} ry={7} fill="#15803d" opacity={0.8} filter="url(#neonFilter)" />
        <ellipse cx={x - 3} cy={py - 36} rx={6} ry={5} fill="#4ade80" opacity={0.7} filter="url(#neonFilter)" />
      </g>
    );
  }
  // Short bushy plant with enhanced glow
  return (
    <g filter="url(#shadowFilter)">
      <rect x={x - 7} y={py} width={14} height={12} rx={3} fill="#7a6a5a" stroke="rgba(74,222,128,0.3)" strokeWidth={0.8} />
      <ellipse cx={x} cy={py} rx={8} ry={3} fill="#8a7a6a" />
      <circle cx={x} cy={py - 10} r={10} fill="#22c55e" opacity={0.9} filter="url(#neonFilter)" />
      <circle cx={x} cy={py - 10} r={10} fill="none" stroke="#4ade80" strokeWidth={0.8} opacity={0.3} />
      <circle cx={x - 7} cy={py - 5} r={6} fill="#16a34a" opacity={0.85} filter="url(#neonFilter)" />
      <circle cx={x + 6} cy={py - 7} r={7} fill="#15803d" opacity={0.8} filter="url(#neonFilter)" />
      <circle cx={x - 2} cy={py - 14} r={5} fill="#4ade80" opacity={0.75} filter="url(#neonFilter)" />
    </g>
  );
}

// ── Bookshelf ──────────────────────────────────────────────────────────────────
function Bookshelf({ row, col }: { row: number; col: number }) {
  const { x, y } = toIso(row, col);
  const sy = y - 50;
  const bookColors = ["#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#22c55e", "#eab308"];
  return (
    <g filter="url(#shadowFilter)">
      {/* Shelf frame with gradient */}
      <defs>
        <linearGradient id="shelfGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a3050" />
          <stop offset="100%" stopColor="#2a1a40" />
        </linearGradient>
      </defs>
      <rect x={x - 20} y={sy} width={40} height={55} rx={2} fill="url(#shelfGrad)" stroke="rgba(200,150,255,0.2)" strokeWidth={1.2} />
      {/* Shelves */}
      {[0, 1, 2].map((shelf) => (
        <g key={shelf}>
          <rect x={x - 18} y={sy + 4 + shelf * 18} width={36} height={2} fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.2)" strokeWidth={0.5} />
          {/* Books with vibrant colors and glow */}
          {[0, 1, 2, 3, 4].map((book) => {
            const bookColor = bookColors[(shelf * 5 + book) % bookColors.length];
            const bookHeight = 12 - Math.random() * 3;
            return (
              <g key={book}>
                <rect
                  x={x - 16 + book * 7}
                  y={sy + 6 + shelf * 18}
                  width={5}
                  height={bookHeight}
                  rx={0.5}
                  fill={bookColor}
                  opacity={0.8}
                  filter="url(#neonFilter)"
                />
                <rect
                  x={x - 16 + book * 7}
                  y={sy + 6 + shelf * 18}
                  width={5}
                  height={bookHeight}
                  rx={0.5}
                  fill="none"
                  stroke={bookColor}
                  strokeWidth={0.5}
                  opacity={0.4}
                />
              </g>
            );
          })}
        </g>
      ))}
      {/* Bookshelf glow accent */}
      <rect x={x - 20} y={sy} width={40} height={55} rx={2} fill="none" stroke="rgba(74,222,128,0.1)" strokeWidth={2} filter="url(#neonFilter)" />
    </g>
  );
}

// ── Conference Table ───────────────────────────────────────────────────────────
function ConferenceTable() {
  const { x, y } = toIso(1, 3.5);
  const ty = y + 5;
  return (
    <g filter="url(#shadowFilter)">
      {/* Table top with gradient */}
      <defs>
        <linearGradient id="tableGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5a4a3a" />
          <stop offset="100%" stopColor="#3a2820" />
        </linearGradient>
      </defs>
      <polygon
        points={`${x},${ty - 8} ${x + 50},${ty + 17} ${x},${ty + 42} ${x - 50},${ty + 17}`}
        fill="url(#tableGrad)"
        stroke="rgba(74,222,128,0.15)"
        strokeWidth={1.8}
      />
      {/* Table top neon accent */}
      <line x1={x - 40} y1={ty + 8} x2={x + 40} y2={ty + 28} stroke="#4ade80" strokeWidth={0.6} opacity={0.2} filter="url(#neonFilter)" />
      {/* Table left face */}
      <polygon
        points={`${x - 50},${ty + 17} ${x},${ty + 42} ${x},${ty + 50} ${x - 50},${ty + 25}`}
        fill="#2e1e18"
        stroke="rgba(100,100,150,0.15)"
        strokeWidth={0.5}
      />
      {/* Table right face */}
      <polygon
        points={`${x},${ty + 42} ${x + 50},${ty + 17} ${x + 50},${ty + 25} ${x},${ty + 50}`}
        fill="#1a1010"
        stroke="rgba(100,100,150,0.15)"
        strokeWidth={0.5}
      />
      {/* Chairs with color variation */}
      {[-20, 0, 20].map((offset, i) => (
        <g key={i} opacity={0.7}>
          <ellipse cx={x + offset - 20} cy={ty + 30 + offset * 0.3} rx={6} ry={3} fill="#4a3a3a" stroke="rgba(74,222,128,0.2)" strokeWidth={0.5} />
          <ellipse cx={x + offset + 25} cy={ty + 5 + offset * 0.3} rx={6} ry={3} fill="#4a3a3a" stroke="rgba(74,222,128,0.2)" strokeWidth={0.5} />
        </g>
      ))}
      {/* Items on table */}
      <circle cx={x - 15} cy={ty + 14} r={3} fill="#8a7a7a" stroke="#4ade80" strokeWidth={0.5} opacity={0.6} filter="url(#neonFilter)" />
      <circle cx={x + 10} cy={ty + 22} r={3} fill="#8a7a7a" stroke="#4ade80" strokeWidth={0.5} opacity={0.6} filter="url(#neonFilter)" />
      {/* Tablet/device on table */}
      <rect x={x - 5} y={ty + 16} width={8} height={5} rx={1} fill="#0a2a5a" stroke="#3b82f6" strokeWidth={0.8} opacity={0.9} filter="url(#neonFilter)" />
      <rect x={x - 4} y={ty + 17} width={6} height={3} fill="#2a5aff" opacity={0.4} />
      {/* Label */}
      <text x={x} y={ty + 65} textAnchor="middle" fill="rgba(74,222,128,0.3)" fontSize={10} fontWeight={600} filter="url(#neonFilter)">
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
    <g filter="url(#shadowFilter)">
      {/* Board frame */}
      <rect x={x - 30} y={wy} width={60} height={40} rx={3} fill="#e8e8e0" stroke="#aaa" strokeWidth={1.5} />
      {/* Board surface */}
      <rect x={x - 27} y={wy + 3} width={54} height={34} fill="#fafaf8" />
      {/* Board content with enhanced detail */}
      {/* Title */}
      <text x={x - 20} y={wy + 12} fill="#333" fontSize={7} fontWeight={700}>AI Team Standup</text>
      {/* Scribbles - better organized */}
      <line x1={x - 22} y1={wy + 16} x2={x - 2} y2={wy + 16} stroke="#ef4444" strokeWidth={1.5} opacity={0.7} />
      <line x1={x - 22} y1={wy + 22} x2={x + 10} y2={wy + 22} stroke="#3b82f6" strokeWidth={1.5} opacity={0.7} />
      <line x1={x - 22} y1={wy + 28} x2={x - 5} y2={wy + 28} stroke="#22c55e" strokeWidth={1.5} opacity={0.7} />
      {/* Sticky note */}
      <rect x={x + 8} y={wy + 18} width={14} height={12} rx={1} fill="#fcd34d" opacity={0.8} stroke="#f59e0b" strokeWidth={0.5} filter="url(#neonFilter)" />
      <text x={x + 15} y={wy + 25} textAnchor="middle" fill="#333" fontSize={5} fontWeight={600}>PRs</text>
      {/* Grid lines */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x - 25} y1={wy + 8 + i * 10} x2={x + 25} y2={wy + 8 + i * 10} stroke="rgba(0,0,0,0.03)" strokeWidth={0.5} />
      ))}
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
      filter="url(#shadowFilter)"
    >
      {/* Task tooltip on hover */}
      {isHovered && atDesk && (
        <TaskTooltip x={x} y={spriteY - 12} task={agent.task} color={agent.color} />
      )}

      {/* Shadow with color tint */}
      <ellipse cx={x} cy={atDesk ? y + 2 : y + 8} rx={14} ry={5} fill={`${agent.color}30`} opacity={0.4} />

      {/* Legs with glow */}
      <rect x={x - 5} y={spriteY + 28} width={4} height={8} rx={1} fill={`${agent.color}dd`} filter="url(#neonFilter)" />
      <rect x={x + 1} y={spriteY + 28} width={4} height={8} rx={1} fill={`${agent.color}bb`} filter="url(#neonFilter)" />

      {/* Body with gradient and glow */}
      <defs>
        <linearGradient id={`bodyGrad-${agent.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={agent.color} stopOpacity="1" />
          <stop offset="100%" stopColor={agent.color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x={x - 9} y={spriteY + 12} width={18} height={18} rx={4} fill={`url(#bodyGrad-${agent.id})`} opacity={0.95} filter="url(#neonFilter)" />
      {/* Body highlight */}
      <rect x={x - 9} y={spriteY + 12} width={9} height={18} rx={4} fill="rgba(255,255,255,0.15)" />
      {/* Body glow outline */}
      <rect x={x - 9} y={spriteY + 12} width={18} height={18} rx={4} fill="none" stroke={agent.color} strokeWidth={0.8} opacity={0.3} />

      {/* Head */}
      <circle cx={x} cy={spriteY + 5} r={10} fill="#fcd9b6" filter="url(#shadowFilter)" />
      {/* Hair with agent color */}
      <ellipse cx={x} cy={spriteY - 1} rx={10} ry={6} fill={agent.color} opacity={0.7} filter="url(#neonFilter)" />

      {/* Avatar emoji */}
      <text x={x} y={spriteY + 9} textAnchor="middle" fontSize={13} filter="url(#neonFilter)">{agent.avatar}</text>

      {/* Status indicator with enhanced glow */}
      <circle cx={x + 13} cy={spriteY - 2} r={5} fill={STATUS_COLORS[agent.status]} stroke="#0d0d1a" strokeWidth={2} filter="url(#neonFilter)" />
      <circle cx={x + 13} cy={spriteY - 2} r={5} fill={STATUS_COLORS[agent.status]} opacity={0.5}>
        <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Status glow */}
      <circle cx={x + 13} cy={spriteY - 2} r={6} fill="none" stroke={STATUS_COLORS[agent.status]} strokeWidth={0.5} opacity={0.3}>
        <animate attributeName="r" values="6;10;6" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Hover glow — enhanced */}
      {isHovered && (
        <>
          <circle cx={x} cy={spriteY + 15} r={24} fill="none" stroke={agent.color} strokeWidth={2} opacity={0.5}>
            <animate attributeName="r" values="24;32;24" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={spriteY + 15} r={20} fill={agent.color} opacity={0.08} />
        </>
      )}

      {/* Name with glow on hover */}
      <text x={x} y={spriteY + 46} textAnchor="middle" fill={isHovered ? agent.color : "#ccc"} fontSize={11} fontWeight={700} fontFamily="system-ui, -apple-system, sans-serif" filter={isHovered ? "url(#neonFilter)" : undefined}>
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
    <svg viewBox="0 0 1200 700" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="wallGradientBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1a50" />
          <stop offset="100%" stopColor="#0f0a20" />
        </linearGradient>
        <linearGradient id="wallGradientLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f1535" />
          <stop offset="100%" stopColor="#0a0515" />
        </linearGradient>
        <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a5aff" />
          <stop offset="60%" stopColor="#0a3aff" />
          <stop offset="100%" stopColor="#1a3a8a" />
        </linearGradient>
        <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neonFilter">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="shadowFilter">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="3" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="offsetblur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient background with gradient */}
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1a0f30" />
          <stop offset="100%" stopColor="#0a0515" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="700" fill="url(#bgGradient)" />

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
      <text x={600} y={670} textAnchor="middle" fill="rgba(74,222,128,0.08)" fontSize={11} fontFamily="system-ui" filter="url(#neonFilter)">
        ✦ Mission Control — Office Floor ✦
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