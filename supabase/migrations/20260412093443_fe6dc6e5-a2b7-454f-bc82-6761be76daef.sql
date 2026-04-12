
-- Helper function to recalculate position changes for a season
CREATE OR REPLACE FUNCTION public.recalculate_position_changes(p_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  old_positions jsonb := '{}';
  new_pos int := 0;
BEGIN
  -- Capture current positions before the update (based on current ordering)
  FOR rec IN
    SELECT team_id, ROW_NUMBER() OVER (
      ORDER BY competition_points DESC, percentage DESC, points_for DESC
    ) as pos
    FROM public.ladder_entries
    WHERE season_id = p_season_id
  LOOP
    old_positions := old_positions || jsonb_build_object(rec.team_id::text, rec.pos);
  END LOOP;

  -- Now update position_change for each team
  new_pos := 0;
  FOR rec IN
    SELECT id, team_id, ROW_NUMBER() OVER (
      ORDER BY competition_points DESC, percentage DESC, points_for DESC
    ) as pos
    FROM public.ladder_entries
    WHERE season_id = p_season_id
  LOOP
    UPDATE public.ladder_entries
    SET position_change = COALESCE((old_positions->>rec.team_id::text)::int, rec.pos) - rec.pos
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Update AFL ladder function to recalculate positions
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
  v_season_id uuid;
  old_positions jsonb := '{}';
  rec RECORD;
BEGIN
  SELECT * INTO fix FROM public.fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_season_id := fix.season_id;
  home_total := p_home_goals * 6 + p_home_behinds;
  away_total := p_away_goals * 6 + p_away_behinds;

  -- Capture old positions
  FOR rec IN
    SELECT team_id, ROW_NUMBER() OVER (
      ORDER BY competition_points DESC, percentage DESC, points_for DESC
    ) as pos
    FROM public.ladder_entries WHERE season_id = v_season_id
  LOOP
    old_positions := old_positions || jsonb_build_object(rec.team_id::text, rec.pos);
  END LOOP;

  -- Upsert home team
  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    v_season_id, fix.home_team_id, 1,
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

  -- Upsert away team
  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    v_season_id, fix.away_team_id, 1,
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

  -- Recalculate position changes
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

-- Update Cricket ladder function to recalculate positions
CREATE OR REPLACE FUNCTION public.update_ladder_from_cricket_result(p_fixture_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  SELECT COALESCE(SUM(total_runs), 0) INTO home_total
  FROM public.cricket_match_results
  WHERE fixture_id = p_fixture_id AND team_id = fix.home_team_id;

  SELECT COALESCE(SUM(total_runs), 0) INTO away_total
  FROM public.cricket_match_results
  WHERE fixture_id = p_fixture_id AND team_id = fix.away_team_id;

  -- Capture old positions
  FOR rec IN
    SELECT team_id, ROW_NUMBER() OVER (
      ORDER BY competition_points DESC, percentage DESC, points_for DESC
    ) as pos
    FROM public.ladder_entries WHERE season_id = v_season_id
  LOOP
    old_positions := old_positions || jsonb_build_object(rec.team_id::text, rec.pos);
  END LOOP;

  -- Upsert home team
  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    v_season_id, fix.home_team_id, 1,
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

  -- Upsert away team
  INSERT INTO public.ladder_entries (season_id, team_id, played, wins, losses, draws, points_for, points_against, competition_points, percentage)
  VALUES (
    v_season_id, fix.away_team_id, 1,
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

  -- Recalculate position changes
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
