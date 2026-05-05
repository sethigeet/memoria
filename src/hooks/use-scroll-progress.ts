import { useEffect, useRef, useCallback } from "react";

interface UseScrollProgressOptions {
  onProgress: (progress: number) => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useScrollProgress({
  onProgress,
  debounceMs = 500,
  enabled = true,
}: UseScrollProgressOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) {
      if (lastProgressRef.current !== 100) {
        lastProgressRef.current = 100;
        onProgress(100);
      }
      return;
    }

    const progress = Math.round((scrollTop / maxScroll) * 100);

    if (progress === lastProgressRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lastProgressRef.current = progress;
      onProgress(progress);
    }, debounceMs);
  }, [onProgress, debounceMs, enabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, enabled]);

  return containerRef;
}
