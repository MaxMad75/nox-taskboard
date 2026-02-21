import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CronExpressionParser } from "cron-parser";

const JOBS_PATH = "/home/nox/.openclaw/cron/jobs.json";

interface CronJob {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz?: string;
  };
  state?: {
    nextRunAtMs?: number;
  };
}

interface JobsFile {
  jobs: CronJob[];
}

function calcNextRun(expr: string, tz?: string): number {
  try {
    const interval = CronExpressionParser.parse(expr, {
      currentDate: new Date(),
      tz: tz || "UTC",
    });
    return interval.next().getTime();
  } catch {
    // fallback: now + 1 hour if parse fails
    return Date.now() + 3600_000;
  }
}

export async function GET() {
  try {
    const raw = fs.readFileSync(JOBS_PATH, "utf-8");
    const data: JobsFile = JSON.parse(raw);

    const parsed = (data.jobs || []).map((job: CronJob) => ({
      sourceJobId: job.id,
      name: job.name,
      description: job.description || "",
      cronExpression: job.schedule?.expr || "",
      timezone: job.schedule?.tz || "UTC",
      enabled: job.enabled ?? true,
      // Prefer nextRunAtMs from state if available, otherwise calculate
      nextRunTime: job.state?.nextRunAtMs ?? calcNextRun(job.schedule?.expr || "0 * * * *", job.schedule?.tz),
    }));

    return NextResponse.json({ jobs: parsed });
  } catch (err) {
    return NextResponse.json({ error: String(err), jobs: [] }, { status: 500 });
  }
}
