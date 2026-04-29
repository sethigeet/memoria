import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Strikethrough, Code, Link } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "#/lib/utils";

type BubbleMenuBarProps = {
  editor: Editor;
};

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 p-1 rounded-lg bg-popover border border-border shadow-lg"
    >
      {showLinkInput ? (
        <div className="flex items-center gap-1 px-1">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              }
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            className="w-48 px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <button
            onClick={setLink}
            className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Add
          </button>
        </div>
      ) : (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolbarButton
            onClick={() => {
              if (editor.isActive("link")) {
                removeLink();
              } else {
                setShowLinkInput(true);
              }
            }}
            isActive={editor.isActive("link")}
            title="Link"
          >
            <Link className="w-4 h-4" />
          </ToolbarButton>
        </>
      )}
    </BubbleMenu>
  );
}

type ToolbarButtonProps = {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}
