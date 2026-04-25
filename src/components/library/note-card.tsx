import { useState } from "react";
import { Link, FileText, Edit3 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import type { Id } from "#/lib/convex";

interface NoteCardProps {
  note: {
    _id: Id<"documents">;
    _creationTime: number;
    type: "web" | "pdf" | "note";
    title: string;
    source?: string;
    excerpt?: string;
    tags: string[];
  };
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);

  const typeConfig = {
    web: { label: "Web", icon: Link, className: "type-badge-web" },
    pdf: { label: "PDF", icon: FileText, className: "type-badge-pdf" },
    note: { label: "Note", icon: Edit3, className: "type-badge-note" },
  };

  const config = typeConfig[note.type];
  const TypeIcon = config.icon;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-[10px] p-[14px] cursor-pointer transition-all duration-150 flex flex-col gap-2.5 min-h-[140px] ${
        hovered
          ? "bg-[#1c1c22] border-[#2e2e38] -translate-y-[1px] shadow-lg"
          : "bg-card border-border"
      } border`}
      style={{
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.3)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase ${config.className}`}
        >
          {config.label}
        </span>
        <span className="text-[11px] text-muted-foreground">{formatDate(note._creationTime)}</span>
      </div>

      {/* Title */}
      <h3 className="text-[13.5px] font-semibold text-foreground leading-tight tracking-tight">
        {note.title}
      </h3>

      {/* Excerpt */}
      {note.excerpt && (
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
          {note.excerpt}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-2">
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[11px] px-2 py-0 h-5 bg-secondary/50 text-muted-foreground border border-border"
              >
                #{tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[11px] text-muted-foreground px-1">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TypeIcon className="w-3 h-3" />
          <span className="text-[11px]">{note.source || "Custom note"}</span>
        </div>
      </div>
    </div>
  );
}
