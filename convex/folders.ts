import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("folders")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder) return null;

    // Allow access if public
    if (folder.isPublic) {
      return folder;
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity || folder.userId !== identity.tokenIdentifier) return null;

    return folder;
  },
});

export const getPublic = query({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder || !folder.isPublic) return null;
    return folder;
  },
});

export const getPublicDocuments = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || !folder.isPublic) return [];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
      .collect();

    const documentsWithTags = await Promise.all(
      documents.map(async (doc) => {
        const docTags = await ctx.db
          .query("documentTags")
          .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
          .collect();
        const tags = await Promise.all(docTags.map((dt) => ctx.db.get(dt.tagId)));
        return {
          ...doc,
          tags: tags.filter(Boolean).map((t) => t!.name),
        };
      }),
    );

    return documentsWithTags;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("folders", {
      name: args.name,
      color: args.color,
      isPublic: args.isPublic ?? false,
      userId: identity.tokenIdentifier,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("folders"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== identity.tokenIdentifier) {
      throw new Error("Folder not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.color !== undefined) updates.color = args.color;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== identity.tokenIdentifier) {
      throw new Error("Folder not found");
    }

    // Remove folder reference from documents (don't delete them)
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.id))
      .collect();

    for (const doc of documents) {
      await ctx.db.patch(doc._id, { folderId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
