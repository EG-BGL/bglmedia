
-- Enums
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('league_admin', 'club_admin', 'coach', 'public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.result_status AS ENUM ('draft', 'submitted', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fixture_status AS ENUM ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tables
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, short_name TEXT NOT NULL, logo_url TEXT,
  primary_color TEXT DEFAULT '#1a365d', secondary_color TEXT DEFAULT '#d69e2e',
  home_ground TEXT, founded_year INTEGER, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, short_name TEXT, description TEXT, competition_type TEXT DEFAULT 'senior',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  year INTEGER NOT NULL, name TEXT NOT NULL, is_current BOOLEAN DEFAULT false,
  start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  division TEXT DEFAULT 'Senior', age_group TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  jersey_number INTEGER, position TEXT, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  venue TEXT, scheduled_at TIMESTAMPTZ,
  status public.fixture_status DEFAULT 'scheduled', is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  home_score INTEGER DEFAULT 0, away_score INTEGER DEFAULT 0,
  home_goals INTEGER DEFAULT 0, home_behinds INTEGER DEFAULT 0,
  away_goals INTEGER DEFAULT 0, away_behinds INTEGER DEFAULT 0,
  home_q1 TEXT, home_q2 TEXT, home_q3 TEXT, home_q4 TEXT,
  away_q1 TEXT, away_q2 TEXT, away_q3 TEXT, away_q4 TEXT,
  best_players_home TEXT[], best_players_away TEXT[],
  goal_kickers_home TEXT[], goal_kickers_away TEXT[],
  match_notes TEXT, status public.result_status DEFAULT 'draft',
  submitted_by UUID REFERENCES auth.users(id), approved_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ, approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ladder_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  played INTEGER DEFAULT 0, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, draws INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0, points_against INTEGER DEFAULT 0,
  percentage NUMERIC(8,2) DEFAULT 0, competition_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.coaches_to_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id, season_id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL, record_id UUID, action TEXT NOT NULL,
  old_data JSONB, new_data JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Triggers
DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_competitions_updated_at ON public.competitions;
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seasons_updated_at ON public.seasons;
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_players_updated_at ON public.players;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_fixtures_updated_at ON public.fixtures;
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON public.fixtures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_results_updated_at ON public.results;
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_ladder_entries_updated_at ON public.ladder_entries;
CREATE TRIGGER update_ladder_entries_updated_at BEFORE UPDATE ON public.ladder_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ladder_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches_to_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public can view competitions" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Public can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public can view fixtures" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Public can view approved results" ON public.results FOR SELECT USING (status = 'approved');
CREATE POLICY "Public can view ladder" ON public.ladder_entries FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Admins manage clubs" ON public.clubs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage competitions" ON public.competitions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage seasons" ON public.seasons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage players" ON public.players FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage fixtures" ON public.fixtures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage all results" ON public.results FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Admins manage ladder" ON public.ladder_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));

-- Coach policies
CREATE POLICY "Coaches can view own results" ON public.results FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Coaches can submit results" ON public.results FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'coach') AND submitted_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.fixtures f JOIN public.coaches_to_teams ct ON (ct.team_id = f.home_team_id OR ct.team_id = f.away_team_id) WHERE f.id = fixture_id AND ct.user_id = auth.uid() AND f.is_locked = false)
);
CREATE POLICY "Coaches can update own draft results" ON public.results FOR UPDATE TO authenticated USING (
  submitted_by = auth.uid() AND status IN ('draft', 'submitted') AND EXISTS (SELECT 1 FROM public.fixtures f WHERE f.id = fixture_id AND f.is_locked = false)
) WITH CHECK (submitted_by = auth.uid());

-- Role/assignment policies
CREATE POLICY "Admins manage user roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage coach assignments" ON public.coaches_to_teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'league_admin')) WITH CHECK (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Coaches can view own assignments" ON public.coaches_to_teams FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Audit log policies
CREATE POLICY "Admins view all audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'league_admin'));
CREATE POLICY "Users view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (performed_by = auth.uid());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_teams_club ON public.teams(club_id);
CREATE INDEX idx_teams_season ON public.teams(season_id);
CREATE INDEX idx_fixtures_season ON public.fixtures(season_id);
CREATE INDEX idx_fixtures_round ON public.fixtures(round_number);
CREATE INDEX idx_results_fixture ON public.results(fixture_id);
CREATE INDEX idx_results_status ON public.results(status);
CREATE INDEX idx_ladder_season ON public.ladder_entries(season_id);
CREATE INDEX idx_players_team ON public.players(team_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_coaches_to_teams_user ON public.coaches_to_teams(user_id);
