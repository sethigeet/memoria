import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { PanelRight } from "lucide-react";
import { api, type Id } from "#/lib/convex";
import { LoadingSplash } from "#/components/ui/loading-splash";
import { DocumentHeader } from "#/components/document/document-header";
import { DocumentMeta } from "#/components/document/document-meta";
import { DocumentSidePanel } from "#/components/document/document-side-panel";
import { DocumentSummary } from "#/components/document/document-summary";
import { DocumentOutline } from "#/components/document/document-outline";
import { Markdown } from "#/components/document/markdown-content";
import { RichEditor } from "#/components/editor/rich-editor";
import { useDebouncedSave } from "#/components/editor/use-debounced-save";
import { ResizableSplit } from "#/components/ui/resizable-split";
import { ScrapingFailedState, ScrapingPendingState } from "#/components/document/scraping-states";
import { useScrollProgress } from "#/hooks/use-scroll-progress";
import { useDocumentOutline } from "#/hooks/use-document-outline";
import { Button } from "#/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/document/$documentId")({
  component: DocumentRoute,
});

type NoteViewMode = "view" | "edit";

function DocumentRoute() {
  const navigate = useNavigate();
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [noteViewMode, setNoteViewMode] = useState<NoteViewMode>("view");

  const documentId = useParams({
    from: "/_authenticated/document/$documentId",
    select: (p) => p.documentId as Id<"documents">,
  });
  const document = useQuery(api.documents.get, { id: documentId });

  const updateDocument = useMutation(api.documents.update);
  const handleSaveContent = useCallback(
    async (content: string) => {
      await updateDocument({ id: documentId, content });
    },
    [documentId, updateDocument],
  );
  const { save: saveContent, status: saveStatus } = useDebouncedSave(handleSaveContent, 2000);

  const updateReadProgress = useMutation(api.documents.updateReadProgress);
  const handleScrollProgress = useCallback(
    (progress: number) => {
      updateReadProgress({ id: documentId, progress });
    },
    [documentId, updateReadProgress],
  );

  const contentContainerRef = useScrollProgress({
    onProgress: handleScrollProgress,
    debounceMs: 1000,
    enabled: !!document && !document.readAt,
  });

  const { headings, activeId, scrollToHeading, minLevel } = useDocumentOutline(contentContainerRef, document?.content);

  const onBack = () => navigate({ to: "/" });
  const handleDelete = () => navigate({ to: "/" });

  if (!document) {
    return <LoadingSplash fullScreen={false} />;
  }

  const isScraping =
    document.scrapingStatus === "pending" || document.scrapingStatus === "processing";
  const isScrapingFailed = document.scrapingStatus === "failed";
  const showSummary = !isScraping && !isScrapingFailed;
  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      <DocumentHeader
        title={document.title}
        documentId={documentId}
        folderId={document.folderId}
        isPublic={document.isPublic}
        onBack={onBack}
        onDelete={handleDelete}
        saveStatus={noteViewMode === "edit" ? saveStatus : undefined}
        noteViewMode={noteViewMode}
        onToggleViewMode={() => setNoteViewMode(noteViewMode === "view" ? "edit" : "view")}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DocumentOutline
          headings={headings}
          activeId={activeId}
          minLevel={minLevel}
          isOpen={outlineOpen}
          onToggle={() => setOutlineOpen(!outlineOpen)}
          onHeadingClick={scrollToHeading}
        />

        <div className="relative flex-1 flex min-h-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSidePanelOpen(!sidePanelOpen)}
                className="absolute z-10 top-3 right-3 rounded-full bg-secondary/80 border border-border/60 shadow-md hover:bg-secondary"
              >
                <PanelRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              {sidePanelOpen ? "Hide panel" : "Show panel"}
            </TooltipContent>
          </Tooltip>

          <ResizableSplit
            storageKey="document-split:left-percent"
            defaultLeftSize={62}
            minLeftSize={35}
            maxLeftSize={80}
            rightCollapsed={!sidePanelOpen}
            left={
              <div
                ref={contentContainerRef}
                className="flex-1 flex flex-col min-h-0 pb-5 overflow-y-auto"
              >
                <DocumentMeta
                  documentId={documentId}
                  type={document.type}
                  title={document.title}
                  tags={document.tags}
                  source={document.source}
                  creationTime={document._creationTime}
                  folder={document.folder}
                  editable={true}
                />

                {showSummary && (
                  <DocumentSummary
                    documentId={documentId}
                    content={document.content}
                    summary={document.summary}
                    summaryType={document.summaryType}
                  />
                )}

                <div className="flex-1 min-h-0 px-7 py-5">
                  {isScraping ? (
                    <ScrapingPendingState />
                  ) : isScrapingFailed ? (
                    <ScrapingFailedState error={document.scrapingError} onRemove={onBack} />
                  ) : (
                    <div className="max-w-[680px]">
                      {noteViewMode === "view" ? (
                        <Markdown>
                          {document.content || "*No content yet. Click Edit to start writing.*"}
                        </Markdown>
                      ) : (
                        <RichEditor
                          initialContent={document.content}
                          onChange={saveContent}
                          placeholder="Start writing..."
                          autoFocus
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            }
            right={
              <DocumentSidePanel
                documentId={documentId}
                content={document.content}
                notebook={document.notebook}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
