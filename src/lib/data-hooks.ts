// Unified data layer: routes to Supabase when authed, localStorage when not.
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { ensureLocalSeed, localStore, uid, type LocalGoal, type LocalReflection } from "./local-store";
import { useEffect, useCallback, useState } from "react";
import type { Lens } from "./starter-lenses";

export type Goal = { id: string; title: string; description: string | null; active: boolean; created_at: string };
export type Reflection = {
  id: string;
  lens_id: string | null;
  lens_name: string | null;
  question: string;
  answer: string | null;
  palette: string[];
  mood: string | null;
  created_at: string;
};


export function useDataMode() {
  const { user, loading } = useAuth();
  return { authed: !!user, userId: user?.id ?? null, loading };
}

// ----- Goals -----
export function useGoals() {
  const { authed, userId } = useDataMode();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (authed && userId) {
      const { data } = await supabase.from("goals").select("*").eq("user_id", userId).order("created_at");
      setGoals(
        (data ?? []).map((g) => ({
          id: g.id, title: g.title, description: g.description, active: g.active, created_at: g.created_at,
        })),
      );
    } else {
      ensureLocalSeed();
      setGoals(localStore.getGoals().map((g) => ({ ...g, description: g.description ?? null })));
    }
    setLoading(false);
  }, [authed, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (title: string, description?: string) => {
    if (authed && userId) {
      await supabase.from("goals").insert({ user_id: userId, title, description: description ?? null });
    } else {
      const g: LocalGoal = { id: uid(), title, description, active: true, created_at: new Date().toISOString() };
      localStore.setGoals([...localStore.getGoals(), g]);
    }
    await refresh();
  };

  const toggle = async (id: string, active: boolean) => {
    if (authed && userId) {
      await supabase.from("goals").update({ active }).eq("id", id);
    } else {
      localStore.setGoals(localStore.getGoals().map((g) => (g.id === id ? { ...g, active } : g)));
    }
    await refresh();
  };

  const remove = async (id: string) => {
    if (authed && userId) {
      await supabase.from("goals").delete().eq("id", id);
    } else {
      localStore.setGoals(localStore.getGoals().filter((g) => g.id !== id));
    }
    await refresh();
  };

  return { goals, loading, add, toggle, remove, refresh };
}

// ----- Lenses -----
export function useLenses() {
  const { authed, userId } = useDataMode();
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (authed && userId) {
      const { data } = await supabase.from("lenses").select("*").eq("user_id", userId).order("created_at");
      setLenses(
        (data ?? []).map((l) => ({
          id: l.id, name: l.name, theme: l.theme ?? "", prompts: l.prompts ?? [],
          enabled: l.enabled, is_starter: l.is_starter,
        })),
      );
    } else {
      ensureLocalSeed();
      setLenses(localStore.getLenses());
    }
    setLoading(false);
  }, [authed, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (name: string, theme: string, prompts: string[]) => {
    if (authed && userId) {
      await supabase.from("lenses").insert({ user_id: userId, name, theme, prompts, is_starter: false });
    } else {
      const l: Lens = { id: uid(), name, theme, prompts, enabled: true, is_starter: false };
      localStore.setLenses([...localStore.getLenses(), l]);
    }
    await refresh();
  };

  const toggle = async (id: string, enabled: boolean) => {
    if (authed && userId) {
      await supabase.from("lenses").update({ enabled }).eq("id", id);
    } else {
      localStore.setLenses(localStore.getLenses().map((l) => (l.id === id ? { ...l, enabled } : l)));
    }
    await refresh();
  };

  const update = async (id: string, patch: Partial<Lens>) => {
    if (authed && userId) {
      await supabase.from("lenses").update({
        name: patch.name, theme: patch.theme, prompts: patch.prompts, enabled: patch.enabled,
      }).eq("id", id);
    } else {
      localStore.setLenses(localStore.getLenses().map((l) => (l.id === id ? { ...l, ...patch } : l)));
    }
    await refresh();
  };

  const remove = async (id: string) => {
    if (authed && userId) {
      await supabase.from("lenses").delete().eq("id", id);
    } else {
      localStore.setLenses(localStore.getLenses().filter((l) => l.id !== id));
    }
    await refresh();
  };

  return { lenses, loading, add, toggle, update, remove, refresh };
}

// ----- Reflections -----
export function useReflections() {
  const { authed, userId } = useDataMode();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (authed && userId) {
      const { data } = await supabase.from("reflections").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
      setReflections((data ?? []) as Reflection[]);
    } else {
      ensureLocalSeed();
      setReflections(localStore.getReflections() as unknown as Reflection[]);
    }
    setLoading(false);
  }, [authed, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (r: Omit<Reflection, "id" | "created_at">) => {
    if (authed && userId) {
      const { data } = await supabase
        .from("reflections")
        .insert({ user_id: userId, ...r })
        .select()
        .single();
      await refresh();
      return data?.id as string | undefined;
    } else {
      const local: LocalReflection = { id: uid(), created_at: new Date().toISOString(), ...r };
      localStore.addReflection(local);
      await refresh();
      return local.id;
    }
  };

  const updateAnswer = async (id: string, answer: string) => {
    if (authed && userId) {
      await supabase.from("reflections").update({ answer }).eq("id", id);
    } else {
      localStore.updateReflection(id, { answer });
    }
    await refresh();
  };

  const remove = async (id: string) => {
    if (authed && userId) {
      await supabase.from("reflections").delete().eq("id", id);
    } else {
      const all = localStore.getReflections().filter((r) => r.id !== id);
      if (typeof window !== "undefined") localStorage.setItem("lenstab.reflections", JSON.stringify(all));
    }
    await refresh();
  };

  return { reflections, loading, add, updateAnswer, remove, refresh };
}

