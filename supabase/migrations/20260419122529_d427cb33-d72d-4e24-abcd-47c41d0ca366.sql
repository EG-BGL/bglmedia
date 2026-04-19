-- Seed Rugby League sport
INSERT INTO public.sports (name, slug, icon)
VALUES ('Rugby League', 'rugby-league', 'rugby')
ON CONFLICT DO NOTHING;

-- =========================================================
-- rugby_match_results: per-team match scores
-- =========================================================
CREATE TABLE public.rugby_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL,
  team_id uuid NOT NULL,
  tries integer DEFAULT 0,
  conversions integer DEFAULT 0,
  penalty_goals integer DEFAULT 0,
  field_goals integer DEFAULT 0,
  total_points integer DEFAULT 0,
  half_time_points integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, team_id)
);

ALTER TABLE public.rugby_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view rugby match results"
ON public.rugby_match_results FOR SELECT USING (true);

CREATE POLICY "Admins manage rugby match results"
ON public.rugby_match_results FOR ALL TO authenticated
USING (has_role(auth.uid(), 'league_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));

CREATE POLICY "Coaches can insert rugby match results"
ON public.rugby_match_results FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = rugby_match_results.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE POLICY "Coaches can update rugby match results"
ON public.rugby_match_results FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = rugby_match_results.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE TRIGGER trg_rugby_match_results_updated_at
BEFORE UPDATE ON public.rugby_match_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- rugby_team_stats: team-level stats per fixture
-- =========================================================
CREATE TABLE public.rugby_team_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL,
  team_id uuid NOT NULL,
  run_metres integer DEFAULT 0,
  line_breaks integer DEFAULT 0,
  tackles integer DEFAULT 0,
  missed_tackles integer DEFAULT 0,
  errors integer DEFAULT 0,
  penalties_conceded integer DEFAULT 0,
  sets_completed integer DEFAULT 0,
  sets_total integer DEFAULT 0,
  possession_pct numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, team_id)
);

ALTER TABLE public.rugby_team_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view rugby team stats"
ON public.rugby_team_stats FOR SELECT USING (true);

CREATE POLICY "Admins manage rugby team stats"
ON public.rugby_team_stats FOR ALL TO authenticated
USING (has_role(auth.uid(), 'league_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));

CREATE POLICY "Coaches can insert rugby team stats"
ON public.rugby_team_stats FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = rugby_team_stats.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE POLICY "Coaches can update rugby team stats"
ON public.rugby_team_stats FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = rugby_team_stats.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE TRIGGER trg_rugby_team_stats_updated_at
BEFORE UPDATE ON public.rugby_team_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- rugby_player_stats: per-player stats per fixture
-- =========================================================
CREATE TABLE public.rugby_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL,
  player_id uuid NOT NULL,
  team_id uuid NOT NULL,
  position text,
  minutes_played integer DEFAULT 0,
  -- Attacking
  tries integer DEFAULT 0,
  try_assists integer DEFAULT 0,
  line_breaks integer DEFAULT 0,
  runs integer DEFAULT 0,
  run_metres integer DEFAULT 0,
  tackle_busts integer DEFAULT 0,
  offloads integer DEFAULT 0,
  -- Defensive
  tackles integer DEFAULT 0,
  missed_tackles integer DEFAULT 0,
  errors integer DEFAULT 0,
  -- Kicking
  conversions integer DEFAULT 0,
  penalty_goals integer DEFAULT 0,
  field_goals integer DEFAULT 0,
  kick_metres integer DEFAULT 0,
  -- Discipline
  penalties_conceded integer DEFAULT 0,
  sin_bins integer DEFAULT 0,
  send_offs integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, player_id)
);

ALTER TABLE public.rugby_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view rugby player stats"
ON public.rugby_player_stats FOR SELECT USING (true);

CREATE POLICY "Admins manage rugby player stats"
ON public.rugby_player_stats FOR ALL TO authenticated
USING (has_role(auth.uid(), 'league_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));

CREATE POLICY "Coaches can insert rugby player stats"
ON public.rugby_player_stats FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = rugby_player_stats.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE POLICY "Coaches can update rugby player stats"
ON public.rugby_player_stats FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role) AND EXISTS (
    SELECT 1 FROM coaches_to_teams ct
    JOIN fixtures f ON f.id = rugby_player_stats.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);

CREATE TRIGGER trg_rugby_player_stats_updated_at
BEFORE UPDATE ON public.rugby_player_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Ladder update function for Rugby League (NRL points: W=2, D=1, L=0)
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_ladder_from_rugby_result(p_fixture_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fix RECORD;
  home_total int;
  away_total int;
  v_season_id uuid;
  old_positions jsonb := '{}';
  rec RECORD;
BEGIN
  SELECT * INTO fix FROM public.fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_season_id := fix.season_id;

  SELECT COALESCE(total_points, 0) INTO home_total
  FROM public.rugby_match_results
  WHERE fixture_id = p_fixture_id AND team_id = fix.home_team_id;

  SELECT COALESCE(total_points, 0) INTO away_total
  FROM public.rugby_match_results
  WHERE fixture_id = p_fixture_id AND team_id = fix.away_team_id;

  home_total := COALESCE(home_total, 0);
  away_total := COALESCE(away_total, 0);

  FOR rec IN
    SELECT team_id, ROW_NUMBER() OVER (
      ORDER BY competition_points DESC, percentage DESC, points_for DESC
    ) as pos
    FROM public.ladder_entries WHERE season_id = v_season_id
  LOOP
    old_positions := old_positions || jsonb_build_object(rec.team_id::text, rec.pos);
  END LOOP;

  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    v_season_id, fix.home_team_id, 1,
    CASE WHEN home_total > away_total THEN 1 ELSE 0 END,
    CASE WHEN home_total < away_total THEN 1 ELSE 0 END,
    CASE WHEN home_total = away_total THEN 1 ELSE 0 END,
    home_total, away_total,
    CASE WHEN home_total > away_total THEN 2 WHEN home_total = away_total THEN 1 ELSE 0 END,
    CASE WHEN away_total = 0 THEN 999.9 ELSE ROUND((home_total::numeric / away_total::numeric) * 100, 1) END
  )
  ON CONFLICT (season_id, team_id) DO UPDATE SET
    played = ladder_entries.played + 1,
    wins = ladder_entries.wins + EXCLUDED.wins,
    losses = ladder_entries.losses + EXCLUDED.losses,
    draws = ladder_entries.draws + EXCLUDED.draws,
    points_for = ladder_entries.points_for + EXCLUDED.points_for,
    points_against = ladder_entries.points_against + EXCLUDED.points_against,
    competition_points = ladder_entries.competition_points + EXCLUDED.competition_points,
    percentage = CASE WHEN (ladder_entries.points_against + EXCLUDED.points_against) = 0 THEN 999.9
      ELSE ROUND(((ladder_entries.points_for + EXCLUDED.points_for)::numeric / (ladder_entries.points_against + EXCLUDED.points_against)::numeric) * 100, 1) END,
    updated_at = now();

  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    v_season_id, fix.away_team_id, 1,
    CASE WHEN away_total > home_total THEN 1 ELSE 0 END,
    CASE WHEN away_total < home_total THEN 1 ELSE 0 END,
    CASE WHEN away_total = home_total THEN 1 ELSE 0 END,
    away_total, home_total,
    CASE WHEN away_total > home_total THEN 2 WHEN away_total = home_total THEN 1 ELSE 0 END,
    CASE WHEN home_total = 0 THEN 999.9 ELSE ROUND((away_total::numeric / home_total::numeric) * 100, 1) END
  )
  ON CONFLICT (season_id, team_id) DO UPDATE SET
    played = ladder_entries.played + 1,
    wins = ladder_entries.wins + EXCLUDED.wins,
    losses = ladder_entries.losses + EXCLUDED.losses,
    draws = ladder_entries.draws + EXCLUDED.draws,
    points_for = ladder_entries.points_for + EXCLUDED.points_for,
    points_against = ladder_entries.points_against + EXCLUDED.points_against,
    competition_points = ladder_entries.competition_points + EXCLUDED.competition_points,
    percentage = CASE WHEN (ladder_entries.points_against + EXCLUDED.points_against) = 0 THEN 999.9
      ELSE ROUND(((ladder_entries.points_for + EXCLUDED.points_for)::numeric / (ladder_entries.points_against + EXCLUDED.points_against)::numeric) * 100, 1) END,
    updated_at = now();

  FOR rec IN
    SELECT id, team_id, ROW_NUMBER() OVER (
      ORDER BY competition_points DESC, percentage DESC, points_for DESC
    ) as new_pos
    FROM public.ladder_entries WHERE season_id = v_season_id
  LOOP
    UPDATE public.ladder_entries
    SET position_change = COALESCE((old_positions->>rec.team_id::text)::int, rec.new_pos) - rec.new_pos
    WHERE id = rec.id;
  END LOOP;
END;
$$;