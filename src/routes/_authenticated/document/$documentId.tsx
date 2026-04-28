import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api, type Id } from "#/lib/convex";
import { DocumentHeader } from "#/components/document/document-header";
import { DocumentMeta } from "#/components/document/document-meta";
import { DocumentSidePanel } from "#/components/document/document-side-panel";
import { DocumentSummary } from "#/components/document/document-summary";
import { Markdown } from "#/components/document/markdown-content";
import { ResizableSplit } from "#/components/ui/resizable-split";
import {
  ScrapingFailedState,
  ScrapingPendingState,
} from "#/components/document/scraping-states";

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

  const onBack = () => navigate({ to: "/" });

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isScraping =
    document.scrapingStatus === "pending" || document.scrapingStatus === "processing";
  const isScrapingFailed = document.scrapingStatus === "failed";
  const showSummary = !isScraping && !isScrapingFailed;

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden">
      <DocumentHeader title={document.title} onBack={onBack} />

      <ResizableSplit
        storageKey="document-split:left-percent"
        defaultLeftSize={62}
        minLeftSize={35}
        maxLeftSize={80}
        left={
          <div className="flex flex-col min-h-0 flex-1 pb-5 overflow-y-auto">
            <DocumentMeta
              type={document.type}
              title={document.title}
              tags={document.tags}
              source={document.source}
              creationTime={document._creationTime}
              folder={document.folder}
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
                <Markdown className="max-w-[680px]">{document.content}</Markdown>
              )}
            </div>
          </div>
        }
        right={<DocumentSidePanel documentId={documentId} content={document.content} />}
      />
    </div>
  );
}
