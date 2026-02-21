"use client";

import {
  Users,
  Cpu,
  Feather,
  Palette,
  Zap,
  Radar,
  Star,
  ArrowRight,
  GitBranch,
  Layers,
} from "lucide-react";

// ── Agent Data ─────────────────────────────────────────────────────────

type Layer = "leadership" | "core" | "development" | "content" | "growth";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  color: string;
  glowColor: string;
  emoji: string;
  layer: Layer;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  note?: string;
}

const AGENTS: Agent[] = [
  {
    id: "henry",
    name: "Henry",
    role: "Chief of Staff",
    description:
      "Orchestrates the entire AI fleet. Delegates tasks, maintains candy, and ensures every agent is firing on all cylinders. The maestro behind the mission.",
    skills: ["Orchestration", "Candy", "Delegation"],
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.2)",
    emoji: "👑",
    layer: "leadership",
    icon: Star,
    note: "Basti",
  },
  {
    id: "nox",
    name: "Nox",
    role: "Mission Control",
    description:
      "Central nervous system of the operation. Monitors all systems, coordinates cross-agent workflows, and keeps the household running smooth 24/7.",
    skills: ["Systems", "Coordination", "Monitoring"],
    color: "#6366f1",
    glowColor: "rgba(99, 102, 241, 0.2)",
    emoji: "🦊",
    layer: "core",
    icon: Cpu,
    note: "Me",
  },
  {
    id: "codex",
    name: "Codex",
    role: "Lead Engineer",
    description:
      "Writes clean code, architects reliable systems, and debugs the things nobody else wants to touch. Ships fast, breaks nothing.",
    skills: ["Code", "Systems", "Reliability"],
    color: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.2)",
    emoji: "⚙️",
    layer: "development",
    icon: GitBranch,
  },
  {
    id: "quill",
    name: "Quill",
    role: "Content Writer",
    description:
      "Crafts every word with intention. Manages voice, ensures quality across all content, and brings the human touch that makes messages land.",
    skills: ["Voice", "Quality", "Design"],
    color: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.2)",
    emoji: "✍️",
    layer: "content",
    icon: Feather,
  },
  {
    id: "pixel",
    name: "Pixel",
    role: "Designer",
    description:
      "Commands every pixel with purpose. Creates visual systems that stop scrolls, drive attention, and make the brand impossible to ignore.",
    skills: ["Visual", "Attention", "Style"],
    color: "#8b5cf6",
    glowColor: "rgba(139, 92, 246, 0.2)",
    emoji: "🎨",
    layer: "content",
    icon: Palette,
  },
  {
    id: "echo",
    name: "Echo",
    role: "Social Media Manager",
    description:
      "Moves at the speed of the feed. Turns ideas into viral moments, manages community signals, and keeps the brand loud and present.",
    skills: ["Viral", "Speed", "Reach"],
    color: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.2)",
    emoji: "📡",
    layer: "growth",
    icon: Zap,
  },
  {
    id: "scout",
    name: "Scout",
    role: "Trend Analyst",
    description:
      "Always 48 hours ahead of the curve. Scans signals, reads the culture, and feeds the team intel before trends become obvious.",
    skills: ["Radar", "Intuition", "Signals"],
    color: "#14b8a6",
    glowColor: "rgba(20, 184, 166, 0.2)",
    emoji: "🔭",
    layer: "growth",
    icon: Radar,
  },
];

const LAYER_META: Record<
  Layer,
  { label: string; color: string; bg: string }
> = {
  leadership: { label: "Leadership",          color: "#f59e0b", bg: "rgba(245,158,11,0.06)"  },
  core:        { label: "Core",               color: "#6366f1", bg: "rgba(99,102,241,0.06)"  },
  development: { label: "Development Layer",  color: "#3b82f6", bg: "rgba(59,130,246,0.06)"  },
  content:     { label: "Content & Design",   color: "#ec4899", bg: "rgba(236,72,153,0.06)"  },
  growth:      { label: "Growth & Operations",color: "#14b8a6", bg: "rgba(20,184,166,0.06)"  },
};

// ── Skill Badge ────────────────────────────────────────────────────────
function SkillBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.55rem",
        borderRadius: 6,
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}

// ── Agent Card ─────────────────────────────────────────────────────────
function AgentCard({ agent }: { agent: Agent }) {
  const Icon = agent.icon;
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: 14,
        border: `1px solid ${agent.color}33`,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        boxShadow: `0 0 20px ${agent.glowColor}`,
        transition: "transform 0.15s, box-shadow 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 30px ${agent.glowColor}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${agent.glowColor}`;
      }}
    >
      {/* Subtle top-left corner accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 60,
          height: 60,
          background: `radial-gradient(circle at top left, ${agent.color}18, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${agent.color}55, ${agent.color}22)`,
            border: `1.5px solid ${agent.color}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            flexShrink: 0,
          }}
        >
          {agent.emoji}
        </div>

        {/* Name + Role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{agent.name}</span>
            {agent.note && (
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "0.1rem 0.4rem",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                {agent.note}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              marginTop: "0.15rem",
            }}
          >
            <Icon size={12} color={agent.color} />
            <span style={{ fontSize: "0.78rem", color: agent.color, fontWeight: 600 }}>
              {agent.role}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {agent.description}
      </p>

      {/* Skill badges */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {agent.skills.map((s) => (
          <SkillBadge key={s} label={s} color={agent.color} />
        ))}
      </div>
    </div>
  );
}

// ── Org Chart ──────────────────────────────────────────────────────────
function OrgNode({
  agent,
  compact = false,
}: {
  agent: Agent;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      <div
        style={{
          width: compact ? 44 : 52,
          height: compact ? 44 : 52,
          borderRadius: compact ? 10 : 12,
          background: `linear-gradient(135deg, ${agent.color}55, ${agent.color}22)`,
          border: `2px solid ${agent.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? "1.1rem" : "1.3rem",
          boxShadow: `0 0 12px ${agent.color}44`,
        }}
      >
        {agent.emoji}
      </div>
      <span
        style={{
          fontSize: compact ? "0.7rem" : "0.75rem",
          fontWeight: 700,
          color: agent.color,
          textAlign: "center",
        }}
      >
        {agent.name}
      </span>
      <span
        style={{
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: 70,
          lineHeight: 1.3,
        }}
      >
        {agent.role}
      </span>
    </div>
  );
}

function OrgConnector({
  color = "var(--border)",
  horizontal = false,
}: {
  color?: string;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: `linear-gradient(180deg, ${color}66, ${color}22)`,
        alignSelf: "center",
      }}
    />
  );
}

function OrgChart() {
  const henry = AGENTS.find((a) => a.id === "henry")!;
  const nox = AGENTS.find((a) => a.id === "nox")!;
  const codex = AGENTS.find((a) => a.id === "codex")!;
  const quill = AGENTS.find((a) => a.id === "quill")!;
  const pixel = AGENTS.find((a) => a.id === "pixel")!;
  const echo = AGENTS.find((a) => a.id === "echo")!;
  const scout = AGENTS.find((a) => a.id === "scout")!;

  const branches = [
    {
      label: "Development",
      color: LAYER_META.development.color,
      agents: [codex],
    },
    {
      label: "Content & Design",
      color: LAYER_META.content.color,
      agents: [quill, pixel],
    },
    {
      label: "Growth & Ops",
      color: LAYER_META.growth.color,
      agents: [echo, scout],
    },
  ];

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        padding: "2rem 1.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />

      {/* META LAYER label */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 16,
          fontSize: "0.6rem",
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        <Layers size={10} color="var(--text-muted)" />
        META LAYER
      </div>

      {/* Henry — top */}
      <OrgNode agent={henry} />
      <OrgConnector color={henry.color} />

      {/* Nox — core */}
      <OrgNode agent={nox} />
      <OrgConnector color={nox.color} />

      {/* Branch row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          width: "100%",
          maxWidth: 560,
        }}
      >
        {branches.map((branch, bi) => (
          <div
            key={branch.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Horizontal connector segments */}
            {bi === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  right: 0,
                  height: 1,
                  background: `${nox.color}44`,
                }}
              />
            )}
            {bi === 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `${nox.color}44`,
                }}
              />
            )}
            {bi === 2 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: "50%",
                  height: 1,
                  background: `${nox.color}44`,
                }}
              />
            )}

            {/* Vertical drop */}
            <div
              style={{
                width: 1,
                height: 20,
                background: `${branch.color}55`,
              }}
            />

            {/* Branch label */}
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: branch.color,
                marginBottom: "0.5rem",
                textAlign: "center",
                padding: "0.15rem 0.4rem",
                borderRadius: 4,
                background: `${branch.color}15`,
                border: `1px solid ${branch.color}33`,
              }}
            >
              {branch.label}
            </span>

            {/* Agent nodes */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
              }}
            >
              {branch.agents.map((a) => (
                <OrgNode key={a.id} agent={a} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Flow Bar ───────────────────────────────────────────────────────────
function FlowBar() {
  const steps = [
    { label: "INPUT SIGNAL", color: "#3b82f6", icon: "📥" },
    { label: "SCOUT detects", color: "#14b8a6", icon: "🔭" },
    { label: "HENRY routes", color: "#f59e0b", icon: "👑" },
    { label: "AGENTS act", color: "#6366f1", icon: "⚡" },
    { label: "OUTPUT ACTION", color: "#22c55e", icon: "📤" },
  ];

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: "0.85rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        overflowX: "auto",
      }}
    >
      {steps.map((step, i) => (
        <div
          key={step.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0.7rem",
              borderRadius: 8,
              background: `${step.color}15`,
              border: `1px solid ${step.color}33`,
            }}
          >
            <span style={{ fontSize: "0.8rem" }}>{step.icon}</span>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: step.color,
                textTransform: "uppercase",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={14} color="var(--text-muted)" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Layer Section ──────────────────────────────────────────────────────
function LayerSection({
  layer,
  agents,
}: {
  layer: Layer;
  agents: Agent[];
}) {
  const meta = LAYER_META[layer];
  return (
    <div>
      {/* Layer header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "0.85rem",
        }}
      >
        <div
          style={{
            width: 3,
            height: 18,
            borderRadius: 2,
            background: meta.color,
          }}
        />
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(90deg, ${meta.color}33, transparent)`,
          }}
        />
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(agents.length, 2)}, 1fr)`,
          gap: "0.85rem",
        }}
      >
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export default function TeamPage() {
  const layers: Layer[] = ["leadership", "core", "development", "content", "growth"];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.75rem 2rem",
        overflowY: "auto",
        gap: "1.75rem",
      }}
    >
      {/* ── Header ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Meet the Team
          </h1>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginLeft: 48 }}>
          7 specialized AI agents. One unified mission. Every input turns into action.
        </p>
      </div>

      {/* ── Flow Visualization ── */}
      <FlowBar />

      {/* ── Org Chart + Cards split ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Org Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Org Structure
          </span>
          <OrgChart />
        </div>

        {/* Cards right side — show leadership + core */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {layers
            .filter((l) => l === "leadership" || l === "core")
            .map((layer) => {
              const layerAgents = AGENTS.filter((a) => a.layer === layer);
              return (
                <LayerSection key={layer} layer={layer} agents={layerAgents} />
              );
            })}
        </div>
      </div>

      {/* ── Agent cards — all layers below ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {layers
          .filter((l) => l !== "leadership" && l !== "core")
          .map((layer) => {
            const layerAgents = AGENTS.filter((a) => a.layer === layer);
            return (
              <LayerSection key={layer} layer={layer} agents={layerAgents} />
            );
          })}
      </div>

      {/* ── Footer tagline ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1rem",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#3b82f6",
          }}
        >
          INPUT SIGNAL
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, #3b82f644, #6366f155, #22c55e44)",
            maxWidth: 200,
          }}
        />
        <ArrowRight size={14} color="var(--text-muted)" />
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}
        >
          7 agents, zero excuses
        </span>
        <ArrowRight size={14} color="var(--text-muted)" />
        <div
          style={{
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, #22c55e44, #6366f155, #3b82f644)",
            maxWidth: 200,
          }}
        />
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#22c55e",
          }}
        >
          OUTPUT ACTION
        </span>
      </div>
    </div>
  );
}
