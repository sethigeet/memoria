"use node";

import { v } from "convex/values";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

const nim = createOpenAICompatible({
  name: "nim",
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NIM_API_KEY,
});

const model = nim.chatModel(process.env.MODEL_ID ?? "deepseek-ai/deepseek-v4-flash");

type GeneratedTitleAndTagsResponse = {
  title: string;
  tags: string[];
};

async function requireOwnedDocument(
  ctx: ActionCtx,
  documentId: Id<"documents">,
): Promise<Pick<Doc<"documents">, "_id" | "userId" | "deletedAt" | "content">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const doc: Pick<Doc<"documents">, "_id" | "userId" | "deletedAt" | "content"> | null =
    await ctx.runQuery(internal.documents.getDocumentAuthState, { documentId });

  if (!doc || doc.deletedAt || doc.userId !== userId) {
    throw new Error("Document not found");
  }

  return doc;
}

async function generateTitleAndTagsForDocument(
  ctx: ActionCtx,
  documentId: Id<"documents">,
  content: string,
): Promise<GeneratedTitleAndTagsResponse> {
  const result = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        title: z.string().describe("A concise, descriptive title for the document (max 80 chars)"),
        tags: z
          .array(z.string())
          .describe("3-5 relevant tags for categorization (lowercase, hyphenated)"),
      }),
    }),
    prompt: `Analyze the following content and generate a title and tags for it.

Content:
${content.slice(0, 4000)}

Generate a concise title and 3-5 relevant tags for categorization.`,
  });

  await ctx.runMutation(internal.documents.internalUpdate, {
    id: documentId,
    title: result.output.title,
  });

  await ctx.runMutation(internal.documents.internalAddTags, {
    documentId,
    tags: result.output.tags,
  });

  return result.output;
}

export const generateTitleAndTags = action({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<GeneratedTitleAndTagsResponse> => {
    const doc = await requireOwnedDocument(ctx, args.documentId);

    return await generateTitleAndTagsForDocument(ctx, args.documentId, doc.content);
  },
});

export const generateTitleAndTagsInternal = internalAction({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args): Promise<GeneratedTitleAndTagsResponse> => {
    const doc: Pick<Doc<"documents">, "_id" | "userId" | "deletedAt" | "content"> | null =
      await ctx.runQuery(internal.documents.getDocumentAuthState, {
        documentId: args.documentId,
      });

    if (!doc || doc.deletedAt) {
      throw new Error("Document not found");
    }

    return await generateTitleAndTagsForDocument(ctx, args.documentId, doc.content);
  },
});

export const generateSummary = action({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    summaryType: v.union(v.literal("concise"), v.literal("detailed"), v.literal("action-items")),
  },
  handler: async (ctx, args) => {
    const doc = await requireOwnedDocument(ctx, args.documentId);

    const prompts = {
      concise: `Write a single concise paragraph summarizing this document (max 150 words):

${doc.content}`,
      detailed: `Create a detailed structured summary with bullet points. Include:
- Overview (2-3 sentences)
- Key points (bulleted list)
- Conclusion (1-2 sentences)

Document:
${doc.content}`,
      "action-items": `Extract all actionable tasks, recommendations, and next steps from this document. Format as a checklist:

${doc.content}`,
    };

    const { text } = await generateText({
      model,
      prompt: prompts[args.summaryType],
    });

    // Save the summary to the document
    await ctx.runMutation(internal.documents.internalUpdate, {
      id: args.documentId,
      summary: text,
      summaryType: args.summaryType,
    });

    return text;
  },
});

export const chat = action({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await requireOwnedDocument(ctx, args.documentId);

    const { text } = await generateText({
      model,
      system: `You are a helpful reading assistant. Answer questions ONLY using the content of the provided document. If the document doesn't address the question, say so clearly. Be concise and accurate.`,
      prompt: `Document:
${doc.content}

Question: ${args.question}`,
    });

    // Save both the question and answer to chat history
    await ctx.runMutation(internal.chat.internalAddMessage, {
      documentId: args.documentId,
      role: "user",
      content: args.question,
    });

    await ctx.runMutation(internal.chat.internalAddMessage, {
      documentId: args.documentId,
      role: "assistant",
      content: text,
    });

    return text;
  },
});
