import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGoals, useLenses, useReflections } from "@/lib/data-hooks";
import { generateLensPrompt } from "@/server/lens-agent.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lens Tab — your thoughtful new tab" },
      { name: "description", content: "Open a new tab and get a fresh, randomized question through a creative lens." },
    ],
  }),
  component: NewTabHome,
});

type LensPrompt = {
  lensId: string | null;
  lensName: string;
  question: string;
};

function NewTabHome() {
  const { goals } = useGoals();
  const { lenses } = useLenses();
  const { reflections, add: addReflection, updateAnswer } = useReflections();

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
        let result: LensPrompt;

        if (enabledLenses.length === 0) {
          result = {
            lensId: null,
            lensName: "Welcome",
            question: "Add a lens or set a goal to begin reflecting.",
          };
        } else {
          // ColorHunt-style randomness: pre-pick a random lens client-side
          const picked = enabledLenses[Math.floor(Math.random() * enabledLenses.length)];
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
                preferredLensId: picked.id,
              },
            });
            result = { lensId: out.lensId, lensName: out.lensName, question: out.question };
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't generate a question. Using a starter prompt.");
            const q = picked.prompts[Math.floor(Math.random() * picked.prompts.length)] ?? "What matters most right now?";
            result = { lensId: picked.id, lensName: picked.name, question: q };
          }
        }

        setPrompt(result);

        if (createReflection && enabledLenses.length > 0) {
          const id = await addReflection({
            lens_id: result.lensId,
            lens_name: result.lensName,
            question: result.question,
            answer: null,
            palette: [],
            mood: null,
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
    if (lenses.length === 0) return;
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

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      <TopBar />

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl">
          <div className="rounded-3xl p-8 sm:p-12 border border-border bg-card shadow-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {prompt?.lensName ?? "…"}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium leading-snug tracking-tight">
              {loading && !prompt ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Drawing a lens…
                </span>
              ) : (
                prompt?.question ?? "What's on your mind?"
              )}
            </h1>

            <div className="mt-8">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Reflect here… or skip."
                rows={4}
                className="resize-none"
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
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRight className="h-4 w-4 mr-1" />}
                  Next lens
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            A new lens and question every time you open a tab — Color Hunt for ideas.
          </p>
        </div>
      </main>
    </div>
  );
}
