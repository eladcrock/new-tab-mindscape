import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Sparkles, Heart } from "lucide-react";
import { useLensLikes } from "@/lib/lens-likes";
import { toast } from "sonner";
import { useGoals, useLenses, useReflections } from "@/lib/data-hooks";
import { useInsights } from "@/lib/chat-hooks";
import { generateLensPrompt } from "@/server/lens-agent.functions";
import { extractInsightsFromReflection } from "@/server/reflection-insights.functions";
import { callAuthed } from "@/lib/call-authed";
import { randomGradient, type Gradient } from "@/lib/gradients";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focal Lens — your thoughtful new tab" },
      { name: "description", content: "Open a new tab and get a fresh, randomized question through a creative lens." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NewTabHome />
    </RequireAuth>
  ),
});

type LensPrompt = {
  lensId: string | null;
  lensName: string;
  question: string;
};

async function saveCurrentGradient(gradient: Gradient, userId: string | null | undefined) {
  if (!userId) {
    toast.error("Sign in to save");
    return;
  }
  const matches = gradient.css.match(/#[0-9a-fA-F]{6}/g);
  if (!matches || matches.length < 2) {
    toast.error("Could not parse gradient");
    return;
  }
  const colors = matches.slice(0, 2);
  const { error } = await supabase
    .from("saved_palettes")
    .insert({ user_id: userId, name: null, colors });
  if (error) toast.error("Could not save");
  else toast.success("Gradient saved to palettes");
}

function NewTabHome() {
  const { user } = useAuth();
  const { goals } = useGoals();
  const { lenses } = useLenses();
  const { reflections, add: addReflection, updateAnswer } = useReflections();
  const { insights, addMany: addInsights } = useInsights();

  const [prompt, setPrompt] = useState<LensPrompt | null>(null);
  const [reflectionId, setReflectionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gradient, setGradient] = useState<Gradient>(() => randomGradient());
  const initialized = useRef(false);

  const enabledLenses = lenses.filter((l) => l.enabled);

  const requestNew = useCallback(
    async (createReflection = true) => {
      if (loading) return;
      setLoading(true);
      setAnswer("");
      setReflectionId(null);
      setGradient((prev) => randomGradient(prev.id));
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
            const out = await callAuthed(generateLensPrompt, {
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
      // Background: mine the reflection for personalized, actionable insights.
      callAuthed(extractInsightsFromReflection, {
        data: {
          reflection: {
            question: prompt?.question ?? "",
            answer: answer.trim(),
            lens_name: prompt?.lensName ?? null,
          },
          existingInsights: insights.map((i) => ({ category: i.category, content: i.content })),
          goals: goals.filter((g) => g.active).map((g) => ({ title: g.title, description: g.description })),
        },
      })
        .then((r) => {
          if (r.insights.length > 0) {
            addInsights(r.insights);
            const actionable = r.insights.filter((i) => i.category === "next_action").length;
            toast.success(
              actionable > 0
                ? `Agent learned ${r.insights.length} new thing${r.insights.length === 1 ? "" : "s"} (${actionable} actionable)`
                : `Agent learned ${r.insights.length} new thing${r.insights.length === 1 ? "" : "s"} about you`,
            );
          }
        })
        .catch((e) => console.warn("reflection insight extraction failed", e));
    } finally {
      setSaving(false);
    }
  };

  const isLight = gradient.fg === "light";
  const fgClass = isLight ? "text-white" : "text-neutral-900";
  const mutedClass = isLight ? "text-white/70" : "text-neutral-900/60";

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-[background] duration-700 ${fgClass}`}
      style={{ background: gradient.css }}
    >
      <TopBar />

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl">
          <div
            className={`rounded-3xl p-8 sm:p-12 backdrop-blur-md border shadow-xl ${
              isLight ? "bg-white/10 border-white/20" : "bg-white/40 border-white/60"
            }`}
          >
            <div className={`text-xs uppercase tracking-[0.2em] mb-4 ${mutedClass}`}>
              {prompt?.lensName ?? "…"}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium leading-snug tracking-tight">
              {loading && !prompt ? (
                <span className={`inline-flex items-center gap-2 ${mutedClass}`}>
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
                className={`resize-none border-0 ${
                  isLight
                    ? "bg-white/10 text-white placeholder:text-white/50"
                    : "bg-white/60 text-neutral-900 placeholder:text-neutral-900/40"
                }`}
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

          {insights.length > 0 && (
            <div
              className={`mt-6 rounded-2xl p-5 backdrop-blur-md border ${
                isLight ? "bg-white/10 border-white/20" : "bg-white/40 border-white/60"
              }`}
            >
              <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] mb-3 ${mutedClass}`}>
                <Sparkles className="h-3.5 w-3.5" /> What the agent has learned about you
              </div>
              <ul className="space-y-2">
                {insights.slice(0, 5).map((i) => (
                  <li key={i.id} className="text-sm flex gap-2">
                    <span
                      className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                        i.category === "next_action"
                          ? isLight ? "bg-white/25" : "bg-neutral-900/15"
                          : isLight ? "bg-white/10" : "bg-neutral-900/5"
                      }`}
                    >
                      {i.category.replace(/_/g, " ")}
                    </span>
                    <span>{i.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className={`mt-6 text-center text-xs ${mutedClass}`}>
            A new lens, question, and palette every tab.
          </p>
          <div className={`mt-3 flex items-center justify-center gap-4 text-[11px] ${mutedClass}`}>
            <button
              onClick={() => saveCurrentGradient(gradient, user?.id)}
              className="underline-offset-4 hover:underline inline-flex items-center gap-1"
              title="Save this gradient to your palettes"
            >
              <Heart className="h-3 w-3" /> Save gradient
            </button>
            <span aria-hidden>·</span>
            <Link to="/palettes" className="underline-offset-4 hover:underline">Palettes</Link>
            <span aria-hidden>·</span>
            <Link to="/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
            <span aria-hidden>·</span>
            <Link to="/credits" className="underline-offset-4 hover:underline">
              Credits & lens attribution
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
