import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api, type Id } from "#/lib/convex";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
  Home,
  Search,
  Plus,
  Folder,
  Globe,
  Tag,
  ChevronRight,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  activeFolder?: Id<"folders">;
  activeTag?: Id<"tags">;
  onFolderSelect: (id: Id<"folders"> | null) => void;
  onTagSelect: (id: Id<"tags"> | null) => void;
  onNewNote: () => void;
  onSearch: (query: string) => void;
}

export function Sidebar({
  activeFolder,
  activeTag,
  onFolderSelect,
  onTagSelect,
  onNewNote,
  onSearch,
}: SidebarProps) {
  const { signOut } = useAuthActions();
  const folders = useQuery(api.folders.list) ?? [];
  const tags = useQuery(api.tags.list) ?? [];
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="w-[232px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#0e0e12] border border-border flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 32 32" className="w-5 h-5">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#4da6ff" }} />
                <stop offset="100%" style={{ stopColor: "#7c3aed" }} />
              </linearGradient>
            </defs>
            <path
              d="M7 24 L7 10 Q7 8 9 8 L11 8 L11 24 Q11 25 10 25 L8 25 Q7 25 7 24Z"
              fill="url(#logoGrad)"
            />
            <path d="M11 11 L16 18 L21 11 L21 13 L16 21 L11 13Z" fill="url(#logoGrad)" />
            <path
              d="M21 8 L23 8 Q25 8 25 10 L25 24 Q25 25 24 25 L22 25 Q21 25 21 24 L21 8Z"
              fill="url(#logoGrad)"
            />
            <circle cx="10" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
            <circle cx="16" cy="4" r="1" fill="#7c3aed" opacity="0.7" />
            <circle cx="22" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
          </svg>
        </div>
        <span className="font-bold text-[15px] tracking-tight">Memoria</span>
      </div>

      {/* New Note Button */}
      <div className="px-2.5 pt-3 pb-2">
        <Button onClick={onNewNote} className="w-full gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-2.5 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </form>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-1.5">
        {/* Library */}
        <button
          onClick={() => {
            onFolderSelect(null);
            onTagSelect(null);
            navigate({ to: "/" });
          }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
            !activeFolder && !activeTag
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          Library
        </button>

        {/* Folders */}
        <div className="mt-2">
          <button
            onClick={() => setFoldersOpen(!foldersOpen)}
            className="flex items-center gap-1.5 px-4 py-1 text-[10.5px] font-bold tracking-wider uppercase text-muted-foreground cursor-pointer"
          >
            {foldersOpen ? (
              <ChevronDown className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            Folders
          </button>
          {foldersOpen &&
            folders.map((folder) => (
              <button
                key={folder._id}
                onClick={() => {
                  onFolderSelect(activeFolder === folder._id ? null : folder._id);
                  onTagSelect(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 pl-6 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                  activeFolder === folder._id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                {folder.isPublic && (
                  <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            ))}
        </div>

        {/* Tags */}
        <div className="mt-2">
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            className="flex items-center gap-1.5 px-4 py-1 text-[10.5px] font-bold tracking-wider uppercase text-muted-foreground cursor-pointer"
          >
            {tagsOpen ? (
              <ChevronDown className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            Tags
          </button>
          {tagsOpen &&
            tags.map((tag) => (
              <button
                key={tag._id}
                onClick={() => {
                  onTagSelect(activeTag === tag._id ? null : tag._id);
                  onFolderSelect(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 pl-6 rounded-md text-[13px] transition-colors mx-1.5 my-0.5 ${
                  activeTag === tag._id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{tag.name}</span>
              </button>
            ))}
        </div>
      </ScrollArea>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          U
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">User</div>
          <div className="text-[11px] text-muted-foreground">Free plan</div>
        </div>
        <button
          onClick={() => signOut()}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
