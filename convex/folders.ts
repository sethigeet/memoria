import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    const activeFolders = folders.filter((f) => !f.deletedAt);

    // Get document counts for each folder
    const foldersWithCounts = await Promise.all(
      activeFolders.map(async (folder) => {
        const docs = await ctx.db
          .query("documents")
          .withIndex("by_folderId", (q) => q.eq("folderId", folder._id))
          .collect();
        const count = docs.filter((d) => !d.deletedAt).length;
        return { ...folder, documentCount: count };
      })
    );

    return foldersWithCounts;
  },
});

export const get = query({
  args: { id: v.id("folders"), includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder) return null;
    if (folder.deletedAt && !args.includeDeleted) return null;

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
    if (!folder || !folder.isPublic || folder.deletedAt) return null;
    return folder;
  },
});

export const getPublicDocuments = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || !folder.isPublic || folder.deletedAt) return [];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
      .collect();

    const documentsWithTags = await Promise.all(
      documents.filter((d) => !d.deletedAt).map(async (doc) => {
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
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.userId !== identity.tokenIdentifier) {
        throw new Error("Parent folder not found");
      }
    }

    return await ctx.db.insert("folders", {
      name: args.name,
      color: args.color,
      isPublic: args.isPublic ?? false,
      userId: identity.tokenIdentifier,
      parentId: args.parentId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("folders"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    parentId: v.optional(v.union(v.id("folders"), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== identity.tokenIdentifier) {
      throw new Error("Folder not found");
    }

    if (args.parentId !== undefined && args.parentId !== null) {
      if (args.parentId === args.id) {
        throw new Error("Folder cannot be its own parent");
      }
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.userId !== identity.tokenIdentifier) {
        throw new Error("Parent folder not found");
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.color !== undefined) updates.color = args.color;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.parentId !== undefined) updates.parentId = args.parentId ?? undefined;

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

    const deletedAt = Date.now();

    // Recursively soft delete child folders and their documents
    const deleteFolder = async (folderId: typeof args.id) => {
      const childFolders = await ctx.db
        .query("folders")
        .withIndex("by_parentId", (q) => q.eq("parentId", folderId))
        .collect();

      for (const child of childFolders) {
        await deleteFolder(child._id);
      }

      // Soft delete documents in this folder
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_folderId", (q) => q.eq("folderId", folderId))
        .collect();

      for (const doc of documents) {
        if (!doc.deletedAt) {
          await ctx.db.patch(doc._id, { deletedAt });
        }
      }

      await ctx.db.patch(folderId, { deletedAt });
    };

    await deleteFolder(args.id);
  },
});

export const restore = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== identity.tokenIdentifier) {
      throw new Error("Folder not found");
    }

    // Restore folder and its documents (but not child folders - restore them separately)
    await ctx.db.patch(args.id, { deletedAt: undefined, parentId: undefined });

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.id))
      .collect();

    for (const doc of documents) {
      if (doc.deletedAt) {
        await ctx.db.patch(doc._id, { deletedAt: undefined });
      }
    }
  },
});

export const permanentlyDelete = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== identity.tokenIdentifier) {
      throw new Error("Folder not found");
    }

    // Recursively delete child folders
    const deleteFolder = async (folderId: typeof args.id) => {
      const childFolders = await ctx.db
        .query("folders")
        .withIndex("by_parentId", (q) => q.eq("parentId", folderId))
        .collect();

      for (const child of childFolders) {
        await deleteFolder(child._id);
      }

      // Delete documents
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_folderId", (q) => q.eq("folderId", folderId))
        .collect();

      for (const doc of documents) {
        const docTags = await ctx.db
          .query("documentTags")
          .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
          .collect();
        for (const dt of docTags) {
          await ctx.db.delete(dt._id);
        }

        const messages = await ctx.db
          .query("chatMessages")
          .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
          .collect();
        for (const msg of messages) {
          await ctx.db.delete(msg._id);
        }

        await ctx.db.delete(doc._id);
      }

      await ctx.db.delete(folderId);
    };

    await deleteFolder(args.id);
  },
});

export const listTrash = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    return folders
      .filter((f) => f.deletedAt)
      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  },
});
