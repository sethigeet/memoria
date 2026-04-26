import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMessages = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const doc = await ctx.db.get(args.documentId);
    if (!doc) return [];

    // Allow if owner or if in public folder
    let hasAccess = doc.userId === userId;
    if (!hasAccess && doc.folderId) {
      const folder = await ctx.db.get(doc.folderId);
      hasAccess = folder?.isPublic === true;
    }
    if (!hasAccess) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    documentId: v.id("documents"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    return await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      role: args.role,
      content: args.content,
      userId,
    });
  },
});

export const clearMessages = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
