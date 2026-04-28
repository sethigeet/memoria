import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const updateScrapingStatus = internalMutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      scrapingStatus: args.status,
      scrapingError: args.error,
    });
  },
});

export const updateDocumentContent = internalMutation({
  args: {
    documentId: v.id("documents"),
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("web"), v.literal("pdf")),
    status: v.literal("completed"),
  },
  handler: async (ctx, args) => {
    const excerpt = args.content.slice(0, 200) + (args.content.length > 200 ? "..." : "");
    await ctx.db.patch(args.documentId, {
      title: args.title,
      content: args.content,
      type: args.type,
      excerpt,
      scrapingStatus: args.status,
    });
  },
});
