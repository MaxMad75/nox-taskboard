"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Brain, BookOpen, Clock, FileText, Hash } from "lucide-react";

interface Section {
  time: string | null;
  title: string;
  body: string;
}

interface MemoryEntry {
  id: string;
  filename: string;
  title: string;
  category: "long-term" | "journal";
  date: string | null;
  content: string;
  wordCount: number;
  fileSize: number;
  modifiedAt: number;
  sections: Section[];
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function getTimeGroup(dateStr: string | null): string {
  if (!dateStr) return "Long-Term Memory";
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 30) return "This Month";
  return d.getFullYear().toString();
}

function renderMarkdownLine(text: string) {
  // Bold
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>');
  // Inline code
  result = result.replace(/`(.+?)`/g, '<code style="background:#1e2345;padding:2px 6px;border-radius:4px;font-size:0.85em;color:#a78bfa">$1</code>');
  // Links
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6366f1;text-decoration:underline">$1</a>');
  return result;
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selected, setSelected] = useState<MemoryEntry | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMemory = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setEntries(data.entries || []);
      if (!selected && data.entries?.length > 0) {
        setSelected(data.entries[0]);
      }
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMemory("");
  }, [fetchMemory]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchMemory(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchMemory]);

  // Group entries
  const groups: Record<string, MemoryEntry[]> = {};
  for (const entry of entries) {
    const group = entry.category === "long-term" ? "Long-Term Memory" : getTimeGroup(entry.date);
    if (!groups[group]) groups[group] = [];
    groups[group].push(entry);
  }

  const groupOrder = ["Long-Term Memory", "Today", "Yesterday", "This Week", "This Month"];

  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return b.localeCompare(a); // years descending
  });

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left Sidebar - Memory List */}
      <div
        style={{
          width: 320,
          minWidth: 320,
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Search */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-primary)",
              borderRadius: 8,
              padding: "8px 12px",
              border: "1px solid var(--border)",
            }}
          >
            <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search memory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 14,
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Entry List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loading && entries.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : (
            sortedGroupKeys.map((group) => (
              <div key={group} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: group === "Long-Term Memory" ? "#a78bfa" : "var(--text-muted)",
                    padding: "4px 8px",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {group === "Long-Term Memory" ? <Brain size={12} /> : <BookOpen size={12} />}
                  {group}
                </div>
                {groups[group].map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: selected?.id === entry.id ? "var(--bg-hover)" : "transparent",
                      border: selected?.id === entry.id ? "1px solid var(--border)" : "1px solid transparent",
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                      marginBottom: 2,
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: selected?.id === entry.id ? "#e2e8f0" : "var(--text-secondary)",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.category === "long-term" ? "🧠 " : "📝 "}
                      {entry.date ? `Journal: ${entry.date}` : entry.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 11,
                        color: "var(--text-muted)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Hash size={10} />
                        {entry.wordCount.toLocaleString()} words
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <FileText size={10} />
                        {formatFileSize(entry.fileSize)}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          background: entry.category === "long-term" ? "#7c3aed22" : "#6366f122",
                          color: entry.category === "long-term" ? "#a78bfa" : "#818cf8",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {entry.category === "long-term" ? "LTM" : "JOURNAL"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: "24px 32px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                {selected.category === "long-term" ? (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Brain size={20} color="white" />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen size={20} color="white" />
                  </div>
                )}
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
                    {selected.date ? `Journal: ${selected.date}` : selected.title}
                  </h1>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                    {selected.date && <span>{formatDate(selected.date)}</span>}
                    <span>{selected.wordCount.toLocaleString()} words</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} />
                      Modified {relativeTime(selected.modifiedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div style={{ padding: "24px 32px", flex: 1 }}>
              {selected.sections.length > 0 ? (
                selected.sections.map((section, i) => (
                  <div key={i} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      {section.time && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6366f1",
                            background: "#6366f115",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontFamily: "var(--font-geist-mono), monospace",
                          }}
                        >
                          {section.time}
                        </span>
                      )}
                      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
                        {section.title}
                      </h2>
                    </div>
                    <div style={{ paddingLeft: section.time ? 0 : 0 }}>
                      {section.body
                        .trim()
                        .split("\n")
                        .map((line, j) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={j} style={{ height: 8 }} />;
                          // List items
                          if (trimmed.startsWith("- ")) {
                            return (
                              <div
                                key={j}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  fontSize: 14,
                                  lineHeight: 1.7,
                                  color: "var(--text-secondary)",
                                  paddingLeft: 4,
                                }}
                              >
                                <span style={{ color: "#6366f1", flexShrink: 0 }}>•</span>
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: renderMarkdownLine(trimmed.slice(2)),
                                  }}
                                />
                              </div>
                            );
                          }
                          // Checkbox items
                          if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
                            const checked = trimmed.startsWith("- [x]");
                            return (
                              <div
                                key={j}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  fontSize: 14,
                                  lineHeight: 1.7,
                                  color: checked ? "var(--text-muted)" : "var(--text-secondary)",
                                  textDecoration: checked ? "line-through" : "none",
                                  paddingLeft: 4,
                                }}
                              >
                                <span style={{ flexShrink: 0 }}>{checked ? "☑" : "☐"}</span>
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: renderMarkdownLine(trimmed.slice(5)),
                                  }}
                                />
                              </div>
                            );
                          }
                          // Regular paragraph
                          return (
                            <p
                              key={j}
                              style={{
                                fontSize: 14,
                                lineHeight: 1.7,
                                color: "var(--text-secondary)",
                                margin: 0,
                              }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdownLine(trimmed) }}
                            />
                          );
                        })}
                    </div>
                  </div>
                ))
              ) : (
                // Raw content fallback
                <pre
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                  }}
                >
                  {selected.content}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
              color: "var(--text-muted)",
            }}
          >
            <Brain size={48} strokeWidth={1} />
            <p style={{ fontSize: 16 }}>Select a memory to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
