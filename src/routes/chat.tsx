import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { RequireAuth } from "@/components/RequireAuth";
import { ChatPanel } from "@/components/ChatPanel";
import { useInsights } from "@/lib/chat-hooks";
import { Button } from "@/components/ui/button";
import { Trash2, Brain } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with your agent · Lens Tab" },
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar />
      <div className="flex-1 mx-auto w-full max-w-6xl grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 px-4 py-6">
        <div className="h-[calc(100vh-9rem)] min-h-[500px]">
          <ChatPanel variant="page" className="h-full bg-card" />
        </div>

        <aside className="hidden md:block">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
              <Brain className="h-4 w-4" /> What the agent has learned
            </div>
            {insights.length === 0 && (
              <p className="text-xs text-muted-foreground">
                As you chat, the agent will save durable things it learns about you here.
              </p>
            )}
            <ul className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {insights.map((i) => (
                <li key={i.id} className="group text-xs border rounded-md p-2 flex items-start gap-2">
                  <div className="flex-1">
                    <div className="uppercase tracking-wider text-[10px] text-muted-foreground">{i.category}</div>
                    <div className="mt-0.5">{i.content}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(i.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
