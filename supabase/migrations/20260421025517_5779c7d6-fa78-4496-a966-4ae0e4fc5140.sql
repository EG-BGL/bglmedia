CREATE TABLE public.coach_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES public.sports(id) ON DELETE SET NULL,
  notes TEXT,
  awarded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_achievements_user ON public.coach_achievements(user_id);

ALTER TABLE public.coach_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view coach achievements"
ON public.coach_achievements FOR SELECT
USING (true);

CREATE POLICY "Admins manage coach achievements"
ON public.coach_achievements FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'league_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));

CREATE TRIGGER update_coach_achievements_updated_at
BEFORE UPDATE ON public.coach_achievements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();