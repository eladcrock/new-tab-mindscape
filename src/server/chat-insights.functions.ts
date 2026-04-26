// Insight-extraction server function (non-streaming, called after a chat).
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireUser } from "./_auth";

type ChatMsg = { role: "user" | "assistant"; content: string };
type Input = {
  messages: ChatMsg[];
  existingInsights?: { category: string; content: string }[];
};

export const extractInsights = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("Invalid input");
    return {
      messages: input.messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant"))
        .slice(-40)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
      existingInsights: Array.isArray(input.existingInsights) ? input.existingInsights.slice(0, 50) : [],
    };
  })
  .handler(async ({ data }): Promise<{ insights: { category: string; content: string }[] }> => {
    await requireUser(getRequest());
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const transcript = data.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const existing = data.existingInsights.length
      ? data.existingInsights.map((i) => `- (${i.category}) ${i.content}`).join("\n")
      : "(none yet)";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You read input from a user (chat turns and/or written reflections) and extract DURABLE, PERSONALIZED insights that will make future agent responses more useful and actionable.

Categories:
- working_style — how they work (e.g. "They think best by writing first thing in the morning.")
- interests — recurring topics that energize them
- project — what they're actively building or pursuing
- value — what they care about
- struggle — a friction point or blocker they keep returning to
- preference — how they want to be supported
- identity — how they describe themselves
- goal_signal — a desired outcome or direction
- recurring_theme — pattern across multiple inputs
- next_action — a CONCRETE, personalized suggestion the agent can offer next time, grounded in what the user actually said (e.g. "Suggest a 20-min sketching block before standup since mornings energize them.")

Rules:
- Only extract from what the USER said/wrote, not the agent.
- Skip anything already covered in existing insights — no duplicates, no rephrasings.
- Be specific. "They like creativity" is too vague. "They feel most creative on long walks without their phone" is good.
- Each insight: one sentence, under 30 words, third person ("They...").
- next_action insights must be doable this week and tied to something concrete the user mentioned.
- Return 0–6 new insights. If nothing genuinely new, return [].`,
          },
          { role: "user", content: `# Existing insights\n${existing}\n\n# Conversation\n${transcript}` },
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
      console.error("extractInsights gateway error", res.status);
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
          .slice(0, 6)
          .map((i: any) => ({ category: i.category.slice(0, 40), content: i.content.slice(0, 400) })),
      };
    } catch {
      return { insights: [] };
    }
  });
