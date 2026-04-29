import { useCallback, useRef, useState, useEffect } from "react";
import { useDebouncedSave } from "#/components/editor/use-debounced-save";
import { useMutation } from "convex/react";
import { api, type Id } from "#/lib/convex";

type EditableTitleProps = {
  documentId: Id<"documents">;
  title: string;
  editable?: boolean;
  className?: string;
};

export function EditableTitle({
  documentId,
  title,
  editable = true,
  className = "",
}: EditableTitleProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateDocument = useMutation(api.documents.update);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleSave = useCallback(
    async (newTitle: string) => {
      if (newTitle.trim() && newTitle !== title) {
        await updateDocument({ id: documentId, title: newTitle.trim() });
      }
    },
    [documentId, title, updateDocument],
  );

  const { save, status } = useDebouncedSave(handleSave, 1000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    if (newTitle.trim()) {
      save(newTitle.trim());
    }
  };

  const handleBlur = () => {
    if (!localTitle.trim()) {
      setLocalTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalTitle(title);
      inputRef.current?.blur();
    }
  };

  if (!editable) {
    return <h1 className={className}>{title}</h1>;
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={localTitle}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent border-0 outline-none focus:ring-0 ${className}`}
        placeholder="Untitled"
      />
      {status === "saving" && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          saving...
        </span>
      )}
    </div>
  );
}
