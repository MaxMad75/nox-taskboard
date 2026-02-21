import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { columnValues, priorityValues } from "./schema";

export const list = query({
  args: {
    column: v.optional(columnValues),
    assignee: v.optional(v.string()),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db.query("tasks").collect();
    if (args.column) tasks = tasks.filter((t) => t.column === args.column);
    if (args.assignee) tasks = tasks.filter((t) => t.assignee === args.assignee);
    if (args.projectId) tasks = tasks.filter((t) => t.projectId === args.projectId);
    return tasks;
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = tasks.filter((t) => t.createdAt >= weekAgo).length;
    const inProgress = tasks.filter((t) => t.column === "in-progress").length;
    const total = tasks.length;
    const done = tasks.filter((t) => t.column === "done").length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;
    return { thisWeek, inProgress, total, completion };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    column: columnValues,
    assignee: v.string(),
    priority: priorityValues,
    tags: v.array(v.string()),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", { ...args, createdAt: Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    column: v.optional(columnValues),
    assignee: v.optional(v.string()),
    priority: v.optional(priorityValues),
    tags: v.optional(v.array(v.string())),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const clean: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) clean[k] = val;
    }
    await ctx.db.patch(id, clean);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
