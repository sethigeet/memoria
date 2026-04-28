import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    folderId: v.optional(v.id("folders")),
    tagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let documents;
    if (args.folderId) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
        .collect();
      documents = documents.filter((d) => d.userId === userId && !d.deletedAt);
    } else {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
      documents = documents.filter((d) => !d.deletedAt);
    }

    if (args.tagId) {
      const tagId = args.tagId;
      const docTagRelations = await ctx.db
        .query("documentTags")
        .withIndex("by_tagId", (q) => q.eq("tagId", tagId))
        .collect();
      const docIds = new Set(docTagRelations.map((dt) => dt.documentId));
      documents = documents.filter((d) => docIds.has(d._id));
    }

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

export const get = query({
  args: { id: v.id("documents"), includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    if (doc.deletedAt && !args.includeDeleted) return null;

    // Allow access if public folder or owner
    if (doc.folderId) {
      const folder = await ctx.db.get(doc.folderId);
      if (folder?.isPublic && !folder.deletedAt) {
        const docTags = await ctx.db
          .query("documentTags")
          .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
          .collect();
        const tags = await Promise.all(docTags.map((dt) => ctx.db.get(dt.tagId)));
        return {
          ...doc,
          tags: tags.filter(Boolean).map((t) => t!.name),
          folder,
        };
      }
    }

    if (!userId || doc.userId !== userId) return null;

    const docTags = await ctx.db
      .query("documentTags")
      .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
      .collect();
    const tags = await Promise.all(docTags.map((dt) => ctx.db.get(dt.tagId)));
    const folder = doc.folderId ? await ctx.db.get(doc.folderId) : null;

    return {
      ...doc,
      tags: tags.filter(Boolean).map((t) => t!.name),
      folder,
    };
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("web"), v.literal("pdf"), v.literal("note")),
    title: v.string(),
    content: v.string(),
    source: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const excerpt = args.content.slice(0, 200) + (args.content.length > 200 ? "..." : "");

    const documentId = await ctx.db.insert("documents", {
      type: args.type,
      title: args.title,
      content: args.content,
      source: args.source,
      excerpt,
      folderId: args.folderId,
      userId,
    });

    return documentId;
  },
});

export const createFromUrl = mutation({
  args: {
    url: v.string(),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const url = args.url.startsWith("http") ? args.url : `https://${args.url}`;
    const source = new URL(url).hostname;

    const documentId = await ctx.db.insert("documents", {
      type: "web",
      title: url,
      content: "Fetching content...",
      source,
      excerpt: "Fetching content...",
      folderId: args.folderId,
      userId,
      scrapingStatus: "pending",
    });

    await ctx.scheduler.runAfter(0, internal.scraping.scrapeUrl, {
      documentId,
      url,
    });

    return documentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    summary: v.optional(v.string()),
    summaryType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) {
      updates.content = args.content;
      updates.excerpt = args.content.slice(0, 200) + (args.content.length > 200 ? "..." : "");
    }
    if (args.folderId !== undefined) updates.folderId = args.folderId;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.summaryType !== undefined) updates.summaryType = args.summaryType;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    // Soft delete - move to trash
    await ctx.db.patch(args.id, { deletedAt: Date.now() });
  },
});

export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const permanentlyDelete = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    // Delete associated tags
    const docTags = await ctx.db
      .query("documentTags")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.id))
      .collect();
    for (const dt of docTags) {
      await ctx.db.delete(dt._id);
    }

    // Delete chat messages
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const titleResults = await ctx.db
      .query("documents")
      .withSearchIndex("search_title", (q) => q.search("title", args.query).eq("userId", userId))
      .take(20);

    const contentResults = await ctx.db
      .query("documents")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.query).eq("userId", userId),
      )
      .take(20);

    // Merge, deduplicate, and filter deleted
    const seen = new Set<string>();
    const results: typeof titleResults = [];
    for (const doc of [...titleResults, ...contentResults]) {
      if (!seen.has(doc._id) && !doc.deletedAt) {
        seen.add(doc._id);
        results.push(doc);
      }
    }

    // Add tags to results
    const resultsWithTags = await Promise.all(
      results.slice(0, 15).map(async (doc) => {
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

    return resultsWithTags;
  },
});

export const listTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return documents
      .filter((d) => d.deletedAt)
      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  },
});

export const addTags = mutation({
  args: {
    documentId: v.id("documents"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    for (const tagName of args.tags) {
      // Find or create tag
      let tag = await ctx.db
        .query("tags")
        .withIndex("by_name_and_userId", (q) => q.eq("name", tagName).eq("userId", userId))
        .unique();

      if (!tag) {
        const tagId = await ctx.db.insert("tags", {
          name: tagName,
          userId,
        });
        tag = await ctx.db.get(tagId);
      }

      if (tag) {
        // Check if relation already exists
        const existing = await ctx.db
          .query("documentTags")
          .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
          .filter((q) => q.eq(q.field("tagId"), tag!._id))
          .unique();

        if (!existing) {
          await ctx.db.insert("documentTags", {
            documentId: args.documentId,
            tagId: tag._id,
          });
        }
      }
    }
  },
});
