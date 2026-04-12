import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useMatchPlayerStats } from '@/hooks/useData';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayersTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
}

const STAT_COLS = [
  { key: 'afl_fantasy', label: 'AF' },
  { key: 'goals_behinds', label: 'G.B', computed: true },
  { key: 'disposals', label: 'D' },
  { key: 'kicks', label: 'K' },
  { key: 'handballs', label: 'H' },
  { key: 'marks', label: 'M' },
  { key: 'tackles', label: 'T' },
] as const;

export default function PlayersTab({ fixture, result, homeClub, awayClub }: PlayersTabProps) {
  const fixtureId = fixture?.id;
  const homeTeamId = (fixture as any)?.home_team?.id;
  const awayTeamId = (fixture as any)?.away_team?.id;
  const { data: allStats, isLoading: loadingStats } = useMatchPlayerStats(fixtureId);

  const [sortKey, setSortKey] = useState<string>('afl_fantasy');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'goalkickers'>('all');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getStatValue = (s: any, key: string) => {
    if (key === 'goals_behinds') return (s.goals ?? 0) * 10 + (s.behinds ?? 0);
    return s[key] ?? 0;
  };

  // Deduplicate stats: group by normalized last name, merge stats, prefer player with jersey_number
  const deduplicatedStats = useMemo(() => {
    if (!allStats?.length) return [];

    const grouped = new Map<string, any>();

    for (const stat of allStats) {
      const lastName = (stat.players?.last_name ?? '').trim().toUpperCase();
      // Determine which logical team this player belongs to (home or away)
      // by checking their team_id against fixture teams
      const isHome = stat.team_id === homeTeamId;
      const key = `${lastName}::${isHome ? 'home' : 'away'}`;

      if (!grouped.has(key)) {
        grouped.set(key, { ...stat });
      } else {
        const existing = grouped.get(key)!;
        // Prefer the record that has a jersey number (real roster player)
        const existingHasJersey = existing.players?.jersey_number != null;
        const newHasJersey = stat.players?.jersey_number != null;

        if (newHasJersey && !existingHasJersey) {
          // Use the new record's player info but merge stats (take max/non-zero)
          grouped.set(key, {
            ...stat,
            goals: Math.max(existing.goals ?? 0, stat.goals ?? 0),
            behinds: Math.max(existing.behinds ?? 0, stat.behinds ?? 0),
            disposals: Math.max(existing.disposals ?? 0, stat.disposals ?? 0),
            kicks: Math.max(existing.kicks ?? 0, stat.kicks ?? 0),
            handballs: Math.max(existing.handballs ?? 0, stat.handballs ?? 0),
            marks: Math.max(existing.marks ?? 0, stat.marks ?? 0),
            tackles: Math.max(existing.tackles ?? 0, stat.tackles ?? 0),
            hitouts: Math.max(existing.hitouts ?? 0, stat.hitouts ?? 0),
            afl_fantasy: Math.max(existing.afl_fantasy ?? 0, stat.afl_fantasy ?? 0),
          });
        } else {
          // Keep existing but merge in non-zero stats from duplicate
          existing.goals = Math.max(existing.goals ?? 0, stat.goals ?? 0);
          existing.behinds = Math.max(existing.behinds ?? 0, stat.behinds ?? 0);
          existing.disposals = Math.max(existing.disposals ?? 0, stat.disposals ?? 0);
          existing.kicks = Math.max(existing.kicks ?? 0, stat.kicks ?? 0);
          existing.handballs = Math.max(existing.handballs ?? 0, stat.handballs ?? 0);
          existing.marks = Math.max(existing.marks ?? 0, stat.marks ?? 0);
          existing.tackles = Math.max(existing.tackles ?? 0, stat.tackles ?? 0);
          existing.hitouts = Math.max(existing.hitouts ?? 0, stat.hitouts ?? 0);
          existing.afl_fantasy = Math.max(existing.afl_fantasy ?? 0, stat.afl_fantasy ?? 0);
        }
      }
    }

    return Array.from(grouped.values());
  }, [allStats, homeTeamId]);

  const combinedStats = useMemo(() => {
    let filtered = [...deduplicatedStats];
    if (filter === 'goalkickers') {
      filtered = filtered.filter((s: any) => (s.goals ?? 0) > 0);
    }
    return filtered.sort((a: any, b: any) => {
      const av = getStatValue(a, sortKey);
      const bv = getStatValue(b, sortKey);
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [deduplicatedStats, sortKey, sortDir, filter]);

  const hasStats = combinedStats.length > 0;

  const getClub = (teamId: string) => teamId === homeTeamId ? homeClub : awayClub;

  return (
    <div className="space-y-3">
      {hasStats && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Player Stats</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >All</button>
              <button
                onClick={() => { setFilter('goalkickers'); setSortKey('goals_behinds'); setSortDir('desc'); }}
                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors ${filter === 'goalkickers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >Goalkickers</button>
            </div>
          </div>
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-2 font-black uppercase tracking-wider text-muted-foreground sticky left-0 bg-card z-10 min-w-[130px]">Player</th>
                  {STAT_COLS.map(col => {
                    const active = sortKey === col.key;
                    return (
                      <th
                        key={col.label}
                        className="text-center py-2 px-1.5 font-black uppercase tracking-wider min-w-[32px] cursor-pointer select-none hover:text-foreground transition-colors"
                        style={{ color: active ? 'hsl(var(--primary))' : undefined }}
                        onClick={() => handleSort(col.key)}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {col.label}
                          {active && (sortDir === 'desc' ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {combinedStats.map((s: any, i: number) => {
                  const club = getClub(s.team_id);
                  const isHome = s.team_id === homeTeamId;
                  const primaryColor = club?.primary_color || (isHome ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))');
                  const playerPhoto = s.players?.photo_url;
                  return (
                    <tr key={`${s.player_id}-${i}`} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="py-1.5 px-2 sticky left-0 z-10" style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.2)' : 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-1.5">
                          {s.players?.jersey_number != null ? (
                            <span
                              className="w-5 h-5 rounded text-[8px] font-black flex items-center justify-center shrink-0 text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {s.players.jersey_number}
                            </span>
                          ) : (
                            <span
                              className="w-5 h-5 rounded text-[8px] font-black flex items-center justify-center shrink-0"
                              style={{ backgroundColor: primaryColor, opacity: 0.3, color: 'white' }}
                            >
                              –
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-[10px] truncate block">
                              {s.players?.first_name?.[0]}. {s.players?.last_name}
                            </span>
                            <span className="text-[8px] text-muted-foreground truncate block">{club?.short_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-1.5 px-1.5 font-bold text-primary">{s.afl_fantasy ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.goals ?? 0}.{s.behinds ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.disposals ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.kicks ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.handballs ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.marks ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.tackles ?? 0}</td>
                      <td className="text-center py-1.5 px-1.5">{s.hitouts ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {loadingStats && !hasStats && (
        <div className="match-card overflow-hidden px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground/50">Loading stats...</p>
        </div>
      )}

      {!loadingStats && !hasStats && (
        <div className="match-card overflow-hidden px-4 py-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground/50">No player stats recorded for this match</p>
        </div>
      )}
    </div>
  );
}
