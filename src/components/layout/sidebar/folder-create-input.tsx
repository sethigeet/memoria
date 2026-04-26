import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";
import { Input } from "#/components/ui/input";

interface FolderCreateInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
}

export function FolderCreateInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Folder name...",
  className,
  style,
  autoFocus,
}: FolderCreateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;

    const focusInput = () => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.select();
    };

    focusInput();
    const raf = requestAnimationFrame(focusInput);
    const timeoutId = window.setTimeout(focusInput, 40);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [autoFocus]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") onSubmit();
    if (event.key === "Escape") onCancel();
  };

  return (
    <div className={className} style={style}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-7 text-[13px] bg-sidebar-accent border-sidebar-border flex-1"
        autoFocus={autoFocus}
      />
      <button onClick={onSubmit} className="p-1 rounded hover:bg-sidebar-accent text-primary">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
