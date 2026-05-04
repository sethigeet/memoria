import { useMemo, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { FolderInput, MoreHorizontal, Trash2 } from "lucide-react";
import { api, type Id } from "#/lib/convex";
import { flattenFolders } from "#/lib/folder-tree";
import { Button } from "#/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "#/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

type NoteActionsProps = {
  documentId: Id<"documents">;
  folderId?: Id<"folders">;
  onDelete?: () => void;
};

const ROOT_FOLDER_VALUE = "__root__";

export function NoteActionsDropdown({ documentId, folderId, onDelete }: NoteActionsProps) {
  const { moveToFolder, deleteNote, selectedFolderValue, flatFolders } = useNoteActions({
    documentId,
    folderId,
    onDelete,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput className="w-4 h-4" />
            Move to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuRadioGroup value={selectedFolderValue} onValueChange={moveToFolder}>
              <DropdownMenuRadioItem value={ROOT_FOLDER_VALUE}>Library root</DropdownMenuRadioItem>
              {flatFolders.map((folder) => (
                <DropdownMenuRadioItem key={folder._id} value={folder._id}>
                  <span className="flex items-center gap-2">
                    <span style={{ width: folder.depth * 12 }} />
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={deleteNote}>
          <Trash2 className="w-4 h-4" />
          Delete note
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type NoteCardContextMenuProps = NoteActionsProps & {
  children: ReactNode;
};

export function NoteCardContextMenu({
  documentId,
  folderId,
  onDelete,
  children,
}: NoteCardContextMenuProps) {
  const { moveToFolder, deleteNote, selectedFolderValue, flatFolders } = useNoteActions({
    documentId,
    folderId,
    onDelete,
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="w-4 h-4" />
            Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuRadioGroup value={selectedFolderValue} onValueChange={moveToFolder}>
              <ContextMenuRadioItem value={ROOT_FOLDER_VALUE}>Library root</ContextMenuRadioItem>
              {flatFolders.map((folder) => (
                <ContextMenuRadioItem key={folder._id} value={folder._id}>
                  <span className="flex items-center gap-2">
                    <span style={{ width: folder.depth * 12 }} />
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </span>
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={deleteNote}>
          <Trash2 className="w-4 h-4" />
          Delete note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function useNoteActions({ documentId, folderId, onDelete }: NoteActionsProps) {
  const folders = useQuery(api.folders.list) ?? [];
  const updateDocument = useMutation(api.documents.update);
  const deleteDocument = useMutation(api.documents.remove);

  const foldersKey = folders.map((f) => `${f._id}:${f.parentId}`).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const flatFolders = useMemo(() => flattenFolders(folders), [foldersKey]);
  const selectedFolderValue = folderId ?? ROOT_FOLDER_VALUE;

  const moveToFolder = async (value: string) => {
    await updateDocument({
      id: documentId,
      folderId: value === ROOT_FOLDER_VALUE ? null : (value as Id<"folders">),
    });
  };

  const deleteNote = async () => {
    await deleteDocument({ id: documentId });
    onDelete?.();
  };

  return {
    flatFolders,
    selectedFolderValue,
    moveToFolder,
    deleteNote,
  };
}
