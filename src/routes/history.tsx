import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useReflections } from "@/lib/data-hooks";


export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Reflection history · Lens Tab" },
      { name: "description", content: "Search and revisit your past reflections." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { reflections, remove } = useReflections();
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? reflections.filter(
        (r) =>
          r.question.toLowerCase().includes(q.toLowerCase()) ||
          (r.answer ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (r.lens_name ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : reflections;

  return (
    <PageShell title="History">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your reflections…" className="mb-6" />
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No reflections yet.</p>}
      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {r.lens_name ?? "Lens"} · {new Date(r.created_at).toLocaleString()}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 font-medium">{r.question}</div>
              {r.answer ? (
                <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/90">{r.answer}</p>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">(no answer)</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
