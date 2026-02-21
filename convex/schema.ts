import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    assignee: v.union(v.literal("Basti"), v.literal("Nox")),
  }),

  schedules: defineTable({
    name: v.string(),
    cronExpression: v.string(),
    nextRunTime: v.number(), // Unix timestamp (ms)
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    sourceJobId: v.optional(v.string()), // id from jobs.json if synced
  }).index("by_nextRunTime", ["nextRunTime"]),
});
