ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS summary_updated_at timestamp with time zone;