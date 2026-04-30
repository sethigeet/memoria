import { internalMutation } from "./_generated/server";
import { removeDocumentTagsAndPrune } from "./tagCleanup";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expirationThreshold = Date.now() - THIRTY_DAYS_MS;

    // Find and delete expired documents
    const allDocs = await ctx.db.query("documents").collect();
    const expiredDocs = allDocs.filter((d) => d.deletedAt && d.deletedAt < expirationThreshold);

    for (const doc of expiredDocs) {
      await removeDocumentTagsAndPrune(ctx, doc._id);

      // Delete chat messages
      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      await ctx.db.delete(doc._id);
    }

    // Find and delete expired folders
    const allFolders = await ctx.db.query("folders").collect();
    const expiredFolders = allFolders.filter(
      (f) => f.deletedAt && f.deletedAt < expirationThreshold,
    );

    for (const folder of expiredFolders) {
      await ctx.db.delete(folder._id);
    }

    return {
      deletedDocuments: expiredDocs.length,
      deletedFolders: expiredFolders.length,
    };
  },
});
