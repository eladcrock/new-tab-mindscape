// Extract insights from saved reflections (the user's most considered input).
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireUser } from "./_auth";

type ReflectionInput = { question: string; answer: string; lens_name?: string | null };
type Existing = { category: string; content: string };
type Input = { reflection: ReflectionInput; existingInsights?: Existing[]; goals?: { title: string; description?: string | null }[] };

export const extractInsightsFromReflection = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input?.reflection?.answer || !input.reflection.question) throw new Error("Invalid input");
    return {
      reflection: {
        question: String(input.reflection.question).slice(0, 600),
        answer: String(input.reflection.answer).slice(0, 4000),
        lens_name: input.reflection.lens_name ?? null,
      },
      existingInsights: Array.isArray(input.existingInsights) ? input.existingInsights.slice(0, 60) : [],
      goals: Array.isArray(input.goals) ? input.goals.slice(0, 10) : [],
    };
  })
  .handler(async ({ data }): Promise<{ insights: { category: string; content: string }[] }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const existing = data.existingInsights.length
      ? data.existingInsights.map((i) => `- (${i.category}) ${i.content}`).join("\n")
      : "(none yet)";
    const goals = data.goals.length
      ? data.goals.map((g) => `- ${g.title}${g.description ? `: ${g.description}` : ""}`).join("\n")
      : "(no active goals)";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You read ONE reflection a user wrote (a question + their answer) and extract DURABLE, PERSONALIZED insights that will make future agent responses more useful and actionable.

Categories: working_style, interests, project, value, struggle, preference, identity, goal_signal, recurring_theme, next_action.

A "next_action" is a CONCRETE, doable-this-week suggestion grounded in what the user actually wrote, ideally tied to one of their active goals.

Rules:
- Only extract from the USER's answer, not the question.
- Be specific and personal. Avoid generic platitudes.
- Skip anything already in existing insights — no duplicates or rephrasings.
- One sentence each, under 30 words, third person ("They...").
- Return 0–4 insights. If the answer is shallow or nothing genuinely new, return [].`,
          },
          {
            role: "user",
            content: `# Active goals
${goals}

# Existing insights
${existing}

# New reflection
Lens: ${data.reflection.lens_name ?? "—"}
Q: ${data.reflection.question}
A: ${data.reflection.answer}`,
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
                      properties: { category: { type: "string" }, content: { type: "string" } },
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
      console.error("extractInsightsFromReflection error", res.status);
      return { insights: [] };
    }
    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { insights: [] };
    try {
      const parsed = JSON.parse(args);
      const arr = Array.isArray(parsed.insights) ? parsed.insights : [];
      return {
        insights: arr
          .filter((i: any) => i && typeof i.category === "string" && typeof i.content === "string")
          .slice(0, 4)
          .map((i: any) => ({ category: i.category.slice(0, 40), content: i.content.slice(0, 400) })),
      };
    } catch {
      return { insights: [] };
    }
  });
