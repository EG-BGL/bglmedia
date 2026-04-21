import Layout from '@/components/layout/Layout';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSport } from '@/hooks/useSport';
import { useSeasons } from '@/hooks/useData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClubLogo from '@/components/ClubLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart3, Flame, Target, Hand, Sparkles, Users2, TrendingUp } from 'lucide-react';

type StatKey = 'goals' | 'disposals' | 'marks' | 'afl_fantasy';

const PLAYER_LEADER_CATS: { key: StatKey; label: string; icon: any; suffix?: string }[] = [
  { key: 'goals', label: 'Goals', icon: Flame },
  { key: 'disposals', label: 'Disposals', icon: Hand },
  { key: 'marks', label: 'Marks', icon: Target },
  { key: 'afl_fantasy', label: 'Fantasy Points', icon: Sparkles },
];

export default function Stats() {
  const { sports, currentSport, setSport } = useSport();
  const { data: allSeasons } = useSeasons();
  const [tab, setTab] = useState<'players' | 'teams'>('players');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const seasons = useMemo(() => {
    if (!allSeasons || !currentSport) return [];
    return allSeasons.filter((s: any) => s.competitions?.sport_id === currentSport.id);
  }, [allSeasons, currentSport]);

  useEffect(() => {
    const stillValid = seasons.some((s: any) => s.id === selectedSeasonId);
    if (stillValid) return;
    const current = seasons.find((s: any) => s.is_current);
    if (current) setSelectedSeasonId(current.id);
    else if (seasons.length > 0) setSelectedSeasonId(seasons[0].id);
    else setSelectedSeasonId('');
  }, [seasons, selectedSeasonId]);

  // Pull all fixtures + stats for season
  const { data: seasonData, isLoading } = useQuery({
    queryKey: ['stats-season', selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return null;
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('id, round_number, status, home_team_id, away_team_id')
        .eq('season_id', selectedSeasonId);
      if (!fixtures?.length) return { fixtures: [], playerStats: [], teamStats: [] };

      const fixtureIds = fixtures.map(f => f.id);
      const [{ data: playerStats }, { data: teamStats }] = await Promise.all([
        supabase
          .from('match_player_stats')
          .select('*, players(id, first_name, last_name, jersey_number, photo_url, team_id, teams(id, club_id, clubs(id, name, short_name, logo_url, primary_color)))')
          .in('fixture_id', fixtureIds),
        supabase
          .from('match_team_stats')
          .select('*')
          .in('fixture_id', fixtureIds),
      ]);
      return { fixtures, playerStats: playerStats ?? [], teamStats: teamStats ?? [] };
    },
    enabled: !!selectedSeasonId,
  });

  // Teams for the season (so we can resolve team display info even without team stats)
  const { data: teams } = useQuery({
    queryKey: ['stats-season-teams', selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return [];
      const { data } = await supabase
        .from('teams')
        .select('id, club_id, clubs(id, name, short_name, logo_url, primary_color)')
        .eq('season_id', selectedSeasonId);
      return data ?? [];
    },
    enabled: !!selectedSeasonId,
  });

  // ============ Player aggregation ============
  const playerAggregates = useMemo(() => {
    if (!seasonData?.playerStats?.length) return [];
    const map = new Map<string, any>();
    for (const s of seasonData.playerStats) {
      const pid = s.player_id;
      if (!map.has(pid)) {
        map.set(pid, {
          player: s.players,
          team_id: s.team_id,
          games: 0,
          goals: 0,
          behinds: 0,
          disposals: 0,
          marks: 0,
          tackles: 0,
          afl_fantasy: 0,
        });
      }
      const a = map.get(pid)!;
      a.games += 1;
      a.goals += s.goals ?? 0;
      a.behinds += s.behinds ?? 0;
      a.disposals += s.disposals ?? 0;
      a.marks += s.marks ?? 0;
      a.tackles += s.tackles ?? 0;
      a.afl_fantasy += s.afl_fantasy ?? 0;
    }
    return Array.from(map.values());
  }, [seasonData]);

  // ============ Last round highs ============
  const lastRound = useMemo(() => {
    if (!seasonData?.fixtures?.length) return null;
    const completed = seasonData.fixtures.filter((f: any) => f.status === 'completed');
    if (!completed.length) return null;
    return Math.max(...completed.map((f: any) => f.round_number));
  }, [seasonData]);

  const lastRoundHighs = useMemo(() => {
    if (!lastRound || !seasonData) return null;
    const roundFixtureIds = new Set(
      seasonData.fixtures.filter((f: any) => f.round_number === lastRound).map((f: any) => f.id)
    );
    const stats = seasonData.playerStats.filter((s: any) => roundFixtureIds.has(s.fixture_id));
    if (!stats.length) return null;

    const top = (key: StatKey) => {
      let best: any = null;
      for (const s of stats) {
        const v = s[key] ?? 0;
        if (!best || v > (best[key] ?? 0)) best = s;
      }
      return best;
    };
    return {
      round: lastRound,
      goals: top('goals'),
      disposals: top('disposals'),
      marks: top('marks'),
      afl_fantasy: top('afl_fantasy'),
    };
  }, [lastRound, seasonData]);

  // ============ Team aggregation ============
  const teamAggregates = useMemo(() => {
    if (!teams?.length) return [];
    const teamMap = new Map<string, any>();
    for (const t of teams) {
      teamMap.set(t.id, {
        team: t,
        games: 0,
        disposals: 0,
        kicks: 0,
        handballs: 0,
        marks: 0,
        goals: 0,
        behinds: 0,
      });
    }

    // Use team stats for disposals/marks
    for (const ts of seasonData?.teamStats ?? []) {
      const a = teamMap.get(ts.team_id);
      if (!a) continue;
      a.games += 1;
      a.disposals += ts.disposals ?? 0;
      a.kicks += ts.kicks ?? 0;
      a.handballs += ts.handballs ?? 0;
      a.marks += ts.marks ?? 0;
    }

    // Goals/behinds: aggregate from player stats per fixture
    const fixtureTeamScored = new Set<string>();
    for (const ps of seasonData?.playerStats ?? []) {
      const a = teamMap.get(ps.team_id);
      if (!a) continue;
      a.goals += ps.goals ?? 0;
      a.behinds += ps.behinds ?? 0;
      fixtureTeamScored.add(`${ps.fixture_id}::${ps.team_id}`);
    }
    // Count games from unique fixture/team if no team stats
    for (const [tid, agg] of teamMap.entries()) {
      if (agg.games === 0) {
        agg.games = Array.from(fixtureTeamScored).filter(k => k.endsWith(`::${tid}`)).length;
      }
    }

    const list = Array.from(teamMap.values()).filter(a => a.games > 0);
    for (const a of list) {
      a.disposal_efficiency = a.disposals > 0 ? (a.kicks / a.disposals) * 100 : 0;
      a.goals_per_game = a.goals / a.games;
      a.behinds_per_game = a.behinds / a.games;
      const totalShots = a.goals + a.behinds;
      a.goal_efficiency = totalShots > 0 ? (a.goals / totalShots) * 100 : 0;
      a.disposals_per_game = a.disposals / a.games;
      a.marks_per_game = a.marks / a.games;
    }
    return list.sort((x, y) => y.disposals_per_game - x.disposals_per_game);
  }, [teams, seasonData]);

  const isAfl = currentSport?.slug === 'afl';

  return (
    <Layout>
      <div className="page-container py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Stats</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Season leaders & team form</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sports.length > 1 && (
              <Select value={currentSport?.slug ?? ''} onValueChange={setSport}>
                <SelectTrigger className="h-8 text-xs w-[110px] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sports.map((s: any) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {seasons.length > 0 && (
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="h-8 text-xs w-[140px] rounded-lg"><SelectValue placeholder="Season" /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {!isAfl ? (
          <div className="match-card p-8 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Stats page is currently AFL-only.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Switch to AFL above to view leaders.</p>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="inline-flex bg-secondary/60 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setTab('players')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tab === 'players' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Users2 className="h-3.5 w-3.5" /> Players
              </button>
              <button
                onClick={() => setTab('teams')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tab === 'teams' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" /> Teams
              </button>
            </div>

            {isLoading && (
              <div className="match-card p-8 text-center text-xs text-muted-foreground">Loading stats…</div>
            )}

            {!isLoading && tab === 'players' && (
              <PlayersView aggregates={playerAggregates} lastRoundHighs={lastRoundHighs} />
            )}

            {!isLoading && tab === 'teams' && (
              <TeamsView aggregates={teamAggregates} />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// =================================================================
// Players View
// =================================================================
function PlayersView({ aggregates, lastRoundHighs }: { aggregates: any[]; lastRoundHighs: any }) {
  const [activeStat, setActiveStat] = useState<StatKey>('afl_fantasy');

  const sorted = useMemo(() => {
    return [...aggregates].sort((a, b) => (b[activeStat] ?? 0) - (a[activeStat] ?? 0)).slice(0, 25);
  }, [aggregates, activeStat]);

  if (!aggregates.length) {
    return (
      <div className="match-card p-8 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No player stats recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last Round Highs */}
      {lastRoundHighs && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Last Round Highs</h2>
            <span className="text-[10px] font-bold uppercase text-primary">Round {lastRoundHighs.round}</span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {PLAYER_LEADER_CATS.map(cat => {
              const top = lastRoundHighs[cat.key];
              const Icon = cat.icon;
              const player = top?.players;
              const club = player?.teams?.clubs;
              const initials = player ? `${player.first_name?.[0] ?? ''}${player.last_name?.[0] ?? ''}`.toUpperCase() : '?';
              const primary = club?.primary_color ?? 'hsl(var(--primary))';
              return (
                <div
                  key={cat.key}
                  className="match-card snap-center shrink-0 w-[78%] max-w-[280px] overflow-hidden relative"
                >
                  {/* Gradient backdrop using club color */}
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{ background: `linear-gradient(135deg, ${primary} 0%, transparent 70%)` }}
                  />
                  <div className="relative p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <Icon className="h-3 w-3 text-primary" /> {cat.label}
                      </div>
                      {club && <ClubLogo club={club} size="sm" />}
                    </div>

                    {top ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-20 w-20 ring-2 ring-primary/40">
                            {player?.photo_url && <AvatarImage src={player.photo_url} alt={`${player.first_name} ${player.last_name}`} className="object-cover" />}
                            <AvatarFallback
                              className="text-lg font-black"
                              style={{ backgroundColor: primary, color: club?.secondary_color ?? '#fff' }}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-4xl font-black tabular-nums leading-none text-primary">
                              {top[cat.key] ?? 0}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-bold mt-1">
                              {cat.label}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-border/30 pt-2">
                          <div className="text-sm font-bold truncate leading-tight">
                            {player?.first_name} {player?.last_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {club?.short_name ?? '—'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground/50 py-8 text-center">No data</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Season Leaders */}
      <section className="match-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Season Leaders</h2>
        </div>

        {/* Stat selector */}
        <div className="flex border-b border-border/30 overflow-x-auto">
          {PLAYER_LEADER_CATS.map(cat => {
            const active = activeStat === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveStat(cat.key)}
                className={`flex-1 min-w-[90px] px-3 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors border-b-2 ${
                  active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3 w-3" /> {cat.label}
              </button>
            );
          })}
        </div>

        <div className="divide-y divide-border/30">
          {sorted.map((row, i) => {
            const club = row.player?.teams?.clubs;
            const value = row[activeStat] ?? 0;
            const avg = row.games > 0 ? (value / row.games).toFixed(1) : '0';
            return (
              <div key={row.player?.id ?? i} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`text-[11px] font-black w-5 text-center ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <ClubLogo club={club ?? {}} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate leading-tight">
                    {row.player?.first_name} {row.player?.last_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {club?.short_name} · {row.games} {row.games === 1 ? 'game' : 'games'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums leading-none text-primary">{value}</div>
                  <div className="text-[9px] text-muted-foreground tabular-nums mt-0.5">avg {avg}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// =================================================================
// Teams View
// =================================================================
const TEAM_COLS: { key: string; label: string; format?: (n: number) => string }[] = [
  { key: 'disposals_per_game', label: 'Disp', format: n => n.toFixed(1) },
  { key: 'disposal_efficiency', label: 'Disp%', format: n => `${n.toFixed(1)}%` },
  { key: 'marks_per_game', label: 'Marks', format: n => n.toFixed(1) },
  { key: 'goals_per_game', label: 'G/g', format: n => n.toFixed(1) },
  { key: 'behinds_per_game', label: 'B/g', format: n => n.toFixed(1) },
  { key: 'goal_efficiency', label: 'Goal%', format: n => `${n.toFixed(1)}%` },
];

function TeamsView({ aggregates }: { aggregates: any[] }) {
  const [sortKey, setSortKey] = useState<string>('disposals_per_game');

  const sorted = useMemo(() => {
    return [...aggregates].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  }, [aggregates, sortKey]);

  if (!aggregates.length) {
    return (
      <div className="match-card p-8 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No team stats recorded yet.</p>
      </div>
    );
  }

  return (
    <section className="match-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Team Averages</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-2 px-3 font-black uppercase tracking-wider text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">Team</th>
              {TEAM_COLS.map(col => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className="text-center py-2 px-2 font-black uppercase tracking-wider min-w-[52px] cursor-pointer select-none transition-colors"
                    style={{ color: active ? 'hsl(var(--primary))' : undefined }}
                    onClick={() => setSortKey(col.key)}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const club = row.team?.clubs;
              return (
                <tr key={row.team?.id} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                  <td
                    className="py-2 px-3 sticky left-0 z-10"
                    style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.2)' : 'hsl(var(--card))' }}
                  >
                    <div className="flex items-center gap-2">
                      <ClubLogo club={club ?? {}} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] truncate leading-tight">{club?.short_name}</div>
                        <div className="text-[9px] text-muted-foreground">{row.games} {row.games === 1 ? 'g' : 'gp'}</div>
                      </div>
                    </div>
                  </td>
                  {TEAM_COLS.map(col => {
                    const active = sortKey === col.key;
                    const v = row[col.key] ?? 0;
                    return (
                      <td
                        key={col.key}
                        className={`text-center py-2 px-2 tabular-nums ${active ? 'font-black text-primary' : 'font-semibold'}`}
                      >
                        {col.format ? col.format(v) : v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
