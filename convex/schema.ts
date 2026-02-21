import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const columnValues = v.union(
  v.literal("recurring"),
  v.literal("backlog"),
  v.literal("in-progress"),
  v.literal("review"),
  v.literal("done")
);

export const priorityValues = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent")
);

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    column: columnValues,
    assignee: v.string(),
    priority: priorityValues,
    tags: v.array(v.string()),
    projectId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_column", ["column"])
    .index("by_assignee", ["assignee"])
    .index("by_projectId", ["projectId"]),

  projects: defineTable({
    name: v.string(),
    color: v.string(),
  }),

  schedules: defineTable({
    name: v.string(),
    cronExpression: v.string(),
    nextRunTime: v.number(),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    sourceJobId: v.optional(v.string()),
  }).index("by_nextRunTime", ["nextRunTime"]),
});
