import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import type { Id } from "#/lib/convex";
import { LibraryView } from "#/components/library/library-view";

export const Route = createFileRoute("/_authenticated/folder/$folderId")({
  component: FolderView,
});

function FolderView() {
  const navigate = useNavigate();
  const { folderId } = useParams({ from: "/_authenticated/folder/$folderId" });

  return (
    <LibraryView
      activeFolder={folderId as Id<"folders">}
      onOpenNote={(id) => navigate({ to: "/document/$documentId", params: { documentId: id } })}
      onNewNote={() => {}}
    />
  );
}
