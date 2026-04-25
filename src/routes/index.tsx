import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Copy, Shuffle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGoals, useLenses, useReflections, usePalettes } from "@/lib/data-hooks";
import { generateLensPrompt } from "@/server/lens-agent.functions";
import { gradientFromPalette, readableTextColor, sanitizePalette } from "@/lib/palette-utils";
import { randomSeedPalette } from "@/lib/seed-palettes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lens Tab — your thoughtful new tab" },
      { name: "description", content: "Open a new tab and reflect on a meaningful question paired with a fresh color palette." },
    ],
  }),
  component: NewTabHome,
});

type LensPrompt = {
  lensId: string | null;
  lensName: string;
  question: string;
  palette: string[];
  mood: string;
};

function NewTabHome() {
  const { goals } = useGoals();
  const { lenses } = useLenses();
  const { reflections, add: addReflection, updateAnswer } = useReflections();
  const { save: savePalette } = usePalettes();

  const [prompt, setPrompt] = useState<LensPrompt | null>(null);
  const [reflectionId, setReflectionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const enabledLenses = lenses.filter((l) => l.enabled);

  const requestNew = useCallback(
    async (createReflection = true) => {
      if (loading) return;
      setLoading(true);
      setAnswer("");
      setReflectionId(null);
      try {
        const fallbackPalette = randomSeedPalette();
        let result: LensPrompt;

        if (enabledLenses.length === 0) {
          result = {
            lensId: null,
            lensName: "Welcome",
            question: "Add a lens or set a goal to begin reflecting.",
            palette: fallbackPalette,
            mood: "open",
          };
        } else {
          try {
            const out = await generateLensPrompt({
              data: {
                goals: goals.filter((g) => g.active).map((g) => ({ title: g.title, description: g.description ?? undefined })),
                lenses: enabledLenses.map((l) => ({ id: l.id, name: l.name, theme: l.theme, prompts: l.prompts })),
                recentReflections: reflections.slice(0, 10).map((r) => ({
                  question: r.question,
                  answer: r.answer,
                  lens_name: r.lens_name,
                })),
              },
            });
            result = {
              lensId: out.lensId,
              lensName: out.lensName,
              question: out.question,
              palette: sanitizePalette(out.palette, fallbackPalette),
              mood: out.mood,
            };
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't generate a question. Using a starter prompt.");
            const fallback = enabledLenses[Math.floor(Math.random() * enabledLenses.length)];
            const q = fallback.prompts[Math.floor(Math.random() * fallback.prompts.length)] ?? "What matters most right now?";
            result = { lensId: fallback.id, lensName: fallback.name, question: q, palette: fallbackPalette, mood: "open" };
          }
        }

        setPrompt(result);

        if (createReflection && enabledLenses.length > 0) {
          const id = await addReflection({
            lens_id: result.lensId,
            lens_name: result.lensName,
            question: result.question,
            answer: null,
            palette: result.palette,
            mood: result.mood,
          });
          if (id) setReflectionId(id);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, enabledLenses, goals, reflections, addReflection],
  );

  // Auto-load first prompt once data is ready
  useEffect(() => {
    if (initialized.current) return;
    if (lenses.length === 0) return; // wait for lenses
    initialized.current = true;
    requestNew(true);
  }, [lenses, requestNew]);

  const handleSaveAnswer = async () => {
    if (!reflectionId || !answer.trim()) return;
    setSaving(true);
    try {
      await updateAnswer(reflectionId, answer.trim());
      toast.success("Reflection saved");
    } finally {
      setSaving(false);
    }
  };

  const handleShufflePalette = () => {
    if (!prompt) return;
    setPrompt({ ...prompt, palette: randomSeedPalette() });
  };

  const handleSavePalette = async () => {
    if (!prompt) return;
    await savePalette(prompt.palette, prompt.lensName);
    toast.success("Palette saved");
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied ${hex}`);
  };

  const palette = prompt?.palette ?? randomSeedPalette();
  const textColor = readableTextColor(palette);
  const isDark = textColor === "#FAFAFA";

  return (
    <div
      className="relative min-h-screen flex flex-col transition-[background] duration-700"
      style={{ backgroundImage: gradientFromPalette(palette), color: textColor }}
    >
      <TopBar transparent textColor={textColor} />

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl">
          <div
            className="rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-2xl border"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-4 text-xs uppercase tracking-widest opacity-70">
              <span>{prompt?.lensName ?? "…"}</span>
              <span>{prompt?.mood ?? ""}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium leading-snug tracking-tight">
              {loading && !prompt ? (
                <span className="inline-flex items-center gap-2 opacity-70">
                  <Loader2 className="h-5 w-5 animate-spin" /> Choosing a lens…
                </span>
              ) : (
                prompt?.question ?? "What's on your mind?"
              )}
            </h1>

            <div className="mt-6">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Reflect here… or skip."
                rows={4}
                className="bg-transparent border-current/30 placeholder:opacity-50 focus-visible:ring-current/40 resize-none"
                style={{ color: textColor, borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }}
                disabled={!reflectionId || loading}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleSaveAnswer}
                  disabled={!answer.trim() || !reflectionId || saving}
                  size="sm"
                  variant="secondary"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save reflection
                </Button>
                <Button
                  onClick={() => requestNew(true)}
                  disabled={loading}
                  size="sm"
                  className="ml-auto"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.85)",
                    color: isDark ? textColor : "#fff",
                  }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRight className="h-4 w-4 mr-1" />}
                  Next lens
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Palette swatches */}
      <footer className="relative z-10 px-5 pb-6">
        <div className="mx-auto max-w-2xl">
          <div
            className="flex items-center gap-2 rounded-2xl p-2 backdrop-blur-md border"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
          >
            {palette.map((hex, i) => (
              <button
                key={i}
                onClick={() => copyHex(hex)}
                className="group flex-1 h-12 sm:h-14 rounded-xl relative overflow-hidden ring-1 ring-black/10"
                style={{ backgroundColor: hex }}
                title={`Copy ${hex}`}
              >
                <span
                  className="absolute inset-x-0 bottom-1 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: readableTextColor([hex]) }}
                >
                  {hex}
                  <Copy className="inline h-3 w-3 ml-1" />
                </span>
              </button>
            ))}
            <div className="flex flex-col gap-1 ml-1">
              <Button size="icon" variant="ghost" onClick={handleSavePalette} title="Save palette" style={{ color: textColor }}>
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleShufflePalette} title="Shuffle palette" style={{ color: textColor }}>
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-3 text-center text-xs opacity-60">
            Click a swatch to copy · Heart to save · Shuffle for a new palette
          </p>
        </div>
      </footer>
    </div>
  );
}
