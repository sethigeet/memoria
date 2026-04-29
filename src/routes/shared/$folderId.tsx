import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { NoteCard } from "#/components/library/note-card";
import { Logo } from "#/components/ui/logo";
import { LoadingSplash } from "#/components/ui/loading-splash";

export const Route = createFileRoute("/shared/$folderId")({
  component: PublicFolderView,
});

function PublicFolderView() {
  const navigate = useNavigate();
  const { folderId } = useParams({ from: "/shared/$folderId" });
  const folder = useQuery(api.folders.getPublic, {
    id: folderId as Id<"folders">,
  });
  const documents = useQuery(api.folders.getPublicDocuments, {
    folderId: folderId as Id<"folders">,
  });

  if (folder === undefined || documents === undefined) {
    return <LoadingSplash />;
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
              <Logo size={20} />
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
            <div className="w-12 h-12 mx-auto mb-4 opacity-30">
              <Logo size={48} />
            </div>
            <p className="text-muted-foreground">This folder is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {documents.map((doc) => (
              <NoteCard
                key={doc._id}
                note={doc}
                onClick={() => {
                  navigate({ to: "/shared/document/$documentId", params: { documentId: doc._id } });
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
