import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LibraryView } from "#/components/library/library-view";

export const Route = createFileRoute("/_authenticated/")({
  component: LibraryIndex,
});

function LibraryIndex() {
  const navigate = useNavigate();

  return (
    <LibraryView
      onOpenNote={(id) => navigate({ to: "/document/$documentId", params: { documentId: id } })}
      onNewNote={() => {}}
    />
  );
}
