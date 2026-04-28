import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import type { Id } from "#/lib/convex";
import { LibraryView } from "#/components/library/library-view";

export const Route = createFileRoute("/_authenticated/tag/$tagId")({
  component: TagView,
});

function TagView() {
  const navigate = useNavigate();
  const { tagId } = useParams({ from: "/_authenticated/tag/$tagId" });

  return (
    <LibraryView
      activeTag={tagId as Id<"tags">}
      onOpenNote={(id) => navigate({ to: "/document/$documentId", params: { documentId: id } })}
    />
  );
}
