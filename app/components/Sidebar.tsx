"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Calendar,
  FolderKanban,
  Brain,
  FileText,
  Users,
  Building2,
  UsersRound,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: CheckSquare, label: "Tasks",    href: "/tasks" },
  { icon: Calendar,    label: "Calendar", href: "/calendar" },
  { icon: FolderKanban,label: "Projects", href: "/projects" },
  { icon: Brain,       label: "Memory",   href: "/memory" },
  { icon: FileText,    label: "Docs",     href: "/docs" },
  { icon: Users,       label: "People",   href: "/people" },
  { icon: Building2,   label: "Office",   href: "/office" },
  { icon: UsersRound,  label: "Team",     href: "/team" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "1.25rem 0",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 1.25rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
          }}
        >
          🚀
        </div>
        <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
          Mission Control
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 1.25rem",
                border: "none",
                background: isActive ? "var(--accent-glow)" : "transparent",
                color: isActive ? "#818cf8" : "var(--text-secondary)",
                fontSize: "0.9rem",
                cursor: "pointer",
                borderLeft: isActive
                  ? "3px solid #6366f1"
                  : "3px solid transparent",
                transition: "all 0.15s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-secondary)";
                }
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: "0.75rem 1.25rem",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          B
        </div>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Basti
        </span>
      </div>
    </aside>
  );
}
