"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import * as cheerio from "cheerio";
import { extractText } from "unpdf";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export const scrapeUrl = internalAction({
  args: {
    documentId: v.id("documents"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.runMutation(internal.scrapingHelpers.updateScrapingStatus, {
        documentId: args.documentId,
        status: "processing",
      });

      const response = await fetch(args.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const urlLower = args.url.toLowerCase();
      const isPdf = contentType.includes("application/pdf") || urlLower.endsWith(".pdf");

      let title: string;
      let content: string;
      let docType: "web" | "pdf" = "web";

      if (isPdf) {
        const buffer = await response.arrayBuffer();
        const { text } = await extractText(buffer, { mergePages: true });
        content = text.trim();

        if (!content) {
          throw new Error("No text could be extracted from PDF");
        }

        title = new URL(args.url).pathname.split("/").pop()?.replace(".pdf", "") || "PDF Document";
        docType = "pdf";
      } else {
        const html = await response.text();
        const $ = cheerio.load(html);

        $("script, style, nav, footer, header, aside, noscript, iframe").remove();

        title = $("title").text().trim() || $("h1").first().text().trim() || args.url;

        let mainElement: ReturnType<typeof $> | null = null;
        const mainSelectors = [
          "article",
          "main",
          "[role='main']",
          ".post-content",
          ".article-content",
          ".entry-content",
          ".content",
          "#content",
        ];

        for (const sel of mainSelectors) {
          const el = $(sel);
          if (el.length) {
            mainElement = el.first();
            break;
          }
        }

        const htmlContent = mainElement ? mainElement.html() : $("body").html();
        content = htmlContent ? turndown.turndown(htmlContent).trim() : "";
      }

      if (!content) {
        throw new Error("No content could be extracted from the URL");
      }

      await ctx.runMutation(internal.scrapingHelpers.updateDocumentContent, {
        documentId: args.documentId,
        title: title.slice(0, 200),
        content,
        type: docType,
        status: "completed",
      });

      // Generate title and tags using AI (non-critical)
      if (content.length > 50) {
        try {
          await ctx.runAction(internal.ai.generateTitleAndTagsInternal, {
            documentId: args.documentId,
          });
        } catch {
          // Title/tag generation is non-critical, ignore errors
        }
      }
    } catch (error) {
      await ctx.runMutation(internal.scrapingHelpers.updateScrapingStatus, {
        documentId: args.documentId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});
