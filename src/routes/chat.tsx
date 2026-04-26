import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { RequireAuth } from "@/components/RequireAuth";
import { ChatPanel } from "@/components/ChatPanel";
import { useInsights } from "@/lib/chat-hooks";
import { useLensLikes } from "@/lib/lens-likes";
import { Button } from "@/components/ui/button";
import { Trash2, Brain, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with your agent · Focal Lens" },
      { name: "description", content: "Have an ongoing conversation with your personal creativity agent. It learns about you over time." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ChatPage />
    </RequireAuth>
  ),
});

function ChatPage() {
  const { insights, remove } = useInsights();
  const { likes, like } = useLensLikes();

  const clearAllInsights = async () => {
    if (insights.length === 0) return;
    if (!confirm(`Remove all ${insights.length} insights from the agent's context? This cannot be undone.`)) return;
    await Promise.all(insights.map((i) => remove(i.id)));
    toast.success("Cleared all agent context");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar />
      <div className="flex-1 mx-auto w-full max-w-6xl grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 px-4 py-6">
        <div className="h-[calc(100vh-9rem)] min-h-[500px]">
          <ChatPanel variant="page" className="h-full bg-card" />
        </div>

        <aside className="hidden md:flex flex-col gap-4 max-h-[calc(100vh-9rem)] overflow-hidden">
          {/* Insights */}
          <div className="rounded-2xl border bg-card p-4 flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4" /> Agent context
              </div>
              {insights.length > 0 && (
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={clearAllInsights}>
                  Clear all
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              These shape how the agent responds. Remove anything that no longer fits.
            </p>
            {insights.length === 0 && (
              <p className="text-xs text-muted-foreground">
                As you chat and reflect, the agent will save durable things it learns about you here.
              </p>
            )}
            <ul className="space-y-2 overflow-y-auto pr-1 flex-1">
              {insights.map((i) => (
                <li key={i.id} className="group text-xs border rounded-md p-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="uppercase tracking-wider text-[10px] text-muted-foreground">{i.category}</div>
                    <div className="mt-0.5 break-words">{i.content}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                    onClick={() => remove(i.id)}
                    title="Remove from agent context"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Liked lenses */}
          {likes.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 flex flex-col min-h-0 max-h-[40%]">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Heart className="h-4 w-4" /> Liked lenses
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                The agent leans toward these framings. Unlike to remove the signal.
              </p>
              <ul className="space-y-1.5 overflow-y-auto pr-1">
                {likes.map((l) => (
                  <li key={l.lens_id} className="group text-xs border rounded-md px-2 py-1.5 flex items-center gap-2">
                    <span className="flex-1 truncate">{l.lens_name ?? "Lens"}</span>
                    {l.count > 1 && <span className="text-[10px] text-muted-foreground">×{l.count}</span>}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                      onClick={() => like(l.lens_id, l.lens_name ?? "Lens")}
                      title="Unlike"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
