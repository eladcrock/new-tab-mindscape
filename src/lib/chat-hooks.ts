// Chat persistence + insights, mirroring the local/cloud split used elsewhere.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "./data-hooks";
import { uid } from "./local-store";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};
export type Conversation = { id: string; title: string | null; created_at: string; updated_at: string };
export type Insight = { id: string; category: string; content: string; created_at: string };

const K = {
  conversations: "lenstab.chat.conversations",
  msgs: (id: string) => `lenstab.chat.msgs.${id}`,
  insights: "lenstab.chat.insights",
};

function lsGet<T>(key: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fb; } catch { return fb; }
}
function lsSet<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(v));
}

// ---- Conversations ----
export function useConversations() {
  const { authed, userId } = useDataMode();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (authed && userId) {
      const { data } = await supabase.from("conversations").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
      setItems((data ?? []) as Conversation[]);
    } else {
      setItems(lsGet<Conversation[]>(K.conversations, []));
    }
    setLoading(false);
  }, [authed, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (title?: string): Promise<string> => {
    if (authed && userId) {
      const { data } = await supabase.from("conversations").insert({ user_id: userId, title: title ?? null }).select().single();
      await refresh();
      return data!.id as string;
    }
    const c: Conversation = { id: uid(), title: title ?? null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    lsSet(K.conversations, [c, ...lsGet<Conversation[]>(K.conversations, [])]);
    await refresh();
    return c.id;
  };

  const remove = async (id: string) => {
    if (authed && userId) {
      await supabase.from("conversations").delete().eq("id", id);
    } else {
      lsSet(K.conversations, lsGet<Conversation[]>(K.conversations, []).filter((c) => c.id !== id));
      if (typeof window !== "undefined") localStorage.removeItem(K.msgs(id));
    }
    await refresh();
  };

  const setTitle = async (id: string, title: string) => {
    if (authed && userId) {
      await supabase.from("conversations").update({ title }).eq("id", id);
    } else {
      lsSet(K.conversations, lsGet<Conversation[]>(K.conversations, []).map((c) => c.id === id ? { ...c, title } : c));
    }
    await refresh();
  };

  return { conversations: items, loading, create, remove, setTitle, refresh };
}

// ---- Messages for a conversation ----
export function useMessages(conversationId: string | null) {
  const { authed, userId } = useDataMode();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);
    if (authed && userId) {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at");
      setMessages(((data ?? []) as ChatMessage[]));
    } else {
      setMessages(lsGet<ChatMessage[]>(K.msgs(conversationId), []));
    }
    setLoading(false);
  }, [conversationId, authed, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const append = async (m: Omit<ChatMessage, "id" | "created_at">) => {
    if (!conversationId) return null;
    if (authed && userId) {
      const { data } = await supabase
        .from("messages")
        .insert({ user_id: userId, conversation_id: conversationId, role: m.role, content: m.content })
        .select()
        .single();
      // bump conv updated_at
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      await refresh();
      return data as ChatMessage;
    }
    const msg: ChatMessage = { id: uid(), created_at: new Date().toISOString(), ...m };
    lsSet(K.msgs(conversationId), [...lsGet<ChatMessage[]>(K.msgs(conversationId), []), msg]);
    // bump conv
    lsSet(
      K.conversations,
      lsGet<Conversation[]>(K.conversations, []).map((c) => c.id === conversationId ? { ...c, updated_at: new Date().toISOString() } : c),
    );
    await refresh();
    return msg;
  };

  // Optimistic: directly set messages (e.g. while streaming)
  const setLocal = (next: ChatMessage[]) => setMessages(next);

  return { messages, loading, append, setLocal, refresh };
}

// ---- Insights ----
export function useInsights() {
  const { authed, userId } = useDataMode();
  const [items, setItems] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (authed && userId) {
      const { data } = await supabase.from("agent_insights").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(80);
      setItems((data ?? []) as Insight[]);
    } else {
      setItems(lsGet<Insight[]>(K.insights, []));
    }
    setLoading(false);
  }, [authed, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addMany = async (rows: { category: string; content: string }[], conversationId?: string) => {
    if (rows.length === 0) return;
    if (authed && userId) {
      await supabase.from("agent_insights").insert(rows.map((r) => ({
        user_id: userId, category: r.category, content: r.content, source_conversation_id: conversationId ?? null,
      })));
    } else {
      const now = new Date().toISOString();
      const next = [
        ...rows.map((r) => ({ id: uid(), category: r.category, content: r.content, created_at: now })),
        ...lsGet<Insight[]>(K.insights, []),
      ];
      lsSet(K.insights, next);
    }
    await refresh();
  };

  const remove = async (id: string) => {
    if (authed && userId) {
      await supabase.from("agent_insights").delete().eq("id", id);
    } else {
      lsSet(K.insights, lsGet<Insight[]>(K.insights, []).filter((i) => i.id !== id));
    }
    await refresh();
  };

  return { insights: items, loading, addMany, remove, refresh };
}
