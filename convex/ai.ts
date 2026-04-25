"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, generateObject, streamText } from "ai";
import { z } from "zod";

const nim = createOpenAICompatible({
  name: "nim",
  baseURL: "https://integrate.api.nvidia.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NIM_API_KEY}`,
  },
});

const model = nim.chatModel("deepseek-ai/deepseek-r1-distill-llama-70b");

export const generateTitleAndTags = action({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await generateObject({
      model,
      schema: z.object({
        title: z.string().describe("A concise, descriptive title for the document (max 80 chars)"),
        tags: z
          .array(z.string())
          .describe("3-5 relevant tags for categorization (lowercase, hyphenated)"),
      }),
      prompt: `Analyze the following content and generate a title and tags for it.

Content:
${args.content.slice(0, 4000)}

Generate a concise title and 3-5 relevant tags for categorization.`,
    });

    // Update the document with the generated title
    await ctx.runMutation(api.documents.update, {
      id: args.documentId,
      title: result.object.title,
    });

    // Add the generated tags
    await ctx.runMutation(api.documents.addTags, {
      documentId: args.documentId,
      tags: result.object.tags,
    });

    return result.object;
  },
});

export const generateSummary = action({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    summaryType: v.union(v.literal("concise"), v.literal("detailed"), v.literal("action-items")),
  },
  handler: async (ctx, args) => {
    const prompts = {
      concise: `Write a single concise paragraph summarizing this document (max 150 words):

${args.content}`,
      detailed: `Create a detailed structured summary with bullet points. Include:
- Overview (2-3 sentences)
- Key points (bulleted list)
- Conclusion (1-2 sentences)

Document:
${args.content}`,
      "action-items": `Extract all actionable tasks, recommendations, and next steps from this document. Format as a checklist:

${args.content}`,
    };

    const { text } = await generateText({
      model,
      prompt: prompts[args.summaryType],
    });

    // Save the summary to the document
    await ctx.runMutation(api.documents.update, {
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
    const { text } = await generateText({
      model,
      system: `You are a helpful reading assistant. Answer questions ONLY using the content of the provided document. If the document doesn't address the question, say so clearly. Be concise and accurate.`,
      prompt: `Document:
${args.content}

Question: ${args.question}`,
    });

    // Save both the question and answer to chat history
    await ctx.runMutation(api.chat.addMessage, {
      documentId: args.documentId,
      role: "user",
      content: args.question,
    });

    await ctx.runMutation(api.chat.addMessage, {
      documentId: args.documentId,
      role: "assistant",
      content: text,
    });

    return text;
  },
});
