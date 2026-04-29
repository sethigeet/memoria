import { BookOpen, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { ChatPane } from "#/components/document/chat-pane";
import { RichEditor } from "#/components/editor/rich-editor";
import { useDebouncedSave } from "#/components/editor/use-debounced-save";
import { useMutation } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { useCallback } from "react";

type DocumentSidePanelProps = {
  documentId: Id<"documents">;
  content: string;
  notebook?: string;
};

export function DocumentSidePanel({ documentId, content, notebook }: DocumentSidePanelProps) {
  const updateDocument = useMutation(api.documents.update);

  const handleSaveNotebook = useCallback(
    async (notebookContent: string) => {
      await updateDocument({ id: documentId, notebook: notebookContent });
    },
    [documentId, updateDocument],
  );

  const { save: saveNotebook, status } = useDebouncedSave(handleSaveNotebook, 2000);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-3 pt-2">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0 px-1 pb-0 gap-0.5 shrink-0">
          <TabsTrigger
            value="chat"
            className="relative gap-2 rounded-t-lg rounded-b-none px-4 py-2.5 text-[13px] font-medium text-muted-foreground/70 bg-transparent border-0 shadow-none transition-all duration-200 data-[state=active]:text-foreground data-[state=active]:bg-secondary/50 data-[state=active]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:text-muted-foreground hover:bg-secondary/30"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="notebook"
            className="relative gap-2 rounded-t-lg rounded-b-none px-4 py-2.5 text-[13px] font-medium text-muted-foreground/70 bg-transparent border-0 shadow-none transition-all duration-200 data-[state=active]:text-foreground data-[state=active]:bg-secondary/50 data-[state=active]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:text-muted-foreground hover:bg-secondary/30"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Notebook
            {status === "saving" && (
              <span className="ml-1 text-[10px] text-muted-foreground">saving...</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="chat"
          className="flex-1 overflow-hidden m-0 bg-secondary/50 rounded-b-lg rounded-tr-lg"
        >
          <ChatPane documentId={documentId} content={content} />
        </TabsContent>

        <TabsContent
          value="notebook"
          className="flex-1 overflow-hidden m-0 p-4 bg-secondary/50 rounded-b-lg rounded-tl-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground/60">
              Personal notes
            </div>
            {status === "saved" && <span className="text-[10px] text-green-500">Saved</span>}
          </div>
          <div className="h-[calc(100%-2rem)] overflow-y-auto">
            <RichEditor
              initialContent={notebook ?? ""}
              placeholder="Write your thoughts, highlights, and connections here..."
              onChange={saveNotebook}
              className="text-[13px]"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
