// Stream from /api/chat (POST, SSE). Token-by-token deltas.
import { supabase } from "@/integrations/supabase/client";

type ChatMsg = { role: "user" | "assistant"; content: string };
type Ctx = {
  displayName?: string | null;
  goals?: { title: string; description?: string }[];
  lenses?: { name: string; theme?: string }[];
  recentReflections?: { question: string; answer?: string | null; lens_name?: string | null }[];
  insights?: { category: string; content: string }[];
  pastConversations?: { title?: string | null; summary?: string | null; updated_at?: string }[];
};

export async function streamChat(
  payload: { messages: ChatMsg[]; context: Ctx },
  opts: { onDelta: (s: string) => void; signal?: AbortSignal },
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to chat.");

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  if (!res.ok) {
    let msg = `Chat failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  if (!res.body) throw new Error("No stream body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { value, done: d } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const payloadStr = line.slice(6).trim();
      if (payloadStr === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(payloadStr);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) opts.onDelta(delta);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }

  // Flush leftover
  if (buf.trim()) {
    for (let raw of buf.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const payloadStr = raw.slice(6).trim();
      if (payloadStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payloadStr);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) opts.onDelta(delta);
      } catch {}
    }
  }
}
