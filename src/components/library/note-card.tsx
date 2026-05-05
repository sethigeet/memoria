import { useState } from "react";
import { useMutation } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { Link, FileText, Edit3, Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { NoteCardContextMenu } from "./note-actions-menu";
import { ReadingProgressIndicator } from "./reading-progress";

const typeConfig = {
  web: {
    label: "Web",
    icon: Link,
    className: "bg-blue-500/15 text-blue-500 border border-blue-500/20",
  },
  pdf: {
    label: "PDF",
    icon: FileText,
    className: "bg-red-500/15 text-red-500 border border-red-500/20",
  },
  note: {
    label: "Note",
    icon: Edit3,
    className: "bg-violet-400/15 text-violet-400 border border-violet-400/20",
  },
};

interface NoteCardProps {
  note: {
    _id: Id<"documents">;
    _creationTime: number;
    type: "web" | "pdf" | "note";
    title: string;
    source?: string;
    excerpt?: string;
    tags: string[];
    folderId?: Id<"folders">;
    scrapingStatus?: "pending" | "processing" | "completed" | "failed";
    scrapingError?: string;
    readAt?: number;
    readProgress?: number;
  };
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);
  const deleteDocument = useMutation(api.documents.remove);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDocument({ id: note._id });
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

  const isProcessing = note.scrapingStatus === "pending" || note.scrapingStatus === "processing";
  const isError = note.scrapingStatus === "failed";

  if (isProcessing) return <ProcessingNoteCard note={note} onClick={onClick} />;

  if (isError) return <ErrorNoteCard note={note} onClick={onClick} />;

  return (
    <NoteCardContextMenu documentId={note._id} folderId={note.folderId} readAt={note.readAt}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`rounded-[10px] p-[14px] cursor-pointer transition-all duration-150 flex flex-col gap-2.5 min-h-[140px] ${
          hovered
            ? "bg-[#1c1c22] border-[#2e2e38] -translate-y-px shadow-lg"
            : "bg-card border-border"
        } border`}
        style={{
          boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.3)" : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase ${config.className}`}
            >
              {config.label}
            </span>
            <ReadingProgressIndicator readAt={note.readAt} progress={note.readProgress} compact />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDate(note._creationTime)}
            </span>
            {hovered && (
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                title="Move to trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
    </NoteCardContextMenu>
  );
}

function ProcessingNoteCard({ note, onClick }: NoteCardProps) {
  const config = typeConfig[note.type];
  const TypeIcon = config.icon;

  return (
    <NoteCardContextMenu documentId={note._id} folderId={note.folderId} readAt={note.readAt}>
      <div
        onClick={onClick}
        className="group relative flex min-h-[140px] cursor-pointer flex-col gap-2.5 overflow-hidden rounded-[10px] border border-sky-500/20 bg-card p-[14px] transition-all duration-150 bg-[radial-gradient(circle_at_top_right,oklch(0.62_0.18_232/0.08),transparent_60%)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-linear-to-r from-transparent via-sky-400/80 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-scan" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-sky-400/4 to-transparent bg-size-[200%_100%] animate-shimmer" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
          >
            {config.label}
          </span>
          <div className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-soft-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Extracting</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-3 pt-1">
          <div className="h-4 w-3/4 rounded bg-linear-to-r from-secondary via-secondary/40 to-secondary bg-size-[200%_100%] animate-shimmer" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-linear-to-r from-secondary via-secondary/40 to-secondary bg-size-[200%_100%] animate-shimmer" />
            <div className="h-3 w-5/6 rounded bg-linear-to-r from-secondary via-secondary/40 to-secondary bg-size-[200%_100%] animate-shimmer" />
            <div className="h-3 w-2/3 rounded bg-linear-to-r from-secondary via-secondary/40 to-secondary bg-size-[200%_100%] animate-shimmer" />
          </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-1.5">
          <TypeIcon className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/60">
            {note.source || "Fetching..."}
          </span>
        </div>
      </div>
    </NoteCardContextMenu>
  );
}

function ErrorNoteCard({ note, onClick }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);

  const config = typeConfig[note.type];
  const TypeIcon = config.icon;

  return (
    <NoteCardContextMenu documentId={note._id} folderId={note.folderId} readAt={note.readAt}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex min-h-[140px] cursor-pointer flex-col gap-2.5 overflow-hidden rounded-[10px] border border-red-500/25 bg-card p-[14px] transition-all duration-150 bg-[radial-gradient(circle_at_top_left,oklch(0.55_0.2_25/0.12),transparent_55%)] ${
          hovered
            ? "-translate-y-px border-red-500/40 shadow-[0_4px_24px_rgba(239,68,68,0.15)]"
            : ""
        }`}
      >
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-red-500/20 blur-3xl animate-glow-pulse" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
          >
            {config.label}
          </span>
          <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-300">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Failed</span>
          </div>
        </div>

        <h3 className="relative z-10 text-[13.5px] font-semibold leading-tight tracking-tight text-red-100/90">
          {note.title}
        </h3>

        <div className="relative z-10 rounded border border-red-500/15 bg-red-500/6 px-2.5 py-1.5 text-red-200/80">
          <p className="line-clamp-2 text-[11px] leading-relaxed">
            {note.scrapingError || "Unable to extract content from this URL"}
          </p>
        </div>

        <div className="relative z-10 mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <TypeIcon className="h-3 w-3" />
            <span className="text-[11px]">{note.source || "Unknown source"}</span>
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-300 transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-200 ${
              hovered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    </NoteCardContextMenu>
  );
}
