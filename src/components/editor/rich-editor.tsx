import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { marked } from "marked";
import TurndownService from "turndown";
import { useEffect, useRef } from "react";
import { cn } from "#/lib/utils";
import { useDebouncedCallback } from "#/hooks/use-debounced-callback";
import { BubbleMenuBar } from "./bubble-menu";
import { SlashCommand } from "./slash-command";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

type RichEditorProps = {
  initialContent: string;
  editable?: boolean;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function RichEditor({
  initialContent,
  editable = true,
  onChange,
  placeholder = "Start writing...",
  className,
  autoFocus = false,
}: RichEditorProps) {
  const initialHtmlRef = useRef<string | null>(null);
  if (initialHtmlRef.current === null) {
    initialHtmlRef.current = initialContent
      ? (marked.parse(initialContent, { async: false }) as string)
      : "";
  }

  const debouncedOnChange = useDebouncedCallback((html: string) => {
    if (onChange) {
      const markdown = turndown.turndown(html);
      onChange(markdown);
    }
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Underline,
      SlashCommand,
    ],
    content: initialHtmlRef.current,
    editable,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm prose-invert max-w-none focus:outline-none min-h-[100px]",
          "text-foreground",
          "prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight",
          "prose-p:text-foreground/90 prose-p:my-2 prose-p:leading-relaxed",
          "prose-ul:my-2 prose-ol:my-2",
          "prose-li:text-foreground/90 prose-li:my-0.5",
          "prose-strong:text-foreground prose-em:text-foreground/90",
          "prose-code:text-foreground prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-secondary prose-pre:p-4 prose-pre:rounded-lg",
          "prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-a:text-primary prose-a:underline",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editable) {
      editor.setEditable(false);
    } else if (editor && editable) {
      editor.setEditable(true);
    }
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {editable && <BubbleMenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
