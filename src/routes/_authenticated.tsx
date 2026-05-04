import { useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import type { Id } from "#/lib/convex";

import {
  Sidebar,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "#/components/layout/sidebar";
import { CreateModal } from "#/components/library/create-modal";
import { SearchDialog } from "#/components/search/search-dialog";
import { ResizableSplit } from "#/components/ui/resizable-split";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      <Authenticated>
        <AppLayout />
      </Authenticated>
      <Unauthenticated>
        <RedirectToLogin />
      </Unauthenticated>
    </>
  );
}

function RedirectToLogin() {
  const navigate = useNavigate();
  navigate({ to: "/login" });
  return null;
}

function AppLayout() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInFolder, setCreateInFolder] = useState<Id<"folders"> | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNewNote = (folderId?: Id<"folders">) => {
    setCreateInFolder(folderId);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateInFolder(undefined);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e0e12]">
      <ResizableSplit
        unit="px"
        storageKey="sidebar-width"
        defaultLeftSize={SIDEBAR_DEFAULT_WIDTH}
        minLeftSize={SIDEBAR_MIN_WIDTH}
        maxLeftSize={SIDEBAR_MAX_WIDTH}
        left={<Sidebar onNewNote={handleNewNote} onOpenSearch={() => setSearchOpen(true)} />}
        right={<Outlet />}
      />
      <CreateModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        initialFolderId={createInFolder}
      />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectResult={(documentId) =>
          navigate({ to: "/document/$documentId", params: { documentId } })
        }
      />
    </div>
  );
}
