import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCricketMatchResults(fixtureId?: string) {
  return useQuery({
    queryKey: ['cricket-match-results', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cricket_match_results')
        .select('*')
        .eq('fixture_id', fixtureId!)
        .order('innings_number');
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}

export function useCricketPlayerStats(fixtureId?: string) {
  return useQuery({
    queryKey: ['cricket-player-stats', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cricket_player_stats')
        .select('*, players(first_name, last_name, jersey_number)')
        .eq('fixture_id', fixtureId!)
        .order('innings_number');
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}

export function useCricketTeamStats(fixtureId?: string) {
  return useQuery({
    queryKey: ['cricket-team-stats', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cricket_team_stats')
        .select('*')
        .eq('fixture_id', fixtureId!)
        .order('innings_number');
      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
  });
}
