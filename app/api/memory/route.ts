import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const WORKSPACE = "/home/nox/.openclaw/workspace";

interface MemoryEntry {
  id: string;
  filename: string;
  title: string;
  category: "long-term" | "journal";
  date: string | null; // ISO date for journals
  content: string;
  wordCount: number;
  fileSize: number;
  modifiedAt: number; // epoch ms
  sections: { time: string | null; title: string; body: string }[];
}

function parseJournalSections(content: string) {
  const sections: { time: string | null; title: string; body: string }[] = [];
  const lines = content.split("\n");
  let currentSection: { time: string | null; title: string; body: string } | null = null;

  for (const line of lines) {
    // Match ## headers
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (currentSection) sections.push(currentSection);
      // Try to extract time from title like "10:30 AM — Something"
      const timeMatch = h2[1].match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[—-]\s*(.+)/i);
      if (timeMatch) {
        currentSection = { time: timeMatch[1], title: timeMatch[2], body: "" };
      } else {
        currentSection = { time: null, title: h2[1], body: "" };
      }
      continue;
    }
    // Skip h1 (title line)
    if (line.match(/^# /)) continue;
    if (currentSection) {
      currentSection.body += line + "\n";
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

function parseLongTermSections(content: string) {
  const sections: { time: string | null; title: string; body: string }[] = [];
  const lines = content.split("\n");
  let currentSection: { time: string | null; title: string; body: string } | null = null;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (currentSection) sections.push(currentSection);
      currentSection = { time: null, title: h2[1], body: "" };
      continue;
    }
    if (line.match(/^# /)) continue;
    if (currentSection) {
      currentSection.body += line + "\n";
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  try {
    const entries: MemoryEntry[] = [];

    // Read MEMORY.md
    try {
      const memPath = path.join(WORKSPACE, "MEMORY.md");
      const [content, stat] = await Promise.all([
        fs.readFile(memPath, "utf-8"),
        fs.stat(memPath),
      ]);
      const entry: MemoryEntry = {
        id: "memory-md",
        filename: "MEMORY.md",
        title: "Long-Term Memory",
        category: "long-term",
        date: null,
        content,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        fileSize: stat.size,
        modifiedAt: stat.mtimeMs,
        sections: parseLongTermSections(content),
      };
      entries.push(entry);
    } catch {
      // MEMORY.md doesn't exist
    }

    // Read memory/*.md
    const memDir = path.join(WORKSPACE, "memory");
    try {
      const files = await fs.readdir(memDir);
      const mdFiles = files.filter((f) => f.endsWith(".md")).sort().reverse();

      await Promise.all(
        mdFiles.map(async (file) => {
          const filePath = path.join(memDir, file);
          const [content, stat] = await Promise.all([
            fs.readFile(filePath, "utf-8"),
            fs.stat(filePath),
          ]);
          const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
          const titleMatch = content.match(/^# (.+)/m);

          entries.push({
            id: file,
            filename: file,
            title: titleMatch ? titleMatch[1] : file.replace(".md", ""),
            category: "journal",
            date: dateMatch ? dateMatch[1] : null,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
            fileSize: stat.size,
            modifiedAt: stat.mtimeMs,
            sections: parseJournalSections(content),
          });
        })
      );
    } catch {
      // memory/ doesn't exist
    }

    // Filter by search query
    let filtered = entries;
    if (query) {
      filtered = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.content.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ entries: filtered });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
