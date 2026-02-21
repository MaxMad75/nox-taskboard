import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    assignee: v.union(v.literal("Basti"), v.literal("Nox")),
  }),
});
