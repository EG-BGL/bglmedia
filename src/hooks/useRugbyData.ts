import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRugbyMatchResults(fixtureId?: string) {
  return useQuery({
    queryKey: ['rugby-match-results', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rugby_match_results')
        .select('*')
        .eq('fixture_id', fixtureId!);
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}

export function useRugbyPlayerStats(fixtureId?: string) {
  return useQuery({
    queryKey: ['rugby-player-stats', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rugby_player_stats')
        .select('*, players(first_name, last_name, jersey_number, photo_url)')
        .eq('fixture_id', fixtureId!);
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}

export function useRugbyTeamStats(fixtureId?: string) {
  return useQuery({
    queryKey: ['rugby-team-stats', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rugby_team_stats')
        .select('*')
        .eq('fixture_id', fixtureId!);
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}
