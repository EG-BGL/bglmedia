
CREATE TABLE public.match_player_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  afl_fantasy INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  behinds INTEGER DEFAULT 0,
  disposals INTEGER DEFAULT 0,
  kicks INTEGER DEFAULT 0,
  handballs INTEGER DEFAULT 0,
  marks INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  hitouts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, player_id)
);

ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view match player stats"
ON public.match_player_stats FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins manage match player stats"
ON public.match_player_stats FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'league_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));

CREATE POLICY "Coaches can insert stats for their fixtures"
ON public.match_player_stats FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = match_player_stats.fixture_id
    WHERE ct.user_id = auth.uid()
    AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE POLICY "Coaches can update stats for their fixtures"
ON public.match_player_stats FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = match_player_stats.fixture_id
    WHERE ct.user_id = auth.uid()
    AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE TRIGGER update_match_player_stats_updated_at
BEFORE UPDATE ON public.match_player_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
