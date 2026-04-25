
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals select" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own goals insert" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own goals update" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own goals delete" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX goals_user_idx ON public.goals(user_id);

-- Lenses
CREATE TABLE public.lenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  prompts TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_starter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lenses select" ON public.lenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own lenses insert" ON public.lenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own lenses update" ON public.lenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own lenses delete" ON public.lenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX lenses_user_idx ON public.lenses(user_id);

-- Reflections
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lens_id UUID REFERENCES public.lenses(id) ON DELETE SET NULL,
  lens_name TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  palette TEXT[] NOT NULL DEFAULT '{}',
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reflections select" ON public.reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reflections insert" ON public.reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reflections update" ON public.reflections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reflections delete" ON public.reflections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX reflections_user_created_idx ON public.reflections(user_id, created_at DESC);

-- Saved palettes
CREATE TABLE public.saved_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colors TEXT[] NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_palettes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own palettes select" ON public.saved_palettes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own palettes insert" ON public.saved_palettes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own palettes update" ON public.saved_palettes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own palettes delete" ON public.saved_palettes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX saved_palettes_user_idx ON public.saved_palettes(user_id);

-- Trigger: auto-create profile + seed starter lenses on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.lenses (user_id, name, theme, prompts, is_starter) VALUES
    (NEW.id, 'Lens of Surprise', 'novelty', ARRAY['What in your work could surprise someone today?','When was the last time something surprised YOU about your project?'], true),
    (NEW.id, 'Lens of Fun', 'joy', ARRAY['What about this is genuinely fun for you?','If this stopped being fun, what would you change first?'], true),
    (NEW.id, 'Lens of Curiosity', 'inquiry', ARRAY['What question are you most curious about right now?','What would you explore if no one was watching?'], true),
    (NEW.id, 'Lens of the Essential Experience', 'core', ARRAY['What is the one feeling you want someone to walk away with?','Strip everything away — what remains?'], true),
    (NEW.id, 'Lens of the Problem Statement', 'clarity', ARRAY['What problem are you really solving?','Could you say it in one sentence?'], true),
    (NEW.id, 'Lens of Endogenous Value', 'meaning', ARRAY['What inside this work matters to you, regardless of outcome?','Which part would you do even unpaid?'], true),
    (NEW.id, 'Lens of the Beginner''s Mind', 'fresh-eyes', ARRAY['How would someone seeing this for the first time react?','What assumption are you carrying that you should drop?'], true),
    (NEW.id, 'Lens of Constraint', 'limits', ARRAY['What constraint, if added, would force a more interesting choice?','What are you avoiding because it feels limiting?'], true),
    (NEW.id, 'Lens of Resonance', 'connection', ARRAY['What part of this resonates most deeply with you, and why?','Who else needs to hear this?'], true),
    (NEW.id, 'Lens of Pacing', 'rhythm', ARRAY['Are you moving too fast, too slow, or just right?','Where in your week do you feel most alive?'], true),
    (NEW.id, 'Lens of Risk', 'courage', ARRAY['What is the smallest risk you could take today?','What are you not doing because of fear?'], true),
    (NEW.id, 'Lens of Reflection', 'meta', ARRAY['What did past-you not know that present-you knows now?','What would future-you thank you for doing today?'], true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER lenses_updated BEFORE UPDATE ON public.lenses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
