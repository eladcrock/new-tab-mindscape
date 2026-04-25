import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useLenses } from "@/lib/data-hooks";

export const Route = createFileRoute("/lenses")({
  head: () => ({
    meta: [
      { title: "Your lenses · Lens Tab" },
      { name: "description", content: "Browse the starter lens deck and add your own thinking lenses." },
    ],
  }),
  component: LensesPage,
});

function LensesPage() {
  const { lenses, add, toggle, remove } = useLenses();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [promptsText, setPromptsText] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const prompts = promptsText.split("\n").map((s) => s.trim()).filter(Boolean);
    await add(name.trim(), theme.trim(), prompts);
    setName("");
    setTheme("");
    setPromptsText("");
  };

  return (
    <PageShell title="Lenses">
      <p className="text-muted-foreground mb-6">
        Lenses are perspectives the agent draws from. Toggle the ones you want active.
      </p>

      <form onSubmit={submit} className="mb-8 grid gap-2 p-4 border rounded-lg">
        <div className="font-medium text-sm">Create a custom lens</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Lens of Discomfort)" maxLength={80} />
        <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme (e.g. growth)" maxLength={40} />
        <Textarea
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
          placeholder={"One example prompt per line\nWhat are you avoiding?\nWhat would you do if it didn't have to be perfect?"}
          rows={4}
        />
        <Button type="submit" disabled={!name.trim()}>Add lens</Button>
      </form>

      <div className="space-y-2">
        {lenses.map((l) => (
          <Card key={l.id} className="p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{l.name}</span>
                {l.theme && <Badge variant="secondary">{l.theme}</Badge>}
                {l.is_starter && <Badge variant="outline">starter</Badge>}
              </div>
              {l.prompts.length > 0 && (
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                  {l.prompts.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={l.enabled} onCheckedChange={(v) => toggle(l.id, v)} />
              {!l.is_starter && (
                <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
