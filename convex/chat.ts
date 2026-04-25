import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getMessages = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const doc = await ctx.db.get(args.documentId);
    if (!doc) return [];

    // Allow if owner or if in public folder
    let hasAccess = doc.userId === identity.tokenIdentifier;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== identity.tokenIdentifier) {
      throw new Error("Document not found");
    }

    return await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      role: args.role,
      content: args.content,
      userId: identity.tokenIdentifier,
    });
  },
});

export const clearMessages = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== identity.tokenIdentifier) {
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
