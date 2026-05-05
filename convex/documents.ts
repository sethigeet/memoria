import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { pruneTagIfUnused, removeDocumentTagsAndPrune } from "./tagCleanup";

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSourceTokens(source: string | undefined) {
  if (!source) return "";

  const values = [source];
  try {
    const url = new URL(source);
    values.push(url.hostname.replace(/^www\./, ""));
    values.push(url.pathname.replace(/\//g, " "));
  } catch {
    values.push(source.replace(/^www\./, ""));
  }

  return normalizeSearchText(values.join(" "));
}

async function getDocumentTagNames(ctx: MutationCtx, documentId: Id<"documents">) {
  const documentTags = await ctx.db
    .query("documentTags")
    .withIndex("by_documentId", (q) => q.eq("documentId", documentId))
    .collect();

  const tags = await Promise.all(documentTags.map((documentTag) => ctx.db.get(documentTag.tagId)));
  return tags
    .filter(Boolean)
    .map((tag) => tag!.name.trim().toLowerCase())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

async function buildSearchMetadata(
  ctx: MutationCtx,
  document: Pick<Doc<"documents">, "_id" | "title" | "content" | "source" | "folderId">,
  tagNames?: string[],
) {
  const folder = document.folderId ? await ctx.db.get(document.folderId) : null;
  const normalizedTagNames = (tagNames ?? (await getDocumentTagNames(ctx, document._id))).map(
    (tag) => tag.trim().toLowerCase(),
  );
  const searchFolderName = normalizeSearchText(folder?.name ?? "");
  const searchSourceText = getSourceTokens(document.source);
  const searchText = normalizeSearchText(
    [
      document.title,
      document.content,
      normalizedTagNames.join(" "),
      folder?.name ?? "",
      searchSourceText,
    ].join(" "),
  );

  return {
    searchText,
    searchTagNames: normalizedTagNames,
    searchFolderName,
    searchFolderLabel: folder?.name ?? "",
    searchSourceText,
  };
}

async function syncDocumentSearchMetadata(
  ctx: MutationCtx,
  document: Pick<Doc<"documents">, "_id" | "title" | "content" | "source" | "folderId">,
  tagNames?: string[],
) {
  const metadata = await buildSearchMetadata(ctx, document, tagNames);
  await ctx.db.patch(document._id, metadata);
}

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

    // Allow access if document is public
    if (doc.isPublic) {
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
    }

    // Allow access if public folder
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
    await ensureOwnedFolder(ctx, args.folderId, userId);

    const excerpt = args.content.slice(0, 200) + (args.content.length > 200 ? "..." : "");
    const source = args.source;
    const searchSourceText = getSourceTokens(source);
    const folder = args.folderId ? await ctx.db.get(args.folderId) : null;
    const searchFolderName = normalizeSearchText(folder?.name ?? "");
    const searchText = normalizeSearchText(
      [args.title, args.content, folder?.name ?? "", searchSourceText].join(" "),
    );

    const documentId = await ctx.db.insert("documents", {
      type: args.type,
      title: args.title,
      content: args.content,
      source,
      excerpt,
      searchText,
      searchTagNames: [],
      searchFolderName,
      searchFolderLabel: folder?.name ?? "",
      searchSourceText,
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
    await ensureOwnedFolder(ctx, args.folderId, userId);

    const url = args.url.startsWith("http") ? args.url : `https://${args.url}`;
    const source = url;
    const searchSourceText = getSourceTokens(source);
    const folder = args.folderId ? await ctx.db.get(args.folderId) : null;
    const searchFolderName = normalizeSearchText(folder?.name ?? "");
    const searchText = normalizeSearchText(
      [url, "Fetching content...", folder?.name ?? ""].join(" "),
    );

    const documentId = await ctx.db.insert("documents", {
      type: "web",
      title: url,
      content: "Fetching content...",
      source,
      excerpt: "Fetching content...",
      searchText,
      searchTagNames: [],
      searchFolderName,
      searchFolderLabel: folder?.name ?? "",
      searchSourceText,
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

async function updateDocumentHelper(
  ctx: MutationCtx,
  id: Id<"documents">,
  args: {
    title?: string;
    content?: string;
    notebook?: string;
    folderId?: Id<"folders"> | null;
    summary?: string | null;
    summaryType?: string | null;
  },
) {
  const existingDocument = await ctx.db.get(id);
  if (!existingDocument) {
    throw new Error("Document not found");
  }

  const updates: Record<string, unknown> = {};
  if (args.title !== undefined) updates.title = args.title;
  if (args.content !== undefined) {
    updates.content = args.content;
    updates.excerpt = args.content.slice(0, 200) + (args.content.length > 200 ? "..." : "");
  }
  if (args.notebook !== undefined) updates.notebook = args.notebook;
  if (args.folderId !== undefined) updates.folderId = args.folderId ?? undefined;
  if (args.summary !== undefined) updates.summary = args.summary ?? undefined;
  if (args.summaryType !== undefined) updates.summaryType = args.summaryType ?? undefined;

  await ctx.db.patch(id, updates);
  await syncDocumentSearchMetadata(ctx, {
    _id: id,
    title: args.title ?? existingDocument.title,
    content: args.content ?? existingDocument.content,
    source: existingDocument.source,
    folderId:
      args.folderId !== undefined ? (args.folderId ?? undefined) : existingDocument.folderId,
  });
  return id;
}

async function ensureOwnedFolder(
  ctx: MutationCtx,
  folderId: Id<"folders"> | null | undefined,
  userId: string,
) {
  if (!folderId) return;

  const folder = await ctx.db.get(folderId);
  if (!folder || folder.userId !== userId || folder.deletedAt) {
    throw new Error("Folder not found");
  }
}

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    notebook: v.optional(v.string()),
    folderId: v.optional(v.union(v.id("folders"), v.null())),
    summary: v.optional(v.union(v.string(), v.null())),
    summaryType: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ensureOwnedFolder(ctx, args.folderId, userId);

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    return await updateDocumentHelper(ctx, args.id, args);
  },
});

export const internalUpdate = internalMutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    summary: v.optional(v.union(v.string(), v.null())),
    summaryType: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");
    return await updateDocumentHelper(ctx, args.id, args);
  },
});

export const getDocumentAuthState = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<Pick<Doc<"documents">, "_id" | "userId" | "deletedAt" | "content"> | null> => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;

    return {
      _id: doc._id,
      userId: doc.userId,
      deletedAt: doc.deletedAt,
      content: doc.content,
    };
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

    await removeDocumentTagsAndPrune(ctx, args.id);

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
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.max(1, Math.min(args.limit ?? 20, 20));
    const normalizedQuery = normalizeSearchText(args.query);
    if (!normalizedQuery) return [];

    const results = await ctx.db
      .query("documents")
      .withSearchIndex("search_text", (q) =>
        q.search("searchText", normalizedQuery).eq("userId", userId),
      )
      .take(limit * 2);

    return results
      .filter((document) => !document.deletedAt)
      .slice(0, limit)
      .map((document) => ({
        ...document,
        tags: document.searchTagNames ?? [],
        folderName: document.searchFolderLabel ?? "",
        sourceText: document.searchSourceText ?? "",
      }));
  },
});

export const backfillSearchMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const document of documents) {
      await syncDocumentSearchMetadata(ctx, document);
    }

    return documents.length;
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

async function addTagsHelper(
  ctx: MutationCtx,
  documentId: Id<"documents">,
  tags: string[],
  userId: string,
) {
  for (const tagName of tags) {
    let tag = await ctx.db
      .query("tags")
      .withIndex("by_name_and_userId", (q) => q.eq("name", tagName).eq("userId", userId))
      .unique();

    if (!tag) {
      const tagId = await ctx.db.insert("tags", { name: tagName, userId });
      tag = await ctx.db.get(tagId);
    }

    if (tag) {
      const existing = await ctx.db
        .query("documentTags")
        .withIndex("by_documentId", (q) => q.eq("documentId", documentId))
        .filter((q) => q.eq(q.field("tagId"), tag!._id))
        .unique();

      if (!existing) {
        await ctx.db.insert("documentTags", { documentId, tagId: tag._id });
      }
    }
  }

  const document = await ctx.db.get(documentId);
  if (document) {
    const tagNames = await getDocumentTagNames(ctx, documentId);
    await syncDocumentSearchMetadata(ctx, document, tagNames);
  }
}

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

    await addTagsHelper(ctx, args.documentId, args.tags, userId);
  },
});

export const internalAddTags = internalMutation({
  args: {
    documentId: v.id("documents"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    await addTagsHelper(ctx, args.documentId, args.tags, doc.userId);
  },
});

export const removeTags = mutation({
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
      const tag = await ctx.db
        .query("tags")
        .withIndex("by_name_and_userId", (q) => q.eq("name", tagName).eq("userId", userId))
        .unique();

      if (tag) {
        const docTag = await ctx.db
          .query("documentTags")
          .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
          .filter((q) => q.eq(q.field("tagId"), tag._id))
          .unique();

        if (docTag) {
          await ctx.db.delete(docTag._id);
          await pruneTagIfUnused(ctx, tag._id);
        }
      }
    }

    const document = await ctx.db.get(args.documentId);
    if (document) {
      const tagNames = await getDocumentTagNames(ctx, args.documentId);
      await syncDocumentSearchMetadata(ctx, document, tagNames);
    }
  },
});

export const updateTags = mutation({
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

    const existingDocTags = await ctx.db
      .query("documentTags")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();

    const existingTags = await Promise.all(
      existingDocTags.map(async (docTag) => ({
        docTag,
        tag: await ctx.db.get(docTag.tagId),
      })),
    );
    const desiredTags = new Set(args.tags);

    for (const { docTag, tag } of existingTags) {
      if (!tag || desiredTags.has(tag.name)) {
        continue;
      }

      await ctx.db.delete(docTag._id);
      await pruneTagIfUnused(ctx, tag._id);
    }

    const existingTagNames = new Set(existingTags.flatMap(({ tag }) => (tag ? [tag.name] : [])));
    const tagsToAdd = args.tags.filter((tagName) => !existingTagNames.has(tagName));

    if (tagsToAdd.length === 0) {
      return;
    }

    await addTagsHelper(ctx, args.documentId, tagsToAdd, userId);

    const document = await ctx.db.get(args.documentId);
    if (document) {
      await syncDocumentSearchMetadata(ctx, document, args.tags);
    }
  },
});

export const syncSearchMetadataForFolder = internalMutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
      .collect();

    for (const document of documents) {
      await syncDocumentSearchMetadata(ctx, document);
    }
  },
});

export const updateReadProgress = mutation({
  args: {
    id: v.id("documents"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    const progress = Math.max(0, Math.min(100, args.progress));
    const updates: { readProgress: number; readAt?: number } = { readProgress: progress };

    if (progress >= 90 && !doc.readAt) {
      updates.readAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.id, { readAt: Date.now(), readProgress: 100 });
    return args.id;
  },
});

export const markAsUnread = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.id, { readAt: undefined, readProgress: undefined });
    return args.id;
  },
});

export const togglePublic = mutation({
  args: { id: v.id("documents"), isPublic: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.id, { isPublic: args.isPublic });
    return args.id;
  },
});

export const getPublic = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.deletedAt) return null;

    // Check if document is public directly or belongs to a public folder
    let isAccessible = doc.isPublic;
    if (!isAccessible && doc.folderId) {
      const folder = await ctx.db.get(doc.folderId);
      isAccessible = folder?.isPublic && !folder.deletedAt;
    }
    if (!isAccessible) return null;

    const docTags = await ctx.db
      .query("documentTags")
      .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
      .collect();
    const tags = await Promise.all(docTags.map((dt) => ctx.db.get(dt.tagId)));

    return {
      ...doc,
      tags: tags.filter(Boolean).map((t) => t!.name),
    };
  },
});
