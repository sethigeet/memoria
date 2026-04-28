import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { LibraryView } from "#/components/library/library-view";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
  component: SearchRoute,
});

function SearchRoute() {
  const navigate = useNavigate();
  const { q } = useSearch({ from: "/_authenticated/search" });

  return (
    <LibraryView
      searchQuery={q}
      onOpenNote={(id) => navigate({ to: "/document/$documentId", params: { documentId: id } })}
      onNewNote={() => {}}
    />
  );
}
