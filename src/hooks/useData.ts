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

export function useCurrentSeason(sportId?: string) {
  return useQuery({
    queryKey: ['current-season', sportId],
    queryFn: async () => {
      let q = supabase.from('seasons').select('*, competitions(*)').eq('is_current', true);
      if (sportId) q = q.eq('competitions.sport_id', sportId);
      const { data, error } = await q;
      if (error) throw error;
      // Filter out seasons where competitions was filtered to empty
      const filtered = sportId ? data?.filter((s: any) => s.competitions !== null) : data;
      return filtered?.[0] ?? null;
    },
  });
}

export function useAllCurrentSeasons() {
  return useQuery({
    queryKey: ['all-current-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('seasons').select('*, competitions(*, sports(*))').eq('is_current', true);
      if (error) throw error;
      return data?.filter((s: any) => s.competitions !== null) ?? [];
    },
  });
}

export function useAllResults() {
  return useQuery({
    queryKey: ['all-results'],
    queryFn: async () => {
      const { data, error } = await supabase.from('results').select(`
        *,
        fixtures!inner(
          *,
          home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
          away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
          seasons:seasons!fixtures_season_id_fkey(*, competitions:competitions!seasons_competition_id_fkey(*, sports:sports!competitions_sport_id_fkey(*)))
        )
      `).eq('status', 'approved').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useCoachOfTheWeek(seasonId?: string) {
  return useQuery({
    queryKey: ['coach-of-the-week', seasonId],
    queryFn: async () => {
      if (!seasonId) return null;

      // Get the latest completed round for this season
      const { data: results, error: rErr } = await supabase
        .from('results')
        .select(`
          *,
          fixtures:results_fixture_id_fkey!inner(
            *,
            home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
            away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))
          )
        `)
        .eq('status', 'approved')
        .eq('fixtures.season_id', seasonId)
        .order('created_at', { ascending: false });
      if (rErr || !results?.length) return null;

      // Find latest round number
      const latestRound = Math.max(...results.map((r: any) => r.fixtures.round_number));
      const roundResults = results.filter((r: any) => r.fixtures.round_number === latestRound);

      // Find the result with the biggest win margin
      let bestResult: any = null;
      let bestMargin = 0;
      let winningTeamId: string | null = null;

      for (const r of roundResults) {
        const margin = Math.abs((r.home_score ?? 0) - (r.away_score ?? 0));
        if (margin > bestMargin) {
          bestMargin = margin;
          bestResult = r;
          winningTeamId = (r.home_score ?? 0) >= (r.away_score ?? 0)
            ? r.fixtures.home_team_id
            : r.fixtures.away_team_id;
        }
      }

      if (!bestResult || !winningTeamId) return null;

      // Get the coach for the winning team
      const { data: coach } = await supabase
        .from('coaches_to_teams')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('team_id', winningTeamId)
        .eq('season_id', seasonId)
        .eq('is_primary', true)
        .maybeSingle();

      if (!coach) return null;

      const winningClub = winningTeamId === bestResult.fixtures.home_team_id
        ? bestResult.fixtures.home_team?.clubs
        : bestResult.fixtures.away_team?.clubs;

      return {
        coachName: (coach.profiles as any)?.full_name ?? 'Unknown',
        avatarUrl: (coach.profiles as any)?.avatar_url,
        club: winningClub,
        margin: bestMargin,
        roundNumber: latestRound,
        result: bestResult,
      };
    },
    enabled: !!seasonId,
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
      const selectStr = `
        *,
        fixtures!inner(
          *,
          home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
          away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
          seasons:seasons!fixtures_season_id_fkey(*, competitions:competitions!seasons_competition_id_fkey(*, sports:sports!competitions_sport_id_fkey(*)))
        )
      `;
      let q = supabase.from('results').select(selectStr).eq('status', 'approved').order('created_at', { ascending: false });
      if (seasonId) {
        q = q.eq('fixtures.season_id', seasonId);
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

export function usePlayerOfTheRound(seasonId?: string) {
  return useQuery({
    queryKey: ['player-of-round', seasonId],
    queryFn: async () => {
      // Get the latest completed round
      const { data: completedFixtures } = await supabase
        .from('fixtures')
        .select('id, round_number')
        .eq('season_id', seasonId!)
        .eq('status', 'completed')
        .order('round_number', { ascending: false })
        .limit(20);

      if (!completedFixtures?.length) return null;

      const latestRound = completedFixtures[0].round_number;
      const roundFixtureIds = completedFixtures
        .filter(f => f.round_number === latestRound)
        .map(f => f.id);

      // Get top fantasy scorer from that round
      const { data: stats } = await supabase
        .from('match_player_stats')
        .select('*, players(first_name, last_name, jersey_number, team_id, teams(*, clubs(*)))')
        .in('fixture_id', roundFixtureIds)
        .order('afl_fantasy', { ascending: false })
        .limit(1);

      if (!stats?.length) return null;

      return { ...stats[0], round_number: latestRound };
    },
    enabled: !!seasonId,
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

export function useMatchTeamStats(fixtureId: string | undefined) {
  return useQuery({
    queryKey: ['match_team_stats', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_team_stats')
        .select('*')
        .eq('fixture_id', fixtureId!);
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}
