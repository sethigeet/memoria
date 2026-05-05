import { List, ChevronLeft } from "lucide-react";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import type { HeadingItem } from "#/hooks/use-document-outline";

type DocumentOutlineProps = {
  headings: HeadingItem[];
  activeId: string | null;
  minLevel: number;
  isOpen: boolean;
  onToggle: () => void;
  onHeadingClick: (id: string) => void;
};

export function DocumentOutline({
  headings,
  activeId,
  minLevel,
  isOpen,
  onToggle,
  onHeadingClick,
}: DocumentOutlineProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="relative h-full flex shrink-0">
      <div
        className={cn(
          "h-full flex flex-col border-r border-border/50 bg-[#0b0b0e]/80 backdrop-blur-sm transition-all duration-300 ease-out overflow-hidden",
          isOpen ? "w-56" : "w-0 border-r-0",
        )}
      >
        <div
          className={cn(
            "flex flex-col h-full overflow-hidden transition-opacity duration-200 w-56",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
            <List className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/70">
              On this page
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            <ul className="space-y-0.5">
              {headings.map((heading) => {
                const indent = (heading.level - minLevel) * 12;
                const isActive = activeId === heading.id;

                return (
                  <li key={heading.id}>
                    <button
                      onClick={() => onHeadingClick(heading.id)}
                      className={cn(
                        "group relative w-full text-left px-3 py-1.5 rounded-md text-[12px] leading-snug transition-all duration-150",
                        "hover:bg-secondary/60 hover:text-foreground",
                        isActive
                          ? "text-foreground bg-primary/10 font-medium"
                          : "text-muted-foreground/80",
                      )}
                      style={{ paddingLeft: `${12 + indent}px` }}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full transition-all duration-200",
                          isActive ? "bg-primary opacity-100" : "bg-transparent opacity-0",
                        )}
                      />
                      <span className="line-clamp-2">{heading.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-3 py-2 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-secondary/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: activeId
                      ? `${((headings.findIndex((h) => h.id === activeId) + 1) / headings.length) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground/60 min-w-10 text-right">
                {activeId ? headings.findIndex((h) => h.id === activeId) + 1 : 0} /{" "}
                {headings.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggle}
            className="absolute z-10 top-3 left-full ml-2 rounded-full bg-secondary/80 border border-border/60 shadow-md hover:bg-secondary"
          >
            {isOpen ? (
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <List className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {isOpen ? "Hide outline" : "Show outline"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
