import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { api, type Id } from "#/lib/convex";
import { Logo } from "#/components/ui/logo";
import { LoadingSplash } from "#/components/ui/loading-splash";
import { Markdown } from "#/components/document/markdown-content";
import { DocumentMeta } from "#/components/document/document-meta";

export const Route = createFileRoute("/shared/document/$documentId")({
  component: PublicDocumentView,
});

function PublicDocumentView() {
  const { documentId } = useParams({ from: "/shared/document/$documentId" });
  const document = useQuery(api.documents.getPublic, {
    id: documentId as Id<"documents">,
  });

  if (document === undefined) {
    return <LoadingSplash />;
  }

  if (document === null) {
    return (
      <div className="min-h-screen bg-[#0e0e12] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Document not found</h1>
          <p className="text-muted-foreground">This document doesn't exist or is not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e12]">
      <header className="border-b border-border bg-[#0b0b0e]">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0e0e12] border border-border flex items-center justify-center">
              <Logo size={20} />
            </div>
            <span className="font-bold text-lg">Memoria</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <DocumentMeta
          documentId={documentId as Id<"documents">}
          type={document.type}
          title={document.title}
          tags={document.tags}
          source={document.source}
          creationTime={document._creationTime}
          editable={false}
        />

        {document.summary && (
          <div className="px-7 py-4 mb-4 bg-secondary/30 rounded-lg border border-border mx-7">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              AI Summary
            </div>
            <Markdown className="text-sm">{document.summary}</Markdown>
          </div>
        )}

        <div className="px-7 py-5">
          <Markdown className="max-w-[680px]">{document.content}</Markdown>
        </div>
      </main>
    </div>
  );
}
