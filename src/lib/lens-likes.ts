import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export type LensLike = {
  lens_id: string;
  lens_name: string | null;
  count: number;
  last_liked_at: string;
};

export function useLensLikes() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [likes, setLikes] = useState<LensLike[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLikes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("lens_likes")
      .select("lens_id, lens_name, count, last_liked_at")
      .order("count", { ascending: false });
    setLikes((data ?? []) as LensLike[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Toggle: if liked (count > 0) remove it, otherwise increment.
  const like = useCallback(
    async (lensId: string, lensName: string) => {
      if (!userId) return;
      const existing = likes.find((l) => l.lens_id === lensId);
      if (existing) {
        // Unlike
        await supabase.from("lens_likes").delete().eq("lens_id", lensId).eq("user_id", userId);
        setLikes((prev) => prev.filter((l) => l.lens_id !== lensId));
        return false;
      }
      // Insert/upsert with count = (existing+1). Since we deleted on unlike, count starts at 1.
      const { data } = await supabase
        .from("lens_likes")
        .upsert(
          {
            user_id: userId,
            lens_id: lensId,
            lens_name: lensName,
            count: 1,
            last_liked_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lens_id" },
        )
        .select()
        .single();
      if (data) {
        setLikes((prev) => [
          { lens_id: data.lens_id, lens_name: data.lens_name, count: data.count, last_liked_at: data.last_liked_at },
          ...prev.filter((l) => l.lens_id !== data.lens_id),
        ]);
      }
      return true;
    },
    [userId, likes],
  );

  // Bump count when user re-likes the same lens (after seeing again).
  // We expose this for callers that want a "love it more" gesture.
  const bump = useCallback(
    async (lensId: string, lensName: string) => {
      if (!userId) return;
      const existing = likes.find((l) => l.lens_id === lensId);
      const next = (existing?.count ?? 0) + 1;
      const { data } = await supabase
        .from("lens_likes")
        .upsert(
          {
            user_id: userId,
            lens_id: lensId,
            lens_name: lensName,
            count: next,
            last_liked_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lens_id" },
        )
        .select()
        .single();
      if (data) {
        setLikes((prev) => [
          { lens_id: data.lens_id, lens_name: data.lens_name, count: data.count, last_liked_at: data.last_liked_at },
          ...prev.filter((l) => l.lens_id !== data.lens_id),
        ]);
      }
    },
    [userId, likes],
  );

  const isLiked = useCallback((lensId: string) => likes.some((l) => l.lens_id === lensId), [likes]);

  return { likes, loading, like, bump, isLiked, refresh };
}
