import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done"))),
    assignee: v.optional(v.union(v.literal("Basti"), v.literal("Nox"))),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db.query("tasks").collect();
    if (args.status) {
      tasks = tasks.filter((t) => t.status === args.status);
    }
    if (args.assignee) {
      tasks = tasks.filter((t) => t.assignee === args.assignee);
    }
    return tasks;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    assignee: v.union(v.literal("Basti"), v.literal("Nox")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done"))),
    assignee: v.optional(v.union(v.literal("Basti"), v.literal("Nox"))),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
