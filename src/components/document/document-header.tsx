import { useState } from "react";
import { ArrowLeft, Share, Pencil, Eye } from "lucide-react";
import { type Id } from "#/lib/convex";
import { Button } from "#/components/ui/button";
import { ShareDialog } from "./share-dialog";
import { NoteActionsDropdown } from "#/components/library/note-actions-menu";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type NoteViewMode = "view" | "edit";

type DocumentHeaderProps = {
  title: string;
  documentId: Id<"documents">;
  folderId?: Id<"folders">;
  isPublic?: boolean;
  onBack: () => void;
  onDelete?: () => void;
  saveStatus?: SaveStatus;
  noteViewMode?: NoteViewMode;
  onToggleViewMode?: () => void;
};

export function DocumentHeader({
  title,
  documentId,
  folderId,
  isPublic,
  onBack,
  onDelete,
  saveStatus,
  noteViewMode,
  onToggleViewMode,
}: DocumentHeaderProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  return (
    <div className="px-4 h-[50px] border-b border-border flex items-center gap-2.5 shrink-0 bg-[#0e0e12]">
      <Button variant="outline" size="icon" className="w-7 h-7" onClick={onBack}>
        <ArrowLeft className="w-3.5 h-3.5" />
      </Button>

      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground flex-1 overflow-hidden">
        <button onClick={onBack} className="hover:text-foreground transition-colors">
          Library
        </button>
        <span className="text-border">/</span>
        <span className="truncate text-foreground/70">{title}</span>
        {saveStatus === "saving" && (
          <span className="text-[10px] text-muted-foreground ml-2">Saving...</span>
        )}
        {saveStatus === "saved" && <span className="text-[10px] text-green-500 ml-2">Saved</span>}
        {saveStatus === "error" && (
          <span className="text-[10px] text-red-500 ml-2">Error saving</span>
        )}
      </div>

      <div className="flex gap-1.5 shrink-0">
        {noteViewMode && onToggleViewMode && (
          <Button
            variant={noteViewMode === "view" ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={onToggleViewMode}
          >
            {noteViewMode === "view" ? (
              <>
                <Pencil className="w-3 h-3" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Done
              </>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share className="w-3 h-3" />
          Share
        </Button>
        <NoteActionsDropdown documentId={documentId} folderId={folderId} onDelete={onDelete} />
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        resourceType="document"
        resourceId={documentId}
        title={title}
        isPublic={isPublic ?? false}
      />
    </div>
  );
}
