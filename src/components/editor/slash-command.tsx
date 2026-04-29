import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "#/lib/utils";

type CommandItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  command: (props: { editor: any; range: any }) => void;
};

const commands: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Code Block",
    description: "Add a code snippet",
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Quote",
    description: "Add a blockquote",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Add a horizontal divider",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

type CommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type CommandListProps = {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  clientRect?: (() => DOMRect | null) | null;
};

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command, clientRect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
      if (clientRect) {
        const rect = clientRect();
        if (rect) {
          setPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
          });
        }
      }
    }, [clientRect]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [items, command],
    );

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
            return true;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % items.length);
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            selectItem(selectedIndex);
            return true;
          }
          return false;
        },
      }),
      [items.length, selectItem, selectedIndex],
    );

    if (items.length === 0) {
      return createPortal(
        <div
          className="fixed z-50 p-2 text-sm text-muted-foreground rounded-lg bg-popover border border-border shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          No results
        </div>,
        document.body,
      );
    }

    return createPortal(
      <div
        className="fixed z-50 flex flex-col gap-0.5 p-1 min-w-[200px] max-h-[300px] overflow-y-auto rounded-lg bg-popover border border-border shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.title}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(index);
              }}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isSelected ? "text-accent-foreground" : "text-muted-foreground",
                )}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.title}</span>
                <span
                  className={cn(
                    "text-xs",
                    isSelected ? "text-accent-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>,
      document.body,
    );
  },
);

CommandList.displayName = "CommandList";

const suggestionConfig: Omit<SuggestionOptions<CommandItem>, "editor"> = {
  char: "/",
  items: ({ query }) => {
    return commands.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  },
  command: ({ editor, range, props }) => {
    props.command({ editor, range });
  },
  render: () => {
    let component: ReactRenderer<CommandListRef> | null = null;

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });
      },
      onUpdate: (props) => {
        component?.updateProps(props);
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          component?.destroy();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        component?.destroy();
      },
    };
  },
};

export const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: suggestionConfig,
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
