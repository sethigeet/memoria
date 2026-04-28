import { BookOpen, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { ChatPane } from "#/components/document/chat-pane";
import type { Id } from "#/lib/convex";

type DocumentSidePanelProps = {
  documentId: Id<"documents">;
  content: string;
};

export function DocumentSidePanel({ documentId, content }: DocumentSidePanelProps) {
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
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 overflow-hidden m-0 bg-secondary/50 rounded-b-lg rounded-tr-lg">
          <ChatPane documentId={documentId} content={content} />
        </TabsContent>

        <TabsContent value="notebook" className="flex-1 overflow-hidden m-0 p-4 bg-secondary/50 rounded-b-lg rounded-tl-lg">
          <div className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground/60 mb-3">
            Personal notes
          </div>
          <textarea
            placeholder="Write your thoughts, highlights, and connections here..."
            className="w-full h-full bg-transparent border-0 outline-none text-[13px] text-foreground/80 leading-relaxed resize-none placeholder:text-muted-foreground/40"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
