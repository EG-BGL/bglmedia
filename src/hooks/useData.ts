import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClubs() {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clubs').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: ['clubs', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clubs').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('seasons').select('*, competitions(*)').order('year', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['current-season'],
    queryFn: async () => {
      const { data, error } = await supabase.from('seasons').select('*, competitions(*)').eq('is_current', true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTeams(seasonId?: string) {
  return useQuery({
    queryKey: ['teams', seasonId],
    queryFn: async () => {
      let q = supabase.from('teams').select('*, clubs(*), seasons(*), competitions(*)');
      if (seasonId) q = q.eq('season_id', seasonId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !seasonId || !!seasonId,
  });
}

export function useFixtures(seasonId?: string, round?: number) {
  return useQuery({
    queryKey: ['fixtures', seasonId, round],
    queryFn: async () => {
      let q = supabase.from('fixtures').select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))
      `).order('scheduled_at', { ascending: true });
      if (seasonId) q = q.eq('season_id', seasonId);
      if (round) q = q.eq('round_number', round);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useResults(seasonId?: string) {
  return useQuery({
    queryKey: ['results', seasonId],
    queryFn: async () => {
      let q = supabase.from('results').select(`
        *,
        fixtures(
          *,
          home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
          away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))
        )
      `).eq('status', 'approved').order('created_at', { ascending: false });
      if (seasonId) {
        q = supabase.from('results').select(`
          *,
          fixtures!inner(
            *,
            home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
            away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))
          )
        `).eq('status', 'approved').eq('fixtures.season_id', seasonId).order('created_at', { ascending: false });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useLadder(seasonId?: string) {
  return useQuery({
    queryKey: ['ladder', seasonId],
    queryFn: async () => {
      let q = supabase.from('ladder_entries').select('*, teams(*, clubs(*))').order('competition_points', { ascending: false }).order('percentage', { ascending: false });
      if (seasonId) q = q.eq('season_id', seasonId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function usePlayers(teamId?: string) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      let q = supabase.from('players').select('*, teams(*, clubs(*))').order('jersey_number');
      if (teamId) q = q.eq('team_id', teamId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !teamId || !!teamId,
  });
}

export function useMatchPlayerStats(fixtureId?: string) {
  return useQuery({
    queryKey: ['match-player-stats', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_player_stats')
        .select('*, players(first_name, last_name, jersey_number)')
        .eq('fixture_id', fixtureId!)
        .order('afl_fantasy', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}

export function useNews(limit?: number) {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      let q = supabase.from('news').select('*').eq('is_published', true).order('published_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useFixture(id: string) {
  return useQuery({
    queryKey: ['fixture', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('fixtures').select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
        results(*)
      `).eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
