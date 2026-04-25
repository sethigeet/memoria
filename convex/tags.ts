import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("tags")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();
  },
});

export const getDocumentCount = query({
  args: { tagId: v.id("tags") },
  handler: async (ctx, args) => {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== identity.tokenIdentifier) {
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
