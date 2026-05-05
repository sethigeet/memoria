import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { formatShortcut, type Shortcut } from "#/hooks/use-keyboard-shortcuts";
import { Command, Navigation, Edit3, Eye } from "lucide-react";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
}

const categoryConfig = {
  navigation: {
    label: "Navigation",
    icon: Navigation,
    gradient: "from-sky-500/20 to-blue-600/10",
    border: "border-sky-500/20",
    text: "text-sky-300",
  },
  actions: {
    label: "Actions",
    icon: Command,
    gradient: "from-violet-500/20 to-purple-600/10",
    border: "border-violet-500/20",
    text: "text-violet-300",
  },
  editing: {
    label: "Editing",
    icon: Edit3,
    gradient: "from-emerald-500/20 to-green-600/10",
    border: "border-emerald-500/20",
    text: "text-emerald-300",
  },
  view: {
    label: "View",
    icon: Eye,
    gradient: "from-amber-500/20 to-orange-600/10",
    border: "border-amber-500/20",
    text: "text-amber-300",
  },
};

export function ShortcutsDialog({ open, onOpenChange, shortcuts }: ShortcutsDialogProps) {
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>,
  );

  const categories = Object.keys(groupedShortcuts) as Array<keyof typeof categoryConfig>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Keyboard shortcuts</DialogTitle>

        <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#0c0c10]/98 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_40px_100px_-20px_rgba(0,0,0,0.7)]">
          {/* Decorative corner accents */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-500/8 blur-[60px]" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-sky-500/6 blur-[50px]" />

          {/* Header */}
          <div className="relative border-b border-white/5 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-linear-to-b from-white/8 to-white/4">
                <Command className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <h2 className="text-xl tracking-tight text-white/90">Keyboard Shortcuts</h2>
                <p className="mt-0.5 text-[12px] text-white/40">
                  Navigate faster with your keyboard
                </p>
              </div>
            </div>

            {/* Close hint */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <kbd className="rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 font-mono text-[11px] text-white/30">
                Esc
              </kbd>
            </div>
          </div>

          {/* Shortcuts grid */}
          <div className="max-h-[60vh] overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                const categoryShortcuts = groupedShortcuts[category];

                return (
                  <div
                    key={category}
                    className={`rounded-2xl border ${config.border} bg-linear-to-br ${config.gradient} p-4`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.text}`} />
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider ${config.text}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <div
                          key={shortcut.key + shortcut.description}
                          className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2"
                        >
                          <span className="text-[13px] text-white/70">{shortcut.description}</span>
                          <kbd className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-white/50">
                            {formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-6 py-4">
            <p className="text-center text-[11px] text-white/30">
              Press{" "}
              <kbd className="mx-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">
                ?
              </kbd>{" "}
              anytime to show this dialog
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
