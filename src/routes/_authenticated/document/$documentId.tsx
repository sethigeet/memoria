import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { ChatPane } from "#/components/document/chat-pane";
import { DocumentSummary } from "#/components/document/document-summary";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  ArrowLeft,
  Share,
  MoreHorizontal,
  Link as LinkIcon,
  Sparkles,
  BookOpen,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Globe,
  FileText,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/document/$documentId")({
  component: DocumentRoute,
});

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function DocumentRoute() {
  const navigate = useNavigate();
  const documentId = useParams({
    from: "/_authenticated/document/$documentId",
    select: (p) => p.documentId as Id<"documents">,
  });
  const document = useQuery(api.documents.get, { id: documentId });

  const onBack = () => navigate({ to: "/" });

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const typeConfig = {
    web: {
      label: "Web",
      className: "bg-blue-500/15 text-blue-500 border border-blue-500/20",
    },
    pdf: {
      label: "PDF",
      className: "bg-red-500/15 text-red-500 border border-red-500/20",
    },
    note: {
      label: "Note",
      className: "bg-violet-400/15 text-violet-400 border border-violet-400/20",
    },
  };

  const config = typeConfig[document.type];

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      <div className="px-4 h-[50px] border-b border-border flex items-center gap-2.5 shrink-0 bg-[#0e0e12]">
        <Button variant="outline" size="icon" className="w-7 h-7" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>

        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground flex-1 overflow-hidden">
          <button onClick={onBack} className="hover:text-foreground transition-colors">
            Library
          </button>
          <span className="text-border">/</span>
          <span className="truncate text-foreground/70">{document.title}</span>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share className="w-3 h-3" />
            Share
          </Button>
          <Button variant="outline" size="icon" className="w-7 h-7">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[62%] border-r border-border flex flex-col min-h-0 pb-5 overflow-y-auto">
          <div className="px-7 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-1.5 mb-2.5">
              {document.folder && (
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `${document.folder.color}18`,
                    color: document.folder.color,
                    border: `1px solid ${document.folder.color}30`,
                  }}
                >
                  {document.folder.name}
                </span>
              )}
              <span
                className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase ${config.className}`}
              >
                {config.label}
              </span>
            </div>

            <h1 className="text-[22px] font-extrabold tracking-tight leading-tight mb-2.5">
              {document.title}
            </h1>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {document.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[11px] px-2 py-0 h-5 bg-secondary/50 text-muted-foreground border border-border"
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            {document.source && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-[12px]">
                <LinkIcon className="w-3 h-3" />
                <span>{document.source}</span>
                <span className="text-border">·</span>
                <span>{formatDate(document._creationTime)}</span>
              </div>
            )}
          </div>

          <DocumentSummary
            documentId={documentId}
            content={document.content}
            summary={document.summary}
            summaryType={document.summaryType}
          />

          <div className="flex-1 min-h-0 px-7 py-5">
            {document.scrapingStatus === "pending" || document.scrapingStatus === "processing" ? (
              <div className="mx-auto flex max-w-md flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-2xl animate-glow-pulse" />
                  <div className="absolute inset-2 rounded-full border border-sky-500/30 bg-linear-to-br from-sky-500/15 to-sky-500/5" />
                  <div className="absolute inset-0 rounded-full border border-sky-400/40 border-t-transparent animate-spin animation-duration-[3s]" />
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-sky-500/30 bg-card shadow-[0_0_24px_rgba(56,189,248,0.25)]">
                    <Globe className="h-6 w-6 text-sky-400" />
                  </div>
                </div>
                <h3 className="mb-2 text-[18px] font-bold tracking-tight text-foreground">
                  Extracting Content
                </h3>
                <p className="mb-7 text-[13px] leading-relaxed text-muted-foreground">
                  Analyzing and extracting the main content from this webpage. This usually takes a few seconds.
                </p>
                <div className="flex w-full max-w-xs flex-col gap-2">
                  <div className="flex items-center gap-2.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-300">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Fetching webpage</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-md border border-sky-500/30 bg-sky-500/8 px-3 py-2 text-[12px] text-sky-200">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    <span>Parsing HTML structure</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-md border border-border bg-secondary/30 px-3 py-2 text-[12px] text-muted-foreground/60">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Extracting main content</span>
                  </div>
                </div>
              </div>
            ) : document.scrapingStatus === "failed" ? (
              <div className="mx-auto flex max-w-md flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl animate-glow-pulse" />
                  <div className="absolute inset-2 rounded-full border border-red-500/30 bg-linear-to-br from-red-500/15 to-red-500/5" />
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-card shadow-[0_0_24px_rgba(239,68,68,0.25)]">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <h3 className="mb-2 text-[18px] font-bold tracking-tight text-foreground">
                  Content Extraction Failed
                </h3>
                <div className="mb-7 rounded-md border border-red-500/15 bg-red-500/6 px-4 py-3 text-[13px] leading-relaxed text-red-200/80">
                  {document.scrapingError || "We couldn't extract content from this URL. The page might be protected, require authentication, or use a format we don't support yet."}
                </div>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-[12px] font-medium text-red-200 transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-100">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try Again
                  </button>
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-all hover:border-border hover:bg-secondary hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-muted-foreground leading-[1.8] max-w-[640px] whitespace-pre-wrap">
                {document.content}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-[#0e0e12] h-auto p-0 px-3.5">
              <TabsTrigger
                value="chat"
                className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="notebook"
                className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Notebook
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
              <ChatPane documentId={documentId} content={document.content} />
            </TabsContent>

            <TabsContent value="notebook" className="flex-1 overflow-hidden m-0 p-4">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2.5">
                Personal notes on this document
              </div>
              <textarea
                placeholder="Write your thoughts, highlights, and connections here..."
                className="w-full h-full bg-transparent border-0 outline-none text-[13px] text-muted-foreground leading-relaxed resize-none"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
