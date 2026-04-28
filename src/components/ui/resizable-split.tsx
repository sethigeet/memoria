import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "#/lib/utils";

type SizeUnit = "%" | "px";

type ResizableSplitProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  /**
   * Unit used for the left-pane size. "%" sizes relative to the container,
   * "px" uses absolute pixel widths (good for narrow sidebars).
   */
  unit?: SizeUnit;
  defaultLeftSize?: number;
  minLeftSize?: number;
  maxLeftSize?: number;
  /** Step used by ArrowLeft/ArrowRight key. Defaults: 2 (%) / 16 (px). */
  step?: number;
  /** Step used when Shift is held. Defaults: 5 (%) / 48 (px). */
  bigStep?: number;
  storageKey?: string;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ResizableSplit({
  left,
  right,
  unit = "%",
  defaultLeftSize = unit === "%" ? 62 : 232,
  minLeftSize = unit === "%" ? 30 : 180,
  maxLeftSize = unit === "%" ? 80 : 400,
  step,
  bigStep,
  storageKey,
  className,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftSize, setLeftSize] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultLeftSize;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultLeftSize;
    const parsed = Number.parseFloat(saved);
    if (Number.isNaN(parsed)) return defaultLeftSize;
    return clamp(parsed, minLeftSize, maxLeftSize);
  });
  const [dragging, setDragging] = useState(false);

  const resolvedStep = step ?? (unit === "%" ? 2 : 16);
  const resolvedBigStep = bigStep ?? (unit === "%" ? 5 : 48);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, String(leftSize));
  }, [leftSize, storageKey]);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const offset = clientX - rect.left;
      const next = unit === "%" ? (offset / rect.width) * 100 : offset;
      setLeftSize(clamp(next, minLeftSize, maxLeftSize));
    },
    [minLeftSize, maxLeftSize, unit],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      updateFromClientX(e.clientX);
    };
    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [dragging, updateFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const stepSize = e.shiftKey ? resolvedBigStep : resolvedStep;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setLeftSize((p) => clamp(p - stepSize, minLeftSize, maxLeftSize));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setLeftSize((p) => clamp(p + stepSize, minLeftSize, maxLeftSize));
    } else if (e.key === "Home") {
      e.preventDefault();
      setLeftSize(minLeftSize);
    } else if (e.key === "End") {
      e.preventDefault();
      setLeftSize(maxLeftSize);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setLeftSize(defaultLeftSize);
    }
  };

  const leftWidth = unit === "%" ? `${leftSize}%` : `${leftSize}px`;

  return (
    <div
      ref={containerRef}
      className={cn("flex min-h-0 min-w-0 flex-1", className)}
    >
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden shrink-0"
        style={{ width: leftWidth }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftSize)}
        aria-valuemin={minLeftSize}
        aria-valuemax={maxLeftSize}
        aria-label="Resize panels"
        tabIndex={0}
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDoubleClick={() => setLeftSize(defaultLeftSize)}
        onKeyDown={onKeyDown}
        className={cn(
          "group relative w-px shrink-0 cursor-col-resize bg-border transition-colors",
          "before:absolute before:inset-y-0 before:-left-1.5 before:-right-1.5 before:content-['']",
          "after:pointer-events-none after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-1/2 after:w-px after:bg-primary/0 after:transition-colors",
          "hover:after:bg-primary/50 focus-visible:outline-none focus-visible:after:bg-primary",
          dragging && "after:bg-primary",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 flex h-9 w-1 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-border/0 transition-colors",
            "group-hover:bg-primary/60",
            dragging && "bg-primary",
          )}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {right}
      </div>
    </div>
  );
}
