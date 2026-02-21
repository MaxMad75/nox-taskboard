import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schedules").withIndex("by_nextRunTime").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    cronExpression: v.string(),
    nextRunTime: v.number(),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    sourceJobId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("schedules", {
      ...args,
      enabled: args.enabled ?? true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("schedules"),
    name: v.optional(v.string()),
    cronExpression: v.optional(v.string()),
    nextRunTime: v.optional(v.number()),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("schedules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Upsert a schedule by sourceJobId (used for syncing from jobs.json).
 * If a schedule with the same sourceJobId exists, update it; otherwise insert.
 */
export const upsertBySourceJobId = mutation({
  args: {
    sourceJobId: v.string(),
    name: v.string(),
    cronExpression: v.string(),
    nextRunTime: v.number(),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("schedules")
      .collect()
      .then((all) => all.find((s) => s.sourceJobId === args.sourceJobId));

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        cronExpression: args.cronExpression,
        nextRunTime: args.nextRunTime,
        description: args.description,
        enabled: args.enabled ?? true,
        timezone: args.timezone,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("schedules", {
        ...args,
        enabled: args.enabled ?? true,
      });
    }
  },
});
