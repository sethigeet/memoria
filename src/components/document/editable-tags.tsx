import { useCallback, useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useMutation } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

type EditableTagsProps = {
  documentId: Id<"documents">;
  tags: string[];
  editable?: boolean;
};

export function EditableTags({ documentId, tags, editable = true }: EditableTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addTags = useMutation(api.documents.addTags);
  const removeTags = useMutation(api.documents.removeTags);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTag = useCallback(async () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      await addTags({ documentId, tags: [trimmed] });
    }
    setNewTag("");
    setIsAdding(false);
  }, [newTag, tags, documentId, addTags]);

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      await removeTags({ documentId, tags: [tag] });
    },
    [documentId, removeTags],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setNewTag("");
      setIsAdding(false);
    }
    if (e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            "text-[11px] px-2 py-0 h-5 bg-secondary/50 text-muted-foreground border border-border",
            editable && "pr-1 gap-1",
          )}
        >
          #{tag}
          {editable && (
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </Badge>
      ))}
      {editable && !isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 h-5 rounded border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add tag
        </button>
      )}
      {isAdding && (
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onBlur={handleAddTag}
          onKeyDown={handleKeyDown}
          placeholder="tag name"
          className="text-[11px] px-2 py-0.5 h-5 w-24 bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  );
}
