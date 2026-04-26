import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { useGoals, useLenses, useReflections } from "@/lib/data-hooks";
import { useConversations, useMessages, useInsights, type ChatMessage } from "@/lib/chat-hooks";
import { streamChat } from "@/lib/stream-chat";
import { extractInsights } from "@/server/chat-insights.functions";
import { callAuthed } from "@/lib/call-authed";

type Props = {
  variant?: "page" | "drawer";
  textColor?: string; // override colors when over a colored background
  className?: string;
};

export function ChatPanel({ variant = "page", textColor, className = "" }: Props) {
  const { goals } = useGoals();
  const { lenses } = useLenses();
  const { reflections } = useReflections();
  const { insights, addMany: addInsights } = useInsights();
  const { conversations, create, remove } = useConversations();

  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, append, setLocal, refresh } = useMessages(activeId);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-pick or create a conversation
  useEffect(() => {
    if (activeId) return;
    if (conversations.length > 0) {
      setActiveId(conversations[0].id);
    } else {
      create("New conversation").then(setActiveId);
    }
  }, [conversations, activeId, create]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Greet on empty conversation
  useEffect(() => {
    if (!activeId || streaming) return;
    if (messages.length > 0) return;
    // Seed a starter assistant turn
    const greet = async () => {
      const greeting =
        goals.filter((g) => g.active).length === 0
          ? "Hey — I'm your creativity agent. To get useful, I need to know you a little. What are you working on right now, and why does it matter to you?"
          : `Welcome back. Of your active goals${goals.filter((g) => g.active).length > 1 ? "" : ""}, which one feels most alive today — and what part of it has your attention?`;
      await append({ role: "assistant", content: greeting });
    };
    greet();
  }, [activeId, messages.length, streaming, goals, append]);

  const send = async () => {
    if (!input.trim() || !activeId || streaming) return;
    const text = input.trim();
    setInput("");

    // Persist user msg
    await append({ role: "user", content: text });

    // Build streaming placeholder
    const placeholder: ChatMessage = {
      id: "streaming-" + Date.now(),
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };
    // local-only update for live tokens
    setLocal([
      ...messages,
      { id: "u-" + Date.now(), role: "user", content: text, created_at: new Date().toISOString() },
      placeholder,
    ]);

    let acc = "";
    setStreaming(true);
    try {
      const enabledLenses = lenses.filter((l) => l.enabled).map((l) => ({ name: l.name, theme: l.theme }));
      const recent = reflections.slice(0, 8).map((r) => ({ question: r.question, answer: r.answer, lens_name: r.lens_name }));
      const goalCtx = goals.filter((g) => g.active).map((g) => ({ title: g.title, description: g.description ?? undefined }));
      const insightCtx = insights.slice(0, 30).map((i) => ({ category: i.category, content: i.content }));

      // Build the message history we send (current persisted messages + new user turn)
      const history = [
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: text },
      ];

      await streamChat(
        { messages: history, context: { goals: goalCtx, lenses: enabledLenses, recentReflections: recent, insights: insightCtx } },
        {
          onDelta: (chunk) => {
            acc += chunk;
            setLocal([
              ...messages,
              { id: "u-live", role: "user", content: text, created_at: new Date().toISOString() },
              { ...placeholder, content: acc },
            ]);
          },
        },
      );

      if (acc.trim()) {
        await append({ role: "assistant", content: acc.trim() });
      } else {
        await refresh();
      }

      // Background: extract durable insights every few turns
      const turnCount = messages.length + 2; // we added 2
      if (turnCount >= 4 && turnCount % 4 === 0) {
        callAuthed(extractInsights, {
          data: {
            messages: [
              ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
              { role: "user", content: text },
              { role: "assistant", content: acc.trim() },
            ],
            existingInsights: insights.map((i) => ({ category: i.category, content: i.content })),
          },
        })
          .then((r) => {
            if (r.insights.length > 0) {
              addInsights(r.insights, activeId ?? undefined);
              toast.success(`Agent learned ${r.insights.length} new thing${r.insights.length === 1 ? "" : "s"} about you`);
            }
          })
          .catch((e) => console.warn("insight extraction failed", e));
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
      await refresh();
    } finally {
      setStreaming(false);
    }
  };

  const newConversation = async () => {
    const id = await create("New conversation");
    setActiveId(id);
  };

  const deleteConversation = async (id: string) => {
    await remove(id);
    if (id === activeId) setActiveId(null);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isDrawer = variant === "drawer";
  const baseStyle = textColor ? { color: textColor } : undefined;
  const isDark = textColor === "#FAFAFA";
  const surface = isDrawer
    ? {
        backgroundColor: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.65)",
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      }
    : undefined;

  return (
    <div
      className={`flex flex-col h-full rounded-2xl border backdrop-blur-md ${className}`}
      style={{ ...surface, ...baseStyle }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-current/10">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Creativity agent</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={newConversation} style={baseStyle}>
            New
          </Button>
        </div>
      </div>

      {/* Conversation list (page only) */}
      {!isDrawer && conversations.length > 0 && (
        <div className="px-4 py-2 border-b border-border flex gap-2 flex-wrap text-xs">
          {conversations.slice(0, 8).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`px-2 py-1 rounded-md border transition-colors ${
                c.id === activeId ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {c.title || "Untitled"}
              {c.id === activeId && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                  className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3 w-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} textColor={textColor} />
        ))}
        {streaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="text-sm opacity-60 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-current/10">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Tell the agent what's on your mind…"
            rows={2}
            className="resize-none bg-transparent"
            style={baseStyle}
            disabled={streaming || !activeId}
          />
          <Button onClick={send} disabled={!input.trim() || streaming || !activeId} size="icon">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] opacity-60">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}

function MessageBubble({ m, textColor }: { m: ChatMessage; textColor?: string }) {
  const isUser = m.role === "user";
  const isDark = textColor === "#FAFAFA";
  const bg = isUser
    ? isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.85)"
    : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const fg = isUser
    ? isDark ? textColor ?? "#fff" : "#fff"
    : textColor ?? "inherit";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
        style={{ backgroundColor: bg, color: fg }}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{m.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none [&_*]:!text-inherit [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5">
            <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
