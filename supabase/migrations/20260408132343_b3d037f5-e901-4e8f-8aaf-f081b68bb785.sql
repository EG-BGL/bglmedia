
CREATE OR REPLACE FUNCTION public.update_ladder_from_cricket_result(p_fixture_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fix RECORD;
  home_total int;
  away_total int;
BEGIN
  SELECT * INTO fix FROM public.fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Sum total runs for home team across all innings
  SELECT COALESCE(SUM(total_runs), 0) INTO home_total
  FROM public.cricket_match_results
  WHERE fixture_id = p_fixture_id AND team_id = fix.home_team_id;

  -- Sum total runs for away team across all innings
  SELECT COALESCE(SUM(total_runs), 0) INTO away_total
  FROM public.cricket_match_results
  WHERE fixture_id = p_fixture_id AND team_id = fix.away_team_id;

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
