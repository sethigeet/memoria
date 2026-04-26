import type { Id } from "#/lib/convex";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";
import type { TagListItem } from "./types";

interface SidebarTagsSectionProps {
  tagsOpen: boolean;
  tags: TagListItem[];
  activeTag?: Id<"tags">;
  onToggleTagsOpen: () => void;
  onTagSelect: (id: Id<"tags"> | null) => void;
  onFolderSelect: (id: Id<"folders"> | null) => void;
}

export function SidebarTagsSection({
  tagsOpen,
  tags,
  activeTag,
  onToggleTagsOpen,
  onTagSelect,
  onFolderSelect,
}: SidebarTagsSectionProps) {
  return (
    <div className="mt-2">
      <button
        onClick={onToggleTagsOpen}
        className="flex items-center gap-1.5 px-4 py-1 text-[10.5px] font-bold tracking-wider uppercase text-muted-foreground cursor-pointer"
      >
        {tagsOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
        Tags
      </button>

      {tagsOpen &&
        tags.map((tag) => (
          <button
            key={tag._id}
            onClick={() => {
              onTagSelect(activeTag === tag._id ? null : tag._id);
              onFolderSelect(null);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 pl-6 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
              activeTag === tag._id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>{tag.name}</span>
          </button>
        ))}
    </div>
  );
}
