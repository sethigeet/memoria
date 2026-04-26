import { useQuery, useMutation } from "convex/react";
import { api } from "#/lib/convex";
import { Button } from "#/components/ui/button";
import { Trash2, RotateCcw, AlertTriangle, Folder, FileText } from "lucide-react";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function TrashView() {
  const trashedDocuments = useQuery(api.documents.listTrash) ?? [];
  const trashedFolders = useQuery(api.folders.listTrash) ?? [];
  const restoreDocument = useMutation(api.documents.restore);
  const deleteDocument = useMutation(api.documents.permanentlyDelete);
  const restoreFolder = useMutation(api.folders.restore);
  const deleteFolder = useMutation(api.folders.permanentlyDelete);

  const getDaysLeft = (deletedAt: number) => {
    const expiresAt = deletedAt + THIRTY_DAYS_MS;
    const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  const isEmpty = trashedDocuments.length === 0 && trashedFolders.length === 0;

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      <div className="px-6 h-[50px] border-b border-border flex items-center gap-3 shrink-0 bg-[#0e0e12]">
        <Trash2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-[14.5px] font-bold tracking-tight">Trash</span>
        <span className="text-[12px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
          {trashedDocuments.length + trashedFolders.length}
        </span>
      </div>

      <div className="px-6 py-3 border-b border-border bg-[#0e0e12]/50 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-[13px] text-muted-foreground">
          Items are permanently deleted 30 days after being moved to trash
        </span>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        {isEmpty ? (
          <div className="text-center text-muted-foreground mt-20">
            <Trash2 className="w-9 h-9 mx-auto mb-4 text-muted-foreground/50" />
            <div className="text-[14px] mb-1.5 text-muted-foreground/80">Trash is empty</div>
            <div className="text-[12px] text-muted-foreground/60">
              Deleted items will appear here
            </div>
          </div>
        ) : (
          <>
            {trashedFolders.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                    Folders
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {trashedFolders.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {trashedFolders.map((folder) => (
                    <div
                      key={folder._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: folder.color + "20" }}
                      >
                        <Folder className="w-4 h-4" style={{ color: folder.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{folder.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {getDaysLeft(folder.deletedAt!)} days left
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreFolder({ id: folder._id })}
                        className="gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFolder({ id: folder._id })}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trashedDocuments.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                    Documents
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {trashedDocuments.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {trashedDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{doc.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {getDaysLeft(doc.deletedAt!)} days left
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreDocument({ id: doc._id })}
                        className="gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument({ id: doc._id })}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
