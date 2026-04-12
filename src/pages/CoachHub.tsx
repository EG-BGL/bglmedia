import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, ClipboardList, CircleDot, TrendingUp, ChevronRight } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface SeasonStats {
  seasonName: string;
  compName: string;
  sportSlug: string;
  year: number;
  isCurrent: boolean;
  teams: any[];
  ladderEntries: any[];
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  competitionPoints: number;
  bestFinish: number | null;
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

    const { data: assignData } = await supabase.from('coaches_to_teams')
      .select('*, teams(*, clubs(*), seasons(*, competitions(*, sports(*))))')
      .eq('user_id', user.id);

    const assigns = assignData ?? [];
    setAssignments(assigns);

    const teamIds = assigns.map(a => a.team_id).filter(Boolean);
    const seasonIds = [...new Set(assigns.map(a => a.season_id).filter(Boolean))];

    let ladderData: any[] = [];
    if (teamIds.length > 0) {
      const { data } = await supabase.from('ladder_entries')
        .select('*, teams(*, clubs(*))')
        .in('team_id', teamIds);
      ladderData = data ?? [];
    }

    let allSeasonLadders: any[] = [];
    if (seasonIds.length > 0) {
      const { data } = await supabase.from('ladder_entries')
        .select('*, teams(*, clubs(*))')
        .in('season_id', seasonIds)
        .order('competition_points', { ascending: false })
        .order('percentage', { ascending: false });
      allSeasonLadders = data ?? [];
    }

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

    Object.entries(seasonMap).forEach(([seasonId, ss]) => {
      const coachTeamIds = ss.teams.map((t: any) => t.team_id);
      const coachLadder = ladderData.filter(le => coachTeamIds.includes(le.team_id) && le.season_id === seasonId);
      ss.ladderEntries = coachLadder;

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

    const { data: resultsData } = await supabase.from('results').select(`
      *,
      fixtures(
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
        seasons:seasons!fixtures_season_id_fkey(*, competitions:competitions!seasons_competition_id_fkey(*, sports:sports!competitions_sport_id_fkey(*)))
      )
    `).eq('submitted_by', user.id).order('created_at', { ascending: false }).limit(5);
    setRecentResults(resultsData ?? []);
    setLoadingData(false);
  }

  if (loading || loadingData) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getPercentage = (ss: SeasonStats) => {
    if (ss.pointsAgainst <= 0) return '–';
    if (ss.sportSlug === 'cricket') return ((ss.pointsFor - ss.pointsAgainst) / Math.max(ss.played, 1)).toFixed(2);
    return ((ss.pointsFor / ss.pointsAgainst) * 100).toFixed(1);
  };

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">Coach Hub</h1>
            <p className="text-[11px] text-muted-foreground">Career overview & stats</p>
          </div>
          <div className="flex gap-1.5">
            <Link to="/portal/submit" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              <ClipboardList className="h-3 w-3" /> AFL
            </Link>
            <Link to="/portal/submit-cricket" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              <CircleDot className="h-3 w-3" /> Cricket
            </Link>
          </div>
        </div>

        {/* Career Stats Bar */}
        <div className="match-card p-3">
          <div className="grid grid-cols-5 divide-x divide-border">
            <StatCell value={allTimeStats.totalSeasons} label="Seasons" />
            <StatCell value={allTimeStats.totalMatches} label="Played" />
            <StatCell value={allTimeStats.wins} label="Wins" className="text-emerald-600" />
            <StatCell value={allTimeStats.losses} label="Losses" className="text-red-500" />
            <StatCell value={`${allTimeStats.winRate}%`} label="Win %" className="text-primary" />
          </div>
        </div>

        {/* Season Cards */}
        {seasonStats.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="section-label flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Seasons</h2>
            {seasonStats.map((ss, i) => (
              <div key={i} className="match-card overflow-hidden">
                {/* Season header bar */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-muted/40 border-b border-border/50">
                  <Badge variant="outline" className="rounded text-[9px] font-bold px-1.5 py-0 shrink-0">
                    {ss.sportSlug === 'cricket' ? '🏏' : '🏈'}
                  </Badge>
                  <span className="font-bold text-xs truncate">{ss.compName}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{ss.seasonName}</span>
                  {ss.isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
                </div>

                <div className="p-3.5 space-y-3">
                  {/* Team rows */}
                  {ss.teams.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <ClubLogo club={a.teams?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                      <span className="font-semibold text-xs truncate">{a.teams?.clubs?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{a.teams?.division}</span>
                      {a.is_primary && <Badge variant="secondary" className="text-[8px] rounded-full px-1.5 py-0 ml-auto shrink-0">Primary</Badge>}
                    </div>
                  ))}

                  {ss.played > 0 ? (
                    <>
                      {/* Record row */}
                      <div className="flex items-center gap-1.5">
                        <RecordPill value={ss.wins} label="W" variant="win" />
                        <RecordPill value={ss.losses} label="L" variant="loss" />
                        <RecordPill value={ss.draws} label="D" variant="draw" />
                        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{ss.played} played</span>
                          <span className="font-bold text-foreground">{ss.winRate}%</span>
                        </div>
                      </div>

                      {/* Bottom stats */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>PF <strong className="text-foreground">{ss.pointsFor}</strong></span>
                        <span>PA <strong className="text-foreground">{ss.pointsAgainst}</strong></span>
                        <span>{ss.sportSlug === 'cricket' ? 'NRR' : '%'} <strong className="text-foreground">{getPercentage(ss)}</strong></span>
                        <span>Pts <strong className="text-foreground">{ss.competitionPoints}</strong></span>
                        {ss.bestFinish && (
                          <span className="flex items-center gap-0.5">
                            <Trophy className="h-3 w-3 text-amber-500" />
                            <strong className="text-foreground">{getOrdinal(ss.bestFinish)}</strong>
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground text-center py-1">No matches played yet</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Recent Submissions */}
        <section className="space-y-2">
          <h2 className="section-label flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Recent Submissions</h2>
          {recentResults.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center match-card">No submissions yet.</p>
          ) : (
            <div className="space-y-1.5">
              {recentResults.map((r: any) => {
                const sportSlug = r.fixtures?.seasons?.competitions?.sports?.slug;
                const isCricket = sportSlug === 'cricket';
                return (
                  <Link key={r.id} to={`/match/${r.fixture_id}`} className="match-card p-3 flex items-center gap-3 group">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className={`text-xs font-bold truncate ${r.home_score > r.away_score ? '' : 'text-muted-foreground'}`}>
                        {r.fixtures?.home_team?.clubs?.short_name}
                      </span>
                    </div>
                    <span className="text-xs font-black tabular-nums shrink-0">{r.home_score} – {r.away_score}</span>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className={`text-xs font-bold truncate ${r.away_score > r.home_score ? '' : 'text-muted-foreground'}`}>
                        {r.fixtures?.away_team?.clubs?.short_name}
                      </span>
                      <ClubLogo club={r.fixtures?.away_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                    </div>
                    <Badge
                      variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="rounded-full text-[8px] capitalize shrink-0 px-1.5 py-0"
                    >
                      {r.status}
                    </Badge>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-foreground transition-colors" />
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

function StatCell({ value, label, className = '' }: { value: string | number; label: string; className?: string }) {
  return (
    <div className="text-center px-1">
      <div className={`text-base font-black tabular-nums ${className}`}>{value}</div>
      <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

function RecordPill({ value, label, variant }: { value: number; label: string; variant: 'win' | 'loss' | 'draw' }) {
  const styles = {
    win: 'bg-emerald-500/10 text-emerald-600',
    loss: 'bg-red-500/10 text-red-500',
    draw: 'bg-amber-500/10 text-amber-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[variant]}`}>
      {value}{label}
    </span>
  );
}
