import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Share } from "lucide-react";
import { type Id } from "#/lib/convex";
import { Button } from "#/components/ui/button";
import { ShareDialog } from "./share-dialog";

type DocumentHeaderProps = {
  title: string;
  documentId: Id<"documents">;
  isPublic?: boolean;
  onBack: () => void;
};

export function DocumentHeader({ title, documentId, isPublic, onBack }: DocumentHeaderProps) {
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
      </div>

      <div className="flex gap-1.5 shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShareDialogOpen(true)}>
          <Share className="w-3 h-3" />
          Share
        </Button>
        <Button variant="outline" size="icon" className="w-7 h-7">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
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
