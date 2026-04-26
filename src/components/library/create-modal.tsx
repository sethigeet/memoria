import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api, type Id } from "#/lib/convex";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Link, FileText, Edit3, Loader2 } from "lucide-react";

type FolderItem = {
  _id: Id<"folders">;
  name: string;
  color: string;
  depth: number;
};

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  initialFolderId?: Id<"folders">;
}

type TabType = "url" | "pdf" | "note";

export function CreateModal({
  open,
  onClose,
  initialFolderId,
}: CreateModalProps) {
  const [tab, setTab] = useState<TabType>("note");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && initialFolderId) {
      setFolderId(initialFolderId);
      setTab("note");
    }
  }, [open, initialFolderId]);

  const folders = useQuery(api.folders.list) ?? [];
  const createDocument = useMutation(api.documents.create);
  const generateTitleAndTags = useAction(api.ai.generateTitleAndTags);

  const flatFolders = useMemo(() => {
    const result: FolderItem[] = [];
    const childrenMap = new Map<string | undefined, typeof folders>();

    for (const f of folders) {
      const key = f.parentId ?? "root";
      if (!childrenMap.has(key)) childrenMap.set(key, []);
      childrenMap.get(key)!.push(f);
    }

    const traverse = (parentId: string | undefined, depth: number) => {
      const children = childrenMap.get(parentId ?? "root") ?? [];
      for (const c of children) {
        result.push({ _id: c._id, name: c.name, color: c.color, depth });
        traverse(c._id, depth + 1);
      }
    };

    traverse(undefined, 0);
    return result;
  }, [folders]);

  const handleCreate = async () => {
    setProcessing(true);

    try {
      let docContent = content;
      let docSource: string | undefined;
      let docTitle = title;
      let docType: "web" | "pdf" | "note" = "note";

      if (tab === "url" && url) {
        docType = "web";
        docSource = new URL(url.startsWith("http") ? url : `https://${url}`)
          .hostname;
        docContent = `Content from ${url}\n\n[Note: URL scraping would happen here in production]`;
        docTitle = docTitle || url;
      } else if (tab === "pdf") {
        docType = "pdf";
        docTitle = "Uploaded PDF";
      }

      const documentId = await createDocument({
        type: docType,
        title: docTitle || "Untitled",
        content: docContent,
        source: docSource,
        folderId: folderId ? (folderId as Id<"folders">) : undefined,
      });

      // Generate title and tags using AI
      if (docContent.length > 50) {
        try {
          await generateTitleAndTags({
            documentId,
            content: docContent,
          });
        } catch (e) {
          console.error("Failed to generate title/tags:", e);
        }
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setTab("url");
    setUrl("");
    setTitle("");
    setContent("");
    setFolderId("");
  };

  const canCreate =
    tab === "url"
      ? url.trim()
      : tab === "note"
        ? title.trim() || content.trim()
        : false;

  const tabs: { id: TabType; icon: typeof Link; label: string }[] = [
    { id: "url", icon: Link, label: "URL" },
    { id: "pdf", icon: FileText, label: "PDF" },
    { id: "note", icon: Edit3, label: "Empty note" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-card">
        <DialogHeader className="px-5 pt-5 pb-3.5">
          <DialogTitle className="text-[16px] font-bold tracking-tight">
            Add to Library
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3.5">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab(t.id)}
              className="gap-1.5"
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 pb-4">
          {tab === "url" && (
            <div className="space-y-4">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                autoFocus
                className="bg-secondary/50"
              />
              <div>
                <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2.5">
                  Supports
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    "Web Articles & Blogs",
                    "Online PDFs",
                    "Research Papers",
                    "Wikipedia",
                    "Documentation",
                  ].map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-2.5 text-[13px] text-muted-foreground"
                    >
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "pdf" && (
            <div className="border-2 border-dashed border-border rounded-xl p-9 text-center cursor-pointer hover:border-muted-foreground/30 transition-colors">
              <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              <div className="text-[14px] text-muted-foreground font-medium mb-1.5">
                Drop PDF here or click to upload
              </div>
              <div className="text-[12px] text-muted-foreground/60">
                Supports PDF files up to 50 MB
              </div>
            </div>
          )}

          {tab === "note" && (
            <div className="space-y-2.5">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                autoFocus
                className="bg-secondary/50"
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing... (Markdown supported)"
                rows={5}
                className="bg-secondary/50 resize-none"
              />
              <Select
                value={folderId || "none"}
                onValueChange={(v) => setFolderId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {flatFolders.map((f) => (
                    <SelectItem key={f._id} value={f._id}>
                      <span className="flex items-center gap-2">
                        <span style={{ width: f.depth * 12 }} />
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: f.color }}
                        />
                        {f.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground/60">
            AI will auto-generate title & tags
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!canCreate || processing}>
              {processing && (
                <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />
              )}
              {tab === "url"
                ? "Import URL"
                : tab === "pdf"
                  ? "Upload PDF"
                  : "Create Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
