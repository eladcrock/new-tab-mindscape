CREATE TABLE public.lens_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lens_id UUID NOT NULL,
  lens_name TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  last_liked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, lens_id)
);

ALTER TABLE public.lens_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own likes select" ON public.lens_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own likes insert" ON public.lens_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own likes update" ON public.lens_likes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own likes delete" ON public.lens_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER lens_likes_touch_updated_at
BEFORE UPDATE ON public.lens_likes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_lens_likes_user ON public.lens_likes(user_id);