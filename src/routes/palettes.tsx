import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Trash2, Plus, Palette as PaletteIcon } from "lucide-react";

export const Route = createFileRoute("/palettes")({
  head: () => ({
    meta: [
      { title: "Saved palettes — Focal Lens" },
      { name: "description", content: "Save and revisit color palettes and gradients you love." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PalettesPage />
    </RequireAuth>
  ),
});

type SavedPalette = {
  id: string;
  name: string | null;
  colors: string[];
  created_at: string;
};

function isGradient(colors: string[]) {
  return colors.length === 2;
}

function paletteCss(colors: string[]) {
  if (isGradient(colors)) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  }
  // Multi-stop gradient preview for palettes
  const stops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}

function PalettesPage() {
  const { user } = useAuth();
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [colorsInput, setColorsInput] = useState("#FFD3A5, #FD6585");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_palettes")
      .select("id, name, colors, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load palettes");
    } else {
      setPalettes((data ?? []) as SavedPalette[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const parseColors = (raw: string): string[] => {
    return raw
      .split(/[,\s]+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => (c.startsWith("#") ? c : `#${c}`));
  };

  const handleAdd = async () => {
    if (!user) return;
    const colors = parseColors(colorsInput);
    if (colors.length < 2) {
      toast.error("Add at least 2 colors");
      return;
    }
    if (colors.length > 8) {
      toast.error("Max 8 colors");
      return;
    }
    const valid = colors.every((c) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c));
    if (!valid) {
      toast.error("Use hex colors like #AABBCC");
      return;
    }
    const { error } = await supabase.from("saved_palettes").insert({
      user_id: user.id,
      name: name.trim() || null,
      colors,
    });
    if (error) {
      toast.error("Could not save");
      return;
    }
    setName("");
    setColorsInput("");
    toast.success("Saved");
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_palettes").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    setPalettes((p) => p.filter((x) => x.id !== id));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center gap-2 mb-2">
          <PaletteIcon className="h-5 w-5" />
          <h1 className="text-2xl font-semibold tracking-tight">Saved palettes & gradients</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Keep colors you love. Two colors saves a gradient; more saves a palette.
        </p>

        <div className="rounded-2xl border border-border bg-card p-4 mb-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end">
            <div>
              <label className="text-xs text-muted-foreground">Name (optional)</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunset" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Colors (hex, comma-separated)</label>
              <Input
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="#FFD3A5, #FD6585"
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1.5" /> Save
            </Button>
          </div>
          {colorsInput && parseColors(colorsInput).length > 0 && (
            <div className="mt-3">
              <div
                className="h-12 rounded-lg border border-border"
                style={{ background: paletteCss(parseColors(colorsInput)) }}
                aria-hidden
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {parseColors(colorsInput).map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted"
                  >
                    {c.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : palettes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No palettes yet. Save your first above, or from the home tab.</p>
        ) : (
          <ul className="space-y-3">
            {palettes.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div
                  className="h-20 cursor-pointer"
                  style={{ background: paletteCss(p.colors) }}
                  onClick={() => copy(paletteCss(p.colors))}
                  title="Click to copy CSS"
                />
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {p.name || (isGradient(p.colors) ? "Gradient" : "Palette")}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => copy(c)}
                          className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border hover:bg-muted transition"
                          title="Copy hex"
                        >
                          {c.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">← Back home</Link>
        </div>
      </main>
    </div>
  );
}
