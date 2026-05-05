import { useState, useMemo } from "react";
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
import { ShortcutsDialog } from "#/components/keyboard-shortcuts/shortcuts-dialog";
import { ResizableSplit } from "#/components/ui/resizable-split";
import { useKeyboardShortcuts, type Shortcut } from "#/hooks/use-keyboard-shortcuts";

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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleNewNote = (folderId?: Id<"folders">) => {
    setCreateInFolder(folderId);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateInFolder(undefined);
  };

  const shortcuts: Shortcut[] = useMemo(
    () => [
      {
        key: "k",
        ctrl: true,
        description: "Search library",
        category: "navigation",
        action: () => setSearchOpen(true),
      },
      {
        key: "n",
        description: "New note",
        category: "actions",
        action: () => handleNewNote(),
      },
      {
        key: "h",
        ctrl: true,
        description: "Go home",
        category: "navigation",
        action: () => navigate({ to: "/" }),
      },
      {
        key: "?",
        shift: true,
        description: "Show shortcuts",
        category: "view",
        action: () => setShortcutsOpen(true),
      },
      {
        key: "Escape",
        description: "Close dialog",
        category: "navigation",
        action: () => {
          if (shortcutsOpen) setShortcutsOpen(false);
          else if (searchOpen) setSearchOpen(false);
          else if (showCreateModal) handleCloseCreateModal();
          else navigate({ to: "/" });
        },
      },
      {
        key: "/",
        description: "Focus search",
        category: "navigation",
        action: () => setSearchOpen(true),
      },
    ],
    [navigate, searchOpen, shortcutsOpen, showCreateModal],
  );

  useKeyboardShortcuts({ shortcuts });

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
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcuts} />
    </div>
  );
}
