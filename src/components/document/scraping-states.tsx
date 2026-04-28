import {
  AlertTriangle,
  Check,
  FileText,
  Globe,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";

export function ScrapingPendingState() {
  return (
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
  );
}

type ScrapingFailedStateProps = {
  error?: string;
  onRemove: () => void;
};

export function ScrapingFailedState({ error, onRemove }: ScrapingFailedStateProps) {
  return (
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
        {error ||
          "We couldn't extract content from this URL. The page might be protected, require authentication, or use a format we don't support yet."}
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-[12px] font-medium text-red-200 transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-100">
          <RotateCcw className="h-3.5 w-3.5" />
          Try Again
        </button>
        <button
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-all hover:border-border hover:bg-secondary hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}
