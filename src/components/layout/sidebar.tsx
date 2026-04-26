import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api, type Id } from "#/lib/convex";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { ScrollArea, ScrollBar } from "#/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "#/components/ui/context-menu";
import {
  Home,
  Search,
  Plus,
  FolderPlus,
  Globe,
  Tag,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Check,
  Trash2,
  FileText,
  Pencil,
  Palette,
} from "lucide-react";

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

type FolderWithChildren = {
  _id: Id<"folders">;
  name: string;
  color: string;
  isPublic: boolean;
  parentId?: Id<"folders">;
  documentCount: number;
  children: FolderWithChildren[];
};

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
  const folders = useQuery(api.folders.list) ?? [];
  const tags = useQuery(api.tags.list) ?? [];
  const createFolder = useMutation(api.folders.create);
  const updateFolder = useMutation(api.folders.update);
  const deleteFolder = useMutation(api.folders.remove);

  const [foldersOpen, setFoldersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [creatingFolder, setCreatingFolder] = useState<
    Id<"folders"> | "root" | null
  >(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<Id<"folders"> | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (renamingFolder) {
      // Use requestAnimationFrame to wait for the input to be mounted
      requestAnimationFrame(() => {
        if (renameInputRef.current) {
          renameInputRef.current.focus();
          renameInputRef.current.select();
        }
      });
    }
  }, [renamingFolder]);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar-width");
    return saved
      ? Math.min(Math.max(parseInt(saved), MIN_WIDTH), MAX_WIDTH)
      : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
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
    const map = new Map<string, FolderWithChildren>();
    const roots: FolderWithChildren[] = [];

    for (const f of folders) {
      map.set(f._id, { ...f, children: [] });
    }

    for (const f of folders) {
      const node = map.get(f._id)!;
      if (f.parentId && map.has(f.parentId)) {
        map.get(f.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [folders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const toggleFolderExpand = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    if (parentId) setExpandedFolders((prev) => new Set(prev).add(parentId));
  };

  const handleRenameFolder = async (folderId: Id<"folders">) => {
    if (!renameValue.trim()) return;
    await updateFolder({ id: folderId, name: renameValue.trim() });
    setRenamingFolder(null);
    setRenameValue("");
  };

  const handleChangeColor = async (folderId: Id<"folders">, color: string) => {
    await updateFolder({ id: folderId, color });
  };

  const renderFolder = (folder: FolderWithChildren, depth: number) => {
    const hasChildren = folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder._id);
    const isRenaming = renamingFolder === folder._id;

    const selectFolder = () => {
      const newFolderId = activeFolder === folder._id ? null : folder._id;
      onFolderSelect(newFolderId);
    };

    const startRenaming = () => {
      setRenamingFolder(folder._id);
      setRenameValue(folder.name);
    };

    return (
      <div key={folder._id}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={`group flex items-center gap-1.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 whitespace-nowrap pr-2 cursor-pointer ${
                activeFolder === folder._id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50"
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={selectFolder}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasChildren) toggleFolderExpand(folder._id);
                }}
                className={`w-4 h-4 flex items-center justify-center shrink-0 ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )
                ) : null}
              </button>
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: folder.color }}
              />
              {isRenaming ? (
                <Input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleRenameFolder(folder._id);
                    if (e.key === "Escape") {
                      setRenamingFolder(null);
                      setRenameValue("");
                    }
                  }}
                  onBlur={() => handleRenameFolder(folder._id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 text-[13px] bg-sidebar-accent border-sidebar-border px-1 py-0 flex-1"
                />
              ) : (
                <>
                  <span className="truncate flex-1">{folder.name}</span>
                  {folder.documentCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">
                      {folder.documentCount}
                    </span>
                  )}
                  {folder.isPublic && (
                    <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={() => onNewNote(folder._id)}>
              <FileText className="w-4 h-4" />
              New note in folder
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setCreatingFolder(folder._id);
                setExpandedFolders((prev) => new Set(prev).add(folder._id));
              }}
            >
              <FolderPlus className="w-4 h-4" />
              New subfolder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={startRenaming}>
              <Pencil className="w-4 h-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="w-4 h-4" />
                Change color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-36">
                <div className="grid grid-cols-4 gap-1 p-2">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleChangeColor(folder._id, color)}
                      className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                        folder.color === color
                          ? "border-white"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => {
                if (activeFolder === folder._id) onFolderSelect(null);
                deleteFolder({ id: folder._id });
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {isExpanded && (
          <>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
            {creatingFolder === folder._id && (
              <div
                className="flex items-center gap-1.5 mx-1.5 my-0.5"
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder(folder._id);
                    if (e.key === "Escape") setCreatingFolder(null);
                  }}
                  placeholder="Folder name..."
                  className="h-7 text-[13px] bg-sidebar-accent border-sidebar-border flex-1"
                  autoFocus
                />
                <button
                  onClick={() => handleCreateFolder(folder._id)}
                  className="p-1 rounded hover:bg-sidebar-accent text-primary"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCreatingFolder(null)}
                  className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={sidebarRef}
      className="h-screen bg-sidebar border-r border-sidebar-border flex shrink-0 relative"
      style={{ width: sidebarWidth }}
    >
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#0e0e12] border border-border flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 32 32" className="w-5 h-5">
              <defs>
                <linearGradient
                  id="logoGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style={{ stopColor: "#4da6ff" }} />
                  <stop offset="100%" style={{ stopColor: "#7c3aed" }} />
                </linearGradient>
              </defs>
              <path
                d="M7 24 L7 10 Q7 8 9 8 L11 8 L11 24 Q11 25 10 25 L8 25 Q7 25 7 24Z"
                fill="url(#logoGrad)"
              />
              <path
                d="M11 11 L16 18 L21 11 L21 13 L16 21 L11 13Z"
                fill="url(#logoGrad)"
              />
              <path
                d="M21 8 L23 8 Q25 8 25 10 L25 24 Q25 25 24 25 L22 25 Q21 25 21 24 L21 8Z"
                fill="url(#logoGrad)"
              />
              <circle cx="10" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
              <circle cx="16" cy="4" r="1" fill="#7c3aed" opacity="0.7" />
              <circle cx="22" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
            </svg>
          </div>
          <span className="font-bold text-[15px] tracking-tight">Memoria</span>
        </div>

        {/* New Note Button */}
        <div className="px-2.5 pt-3 pb-2">
          <Button
            onClick={() => onNewNote()}
            className="w-full gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="px-2.5 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-sidebar-accent border-sidebar-border"
            />
          </div>
        </form>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="px-1.5 min-w-max">
            {/* Library */}
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

            {/* Folders */}
            <div className="mt-2">
              <div className="flex items-center justify-between pr-3">
                <button
                  onClick={() => setFoldersOpen(!foldersOpen)}
                  className="flex items-center gap-1.5 px-4 py-1 text-[10.5px] font-bold tracking-wider uppercase text-muted-foreground cursor-pointer"
                >
                  {foldersOpen ? (
                    <ChevronDown className="w-2.5 h-2.5" />
                  ) : (
                    <ChevronRight className="w-2.5 h-2.5" />
                  )}
                  Folders
                </button>
                <button
                  onClick={() => setCreatingFolder("root")}
                  className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
                  title="New folder"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {foldersOpen && (
                <>
                  {folderTree.map((folder) => renderFolder(folder, 1))}
                  {creatingFolder === "root" && (
                    <div className="flex items-center gap-1.5 mx-1.5 my-0.5 pl-5">
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateFolder();
                          if (e.key === "Escape") setCreatingFolder(null);
                        }}
                        placeholder="Folder name..."
                        className="h-7 text-[13px] bg-sidebar-accent border-sidebar-border flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleCreateFolder()}
                        className="p-1 rounded hover:bg-sidebar-accent text-primary"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCreatingFolder(null)}
                        className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            <div className="mt-2">
              <button
                onClick={() => setTagsOpen(!tagsOpen)}
                className="flex items-center gap-1.5 px-4 py-1 text-[10.5px] font-bold tracking-wider uppercase text-muted-foreground cursor-pointer"
              >
                {tagsOpen ? (
                  <ChevronDown className="w-2.5 h-2.5" />
                ) : (
                  <ChevronRight className="w-2.5 h-2.5" />
                )}
                Tags
              </button>
              {tagsOpen &&
                tags.map((tag) => (
                  <button
                    key={tag._id}
                    onClick={() => {
                      onTagSelect(activeTag === tag._id ? null : tag._id);
                      onFolderSelect(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 pl-6 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                      activeTag === tag._id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag.name}</span>
                  </button>
                ))}
            </div>

            {/* Trash */}
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

        {/* User */}
        <div className="p-3 border-t border-sidebar-border flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            U
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">User</div>
            <div className="text-[11px] text-muted-foreground">Free plan</div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={startResizing}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors ${
          isResizing ? "bg-primary/50" : ""
        }`}
      />
    </div>
  );
}
