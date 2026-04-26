// Generate a one-paragraph summary of a conversation, persisted on conversations.summary.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireUser } from "./_auth";
import { createClient } from "@supabase/supabase-js";

type Input = { conversationId: string };

export const summarizeConversation = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || typeof input.conversationId !== "string" || input.conversationId.length < 8) {
      throw new Error("Invalid conversationId");
    }
    return { conversationId: input.conversationId };
  })
  .handler(async ({ data }): Promise<{ summary: string | null }> => {
    const req = getRequest();
    const { userId } = await requireUser(req);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase server env not configured");
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Verify ownership and fetch messages
    const { data: convo, error: convoErr } = await admin
      .from("conversations")
      .select("id, user_id, title")
      .eq("id", data.conversationId)
      .single();
    if (convoErr || !convo || convo.user_id !== userId) {
      return { summary: null };
    }

    const { data: msgs } = await admin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(80);

    const turns = (msgs ?? []).filter((m) => m.role === "user" || m.role === "assistant");
    if (turns.length < 2) return { summary: null };

    const transcript = turns
      .map((m) => `${m.role.toUpperCase()}: ${String(m.content).slice(0, 1500)}`)
      .join("\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Summarize a chat between a user and their creativity agent into 1–3 sentences (max 60 words).
Write in third person about the user ("They explored…", "They were stuck on…").
Capture: the topic, any decision/realization the USER reached, and any commitment or next step they mentioned.
Skip pleasantries. Skip what the agent said unless it directly led to a user insight.
Plain prose, no markdown.`,
          },
          { role: "user", content: `Conversation title: ${convo.title ?? "(untitled)"}\n\n${transcript}` },
        ],
      }),
    });

    if (!res.ok) {
      console.error("summarizeConversation gateway error", res.status);
      return { summary: null };
    }
    const json = await res.json();
    const summary: string | undefined = json?.choices?.[0]?.message?.content?.trim();
    if (!summary) return { summary: null };

    const trimmed = summary.slice(0, 600);
    await admin
      .from("conversations")
      .update({ summary: trimmed, summary_updated_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    return { summary: trimmed };
  });
