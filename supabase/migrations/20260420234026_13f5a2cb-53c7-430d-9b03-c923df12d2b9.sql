-- live_match_state
CREATE TABLE IF NOT EXISTS public.live_match_state (
  fixture_id uuid PRIMARY KEY REFERENCES public.fixtures(id) ON DELETE CASCADE,
  home_goals int NOT NULL DEFAULT 0,
  home_behinds int NOT NULL DEFAULT 0,
  away_goals int NOT NULL DEFAULT 0,
  away_behinds int NOT NULL DEFAULT 0,
  home_q1 text, home_q2 text, home_q3 text, home_q4 text,
  away_q1 text, away_q2 text, away_q3 text, away_q4 text,
  current_quarter int NOT NULL DEFAULT 1,
  quarter_status text NOT NULL DEFAULT 'not_started',
  quarter_started_at timestamptz,
  match_status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.live_match_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_match_state REPLICA IDENTITY FULL;

-- live_goal_events
CREATE TABLE IF NOT EXISTS public.live_goal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id),
  player_id uuid REFERENCES public.players(id),
  quarter int NOT NULL DEFAULT 1,
  is_goal boolean NOT NULL DEFAULT true,
  scored_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS idx_live_goal_events_fixture ON public.live_goal_events(fixture_id, scored_at);
ALTER TABLE public.live_goal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_goal_events REPLICA IDENTITY FULL;

-- fixture_scorers
CREATE TABLE IF NOT EXISTS public.fixture_scorers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, user_id)
);
ALTER TABLE public.fixture_scorers ENABLE ROW LEVEL SECURITY;

-- Helper: can_score_fixture
CREATE OR REPLACE FUNCTION public.can_score_fixture(_user_id uuid, _fixture_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'league_admin'::app_role)
    OR public.has_role(_user_id, 'scorer'::app_role)
    OR EXISTS (SELECT 1 FROM public.fixture_scorers WHERE fixture_id = _fixture_id AND user_id = _user_id);
$$;

-- RLS policies: live_match_state
CREATE POLICY "Public can view live match state" ON public.live_match_state FOR SELECT USING (true);
CREATE POLICY "Scorers can insert live match state" ON public.live_match_state
  FOR INSERT WITH CHECK (public.can_score_fixture(auth.uid(), fixture_id));
CREATE POLICY "Scorers can update live match state" ON public.live_match_state
  FOR UPDATE USING (public.can_score_fixture(auth.uid(), fixture_id));
CREATE POLICY "Admins delete live match state" ON public.live_match_state
  FOR DELETE USING (public.has_role(auth.uid(), 'league_admin'::app_role));

-- RLS: live_goal_events
CREATE POLICY "Public can view live goal events" ON public.live_goal_events FOR SELECT USING (true);
CREATE POLICY "Scorers can insert live goal events" ON public.live_goal_events
  FOR INSERT WITH CHECK (public.can_score_fixture(auth.uid(), fixture_id));
CREATE POLICY "Scorers can delete live goal events" ON public.live_goal_events
  FOR DELETE USING (public.can_score_fixture(auth.uid(), fixture_id));

-- RLS: fixture_scorers
CREATE POLICY "Public can view fixture scorers" ON public.fixture_scorers FOR SELECT USING (true);
CREATE POLICY "Admins manage fixture scorers" ON public.fixture_scorers
  FOR ALL USING (public.has_role(auth.uid(), 'league_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'league_admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_live_match_state_updated_at ON public.live_match_state;
CREATE TRIGGER trg_live_match_state_updated_at
  BEFORE UPDATE ON public.live_match_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_goal_events;

-- Unique constraint on results.fixture_id (needed for upsert in finalise)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_fixture_id_unique') THEN
    IF NOT EXISTS (SELECT fixture_id FROM public.results GROUP BY fixture_id HAVING COUNT(*) > 1) THEN
      ALTER TABLE public.results ADD CONSTRAINT results_fixture_id_unique UNIQUE (fixture_id);
    END IF;
  END IF;
END $$;

-- finalise_live_match
CREATE OR REPLACE FUNCTION public.finalise_live_match(p_fixture_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  st RECORD;
  fix RECORD;
  home_kickers text[];
  away_kickers text[];
BEGIN
  SELECT * INTO st FROM public.live_match_state WHERE fixture_id = p_fixture_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO fix FROM public.fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(array_agg(label ORDER BY goals DESC), '{}') INTO home_kickers FROM (
    SELECT (p.first_name || ' ' || p.last_name || ' (' || COUNT(*) || ')') AS label, COUNT(*) AS goals
    FROM public.live_goal_events e
    JOIN public.players p ON p.id = e.player_id
    WHERE e.fixture_id = p_fixture_id AND e.team_id = fix.home_team_id AND e.is_goal AND e.player_id IS NOT NULL
    GROUP BY p.first_name, p.last_name
  ) sub;

  SELECT COALESCE(array_agg(label ORDER BY goals DESC), '{}') INTO away_kickers FROM (
    SELECT (p.first_name || ' ' || p.last_name || ' (' || COUNT(*) || ')') AS label, COUNT(*) AS goals
    FROM public.live_goal_events e
    JOIN public.players p ON p.id = e.player_id
    WHERE e.fixture_id = p_fixture_id AND e.team_id = fix.away_team_id AND e.is_goal AND e.player_id IS NOT NULL
    GROUP BY p.first_name, p.last_name
  ) sub;

  INSERT INTO public.results (
    fixture_id, home_goals, home_behinds, away_goals, away_behinds,
    home_score, away_score,
    home_q1, home_q2, home_q3, home_q4, away_q1, away_q2, away_q3, away_q4,
    goal_kickers_home, goal_kickers_away,
    status, submitted_at, approved_at
  ) VALUES (
    p_fixture_id, st.home_goals, st.home_behinds, st.away_goals, st.away_behinds,
    st.home_goals * 6 + st.home_behinds, st.away_goals * 6 + st.away_behinds,
    st.home_q1, st.home_q2, st.home_q3, st.home_q4, st.away_q1, st.away_q2, st.away_q3, st.away_q4,
    home_kickers, away_kickers,
    'approved', now(), now()
  )
  ON CONFLICT (fixture_id) DO UPDATE SET
    home_goals = EXCLUDED.home_goals, home_behinds = EXCLUDED.home_behinds,
    away_goals = EXCLUDED.away_goals, away_behinds = EXCLUDED.away_behinds,
    home_score = EXCLUDED.home_score, away_score = EXCLUDED.away_score,
    home_q1 = EXCLUDED.home_q1, home_q2 = EXCLUDED.home_q2, home_q3 = EXCLUDED.home_q3, home_q4 = EXCLUDED.home_q4,
    away_q1 = EXCLUDED.away_q1, away_q2 = EXCLUDED.away_q2, away_q3 = EXCLUDED.away_q3, away_q4 = EXCLUDED.away_q4,
    goal_kickers_home = EXCLUDED.goal_kickers_home,
    goal_kickers_away = EXCLUDED.goal_kickers_away,
    status = 'approved', approved_at = now(), updated_at = now();

  UPDATE public.fixtures SET status = 'completed' WHERE id = p_fixture_id;

  PERFORM public.update_ladder_from_result(
    p_fixture_id, st.home_goals, st.home_behinds, st.away_goals, st.away_behinds
  );
END;
$$;