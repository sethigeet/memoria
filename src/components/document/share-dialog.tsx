import { useState } from "react";
import { useMutation } from "convex/react";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { api, type Id } from "#/lib/convex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "document" | "folder";
  resourceId: Id<"documents"> | Id<"folders">;
  title: string;
  isPublic: boolean;
};

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  title,
  isPublic,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const toggleDocumentPublic = useMutation(api.documents.togglePublic);
  const updateFolder = useMutation(api.folders.update);

  const shareUrl =
    resourceType === "document"
      ? `${window.location.origin}/shared/document/${resourceId}`
      : `${window.location.origin}/shared/${resourceId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleToggle = async () => {
    if (resourceType === "document") {
      await toggleDocumentPublic({
        id: resourceId as Id<"documents">,
        isPublic: !isPublic,
      });
    } else {
      await updateFolder({
        id: resourceId as Id<"folders">,
        isPublic: !isPublic,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader className="overflow-hidden">
          <DialogTitle>Share {resourceType}</DialogTitle>
          <DialogDescription className="truncate max-w-full">{title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/30">
            <div className="flex items-center gap-3 min-w-0">
              {isPublic ? (
                <Globe className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{isPublic ? "Public" : "Private"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {isPublic ? "Anyone with the link can view" : "Only you can access"}
                </p>
              </div>
            </div>
            <Button
              variant={isPublic ? "outline" : "default"}
              size="sm"
              className="shrink-0"
              onClick={handleToggle}
            >
              {isPublic ? "Make private" : "Make public"}
            </Button>
          </div>

          {isPublic && (
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-x-auto px-3 py-2 rounded-md border border-border bg-background font-mono text-xs text-muted-foreground whitespace-nowrap">
                {shareUrl}
              </div>
              <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
