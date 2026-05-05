import { LogOut, Keyboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip";

interface SidebarUserSectionProps {
  user:
    | {
        name: string | null;
        email: string | null;
        image: string | null;
      }
    | null
    | undefined;
  onSignOut: () => void;
}

export function SidebarUserSection({ user, onSignOut }: SidebarUserSectionProps) {
  const displayName = user?.name ?? user?.email ?? "User";
  const detailText = user === undefined ? "Loading..." : (user?.email ?? "Signed in");
  const avatarText = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="p-3 border-t border-sidebar-border flex items-center gap-2.5 shrink-0">
      <div className="w-7 h-7 rounded-full bg-purple-500 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
        {user?.image ? (
          <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          avatarText
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{displayName}</div>
        <div className="text-[11px] text-muted-foreground truncate">{detailText}</div>
      </div>
      <div className="flex items-center gap-0.5">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  const event = new KeyboardEvent("keydown", {
                    key: "?",
                    shiftKey: true,
                    bubbles: true,
                  });
                  window.dispatchEvent(event);
                }}
                className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              Keyboard shortcuts
              <kbd className="ml-1.5 rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px]">
                ?
              </kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <button
          onClick={onSignOut}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
