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
import { Loader2, Sparkles, Wand2 } from "lucide-react";

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
    await updateDocument({
      id: documentId,
      summary: undefined,
      summaryType: undefined,
    });
  };

  return (
    <div className="px-7 py-3 border-y border-border shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={summaryType} onValueChange={(v) => setSummaryType(v as SummaryType)}>
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

        {summary && (
          <button
            onClick={clearSummary}
            className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {summary && (
        <div className="mt-3 p-3.5 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-primary">
              {generatedSummaryType} Summary
            </span>
          </div>
          <div className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
