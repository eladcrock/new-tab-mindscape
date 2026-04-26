import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Credits & Attribution · Focal Lens" },
      { name: "description", content: "Credits, sources, and attribution for Focal Lens." },
      { property: "og:title", content: "Credits & Attribution · Focal Lens" },
      { property: "og:description", content: "Sources and attribution for the lenses, frameworks, and tools that inspired Focal Lens." },
    ],
  }),
  component: CreditsPage,
});

function CreditsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Credits & Attribution</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Focal Lens stands on the shoulders of work by others. Here's who and what.
        </p>

        <section className="mt-8 space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-medium">A Deck of Lenses · Jesse Schell</h2>
            <p className="mt-2 text-muted-foreground">
              Several of the starter lenses bundled with Focal Lens — including the Lens of
              Surprise, Lens of Fun, Lens of Curiosity, Lens of the Essential Experience,
              Lens of the Problem Statement, Lens of Endogenous Value, and others — are
              inspired by and adapted from <em>A Deck of Lenses</em> (also published as part
              of <em>The Art of Game Design: A Book of Lenses</em>) by Jesse Schell.
            </p>
            <p className="mt-2 text-muted-foreground">
              The lens names and underlying concepts are © Jesse Schell and Schell Games. We
              use them here in an educational, transformative context — adapted as
              open-ended reflective prompts for any creative work, not just game design —
              with full credit to the original author. If you find these useful, please
              support the source:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <a
                  href="https://www.schellgames.com/art-of-game-design"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  The Art of Game Design — Schell Games
                </a>
              </li>
              <li>
                <a
                  href="https://deck.artofgamedesign.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  A Deck of Lenses (official deck)
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              If you are the rights holder and would like any specific lens removed or
              relabeled, please contact us and we will do so promptly.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium">Color Hunt · palette inspiration</h2>
            <p className="mt-2 text-muted-foreground">
              The "fresh palette every tab" idea is inspired by{" "}
              <a
                href="https://colorhunt.co/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Color Hunt
              </a>
              . The gradients shown in Focal Lens are independently generated.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium">Open-source software</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>React, TanStack Router & Start, Vite, Tailwind CSS</li>
              <li>shadcn/ui component primitives (MIT)</li>
              <li>lucide-react icons</li>
              <li>Supabase (auth + Postgres) via Lovable Cloud</li>
              <li>Google Gemini, accessed through the Lovable AI Gateway</li>
            </ul>
          </div>
        </section>

        <div className="mt-10 flex gap-4 text-sm">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">← Back to app</Link>
          <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">Privacy policy</Link>
        </div>
      </main>
    </div>
  );
}
