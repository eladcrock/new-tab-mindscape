import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useGoals } from "@/lib/data-hooks";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Your goals · Lens Tab" },
      { name: "description", content: "Tell the agent what you're working toward so it asks better questions." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <GoalsPage />
    </RequireAuth>
  ),
});

function GoalsPage() {
  const { goals, add, toggle, remove } = useGoals();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await add(title.trim(), desc.trim() || undefined);
    setTitle("");
    setDesc("");
  };

  return (
    <PageShell title="Goals">
      <p className="text-muted-foreground mb-6">
        The agent uses your active goals to shape every question it asks.
      </p>

      <form onSubmit={submit} className="mb-8 grid gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ship my indie game" maxLength={120} />
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="A bit more context (optional)" rows={2} maxLength={500} />
        <Button type="submit" disabled={!title.trim()}>Add goal</Button>
      </form>

      <div className="space-y-2">
        {goals.length === 0 && <p className="text-sm text-muted-foreground">No goals yet.</p>}
        {goals.map((g) => (
          <Card key={g.id} className="p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className={`font-medium ${g.active ? "" : "line-through opacity-60"}`}>{g.title}</div>
              {g.description && <div className="text-sm text-muted-foreground mt-1">{g.description}</div>}
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={g.active} onCheckedChange={(v) => toggle(g.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => remove(g.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
