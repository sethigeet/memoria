import type { Id } from "#/lib/convex";

type FolderLike = {
  _id: Id<"folders">;
  name: string;
  color: string;
  parentId?: Id<"folders">;
};

export type FlatFolderOption = {
  _id: Id<"folders">;
  name: string;
  color: string;
  depth: number;
};

export function flattenFolders(folders: FolderLike[]): FlatFolderOption[] {
  const result: FlatFolderOption[] = [];
  const childrenMap = new Map<string, FolderLike[]>();

  for (const folder of folders) {
    const key = folder.parentId ?? "root";
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(folder);
  }

  const traverse = (parentId: Id<"folders"> | undefined, depth: number) => {
    const children = childrenMap.get(parentId ?? "root") ?? [];
    for (const child of children) {
      result.push({
        _id: child._id,
        name: child.name,
        color: child.color,
        depth,
      });
      traverse(child._id, depth + 1);
    }
  };

  traverse(undefined, 0);
  return result;
}
