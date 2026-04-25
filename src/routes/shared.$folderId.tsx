import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { NoteCard } from "#/components/library/note-card";

export const Route = createFileRoute("/shared/$folderId")({
  component: PublicFolderView,
});

function PublicFolderView() {
  const { folderId } = useParams({ from: "/shared/$folderId" });
  const folder = useQuery(api.folders.getPublic, {
    id: folderId as Id<"folders">,
  });
  const documents = useQuery(api.folders.getPublicDocuments, {
    folderId: folderId as Id<"folders">,
  });

  if (folder === undefined || documents === undefined) {
    return (
      <div className="min-h-screen bg-[#0e0e12] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (folder === null) {
    return (
      <div className="min-h-screen bg-[#0e0e12] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Folder not found</h1>
          <p className="text-muted-foreground">This folder doesn't exist or is not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e12]">
      {/* Header */}
      <header className="border-b border-border bg-[#0b0b0e]">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#0e0e12] border border-border flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-5 h-5">
                <defs>
                  <linearGradient id="sharedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#4da6ff" }} />
                    <stop offset="100%" style={{ stopColor: "#7c3aed" }} />
                  </linearGradient>
                </defs>
                <path
                  d="M7 24 L7 10 Q7 8 9 8 L11 8 L11 24 Q11 25 10 25 L8 25 Q7 25 7 24Z"
                  fill="url(#sharedGrad)"
                />
                <path d="M11 11 L16 18 L21 11 L21 13 L16 21 L11 13Z" fill="url(#sharedGrad)" />
                <path
                  d="M21 8 L23 8 Q25 8 25 10 L25 24 Q25 25 24 25 L22 25 Q21 25 21 24 L21 8Z"
                  fill="url(#sharedGrad)"
                />
                <circle cx="10" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
                <circle cx="16" cy="4" r="1" fill="#7c3aed" opacity="0.7" />
                <circle cx="22" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
              </svg>
            </div>
            <span className="font-bold text-lg">Memoria</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{folder.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Public collection · {documents.length} items
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {documents.length === 0 ? (
          <div className="text-center py-20">
            <svg viewBox="0 0 32 32" className="w-12 h-12 mx-auto mb-4 opacity-30">
              <path
                d="M7 24 L7 10 Q7 8 9 8 L11 8 L11 24 Q11 25 10 25 L8 25 Q7 25 7 24Z"
                fill="currentColor"
              />
              <path d="M11 11 L16 18 L21 11 L21 13 L16 21 L11 13Z" fill="currentColor" />
              <path
                d="M21 8 L23 8 Q25 8 25 10 L25 24 Q25 25 24 25 L22 25 Q21 25 21 24 L21 8Z"
                fill="currentColor"
              />
            </svg>
            <p className="text-muted-foreground">This folder is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {documents.map((doc) => (
              <NoteCard
                key={doc._id}
                note={doc}
                onClick={() => {
                  // In public view, could open a read-only document view
                  // For now, just a placeholder
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
