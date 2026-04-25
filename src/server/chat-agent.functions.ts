// Conversational creativity agent.
// - chatStream: streaming reply (SSE) using full context (goals, lenses, recent reflections, insights, conv history)
// - extractInsights: post-hoc agent that reads a conversation and returns durable user insights.

import { createServerFn } from "@tanstack/react-start";

type ChatMsg = { role: "user" | "assistant"; content: string };

type ChatContext = {
  goals?: { title: string; description?: string }[];
  lenses?: { name: string; theme?: string }[];
  recentReflections?: { question: string; answer?: string | null; lens_name?: string | null }[];
  insights?: { category: string; content: string }[];
};

type ChatInput = {
  messages: ChatMsg[]; // full thread; last is latest user message
  context: ChatContext;
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

function buildContextBlock(ctx: ChatContext): string {
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

export const chatStream = createServerFn({ method: "POST" })
  .inputValidator((input: ChatInput) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("Invalid input");
    return {
      messages: input.messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-30)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      context: input.context ?? {},
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const ctxBlock = buildContextBlock(data.context);
    const systemMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "system" as const, content: `Context about this user:\n\n${ctxBlock}` },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [...systemMessages, ...data.messages],
        stream: true,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
      const text = await res.text().catch(() => "");
      console.error("AI gateway error:", res.status, text);
      throw new Error("AI gateway error");
    }
    if (!res.body) throw new Error("AI gateway returned no body");

    return new Response(res.body, {
      headers: { "Content-Type": "text/event-stream" },
    });
  });

// ---- Insight extraction ----

type ExtractInput = {
  messages: ChatMsg[];
  existingInsights?: { category: string; content: string }[];
};

export const extractInsights = createServerFn({ method: "POST" })
  .inputValidator((input: ExtractInput) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("Invalid input");
    return {
      messages: input.messages.slice(-40).map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
      existingInsights: Array.isArray(input.existingInsights) ? input.existingInsights.slice(0, 50) : [],
    };
  })
  .handler(async ({ data }): Promise<{ insights: { category: string; content: string }[] }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const transcript = data.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const existing = data.existingInsights.length
      ? data.existingInsights.map((i) => `- (${i.category}) ${i.content}`).join("\n")
      : "(none yet)";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You read a conversation between a user and their creativity agent and extract DURABLE insights about the user that will help future conversations be more personal.

Categories you may use: working_style, interests, project, value, struggle, preference, identity, goal_signal, recurring_theme.

Rules:
- Only output things stated or strongly implied by the USER, not the agent.
- Skip anything already covered in existing insights.
- Each insight is one sentence, under 25 words, written in third person ("They prefer...", "They are working on...").
- Return 0–6 insights. If nothing new, return an empty array.`,
          },
          {
            role: "user",
            content: `# Existing insights\n${existing}\n\n# Conversation\n${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_insights",
              description: "Save new durable insights about the user.",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["category", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_insights" } },
      }),
    });

    if (!res.ok) {
      console.error("extractInsights gateway error", res.status);
      return { insights: [] };
    }
    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { insights: [] };
    try {
      const parsed = JSON.parse(args);
      const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
      return {
        insights: insights
          .filter((i: any) => i && typeof i.category === "string" && typeof i.content === "string")
          .slice(0, 6)
          .map((i: any) => ({ category: i.category.slice(0, 40), content: i.content.slice(0, 400) })),
      };
    } catch {
      return { insights: [] };
    }
  });
