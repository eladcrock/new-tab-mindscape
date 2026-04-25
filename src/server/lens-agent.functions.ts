import { createServerFn } from "@tanstack/react-start";

type LensRef = { id: string; name: string; theme?: string; prompts?: string[] };
type GoalRef = { title: string; description?: string };
type ReflectionRef = { question: string; answer?: string | null; lens_name?: string | null };

type Input = {
  goals: GoalRef[];
  lenses: LensRef[]; // enabled lens pool
  recentReflections: ReflectionRef[]; // up to ~10
  preferredLensId?: string | null; // randomly pre-picked lens to bias toward
};

type Output = {
  lensId: string | null;
  lensName: string;
  question: string;
};

export const generateLensPrompt = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    return {
      goals: Array.isArray(input.goals) ? input.goals.slice(0, 10) : [],
      lenses: Array.isArray(input.lenses) ? input.lenses.slice(0, 60) : [],
      recentReflections: Array.isArray(input.recentReflections) ? input.recentReflections.slice(0, 10) : [],
      preferredLensId: typeof input.preferredLensId === "string" ? input.preferredLensId : null,
    };
  })
  .handler(async ({ data }): Promise<Output> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // Randomize lens order so the model sees a different framing each call.
    const shuffled = [...data.lenses].sort(() => Math.random() - 0.5);
    // If a preferred lens was randomly chosen by the client, bring it to the front.
    if (data.preferredLensId) {
      const idx = shuffled.findIndex((l) => l.id === data.preferredLensId);
      if (idx > 0) {
        const [picked] = shuffled.splice(idx, 1);
        shuffled.unshift(picked);
      }
    }

    const lensSummary = shuffled.map((l) => `- [${l.id}] ${l.name}${l.theme ? ` — ${l.theme}` : ""}`).join("\n");
    const goalSummary = data.goals.length
      ? data.goals.map((g) => `- ${g.title}${g.description ? `: ${g.description}` : ""}`).join("\n")
      : "(no goals set yet)";
    const recentSummary = data.recentReflections.length
      ? data.recentReflections
          .map(
            (r, i) =>
              `${i + 1}. [${r.lens_name ?? "lens"}] Q: ${r.question}\n   A: ${r.answer ? r.answer.slice(0, 240) : "(skipped)"}`,
          )
          .join("\n")
      : "(no past reflections)"
    ;

    const preferred = data.preferredLensId
      ? `Strongly prefer the lens at the top of the list (id: ${data.preferredLensId}) unless it clearly does not fit.`
      : `Pick whichever lens feels freshest given recent reflections.`;

    const systemPrompt = `You are a thoughtful reflective companion built on Jesse Schell's "Deck of Lenses" concept, adapted for any creative work.
When the user opens a new tab, you greet them with ONE meaningful, thought-provoking question drawn from their available lenses.

Rules:
- ${preferred}
- Use the lens id exactly as provided.
- The question must be specific, open-ended, and personal. Tie it to the user's goals or recent reflections when natural — but do NOT repeat any recent question.
- Question: 1 sentence, max 25 words, no preamble, no quotes.`;

    const userPrompt = `# User goals
${goalSummary}

# Available lenses
${lensSummary}

# Recent reflections (most recent first)
${recentSummary}

Now produce one new reflective question.`;

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "deliver_lens_prompt",
            description: "Return one lens-based reflective question",
            parameters: {
              type: "object",
              properties: {
                lensId: { type: "string", description: "id of the chosen lens from the list" },
                lensName: { type: "string" },
                question: { type: "string" },
              },
              required: ["lensId", "lensName", "question"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "deliver_lens_prompt" } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
      const text = await res.text();
      console.error("AI gateway error:", res.status, text);
      throw new Error("AI gateway error");
    }

    const json = await res.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI returned no structured output");

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("AI returned malformed JSON");
    }

    return {
      lensId: typeof parsed.lensId === "string" ? parsed.lensId : null,
      lensName: String(parsed.lensName ?? "Reflection"),
      question: String(parsed.question ?? "What matters most to you right now?"),
    };
  });
