import { useEffect, useCallback, useRef } from "react";

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: "navigation" | "actions" | "editing" | "view";
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: Shortcut[];
  enabled?: boolean;
}

function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const key = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  if (key !== shortcutKey) return false;

  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const wantsCtrlOrMeta = shortcut.ctrl || shortcut.meta;

  if (wantsCtrlOrMeta && !ctrlOrMeta) return false;
  if (!wantsCtrlOrMeta && ctrlOrMeta) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (!shortcut.shift && event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  if (!shortcut.alt && event.altKey) return false;

  return true;
}

function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea") return true;
  if ((element as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const isInEditable = isEditableElement(document.activeElement);

      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut)) {
          const requiresModifier = shortcut.ctrl || shortcut.meta || shortcut.alt;
          if (isInEditable && !requiresModifier) continue;

          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function formatShortcut(shortcut: Pick<Shortcut, "key" | "ctrl" | "meta" | "shift" | "alt">): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }

  const keyDisplay: Record<string, string> = {
    escape: "Esc",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    enter: "↵",
    backspace: "⌫",
    " ": "Space",
  };

  const key = shortcut.key.toLowerCase();
  parts.push(keyDisplay[key] || shortcut.key.toUpperCase());

  return parts.join(isMac ? "" : "+");
}
