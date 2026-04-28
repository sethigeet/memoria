import { useState } from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import { Check, Copy, ExternalLink } from "lucide-react";

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function SourceLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const domain = getDomain(url);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <HoverCardPrimitive.Root openDelay={120} closeDelay={120}>
      <HoverCardPrimitive.Trigger asChild>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate min-w-0 max-w-[280px] underline-offset-[3px] decoration-muted-foreground/30 transition-colors hover:text-foreground hover:underline hover:decoration-foreground/40"
        >
          {domain}
        </a>
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[420px] max-w-[calc(100vw-2rem)] origin-top-left rounded-lg border border-border/80 bg-popover/95 p-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="min-w-0 flex-1 truncate px-2 py-1 font-mono text-[11.5px] text-foreground/90"
              title={url}
            >
              {url}
            </div>
            <button
              onClick={handleOpen}
              aria-label="Open in new tab"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy URL"}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-secondary/40 text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
