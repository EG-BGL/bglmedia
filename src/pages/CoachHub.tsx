import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trophy, BarChart3, Users, ClipboardList, CircleDot, TrendingUp, Hash, Target } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface SeasonStats {
  seasonName: string;
  compName: string;
  sportSlug: string;
  year: number;
  isCurrent: boolean;
  teams: any[];
  ladderEntries: any[];
  // Aggregated stats across all teams in this season
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  competitionPoints: number;
  bestFinish: number | null; // ladder position
  winRate: string;
}

export default function CoachHub() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats[]>([]);
  const [allTimeStats, setAllTimeStats] = useState({ totalSeasons: 0, totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: '0' });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    loadCoachData();
  }, [user]);

  async function loadCoachData() {
    if (!user) return;
    setLoadingData(true);

    // Fetch assignments with full details
    const { data: assignData } = await supabase.from('coaches_to_teams')
      .select('*, teams(*, clubs(*), seasons(*, competitions(*, sports(*))))')
      .eq('user_id', user.id);

    const assigns = assignData ?? [];
    setAssignments(assigns);

    // Get all team IDs the coach has been assigned to
    const teamIds = assigns.map(a => a.team_id).filter(Boolean);
    const seasonIds = [...new Set(assigns.map(a => a.season_id).filter(Boolean))];

    // Fetch ladder entries for all coach's teams
    let ladderData: any[] = [];
    if (teamIds.length > 0) {
      const { data } = await supabase.from('ladder_entries')
        .select('*, teams(*, clubs(*))')
        .in('team_id', teamIds);
      ladderData = data ?? [];
    }

    // Fetch ALL ladder entries for each season to determine position
    let allSeasonLadders: any[] = [];
    if (seasonIds.length > 0) {
      const { data } = await supabase.from('ladder_entries')
        .select('*, teams(*, clubs(*))')
        .in('season_id', seasonIds)
        .order('competition_points', { ascending: false })
        .order('percentage', { ascending: false });
      allSeasonLadders = data ?? [];
    }

    // Group by season
    const seasonMap: Record<string, SeasonStats> = {};
    assigns.forEach((a: any) => {
      const season = a.teams?.seasons;
      const comp = season?.competitions;
      const sport = comp?.sports;
      const key = season?.id;
      if (!key) return;

      if (!seasonMap[key]) {
        seasonMap[key] = {
          seasonName: season?.name ?? '',
          compName: comp?.name ?? '',
          sportSlug: sport?.slug ?? 'afl',
          year: season?.year ?? 0,
          isCurrent: season?.is_current ?? false,
          teams: [],
          ladderEntries: [],
          played: 0, wins: 0, losses: 0, draws: 0,
          pointsFor: 0, pointsAgainst: 0, competitionPoints: 0,
          bestFinish: null,
          winRate: '0',
        };
      }
      seasonMap[key].teams.push(a);
    });

    // Populate ladder stats per season
    Object.entries(seasonMap).forEach(([seasonId, ss]) => {
      const coachTeamIds = ss.teams.map((t: any) => t.team_id);
      const coachLadder = ladderData.filter(le => coachTeamIds.includes(le.team_id) && le.season_id === seasonId);
      ss.ladderEntries = coachLadder;

      // Aggregate stats
      coachLadder.forEach((le: any) => {
        ss.played += le.played ?? 0;
        ss.wins += le.wins ?? 0;
        ss.losses += le.losses ?? 0;
        ss.draws += le.draws ?? 0;
        ss.pointsFor += le.points_for ?? 0;
        ss.pointsAgainst += le.points_against ?? 0;
        ss.competitionPoints += le.competition_points ?? 0;
      });

      ss.winRate = ss.played > 0 ? ((ss.wins / ss.played) * 100).toFixed(0) : '0';

      // Determine ladder position for each team
      const seasonLadder = allSeasonLadders.filter(le => le.season_id === seasonId);
      let bestPos: number | null = null;
      coachTeamIds.forEach((tid: string) => {
        const pos = seasonLadder.findIndex(le => le.team_id === tid);
        if (pos !== -1) {
          const position = pos + 1;
          if (bestPos === null || position < bestPos) bestPos = position;
        }
      });
      ss.bestFinish = bestPos;
    });

    const sortedSeasons = Object.values(seasonMap).sort((a, b) => b.year - a.year || (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
    setSeasonStats(sortedSeasons);

    // All-time stats
    const totals = sortedSeasons.reduce((acc, s) => ({
      totalSeasons: acc.totalSeasons + 1,
      totalMatches: acc.totalMatches + s.played,
      wins: acc.wins + s.wins,
      losses: acc.losses + s.losses,
      draws: acc.draws + s.draws,
    }), { totalSeasons: 0, totalMatches: 0, wins: 0, losses: 0, draws: 0 });

    setAllTimeStats({
      ...totals,
      winRate: totals.totalMatches > 0 ? ((totals.wins / totals.totalMatches) * 100).toFixed(0) : '0',
    });

    // Recent results
    const { data: resultsData } = await supabase.from('results').select(`
      *,
      fixtures(
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
        seasons:seasons!fixtures_season_id_fkey(*, competitions:competitions!seasons_competition_id_fkey(*, sports:sports!competitions_sport_id_fkey(*)))
      )
    `).eq('submitted_by', user.id).order('created_at', { ascending: false }).limit(10);
    setRecentResults(resultsData ?? []);
    setLoadingData(false);
  }

  if (loading || loadingData) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

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

        {/* All-Time Stats */}
        <div className="match-card p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Career Overview</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="text-2xl font-black text-primary tabular-nums">{allTimeStats.totalSeasons}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Seasons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary tabular-nums">{allTimeStats.totalMatches}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary tabular-nums">{allTimeStats.winRate}%</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Win Rate</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-black text-emerald-600 tabular-nums">{allTimeStats.wins}</div>
              <div className="text-[9px] font-bold uppercase text-emerald-600/70">Wins</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-black text-red-600 tabular-nums">{allTimeStats.losses}</div>
              <div className="text-[9px] font-bold uppercase text-red-600/70">Losses</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-black text-amber-600 tabular-nums">{allTimeStats.draws}</div>
              <div className="text-[9px] font-bold uppercase text-amber-600/70">Draws</div>
            </div>
          </div>
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

        {/* Season-by-Season Breakdown */}
        {seasonStats.length > 0 && (
          <section>
            <h2 className="section-label mb-2 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Season Breakdown</h2>
            <div className="space-y-3">
              {seasonStats.map((ss, i) => (
                <div key={i} className="match-card p-4">
                  {/* Season header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2 py-0">
                      {ss.sportSlug === 'cricket' ? 'Cricket' : 'AFL'}
                    </Badge>
                    <span className="font-bold text-sm">{ss.compName}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {ss.isCurrent && <Badge className="rounded-full text-[9px] px-2 py-0 bg-emerald-500">Active</Badge>}
                      <span className="text-[10px] text-muted-foreground">{ss.seasonName}</span>
                    </div>
                  </div>

                  {/* Teams coached */}
                  <div className="space-y-1.5 mb-3">
                    {ss.teams.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30">
                        <ClubLogo club={a.teams?.clubs ?? {}} size="sm" className="!h-7 !w-7" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">{a.teams?.clubs?.name}</div>
                          <div className="text-[10px] text-muted-foreground">{a.teams?.division} · {a.teams?.age_group}</div>
                        </div>
                        {a.is_primary && <Badge variant="secondary" className="text-[9px] rounded-full shrink-0">Primary</Badge>}
                      </div>
                    ))}
                  </div>

                  {/* Season stats grid */}
                  {ss.played > 0 ? (
                    <>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-1.5 rounded-lg bg-muted/30">
                          <div className="text-sm font-black tabular-nums">{ss.played}</div>
                          <div className="text-[8px] text-muted-foreground font-bold uppercase">Played</div>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-emerald-500/10">
                          <div className="text-sm font-black text-emerald-600 tabular-nums">{ss.wins}</div>
                          <div className="text-[8px] text-emerald-600/70 font-bold uppercase">Won</div>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-red-500/10">
                          <div className="text-sm font-black text-red-600 tabular-nums">{ss.losses}</div>
                          <div className="text-[8px] text-red-600/70 font-bold uppercase">Lost</div>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-amber-500/10">
                          <div className="text-sm font-black text-amber-600 tabular-nums">{ss.draws}</div>
                          <div className="text-[8px] text-amber-600/70 font-bold uppercase">Drew</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-xs font-black tabular-nums">{ss.winRate}%</div>
                            <div className="text-[8px] text-muted-foreground font-bold uppercase">Win Rate</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-xs font-black tabular-nums">{ss.competitionPoints}</div>
                            <div className="text-[8px] text-muted-foreground font-bold uppercase">Points</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <Trophy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-xs font-black tabular-nums">
                              {ss.bestFinish ? getOrdinal(ss.bestFinish) : '–'}
                            </div>
                            <div className="text-[8px] text-muted-foreground font-bold uppercase">Finish</div>
                          </div>
                        </div>
                      </div>

                      {/* Points breakdown */}
                      <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-muted-foreground">
                        <span>PF: <strong className="text-foreground">{ss.pointsFor}</strong></span>
                        <span>PA: <strong className="text-foreground">{ss.pointsAgainst}</strong></span>
                        <span>
                          {ss.sportSlug === 'cricket' ? 'NRR' : '%'}:{' '}
                          <strong className="text-foreground">
                            {ss.pointsAgainst > 0 
                              ? ss.sportSlug === 'cricket'
                                ? ((ss.pointsFor - ss.pointsAgainst) / Math.max(ss.played, 1)).toFixed(2)
                                : ((ss.pointsFor / ss.pointsAgainst) * 100).toFixed(1)
                              : '–'}
                          </strong>
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No matches played yet</p>
                  )}
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
