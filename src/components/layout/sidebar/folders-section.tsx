import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { Id } from "#/lib/convex";
import { Input } from "#/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "#/components/ui/context-menu";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderPlus,
  Globe,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { FolderCreateInput } from "./folder-create-input";
import type { CreatingFolder, FolderWithChildren } from "./types";

interface SidebarFoldersSectionProps {
  activeFolder?: Id<"folders">;
  foldersOpen: boolean;
  folderTree: FolderWithChildren[];
  expandedFolders: Set<string>;
  creatingFolder: CreatingFolder;
  newFolderName: string;
  renamingFolder: Id<"folders"> | null;
  renameValue: string;
  folderColors: readonly string[];
  onToggleFoldersOpen: () => void;
  onToggleFolderExpand: (id: string) => void;
  onEnsureFolderExpanded: (id: string) => void;
  onCreateFolderStart: (parentId: CreatingFolder) => void;
  onCreateFolderSubmit: (parentId?: Id<"folders">) => void;
  onCreateFolderCancel: () => void;
  onNewFolderNameChange: (value: string) => void;
  onRenameStart: (folderId: Id<"folders">, currentName: string) => void;
  onRenameSubmit: (folderId: Id<"folders">) => void;
  onRenameCancel: () => void;
  onRenameValueChange: (value: string) => void;
  onNewNote: (folderId?: Id<"folders">) => void;
  onChangeFolderColor: (folderId: Id<"folders">, color: string) => void;
  onDeleteFolder: (folderId: Id<"folders">) => void;
}

interface FolderTreeItemProps {
  folder: FolderWithChildren;
  depth: number;
  activeFolder?: Id<"folders">;
  expandedFolders: Set<string>;
  creatingFolder: CreatingFolder;
  newFolderName: string;
  renamingFolder: Id<"folders"> | null;
  renameValue: string;
  folderColors: readonly string[];
  onToggleFolderExpand: (id: string) => void;
  onEnsureFolderExpanded: (id: string) => void;
  onCreateFolderStart: (parentId: CreatingFolder) => void;
  onCreateFolderSubmit: (parentId?: Id<"folders">) => void;
  onCreateFolderCancel: () => void;
  onNewFolderNameChange: (value: string) => void;
  onRenameStart: (folderId: Id<"folders">, currentName: string) => void;
  onRenameSubmit: (folderId: Id<"folders">) => void;
  onRenameCancel: () => void;
  onRenameValueChange: (value: string) => void;
  onNewNote: (folderId?: Id<"folders">) => void;
  onChangeFolderColor: (folderId: Id<"folders">, color: string) => void;
  onDeleteFolder: (folderId: Id<"folders">) => void;
}

function FolderTreeItem({
  folder,
  depth,
  activeFolder,
  expandedFolders,
  creatingFolder,
  newFolderName,
  renamingFolder,
  renameValue,
  folderColors,
  onToggleFolderExpand,
  onEnsureFolderExpanded,
  onCreateFolderStart,
  onCreateFolderSubmit,
  onCreateFolderCancel,
  onNewFolderNameChange,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
  onRenameValueChange,
  onNewNote,
  onChangeFolderColor,
  onDeleteFolder,
}: FolderTreeItemProps) {
  const hasChildren = folder.children.length > 0;
  const isExpanded = expandedFolders.has(folder._id);
  const isRenaming = renamingFolder === folder._id;
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) return;
    requestAnimationFrame(() => {
      if (!renameInputRef.current) return;
      renameInputRef.current.focus();
      renameInputRef.current.select();
    });
  }, [isRenaming]);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link
            to="/folder/$folderId"
            params={{ folderId: folder._id }}
            className={`group flex items-center gap-1.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 whitespace-nowrap pr-2 cursor-pointer ${
              activeFolder === folder._id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50"
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (hasChildren) onToggleFolderExpand(folder._id);
              }}
              className={`w-4 h-4 flex items-center justify-center shrink-0 ${
                hasChildren ? "cursor-pointer" : "cursor-default"
              }`}
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
                onChange={(event) => onRenameValueChange(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter") onRenameSubmit(folder._id);
                  if (event.key === "Escape") onRenameCancel();
                }}
                onBlur={() => onRenameSubmit(folder._id)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
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
                {folder.isPublic && <Globe className="w-3 h-3 text-muted-foreground shrink-0" />}
              </>
            )}
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onNewNote(folder._id)}>
            <FileText className="w-4 h-4" />
            New note in folder
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              onCreateFolderStart(folder._id);
              onEnsureFolderExpanded(folder._id);
            }}
          >
            <FolderPlus className="w-4 h-4" />
            New subfolder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onRenameStart(folder._id, folder.name)}>
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
                {folderColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChangeFolderColor(folder._id, color)}
                    className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                      folder.color === color ? "border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onClick={() => onDeleteFolder(folder._id)}>
            <Trash2 className="w-4 h-4" />
            Delete folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && (
        <>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child._id}
              folder={child}
              depth={depth + 1}
              activeFolder={activeFolder}
              expandedFolders={expandedFolders}
              creatingFolder={creatingFolder}
              newFolderName={newFolderName}
              renamingFolder={renamingFolder}
              renameValue={renameValue}
              folderColors={folderColors}
              onToggleFolderExpand={onToggleFolderExpand}
              onEnsureFolderExpanded={onEnsureFolderExpanded}
              onCreateFolderStart={onCreateFolderStart}
              onCreateFolderSubmit={onCreateFolderSubmit}
              onCreateFolderCancel={onCreateFolderCancel}
              onNewFolderNameChange={onNewFolderNameChange}
              onRenameStart={onRenameStart}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onRenameValueChange={onRenameValueChange}
              onNewNote={onNewNote}
              onChangeFolderColor={onChangeFolderColor}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
          {creatingFolder === folder._id && (
            <FolderCreateInput
              value={newFolderName}
              onChange={onNewFolderNameChange}
              onSubmit={() => onCreateFolderSubmit(folder._id)}
              onCancel={onCreateFolderCancel}
              className="flex items-center gap-1.5 mx-1.5 my-0.5"
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              autoFocus
            />
          )}
        </>
      )}
    </div>
  );
}

export function SidebarFoldersSection({
  activeFolder,
  foldersOpen,
  folderTree,
  expandedFolders,
  creatingFolder,
  newFolderName,
  renamingFolder,
  renameValue,
  folderColors,
  onToggleFoldersOpen,
  onToggleFolderExpand,
  onEnsureFolderExpanded,
  onCreateFolderStart,
  onCreateFolderSubmit,
  onCreateFolderCancel,
  onNewFolderNameChange,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
  onRenameValueChange,
  onNewNote,
  onChangeFolderColor,
  onDeleteFolder,
}: SidebarFoldersSectionProps) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between pr-3">
        <button
          onClick={onToggleFoldersOpen}
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
          onClick={() => onCreateFolderStart("root")}
          className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
          title="New folder"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {foldersOpen && (
        <>
          {folderTree.map((folder) => (
            <FolderTreeItem
              key={folder._id}
              folder={folder}
              depth={1}
              activeFolder={activeFolder}
              expandedFolders={expandedFolders}
              creatingFolder={creatingFolder}
              newFolderName={newFolderName}
              renamingFolder={renamingFolder}
              renameValue={renameValue}
              folderColors={folderColors}
              onToggleFolderExpand={onToggleFolderExpand}
              onEnsureFolderExpanded={onEnsureFolderExpanded}
              onCreateFolderStart={onCreateFolderStart}
              onCreateFolderSubmit={onCreateFolderSubmit}
              onCreateFolderCancel={onCreateFolderCancel}
              onNewFolderNameChange={onNewFolderNameChange}
              onRenameStart={onRenameStart}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onRenameValueChange={onRenameValueChange}
              onNewNote={onNewNote}
              onChangeFolderColor={onChangeFolderColor}
              onDeleteFolder={onDeleteFolder}
            />
          ))}

          {creatingFolder === "root" && (
            <FolderCreateInput
              value={newFolderName}
              onChange={onNewFolderNameChange}
              onSubmit={() => onCreateFolderSubmit()}
              onCancel={onCreateFolderCancel}
              className="flex items-center gap-1.5 mx-1.5 my-0.5 pl-5"
              autoFocus
            />
          )}
        </>
      )}
    </div>
  );
}
