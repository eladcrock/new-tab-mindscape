// Profile hook — fetches the current user's display_name from profiles.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export type Profile = { id: string; display_name: string | null };

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile((data as Profile) ?? { id: user.id, display_name: null });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fallback: use user metadata or email prefix when no profile row exists yet
  const displayName =
    profile?.display_name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : null);

  return { profile, displayName, loading };
}
