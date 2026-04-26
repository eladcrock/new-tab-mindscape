// Helper to call a TanStack `createServerFn` with the current Supabase access
// token forwarded as `Authorization: Bearer <token>` so the server-side
// `requireUser()` check can verify the caller's session.
import { supabase } from "@/integrations/supabase/client";

type ServerFn<TArgs, TResult> = (args: TArgs) => Promise<TResult>;

export async function callAuthed<TArgs extends { data?: unknown; headers?: Record<string, string> }, TResult>(
  fn: ServerFn<TArgs, TResult>,
  args: TArgs,
): Promise<TResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in.");
  const merged = {
    ...args,
    headers: { ...(args.headers ?? {}), Authorization: `Bearer ${token}` },
  } as TArgs;
  return fn(merged);
}
