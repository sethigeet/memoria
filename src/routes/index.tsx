import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import type { Id } from "#/lib/convex";

import { AuthScreen } from "#/components/auth/auth-screen";
import { Sidebar } from "#/components/layout/sidebar";
import { LibraryView } from "#/components/library/library-view";
import { TrashView } from "#/components/library/trash-view";
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
  const [createInFolder, setCreateInFolder] = useState<Id<"folders"> | undefined>(undefined);
  const [showTrash, setShowTrash] = useState(false);

  const handleNewNote = (folderId?: Id<"folders">) => {
    setCreateInFolder(folderId);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateInFolder(undefined);
  };


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveDocument(null);
    setShowTrash(false);
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
        showTrash={showTrash}
        onFolderSelect={(id) => {
          setActiveFolder(id);
          setActiveTag(null);
          setActiveDocument(null);
          setSearchQuery("");
          setShowTrash(false);
        }}
        onTagSelect={(id) => {
          setActiveTag(id);
          setActiveFolder(null);
          setActiveDocument(null);
          setSearchQuery("");
          setShowTrash(false);
        }}
        onTrashSelect={() => {
          setShowTrash(true);
          setActiveFolder(null);
          setActiveTag(null);
          setActiveDocument(null);
          setSearchQuery("");
        }}
        onNewNote={handleNewNote}
        onSearch={handleSearch}
      />

      {activeDocument ? (
        <DocumentView documentId={activeDocument} onBack={handleBack} />
      ) : showTrash ? (
        <TrashView />
      ) : (
        <LibraryView
          activeFolder={activeFolder ?? undefined}
          activeTag={activeTag ?? undefined}
          onOpenNote={handleOpenNote}
          onNewNote={() => handleNewNote()}
          searchQuery={searchQuery || undefined}
        />
      )}

      <CreateModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        initialFolderId={createInFolder}
      />
    </div>
  );
}
