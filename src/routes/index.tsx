import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import type { Id } from "#/lib/convex";

import { AuthScreen } from "#/components/auth/auth-screen";
import { Sidebar } from "#/components/layout/sidebar";
import { LibraryView } from "#/components/library/library-view";
import { DocumentView } from "#/components/document/document-view";
import { CreateModal } from "#/components/library/create-modal";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <Authenticated>
        <AppLayout />
      </Authenticated>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
    </>
  );
}

function AppLayout() {
  const [activeFolder, setActiveFolder] = useState<Id<"folders"> | null>(null);
  const [activeTag, setActiveTag] = useState<Id<"tags"> | null>(null);
  const [activeDocument, setActiveDocument] = useState<Id<"documents"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveDocument(null);
  };

  const handleOpenNote = (id: Id<"documents">) => {
    setActiveDocument(id);
  };

  const handleBack = () => {
    setActiveDocument(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e0e12]">
      <Sidebar
        activeFolder={activeFolder ?? undefined}
        activeTag={activeTag ?? undefined}
        onFolderSelect={(id) => {
          setActiveFolder(id);
          setActiveDocument(null);
          setSearchQuery("");
        }}
        onTagSelect={(id) => {
          setActiveTag(id);
          setActiveDocument(null);
          setSearchQuery("");
        }}
        onNewNote={() => setShowCreateModal(true)}
        onSearch={handleSearch}
      />

      {activeDocument ? (
        <DocumentView documentId={activeDocument} onBack={handleBack} />
      ) : (
        <LibraryView
          activeFolder={activeFolder ?? undefined}
          activeTag={activeTag ?? undefined}
          onOpenNote={handleOpenNote}
          onNewNote={() => setShowCreateModal(true)}
          searchQuery={searchQuery || undefined}
        />
      )}

      <CreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
