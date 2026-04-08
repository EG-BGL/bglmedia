import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trophy, BarChart3, Users, ClipboardList, CircleDot, ChevronRight } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

export default function CoachHub() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalMatches: 0, wins: 0, losses: 0, draws: 0 });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch coach assignments with competition and sport info
    supabase.from('coaches_to_teams').select('*, teams(*, clubs(*), seasons(*, competitions(*, sports(*))))')
      .eq('user_id', user.id)
      .then(({ data }) => setAssignments(data ?? []));

    // Fetch recent results submitted by this coach
    supabase.from('results').select(`
      *,
      fixtures(
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
        seasons:seasons!fixtures_season_id_fkey(*, competitions:competitions!seasons_competition_id_fkey(*, sports:sports!competitions_sport_id_fkey(*)))
      )
    `).eq('submitted_by', user.id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        const results = data ?? [];
        setRecentResults(results);

        // Calculate W/L/D for matches involving coach's teams
        let w = 0, l = 0, d = 0;
        results.forEach((r: any) => {
          if (r.home_score === r.away_score) d++;
          else if (r.home_score > r.away_score) w++;
          else l++;
        });
        setStats({ totalMatches: results.length, wins: w, losses: l, draws: d });
      });
  }, [user]);

  if (loading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  // Group assignments by competition
  const competitionGroups = assignments.reduce((acc: any, a: any) => {
    const compName = a.teams?.seasons?.competitions?.name ?? 'Unknown';
    const sportSlug = a.teams?.seasons?.competitions?.sports?.slug ?? 'afl';
    const seasonName = a.teams?.seasons?.name ?? '';
    const key = `${compName}-${seasonName}`;
    if (!acc[key]) acc[key] = { compName, sportSlug, seasonName, teams: [] };
    acc[key].teams.push(a);
    return acc;
  }, {});

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto space-y-5">
        <button onClick={() => navigate('/portal')} className="flex items-center gap-1 text-muted-foreground text-xs">
          <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
        </button>

        <div>
          <h1 className="text-xl font-black tracking-tight">Coach Hub</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your coaching overview and statistics</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Matches', value: stats.totalMatches, icon: BarChart3 },
            { label: 'Wins', value: stats.wins, icon: Trophy },
            { label: 'Losses', value: stats.losses, icon: BarChart3 },
            { label: 'Draws', value: stats.draws, icon: BarChart3 },
          ].map(s => (
            <div key={s.label} className="match-card p-3 text-center">
              <div className="text-2xl font-black text-primary tabular-nums">{s.value}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/portal/submit" className="match-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xs">Submit AFL</span>
          </Link>
          <Link to="/portal/submit-cricket" className="match-card p-4 flex flex-col items-center gap-2 text-center">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CircleDot className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xs">Submit Cricket</span>
          </Link>
        </div>

        {/* Competitions */}
        {Object.keys(competitionGroups).length > 0 && (
          <section>
            <h2 className="section-label mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />My Competitions</h2>
            <div className="space-y-3">
              {Object.values(competitionGroups).map((group: any, gi: number) => (
                <div key={gi} className="match-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2 py-0">
                      {group.sportSlug === 'cricket' ? 'Cricket' : 'AFL'}
                    </Badge>
                    <span className="font-bold text-sm">{group.compName}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{group.seasonName}</span>
                  </div>
                  <div className="space-y-2">
                    {group.teams.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <ClubLogo club={a.teams?.clubs ?? {}} size="sm" className="!h-8 !w-8" />
                        <div className="flex-1">
                          <div className="font-bold text-xs">{a.teams?.clubs?.name}</div>
                          <div className="text-[10px] text-muted-foreground">{a.teams?.division} · {a.teams?.age_group}</div>
                        </div>
                        {a.is_primary && <Badge variant="secondary" className="text-[9px] rounded-full">Primary</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Results */}
        <section>
          <h2 className="section-label mb-2 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Recent Submissions</h2>
          {recentResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center match-card">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentResults.map((r: any) => {
                const sportSlug = r.fixtures?.seasons?.competitions?.sports?.slug;
                const isCricket = sportSlug === 'cricket';
                const compName = r.fixtures?.seasons?.competitions?.short_name || r.fixtures?.seasons?.competitions?.name || '';
                return (
                  <Link key={r.id} to={`/match/${r.fixture_id}`} className="block match-card p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2 py-0">
                        {isCricket ? 'Cricket' : 'AFL'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{compName} · Rd {r.fixtures?.round_number}</span>
                      <Badge
                        variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="rounded-full text-[9px] capitalize ml-auto shrink-0"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" />
                        <span className={`font-bold text-sm truncate ${r.home_score > r.away_score ? '' : 'text-muted-foreground'}`}>
                          {r.fixtures?.home_team?.clubs?.short_name}
                        </span>
                      </div>
                      <div className="text-center shrink-0">
                        <span className="stat-number text-base">{r.home_score} – {r.away_score}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`font-bold text-sm truncate ${r.away_score > r.home_score ? '' : 'text-muted-foreground'}`}>
                          {r.fixtures?.away_team?.clubs?.short_name}
                        </span>
                        <ClubLogo club={r.fixtures?.away_team?.clubs ?? {}} size="sm" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}