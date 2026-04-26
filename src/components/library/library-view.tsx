import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { NoteCard } from "./note-card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Plus, Filter, ChevronDown, Link as LinkIcon, BookOpen } from "lucide-react";

interface LibraryViewProps {
  activeFolder?: Id<"folders">;
  activeTag?: Id<"tags">;
  onOpenNote: (id: Id<"documents">) => void;
  onNewNote: () => void;
  searchQuery?: string;
}

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "type";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "date-desc", label: "Date — newest" },
  { id: "date-asc", label: "Date — oldest" },
  { id: "title-asc", label: "Title — A to Z" },
  { id: "title-desc", label: "Title — Z to A" },
  { id: "type", label: "Type" },
];

export function LibraryView({
  activeFolder,
  activeTag,
  onOpenNote,
  onNewNote,
  searchQuery,
}: LibraryViewProps) {
  const [urlInput, setUrlInput] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  const queryArgs = {
    ...(activeFolder && { folderId: activeFolder }),
    ...(activeTag && { tagId: activeTag }),
  };
  const documents = useQuery(api.documents.list, queryArgs);

  const searchResults = useQuery(
    api.documents.search,
    searchQuery ? { query: searchQuery } : "skip",
  );

  const folders = useQuery(api.folders.list);
  const folder = activeFolder ? folders?.find((f) => f._id === activeFolder) : null;

  const displayDocs = searchQuery ? searchResults : documents;
  const heading = folder?.name || (searchQuery ? `Search: "${searchQuery}"` : "Library");

  const sortedDocs = useMemo(() => {
    if (!displayDocs) return [];

    return [...displayDocs].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b._creationTime - a._creationTime;
        case "date-asc":
          return a._creationTime - b._creationTime;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "type":
          return a.type.localeCompare(b.type) || b._creationTime - a._creationTime;
        default:
          return 0;
      }
    });
  }, [displayDocs, sortBy]);

  const groupedDocs = useMemo(() => {
    const groups: Record<string, typeof sortedDocs> = {};

    for (const doc of sortedDocs) {
      let key: string;
      if (sortBy === "date-desc" || sortBy === "date-asc") {
        const date = new Date(doc._creationTime);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) key = "Today";
        else if (diffDays === 1) key = "Yesterday";
        else
          key = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
      } else if (sortBy === "title-asc" || sortBy === "title-desc") {
        key = doc.title[0].toUpperCase();
      } else if (sortBy === "type") {
        key = { web: "Web", pdf: "PDF", note: "Note" }[doc.type];
      } else {
        key = "All";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }

    return groups;
  }, [sortedDocs, sortBy]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="px-6 h-[50px] border-b border-border flex items-center gap-3 flex-shrink-0 bg-[#0e0e12]">
        <span className="text-[14.5px] font-bold tracking-tight">{heading}</span>
        <span className="text-[12px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
          {displayDocs?.length ?? 0}
        </span>

        <div className="ml-auto flex gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <Filter className="w-3 h-3" />
                {currentSortLabel}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <div className="px-2 py-1.5 text-[10.5px] font-bold tracking-wider uppercase text-muted-foreground">
                Sort by
              </div>
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={sortBy === opt.id ? "bg-secondary" : ""}
                >
                  {opt.label}
                  {sortBy === opt.id && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onNewNote} size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            New Note
          </Button>
        </div>
      </div>

      {/* URL capture bar */}
      <div className="px-6 py-2.5 border-b border-border bg-[#0e0e12] flex-shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-secondary/30 border border-border rounded-lg">
            <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a URL or drop a PDF to add to your library..."
              className="border-0 bg-transparent h-auto p-0 text-[13px] focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setUrlInput("")}>
            Add
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {Object.keys(groupedDocs).length === 0 ? (
          <div className="text-center text-muted-foreground mt-20">
            <BookOpen className="w-9 h-9 mx-auto mb-4 text-muted-foreground/50" />
            <div className="text-[14px] mb-1.5 text-muted-foreground/80">Nothing here yet</div>
            <div className="text-[12px] text-muted-foreground/60">
              Add a URL, upload a PDF, or create a custom note.
            </div>
          </div>
        ) : (
          Object.entries(groupedDocs).map(([key, docs]) => (
            <div key={key} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                  {key}
                </span>
                <span className="text-[11px] text-muted-foreground/60">{docs.length}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-2.5">
                {docs.map((note) => (
                  <NoteCard key={note._id} note={note} onClick={() => onOpenNote(note._id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
