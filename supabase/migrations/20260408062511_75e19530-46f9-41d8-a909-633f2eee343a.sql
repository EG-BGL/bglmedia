
-- Add team_id to results
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);

-- Unique constraint: one submission per team per fixture
ALTER TABLE public.results ADD CONSTRAINT results_fixture_team_unique UNIQUE (fixture_id, team_id);

-- Function: auto-confirm when both teams agree
CREATE OR REPLACE FUNCTION public.auto_confirm_matching_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_result RECORD;
  fix RECORD;
BEGIN
  -- Only process submitted results
  IF NEW.status <> 'submitted' THEN
    RETURN NEW;
  END IF;

  -- Get the fixture to know both teams
  SELECT * INTO fix FROM public.fixtures WHERE id = NEW.fixture_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Find the other team's submission for this fixture
  SELECT * INTO other_result
  FROM public.results
  WHERE fixture_id = NEW.fixture_id
    AND id <> NEW.id
    AND status = 'submitted'
    AND team_id IS NOT NULL
    AND team_id <> NEW.team_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Check if scores match
  IF other_result.home_goals = NEW.home_goals
    AND other_result.home_behinds = NEW.home_behinds
    AND other_result.away_goals = NEW.away_goals
    AND other_result.away_behinds = NEW.away_behinds
  THEN
    -- Auto-approve both submissions
    UPDATE public.results SET status = 'approved', approved_at = now() WHERE id = NEW.id;
    UPDATE public.results SET status = 'approved', approved_at = now() WHERE id = other_result.id;

    -- Update fixture status
    UPDATE public.fixtures SET status = 'completed' WHERE id = NEW.fixture_id;

    -- Update ladder entries
    PERFORM public.update_ladder_from_result(NEW.fixture_id, NEW.home_goals, NEW.home_behinds, NEW.away_goals, NEW.away_behinds);

    -- Set the returned row status too
    NEW.status := 'approved';
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Function: update ladder from confirmed result
CREATE OR REPLACE FUNCTION public.update_ladder_from_result(
  p_fixture_id uuid,
  p_home_goals int,
  p_home_behinds int,
  p_away_goals int,
  p_away_behinds int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fix RECORD;
  home_total int;
  away_total int;
BEGIN
  SELECT * INTO fix FROM public.fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RETURN; END IF;

  home_total := p_home_goals * 6 + p_home_behinds;
  away_total := p_away_goals * 6 + p_away_behinds;

  -- Upsert home team ladder entry
  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    fix.season_id, fix.home_team_id, 1,
    CASE WHEN home_total > away_total THEN 1 ELSE 0 END,
    CASE WHEN home_total < away_total THEN 1 ELSE 0 END,
    CASE WHEN home_total = away_total THEN 1 ELSE 0 END,
    home_total, away_total,
    CASE WHEN home_total > away_total THEN 4 WHEN home_total = away_total THEN 2 ELSE 0 END,
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

  -- Upsert away team ladder entry
  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    fix.season_id, fix.away_team_id, 1,
    CASE WHEN away_total > home_total THEN 1 ELSE 0 END,
    CASE WHEN away_total < home_total THEN 1 ELSE 0 END,
    CASE WHEN away_total = home_total THEN 1 ELSE 0 END,
    away_total, home_total,
    CASE WHEN away_total > home_total THEN 4 WHEN away_total = home_total THEN 2 ELSE 0 END,
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
END;
$$;

-- Add unique constraint for ladder upsert
ALTER TABLE public.ladder_entries ADD CONSTRAINT ladder_entries_season_team_unique UNIQUE (season_id, team_id);

-- Trigger: auto-confirm on insert or update
CREATE TRIGGER trg_auto_confirm_results
BEFORE INSERT OR UPDATE ON public.results
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_matching_results();

-- RLS: coaches can see all submissions for fixtures involving their teams
CREATE POLICY "Coaches can view fixture submissions"
ON public.results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coaches_to_teams ct
    JOIN public.fixtures f ON f.id = results.fixture_id
    WHERE ct.user_id = auth.uid()
      AND (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id)
  )
);
