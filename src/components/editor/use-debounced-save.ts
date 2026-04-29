import { useCallback, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useDebouncedSave(onSave: (content: string) => Promise<void>, delay: number = 1000) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (content: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      setStatus("saving");

      timeoutRef.current = setTimeout(async () => {
        try {
          await onSave(content);
          setStatus("saved");
          savedTimeoutRef.current = setTimeout(() => {
            setStatus("idle");
          }, 2000);
        } catch {
          setStatus("error");
        }
      }, delay);
    },
    [onSave, delay],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
    setStatus("idle");
  }, []);

  return { save, cancel, status };
}
