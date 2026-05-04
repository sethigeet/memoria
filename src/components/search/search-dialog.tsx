import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Edit3, FileText, Globe, Hash, Search, ArrowRight, Sparkles } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectResult: (documentId: Id<"documents">) => void;
}

const typeConfig = {
  web: {
    label: "Web",
    icon: Globe,
    accentClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/20",
  },
  pdf: {
    label: "PDF",
    icon: FileText,
    accentClass: "text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/20",
  },
  note: {
    label: "Note",
    icon: Edit3,
    accentClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
  },
} as const;

function getSourceLabel(source: string | undefined) {
  if (!source) return "Custom note";
  try {
    const url = new URL(source);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return source;
  }
}

function getExcerpt(content: string, excerpt?: string) {
  return (excerpt || content).replace(/\s+/g, " ").trim().slice(0, 160);
}

export function SearchDialog({ open, onOpenChange, onSelectResult }: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      return;
    }
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 120);
    return () => window.clearTimeout(timer);
  }, [query]);

  const results = useQuery(
    api.documents.search,
    debouncedQuery ? { query: debouncedQuery, limit: 24 } : "skip",
  );

  const hasQuery = debouncedQuery.length > 0;
  const resultCount = results?.length ?? 0;
  const isLoading = hasQuery && results === undefined;

  const subtitle = useMemo(() => {
    if (!hasQuery) return "Search your archive";
    if (isLoading) return `Searching...`;
    if (resultCount === 0) return `Nothing found for "${debouncedQuery}"`;
    return `${resultCount} ${resultCount === 1 ? "memory" : "memories"} found`;
  }, [debouncedQuery, hasQuery, isLoading, resultCount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Search your notes</DialogTitle>

        <div className="search-container relative overflow-hidden rounded-[28px] border border-white/8 bg-[#0c0c10]/98 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_40px_100px_-20px_rgba(0,0,0,0.7),0_0_80px_-30px_rgba(59,130,246,0.15)]">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-500/8 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-blue-600/6 blur-[60px]" />

          {/* Grain texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Search header */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="group relative flex items-center gap-4 rounded-2xl border border-white/6 bg-white/2 px-5 py-4 transition-all duration-300 focus-within:border-blue-500/20 focus-within:bg-white/3 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.1),0_8px_40px_-10px_rgba(59,130,246,0.1)]">
              <Search className="h-5 w-5 text-blue-200/40 transition-colors duration-300 group-focus-within:text-blue-300/70" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a memory..."
                className="h-auto border-0 bg-transparent px-0 text-xl tracking-tight text-white/90 placeholder:text-white/25 shadow-none focus-visible:ring-0"
              />
              <kbd className="hidden shrink-0 items-center gap-1 rounded-lg border border-white/6 bg-white/3 px-2.5 py-1.5 font-mono text-[11px] text-white/30 sm:flex">
                <span className="text-[13px]">⌘</span>K
              </kbd>
            </div>

            <p className="mt-3 px-1 font-sans text-[13px] tracking-wide text-white/35">
              {subtitle}
            </p>
          </div>

          {/* Results area */}
          <div className="relative max-h-[60vh] overflow-y-auto px-4 pb-4">
            {/* Empty state */}
            {!hasQuery && (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/10 bg-linear-to-b from-blue-500/10 to-blue-600/5">
                  <Sparkles className="h-6 w-6 text-blue-300/60" />
                </div>
                <p className="text-xl tracking-tight text-white/80">Your personal archive</p>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/35">
                  Search across notes, tags, folders, and saved links. Everything you've remembered
                  lives here.
                </p>
              </div>
            )}

            {/* Loading state */}
            {hasQuery && isLoading && (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/4 bg-white/15 p-5"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-12 animate-pulse rounded-md bg-white/5" />
                      <div className="h-3 w-20 animate-pulse rounded bg-white/3" />
                    </div>
                    <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/4" />
                    <div className="mt-3 space-y-2">
                      <div className="h-3 w-full animate-pulse rounded bg-white/25" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {hasQuery && !isLoading && resultCount === 0 && (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-8 text-center">
                <p className="text-lg text-white/70">No memories found</p>
                <p className="mt-2 text-[13px] text-white/35">
                  Try searching for a title, tag, or part of the content
                </p>
              </div>
            )}

            {/* Results */}
            {hasQuery && !isLoading && resultCount > 0 && (
              <div className="space-y-2">
                {results?.map((result, index) => {
                  const config = typeConfig[result.type];
                  const TypeIcon = config.icon;
                  const metaTags = [
                    ...(result.folderName ? [{ icon: ArrowRight, label: result.folderName }] : []),
                    ...result.tags.slice(0, 2).map((tag) => ({ icon: Hash, label: tag })),
                    ...(result.source
                      ? [{ icon: Globe, label: getSourceLabel(result.source) }]
                      : []),
                  ].slice(0, 3);

                  return (
                    <button
                      key={result._id}
                      type="button"
                      onClick={() => {
                        onSelectResult(result._id);
                        onOpenChange(false);
                      }}
                      className="group w-full animate-fade-in-up rounded-2xl border border-transparent bg-white/2 p-5 text-left transition-all duration-200 hover:border-blue-500/15 hover:bg-white/4"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {/* Type badge & date */}
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${config.bgClass} ${config.borderClass} ${config.accentClass}`}
                            >
                              <TypeIcon className="h-3 w-3" />
                              {config.label}
                            </span>
                            <span className="text-[11px] text-white/25">
                              {new Date(result._creationTime).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="mt-3 text-[17px] leading-snug tracking-tight text-white/90 transition-colors group-hover:text-blue-100">
                            {result.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/40">
                            {getExcerpt(result.content, result.excerpt)}
                          </p>

                          {/* Meta tags */}
                          {metaTags.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {metaTags.map((tag) => (
                                <span
                                  key={`${result._id}-${tag.label}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-white/3 px-2 py-0.5 text-[11px] text-white/30"
                                >
                                  <tag.icon className="h-2.5 w-2.5" />
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/4 bg-white/2 text-white/20 transition-all duration-200 group-hover:border-blue-500/20 group-hover:bg-blue-500/10 group-hover:text-blue-300/70">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
