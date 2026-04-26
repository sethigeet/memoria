import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api, type Id } from "#/lib/convex";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Logo } from "#/components/ui/logo";
import { ScrollArea, ScrollBar } from "#/components/ui/scroll-area";
import { Home, Search, Plus, Trash2 } from "lucide-react";
import { SidebarFoldersSection } from "./sidebar/folders-section";
import { SidebarTagsSection } from "./sidebar/tags-section";
import { SidebarUserSection } from "./sidebar/user-section";
import type { FolderWithChildren } from "./sidebar/types";

interface SidebarProps {
  activeFolder?: Id<"folders">;
  activeTag?: Id<"tags">;
  showTrash?: boolean;
  onFolderSelect: (id: Id<"folders"> | null) => void;
  onTagSelect: (id: Id<"tags"> | null) => void;
  onTrashSelect: () => void;
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

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 232;

export function Sidebar({
  activeFolder,
  activeTag,
  showTrash,
  onFolderSelect,
  onTagSelect,
  onTrashSelect,
  onNewNote,
  onSearch,
}: SidebarProps) {
  const { signOut } = useAuthActions();
  const folders = useQuery(api.folders.list);
  const tags = useQuery(api.tags.list);
  const currentUser = useQuery(api.auth.currentUser);
  const createFolder = useMutation(api.folders.create);
  const updateFolder = useMutation(api.folders.update);
  const deleteFolder = useMutation(api.folders.remove);

  const [foldersOpen, setFoldersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState<Id<"folders"> | "root" | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<Id<"folders"> | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar-width");
    return saved ? Math.min(Math.max(parseInt(saved), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(event.clientX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem("sidebar-width", sidebarWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, sidebarWidth]);

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
    if (activeFolder === folderId) onFolderSelect(null);
    void deleteFolder({ id: folderId });
  };

  const handleRenameCancel = () => {
    setRenamingFolder(null);
    setRenameValue("");
  };

  return (
    <div
      ref={sidebarRef}
      className="h-screen bg-sidebar border-r border-sidebar-border flex shrink-0 relative"
      style={{ width: sidebarWidth }}
    >
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
            <button
              onClick={() => {
                onFolderSelect(null);
                onTagSelect(null);
                navigate({ to: "/" });
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                !activeFolder && !activeTag && !showTrash
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Library
            </button>

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
              onFolderSelect={onFolderSelect}
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
              onDeleteFolder={handleDeleteFolder}
            />

            <SidebarTagsSection
              tagsOpen={tagsOpen}
              tags={tags ?? []}
              activeTag={activeTag}
              onToggleTagsOpen={() => setTagsOpen((open) => !open)}
              onTagSelect={onTagSelect}
              onFolderSelect={onFolderSelect}
            />

            <div className="mt-4">
              <button
                onClick={onTrashSelect}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                  showTrash
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Trash
              </button>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <SidebarUserSection user={currentUser} onSignOut={() => signOut()} />
      </div>

      <div
        onMouseDown={startResizing}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors ${
          isResizing ? "bg-primary/50" : ""
        }`}
      />
    </div>
  );
}
