import type { Id } from "#/lib/convex";

export type CreatingFolder = Id<"folders"> | "root" | null;

export type FolderWithChildren = {
  _id: Id<"folders">;
  name: string;
  color: string;
  isPublic: boolean;
  parentId?: Id<"folders"> | null;
  documentCount: number;
  children: FolderWithChildren[];
};

export type TagListItem = {
  _id: Id<"tags">;
  name: string;
};
