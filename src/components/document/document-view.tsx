import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { ChatPane } from "./chat-pane";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  ArrowLeft,
  Share,
  MoreHorizontal,
  Link as LinkIcon,
  Sparkles,
  BookOpen,
  Wand2,
  Loader2,
} from "lucide-react";

interface DocumentViewProps {
  documentId: Id<"documents">;
  onBack: () => void;
}

export function DocumentView({ documentId, onBack }: DocumentViewProps) {
  const document = useQuery(api.documents.get, { id: documentId });
  const [summaryType, setSummaryType] = useState<"concise" | "detailed" | "action-items">(
    "concise",
  );
  const [generating, setGenerating] = useState(false);

  const updateDocument = useMutation(api.documents.update);
  const generateSummary = useAction(api.ai.generateSummary);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      await generateSummary({
        documentId,
        content: document.content,
        summaryType,
      });
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setGenerating(false);
    }
  };

  const clearSummary = async () => {
    await updateDocument({
      id: documentId,
      summary: undefined,
      summaryType: undefined,
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const typeConfig = {
    web: { label: "Web", className: "type-badge-web" },
    pdf: { label: "PDF", className: "type-badge-pdf" },
    note: { label: "Note", className: "type-badge-note" },
  };

  const config = typeConfig[document.type];

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="px-4 h-[50px] border-b border-border flex items-center gap-2.5 flex-shrink-0 bg-[#0e0e12]">
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

        <div className="flex gap-1.5 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share className="w-3 h-3" />
            Share
          </Button>
          <Button variant="outline" size="icon" className="w-7 h-7">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content */}
        <div className="w-[62%] border-r border-border flex flex-col overflow-hidden">
          {/* Meta header */}
          <div className="px-7 pt-5 pb-3 flex-shrink-0">
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

          {/* Summary bar */}
          <div className="px-7 py-3 border-y border-border flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={summaryType}
                onValueChange={(v) => setSummaryType(v as typeof summaryType)}
              >
                <SelectTrigger className="w-[130px] h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="action-items">Action Items</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generating}
                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Generate Summary
                  </>
                )}
              </Button>

              {document.summary && (
                <button
                  onClick={clearSummary}
                  className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {document.summary && (
              <div className="mt-3 p-3.5 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10.5px] font-bold tracking-wider uppercase text-primary">
                    {document.summaryType} Summary
                  </span>
                </div>
                <div className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {document.summary}
                </div>
              </div>
            )}
          </div>

          {/* Article content */}
          <div className="flex-1 overflow-auto px-7 py-5">
            <div className="text-[14px] text-muted-foreground leading-[1.8] max-w-[640px] whitespace-pre-wrap">
              {document.content}
            </div>
          </div>
        </div>

        {/* Right: Chat/Notebook */}
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
