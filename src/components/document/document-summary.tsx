import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { Button } from "#/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";
import { ChevronDown, Loader2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Markdown } from "#/components/document/markdown-content";
import { cn } from "#/lib/utils";

type SummaryType = "concise" | "detailed" | "action-items";

type DocumentSummaryProps = {
  documentId: Id<"documents">;
  content: string;
  summary?: string;
  summaryType?: string;
};

export function DocumentSummary({
  documentId,
  content,
  summary,
  summaryType: generatedSummaryType,
}: DocumentSummaryProps) {
  const [summaryType, setSummaryType] = useState<SummaryType>("concise");
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(true);
  const [clearing, setClearing] = useState(false);

  const updateDocument = useMutation(api.documents.update);
  const generateSummary = useAction(api.ai.generateSummary);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      await generateSummary({
        documentId,
        content,
        summaryType,
      });
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setGenerating(false);
    }
  };

  const clearSummary = async () => {
    setClearing(true);
    try {
      await updateDocument({
        id: documentId,
        summary: null,
        summaryType: null,
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="px-7 py-3 border-y border-border shrink-0">
      {!summary ? (
        <div className="group relative overflow-hidden rounded-lg border border-primary/15 bg-linear-to-r from-primary/6 via-primary/3 to-transparent">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-primary/40 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -left-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl"
          />

          <div className="relative flex flex-wrap items-center gap-3 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary/90">
                  AI Summary
                </div>
                <div className="truncate text-[11.5px] text-muted-foreground">
                  Distill this document into a quick overview.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Select
                value={summaryType}
                onValueChange={(v) => setSummaryType(v as SummaryType)}
                disabled={generating}
              >
                <SelectTrigger className="h-8 w-[140px] rounded-md border-primary/20 bg-background/40 text-[12px] hover:border-primary/40 focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="action-items">Action Items</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generating}
                className={cn(
                  "h-8 gap-1.5 px-3 text-[12px] font-medium",
                  "bg-linear-to-b from-primary/90 to-primary text-primary-foreground",
                  "border border-primary/40 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_4px_14px_-6px_var(--color-primary)]",
                  "hover:from-primary hover:to-primary hover:brightness-110",
                  "disabled:opacity-70",
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          className="rounded-lg bg-primary/5 border border-primary/20 overflow-hidden"
        >
          <CollapsibleTrigger className="group flex w-full items-center gap-1.5 px-3.5 py-2.5 text-left transition-colors hover:bg-primary/10">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-primary">
              {generatedSummaryType} Summary
            </span>
            <ChevronDown
              className={cn(
                "ml-auto w-3.5 h-3.5 text-primary/70 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="px-3.5 pt-1 pb-3.5 border-t border-primary/15">
              <Markdown compact className="text-foreground/80 mt-2.5">
                {summary}
              </Markdown>

              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSummary}
                  disabled={clearing}
                  className="h-7 gap-1.5 px-2.5 text-[11.5px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  {clearing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Clear summary
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
