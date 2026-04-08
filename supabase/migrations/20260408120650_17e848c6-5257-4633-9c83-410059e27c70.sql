
-- Create sports table
CREATE TABLE public.sports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Admins manage sports" ON public.sports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'league_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));

-- Seed sports
INSERT INTO public.sports (name, slug, icon) VALUES
  ('Australian Rules Football', 'afl', 'football'),
  ('Cricket', 'cricket', 'circle-dot');

-- Add sport_id to competitions
ALTER TABLE public.competitions ADD COLUMN sport_id UUID REFERENCES public.sports(id);

-- Link existing competitions to AFL
UPDATE public.competitions SET sport_id = (SELECT id FROM public.sports WHERE slug = 'afl');

-- Add match_format to fixtures (for cricket: T20, One-Day, Multi-Day; for AFL: null)
ALTER TABLE public.fixtures ADD COLUMN match_format TEXT;

-- Cricket match results (innings-level scoring)
CREATE TABLE public.cricket_match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id),
  innings_number INTEGER NOT NULL DEFAULT 1,
  total_runs INTEGER DEFAULT 0,
  total_wickets INTEGER DEFAULT 0,
  total_overs NUMERIC(5,1) DEFAULT 0,
  extras INTEGER DEFAULT 0,
  extras_breakdown JSONB,
  run_rate NUMERIC(5,2) DEFAULT 0,
  all_out BOOLEAN DEFAULT false,
  declared BOOLEAN DEFAULT false,
  follow_on BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fixture_id, team_id, innings_number)
);

ALTER TABLE public.cricket_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view cricket match results" ON public.cricket_match_results FOR SELECT USING (true);
CREATE POLICY "Admins manage cricket match results" ON public.cricket_match_results FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'league_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));
CREATE POLICY "Coaches can insert cricket match results" ON public.cricket_match_results FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct JOIN fixtures f ON f.id = cricket_match_results.fixture_id
    WHERE ct.user_id = auth.uid() AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  ));
CREATE POLICY "Coaches can update cricket match results" ON public.cricket_match_results FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct JOIN fixtures f ON f.id = cricket_match_results.fixture_id
    WHERE ct.user_id = auth.uid() AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  ));

-- Cricket player stats
CREATE TABLE public.cricket_player_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id),
  innings_number INTEGER NOT NULL DEFAULT 1,
  -- Batting
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  strike_rate NUMERIC(6,2) DEFAULT 0,
  not_out BOOLEAN DEFAULT false,
  how_out TEXT,
  bowler_name TEXT,
  -- Bowling
  overs_bowled NUMERIC(4,1) DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  economy NUMERIC(5,2) DEFAULT 0,
  wides INTEGER DEFAULT 0,
  no_balls INTEGER DEFAULT 0,
  -- Fielding
  catches INTEGER DEFAULT 0,
  stumpings INTEGER DEFAULT 0,
  run_outs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cricket_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view cricket player stats" ON public.cricket_player_stats FOR SELECT USING (true);
CREATE POLICY "Admins manage cricket player stats" ON public.cricket_player_stats FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'league_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));
CREATE POLICY "Coaches can insert cricket player stats" ON public.cricket_player_stats FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct JOIN fixtures f ON f.id = cricket_player_stats.fixture_id
    WHERE ct.user_id = auth.uid() AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  ));
CREATE POLICY "Coaches can update cricket player stats" ON public.cricket_player_stats FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct JOIN fixtures f ON f.id = cricket_player_stats.fixture_id
    WHERE ct.user_id = auth.uid() AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  ));

-- Cricket team stats
CREATE TABLE public.cricket_team_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id),
  innings_number INTEGER NOT NULL DEFAULT 1,
  total_runs INTEGER DEFAULT 0,
  total_wickets INTEGER DEFAULT 0,
  total_overs NUMERIC(5,1) DEFAULT 0,
  extras INTEGER DEFAULT 0,
  run_rate NUMERIC(5,2) DEFAULT 0,
  partnership_highest INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fixture_id, team_id, innings_number)
);

ALTER TABLE public.cricket_team_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view cricket team stats" ON public.cricket_team_stats FOR SELECT USING (true);
CREATE POLICY "Admins manage cricket team stats" ON public.cricket_team_stats FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'league_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));
CREATE POLICY "Coaches can insert cricket team stats" ON public.cricket_team_stats FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct JOIN fixtures f ON f.id = cricket_team_stats.fixture_id
    WHERE ct.user_id = auth.uid() AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  ));
CREATE POLICY "Coaches can update cricket team stats" ON public.cricket_team_stats FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct JOIN fixtures f ON f.id = cricket_team_stats.fixture_id
    WHERE ct.user_id = auth.uid() AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  ));

-- Add update triggers
CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON public.sports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cricket_match_results_updated_at BEFORE UPDATE ON public.cricket_match_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cricket_player_stats_updated_at BEFORE UPDATE ON public.cricket_player_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cricket_team_stats_updated_at BEFORE UPDATE ON public.cricket_team_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
