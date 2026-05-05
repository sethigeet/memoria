import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export async function pruneTagIfUnused(ctx: MutationCtx, tagId: Id<"tags">) {
  const remainingRelations = await ctx.db
    .query("documentTags")
    .withIndex("by_tagId", (q) => q.eq("tagId", tagId))
    .take(1);

  if (remainingRelations.length === 0) {
    const tag = await ctx.db.get(tagId);
    if (tag) {
      await ctx.db.delete(tagId);
    }
  }
}

export async function removeDocumentTagsAndPrune(ctx: MutationCtx, documentId: Id<"documents">) {
  const docTags = await ctx.db
    .query("documentTags")
    .withIndex("by_documentId", (q) => q.eq("documentId", documentId))
    .collect();

  const affectedTagIds = new Set<Id<"tags">>();
  for (const docTag of docTags) {
    affectedTagIds.add(docTag.tagId);
    await ctx.db.delete(docTag._id);
  }

  for (const tagId of affectedTagIds) {
    await pruneTagIfUnused(ctx, tagId);
  }
}
