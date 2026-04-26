// Helper to call a TanStack `createServerFn` with the current Supabase access
// token forwarded as `Authorization: Bearer <token>` so the server-side
// `requireUser()` check can verify the caller's session.
import { supabase } from "@/integrations/supabase/client";

export async function callAuthed<TFn extends (args: any) => Promise<any>>(
  fn: TFn,
  args: Parameters<TFn>[0],
): Promise<Awaited<ReturnType<TFn>>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in.");
  const merged: any = {
    ...(args as object),
    headers: { ...((args as any)?.headers ?? {}), Authorization: `Bearer ${token}` },
  };
  return fn(merged);
}
