import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Server, Database, Sparkles, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing breakdown · Focal Lens" },
      {
        name: "description",
        content:
          "What you're paying for in Focal Lens — hosting, database, and AI usage — and the settings that reduce each cost.",
      },
      { property: "og:title", content: "Pricing breakdown · Focal Lens" },
      {
        property: "og:description",
        content: "Hosting vs database vs AI — what each costs and how to reduce it.",
      },
    ],
  }),
  component: PricingPage,
});

type Row = {
  icon: typeof Server;
  title: string;
  what: string;
  charged: string;
  reduce: { label: string; detail: string }[];
  link?: { href: string; label: string };
};

const rows: Row[] = [
  {
    icon: Server,
    title: "Hosting (Lovable)",
    what: "Serves the app, runs SSR, /api/chat streaming, and TanStack Start server functions on Cloudflare Workers via Lovable.",
    charged:
      "Covered by your Lovable subscription plan. Build/edit messages also consume Lovable credits — 1 credit per plan-mode message; build-mode varies with complexity.",
    reduce: [
      {
        label: "Downgrade or right-size your Lovable plan",
        detail: "Settings → Plans & Credits. Free gives 5 daily credits (capped 30/mo); paid plans add monthly credits.",
      },
      {
        label: "Use plan mode and small, focused messages",
        detail: "Plan mode is 1 credit/message. Smaller scoped requests in build mode usually cost less.",
      },
      {
        label: "Set per-member credit caps",
        detail: "Settings → Workspace → Default monthly member credit limit (or per-person in Settings → People).",
      },
    ],
    link: { href: "https://lovable.dev/pricing", label: "Lovable pricing" },
  },
  {
    icon: Database,
    title: "Database & auth (Lovable Cloud)",
    what: "Postgres for goals, lenses, reflections, conversations, messages, profiles. Auth, RLS, and edge secrets all live here.",
    charged:
      "Usage-based, separate from your subscription. Driven by instance size, activity, and bandwidth. You get $25/mo free Cloud balance per workspace.",
    reduce: [
      {
        label: "Stay on the smallest instance that's healthy",
        detail: "Cloud → Overview → Advanced settings. Only upsize if you hit timeouts.",
      },
      {
        label: "Cap Cloud spend",
        detail: "Settings → Cloud & AI balance. Set a hard ceiling so a runaway workload can't surprise you.",
      },
      {
        label: "Trim heavy queries",
        detail: "Default row limit is 1000. Avoid unbounded selects in chat/insights paths and add indexes for hot filters.",
      },
    ],
  },
  {
    icon: Sparkles,
    title: "AI usage (Lovable AI Gateway)",
    what: "Powers chat streaming, conversation summaries, and reflection-insight extraction via google/gemini-3-flash-preview.",
    charged:
      "Usage-based per token, billed against your AI balance ($1/mo free per workspace until early 2026). Each chat turn + every summary + every insight extraction = a gateway call.",
    reduce: [
      {
        label: "Keep using the flash model",
        detail: "google/gemini-3-flash-preview is the cheapest capable tier here. Avoid switching insight/summary jobs to gemini-2.5-pro or gpt-5.",
      },
      {
        label: "Run insight extraction less often",
        detail: "Currently fires after each chat and each saved reflection. Batch (e.g. once per conversation close) to cut calls roughly in half.",
      },
      {
        label: "Shorten context windows",
        detail: "Insight calls already cap at 40 turns / 4000 chars. Trimming further (e.g. last 20 turns) directly reduces input tokens.",
      },
      {
        label: "Cap AI spend",
        detail: "Settings → Cloud & AI balance.",
      },
    ],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing breakdown</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Where Focal Lens spends money, and the exact settings that lower each line.
        </p>

        <div className="mt-8 space-y-5">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <Card key={row.title} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-medium">{row.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{row.what}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">How you're charged: </span>
                      <span className="text-muted-foreground">{row.charged}</span>
                    </p>

                    <div className="mt-4">
                      <p className="text-sm font-medium">Reduce it</p>
                      <ul className="mt-2 space-y-2">
                        {row.reduce.map((r) => (
                          <li key={r.label} className="text-sm">
                            <span className="font-medium">{r.label}.</span>{" "}
                            <span className="text-muted-foreground">{r.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {row.link && (
                      <a
                        href={row.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {row.link.label} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 p-5">
          <h2 className="text-lg font-medium">Quick wins, in order</h2>
          <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Set a Cloud + AI balance cap so spend can't run away.</li>
            <li>Right-size your Lovable plan to match how often you actually build.</li>
            <li>Keep AI on the flash model and batch insight extraction.</li>
            <li>Stay on the smallest healthy Cloud instance.</li>
          </ol>
        </Card>

        <div className="mt-10 flex gap-4 text-sm">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            ← Back to app
          </Link>
          <Link to="/credits" className="text-primary underline-offset-4 hover:underline">
            Credits
          </Link>
        </div>
      </main>
    </div>
  );
}
