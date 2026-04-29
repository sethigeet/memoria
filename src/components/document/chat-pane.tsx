import { useState, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api, type Id } from "#/lib/convex";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Logo } from "#/components/ui/logo";
import { Send } from "lucide-react";
import { Markdown } from "#/components/document/markdown-content";

interface ChatPaneProps {
  documentId: Id<"documents">;
  content: string;
}

export function ChatPane({ documentId, content }: ChatPaneProps) {
  const messages = useQuery(api.chat.getMessages, { documentId }) ?? [];
  const chatAction = useAction(api.ai.chat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setLoading(true);

    try {
      await chatAction({ documentId, content, question });
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What is the main argument?",
    "What are the key takeaways?",
    "Summarize in simple terms",
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto px-4 pt-4 pb-2">
        {messages.length === 0 ? (
          <div className="max-w-[240px] mx-auto text-center mt-9">
            <div className="w-10 h-10 flex items-center justify-center mx-auto mb-3.5">
              <Logo size={40} />
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Ask anything about this document. The AI answers using only its content.
            </p>
            <div className="mt-4 flex flex-col gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-2 text-left text-[12px] text-muted-foreground bg-secondary/30 border border-border rounded-lg hover:border-muted-foreground/30 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`mb-3.5 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Logo size={16} />
                  <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Memoria
                  </span>
                </div>
              )}
              <div
                className={`max-w-[88%] px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "rounded-[10px_10px_3px_10px] bg-primary/15 border border-primary/25 text-foreground/90"
                    : "rounded-[3px_10px_10px_10px] bg-secondary/50 border border-border text-foreground/80"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  <Markdown compact>{msg.content}</Markdown>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Logo size={16} />
              <span className="text-[11px] font-semibold text-muted-foreground">Memoria</span>
            </div>
            <div className="flex gap-1 px-3 py-2.5 rounded-[3px_10px_10px_10px] bg-secondary/50 border border-border w-fit">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                  style={{ animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2 items-end bg-secondary/30 border border-border rounded-lg p-1.5 pl-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document..."
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none text-[13px] min-h-0 p-0 py-1 focus-visible:ring-0"
          />
          <Button
            size="icon"
            className="w-7 h-7 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-1.5">
          Scoped to this document only · Enter to send
        </p>
      </div>
    </div>
  );
}
