import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tags")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listNamesForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tags = await ctx.db
      .query("tags")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return tags.map((tag) => tag.name).sort((a, b) => a.localeCompare(b));
  },
});

export const getDocumentCount = query({
  args: { tagId: v.id("tags") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const tag = await ctx.db.get(args.tagId);
    if (!tag || tag.userId !== userId) return 0;

    const relations = await ctx.db
      .query("documentTags")
      .withIndex("by_tagId", (q) => q.eq("tagId", args.tagId))
      .collect();
    return relations.length;
  },
});

export const remove = mutation({
  args: { id: v.id("tags") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== userId) {
      throw new Error("Tag not found");
    }

    // Delete all document-tag relations
    const relations = await ctx.db
      .query("documentTags")
      .withIndex("by_tagId", (q) => q.eq("tagId", args.id))
      .collect();

    for (const rel of relations) {
      await ctx.db.delete(rel._id);
    }

    await ctx.db.delete(args.id);
  },
});
