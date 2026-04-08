import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'league_admin' | 'club_admin' | 'coach' | 'public';

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return (data?.role as AppRole) ?? null;
}

export async function getCoachTeams(userId: string) {
  const { data } = await supabase
    .from('coaches_to_teams')
    .select(`
      team_id,
      teams (
        id,
        division,
        clubs (name, short_name),
        seasons (year, name)
      )
    `)
    .eq('user_id', userId);
  return data;
}
