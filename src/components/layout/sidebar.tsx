import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api, type Id } from "#/lib/convex";
import { Link, useNavigate, useMatch, useLocation } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Logo } from "#/components/ui/logo";
import { ScrollArea, ScrollBar } from "#/components/ui/scroll-area";
import { Home, Search, Plus, Trash2 } from "lucide-react";
import { SidebarFoldersSection } from "./sidebar/folders-section";
import { SidebarTagsSection } from "./sidebar/tags-section";
import { SidebarUserSection } from "./sidebar/user-section";
import { ShareDialog } from "#/components/document/share-dialog";
import type { FolderWithChildren } from "./sidebar/types";

interface SidebarProps {
  onNewNote: (folderId?: Id<"folders">) => void;
  onSearch: (query: string) => void;
}

const FOLDER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 400;
export const SIDEBAR_DEFAULT_WIDTH = 232;

export function Sidebar({ onNewNote, onSearch }: SidebarProps) {
  const { signOut } = useAuthActions();
  const folders = useQuery(api.folders.list);
  const tags = useQuery(api.tags.list);
  const currentUser = useQuery(api.auth.currentUser);
  const createFolder = useMutation(api.folders.create);
  const updateFolder = useMutation(api.folders.update);
  const deleteFolder = useMutation(api.folders.remove);
  const navigate = useNavigate();
  const location = useLocation();

  const folderMatch = useMatch({ from: "/_authenticated/folder/$folderId", shouldThrow: false });
  const tagMatch = useMatch({ from: "/_authenticated/tag/$tagId", shouldThrow: false });

  const activeFolder = folderMatch?.params?.folderId as Id<"folders"> | undefined;
  const activeTag = tagMatch?.params?.tagId as Id<"tags"> | undefined;
  const showTrash = location.pathname === "/trash";
  const isHome = location.pathname === "/" || location.pathname === "";

  const [foldersOpen, setFoldersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState<Id<"folders"> | "root" | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<Id<"folders"> | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sharingFolder, setSharingFolder] = useState<FolderWithChildren | null>(null);

  const folderTree = useMemo(() => {
    if (!folders) return [];

    const map = new Map<string, FolderWithChildren>();
    const roots: FolderWithChildren[] = [];

    for (const folder of folders) {
      map.set(folder._id, { ...folder, children: [] });
    }

    for (const folder of folders) {
      const node = map.get(folder._id);
      if (!node) continue;
      if (folder.parentId && map.has(folder.parentId)) {
        map.get(folder.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [folders]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchQuery);
  };

  const toggleFolderExpand = (id: string) => {
    setExpandedFolders((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ensureFolderExpanded = (id: string) => {
    setExpandedFolders((previous) => new Set(previous).add(id));
  };

  const handleCreateFolder = async (parentId?: Id<"folders">) => {
    if (!newFolderName.trim()) return;
    await createFolder({
      name: newFolderName.trim(),
      color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
      parentId,
    });
    setNewFolderName("");
    setCreatingFolder(null);
    if (parentId) ensureFolderExpanded(parentId);
  };

  const handleRenameFolder = async (folderId: Id<"folders">) => {
    if (!renameValue.trim()) return;
    await updateFolder({ id: folderId, name: renameValue.trim() });
    setRenamingFolder(null);
    setRenameValue("");
  };

  const handleChangeFolderColor = async (folderId: Id<"folders">, color: string) => {
    await updateFolder({ id: folderId, color });
  };

  const handleDeleteFolder = (folderId: Id<"folders">) => {
    if (activeFolder === folderId) {
      navigate({ to: "/" });
    }
    void deleteFolder({ id: folderId });
  };

  const handleRenameCancel = () => {
    setRenamingFolder(null);
    setRenameValue("");
  };

  return (
    <div className="h-full bg-sidebar flex w-full">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#0e0e12] border border-border flex items-center justify-center overflow-hidden">
            <Logo size={20} />
          </div>
          <span className="font-bold text-[15px] tracking-tight">Memoria</span>
        </div>

        <div className="px-2.5 pt-3 pb-2">
          <Button onClick={() => onNewNote()} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        <form onSubmit={handleSearch} className="px-2.5 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 h-8 text-sm bg-sidebar-accent border-sidebar-border"
            />
          </div>
        </form>

        <ScrollArea className="flex-1">
          <div className="px-1.5 min-w-max">
            <Link
              to="/"
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                isHome && !activeFolder && !activeTag && !showTrash
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Library
            </Link>

            <SidebarFoldersSection
              activeFolder={activeFolder}
              foldersOpen={foldersOpen}
              folderTree={folderTree}
              expandedFolders={expandedFolders}
              creatingFolder={creatingFolder}
              newFolderName={newFolderName}
              renamingFolder={renamingFolder}
              renameValue={renameValue}
              folderColors={FOLDER_COLORS}
              onToggleFoldersOpen={() => setFoldersOpen((open) => !open)}
              onToggleFolderExpand={toggleFolderExpand}
              onEnsureFolderExpanded={ensureFolderExpanded}
              onCreateFolderStart={setCreatingFolder}
              onCreateFolderSubmit={handleCreateFolder}
              onCreateFolderCancel={() => setCreatingFolder(null)}
              onNewFolderNameChange={setNewFolderName}
              onRenameStart={(folderId, currentName) => {
                setRenamingFolder(folderId);
                setRenameValue(currentName);
              }}
              onRenameSubmit={handleRenameFolder}
              onRenameCancel={handleRenameCancel}
              onRenameValueChange={setRenameValue}
              onNewNote={onNewNote}
              onChangeFolderColor={handleChangeFolderColor}
              onShareFolder={setSharingFolder}
              onDeleteFolder={handleDeleteFolder}
            />

            <SidebarTagsSection
              tagsOpen={tagsOpen}
              tags={tags ?? []}
              activeTag={activeTag}
              onToggleTagsOpen={() => setTagsOpen((open) => !open)}
            />

            <div className="mt-4">
              <Link
                to="/trash"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                  showTrash
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Trash
              </Link>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <SidebarUserSection user={currentUser} onSignOut={() => signOut()} />
      </div>

      {sharingFolder && (
        <ShareDialog
          open={!!sharingFolder}
          onOpenChange={(open) => !open && setSharingFolder(null)}
          resourceType="folder"
          resourceId={sharingFolder._id}
          title={sharingFolder.name}
          isPublic={folders?.find((f) => f._id === sharingFolder._id)?.isPublic ?? false}
        />
      )}
    </div>
  );
}
