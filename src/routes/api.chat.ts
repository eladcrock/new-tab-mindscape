import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/server/_auth";

type ChatMsg = { role: "user" | "assistant"; content: string };
type Body = {
  messages: ChatMsg[];
  context?: {
    goals?: { title: string; description?: string }[];
    lenses?: { name: string; theme?: string }[];
    recentReflections?: { question: string; answer?: string | null; lens_name?: string | null }[];
    insights?: { category: string; content: string }[];
  };
};

const SYSTEM_PROMPT = `You are the user's personal creativity agent — patient, curious, and a little provocative.
Your job is to help them think more clearly about their creative work by asking sharp, thoughtful questions and reflecting back what you hear.

How you behave:
- The USER is the source of truth. You ask; they answer. Build context turn by turn.
- Ask ONE focused question at a time, then wait. Avoid stacking 3 questions in one message.
- Ground every question in what you already know about them: their goals, recent reflections, prior insights.
- When they share something rich, briefly mirror it back in your own words, then go deeper.
- Pull from the lens framework (Jesse Schell's Deck of Lenses, expanded for any creative work) when relevant — name the lens by name.
- Keep replies short (2–5 sentences). Markdown is fine. No emojis unless they use them first.
- Never invent details about the user. If you don't know, ask.
- If they seem stuck, offer a small, concrete next experiment.`;

function buildContextBlock(ctx: Body["context"]): string {
  if (!ctx) return "(no context yet — get to know them)";
  const parts: string[] = [];
  if (ctx.goals?.length) {
    parts.push(`# Their active goals\n${ctx.goals.map((g) => `- ${g.title}${g.description ? `: ${g.description}` : ""}`).join("\n")}`);
  }
  if (ctx.insights?.length) {
    parts.push(`# What you've learned about them so far\n${ctx.insights.map((i) => `- (${i.category}) ${i.content}`).join("\n")}`);
  }
  if (ctx.recentReflections?.length) {
    parts.push(
      `# Recent solo reflections (most recent first)\n${ctx.recentReflections
        .map((r, i) => `${i + 1}. [${r.lens_name ?? "lens"}] Q: ${r.question}\n   A: ${r.answer ? r.answer.slice(0, 280) : "(no answer)"}`)
        .join("\n")}`,
    );
  }
  if (ctx.lenses?.length) {
    parts.push(`# Lenses they have enabled (you can draw from these)\n${ctx.lenses.slice(0, 30).map((l) => `- ${l.name}${l.theme ? ` (${l.theme})` : ""}`).join("\n")}`);
  }
  return parts.length ? parts.join("\n\n") : "(no context yet — get to know them)";
}

// Same-origin only: no Access-Control-Allow-Origin header. The app calls this
// endpoint from its own origin so CORS is unnecessary, and omitting the wildcard
// prevents arbitrary third-party sites from invoking it to drain AI credits.
const baseHeaders = {
  "Access-Control-Allow-Headers": "content-type, authorization",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: baseHeaders }),
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...baseHeaders, "Content-Type": "application/json" },
          });
        }

        const messages = Array.isArray(body?.messages)
          ? body.messages
              .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
              .slice(-30)
              .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
          : [];

        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "No messages" }), {
            status: 400,
            headers: { ...baseHeaders, "Content-Type": "application/json" },
          });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
            status: 500,
            headers: { ...baseHeaders, "Content-Type": "application/json" },
          });
        }

        const ctxBlock = buildContextBlock(body.context);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "system", content: `Context about this user:\n\n${ctxBlock}` },
              ...messages,
            ],
            stream: true,
          }),
        });

        if (!res.ok) {
          if (res.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
              status: 429,
              headers: { ...baseHeaders, "Content-Type": "application/json" },
            });
          }
          if (res.status === 402) {
            return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
              status: 402,
              headers: { ...baseHeaders, "Content-Type": "application/json" },
            });
          }
          const text = await res.text().catch(() => "");
          console.error("AI gateway error:", res.status, text);
          return new Response(JSON.stringify({ error: "AI gateway error" }), {
            status: 500,
            headers: { ...baseHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(res.body, {
          headers: { ...baseHeaders, "Content-Type": "text/event-stream" },
        });
      },
    },
  },
});
