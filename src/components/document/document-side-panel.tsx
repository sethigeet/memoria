import { BookOpen, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { ChatPane } from "#/components/document/chat-pane";
import type { Id } from "#/lib/convex";

type DocumentSidePanelProps = {
  documentId: Id<"documents">;
  content: string;
};

export function DocumentSidePanel({ documentId, content }: DocumentSidePanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-[#0e0e12] h-auto p-0 px-3.5">
          <TabsTrigger
            value="chat"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="notebook"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Notebook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
          <ChatPane documentId={documentId} content={content} />
        </TabsContent>

        <TabsContent value="notebook" className="flex-1 overflow-hidden m-0 p-4">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2.5">
            Personal notes on this document
          </div>
          <textarea
            placeholder="Write your thoughts, highlights, and connections here..."
            className="w-full h-full bg-transparent border-0 outline-none text-[13px] text-muted-foreground leading-relaxed resize-none"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
