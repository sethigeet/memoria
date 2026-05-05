import { Check, Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip";

interface ReadingProgressProps {
  readAt?: number;
  progress?: number;
  compact?: boolean;
}

export function ReadingProgressIndicator({
  readAt,
  progress = 0,
  compact = false,
}: ReadingProgressProps) {
  const isRead = !!readAt;
  const hasProgress = progress > 0 && progress < 90;

  if (compact) {
    if (isRead) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              Read {formatReadDate(readAt)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (hasProgress) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex h-4 w-4 items-center justify-center">
                <svg className="h-4 w-4 -rotate-90" viewBox="0 0 16 16">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/10"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(progress / 100) * 37.7} 37.7`}
                    strokeLinecap="round"
                    className="text-sky-400"
                  />
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              {progress}% read
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-4 w-4 items-center justify-center">
              <Circle className="h-2 w-2 fill-sky-400 text-sky-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">
            Unread
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isRead) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-400">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide">Read</span>
      </div>
    );
  }

  if (hasProgress) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-sky-400 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40">{progress}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sky-400">
      <Circle className="h-2 w-2 fill-current" />
      <span className="text-[10px] font-medium uppercase tracking-wide">Unread</span>
    </div>
  );
}

function formatReadDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
