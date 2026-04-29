import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useCallback } from "react";
import { api, type Id } from "#/lib/convex";
import { LoadingSplash } from "#/components/ui/loading-splash";
import { DocumentHeader } from "#/components/document/document-header";
import { DocumentMeta } from "#/components/document/document-meta";
import { DocumentSidePanel } from "#/components/document/document-side-panel";
import { DocumentSummary } from "#/components/document/document-summary";
import { Markdown } from "#/components/document/markdown-content";
import { RichEditor } from "#/components/editor/rich-editor";
import { useDebouncedSave } from "#/components/editor/use-debounced-save";
import { ResizableSplit } from "#/components/ui/resizable-split";
import { ScrapingFailedState, ScrapingPendingState } from "#/components/document/scraping-states";

export const Route = createFileRoute("/_authenticated/document/$documentId")({
  component: DocumentRoute,
});

function DocumentRoute() {
  const navigate = useNavigate();
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

  const onBack = () => navigate({ to: "/" });

  if (!document) {
    return <LoadingSplash fullScreen={false} />;
  }

  const isScraping =
    document.scrapingStatus === "pending" || document.scrapingStatus === "processing";
  const isScrapingFailed = document.scrapingStatus === "failed";
  const showSummary = !isScraping && !isScrapingFailed;
  const isNote = document.type === "note";

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      <DocumentHeader
        title={document.title}
        documentId={documentId}
        isPublic={document.isPublic}
        onBack={onBack}
        saveStatus={isNote ? saveStatus : undefined}
      />

      <ResizableSplit
        storageKey="document-split:left-percent"
        defaultLeftSize={62}
        minLeftSize={35}
        maxLeftSize={80}
        left={
          <div className="flex flex-col min-h-0 flex-1 pb-5 overflow-y-auto">
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
              ) : isNote ? (
                <RichEditor
                  initialContent={document.content}
                  onChange={saveContent}
                  placeholder="Start writing your note..."
                  className="max-w-[680px]"
                />
              ) : (
                <Markdown className="max-w-[680px]">{document.content}</Markdown>
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
  );
}
