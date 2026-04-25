import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePalettes } from "@/lib/data-hooks";
import { SEED_PALETTES } from "@/lib/seed-palettes";
import { gradientFromPalette } from "@/lib/palette-utils";

export const Route = createFileRoute("/palettes")({
  head: () => ({
    meta: [
      { title: "Palettes · Lens Tab" },
      { name: "description", content: "Your saved palettes plus a curated starter library." },
    ],
  }),
  component: PalettesPage,
});

function PaletteCard({ colors, onCopy, onSave, onRemove }: { colors: string[]; onCopy: (h: string) => void; onSave?: () => void; onRemove?: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-24" style={{ backgroundImage: gradientFromPalette(colors) }} />
      <div className="p-2 flex items-center gap-1">
        {colors.map((h, i) => (
          <button
            key={i}
            onClick={() => onCopy(h)}
            className="flex-1 h-8 rounded text-[10px] font-mono"
            style={{ backgroundColor: h, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            title={`Copy ${h}`}
          >
            {h}
          </button>
        ))}
        {onSave && (
          <Button size="icon" variant="ghost" onClick={onSave} title="Save">
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {onRemove && (
          <Button size="icon" variant="ghost" onClick={onRemove} title="Remove">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function PalettesPage() {
  const { palettes, save, remove } = usePalettes();

  const copy = (h: string) => {
    navigator.clipboard.writeText(h);
    toast.success(`Copied ${h}`);
  };

  return (
    <PageShell title="Palettes">
      <h2 className="text-lg font-semibold mb-3">Saved</h2>
      {palettes.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-8">Heart a palette from the new-tab page to save it here.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {palettes.map((p) => (
            <PaletteCard key={p.id} colors={p.colors} onCopy={copy} onRemove={() => remove(p.id)} />
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Curated library</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SEED_PALETTES.map((p, i) => (
          <PaletteCard key={i} colors={p} onCopy={copy} onSave={() => { save(p); toast.success("Saved"); }} />
        ))}
      </div>
    </PageShell>
  );
}
