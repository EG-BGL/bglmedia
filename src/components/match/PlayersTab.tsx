import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Award, Users, BarChart3 } from 'lucide-react';
import { usePlayers, useMatchPlayerStats } from '@/hooks/useData';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
  { key: 'hitouts', label: 'HO' },
] as const;

function StatsTable({ stats, club }: { stats: any[]; club: any }) {
  if (!stats || stats.length === 0) {
    return <p className="text-xs text-muted-foreground/50 italic px-4 py-3">No player stats available</p>;
  }

  return (
    <ScrollArea className="w-full">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-border/30">
            <th className="text-left py-2 px-2 font-black uppercase tracking-wider text-muted-foreground sticky left-0 bg-card z-10 min-w-[100px]">Player</th>
            {STAT_COLS.map(col => (
              <th key={col.label} className="text-center py-2 px-1.5 font-black uppercase tracking-wider text-muted-foreground min-w-[32px]">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s: any, i: number) => (
            <tr key={s.id} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
              <td className="py-1.5 px-2 sticky left-0 z-10 font-medium" style={{ backgroundColor: 'inherit' }}>
                <div className="flex items-center gap-1.5" style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.2)' : 'hsl(var(--card))' }}>
                  {s.players?.jersey_number != null && (
                    <span className="w-4 h-4 rounded bg-muted text-muted-foreground text-[8px] font-bold flex items-center justify-center shrink-0">{s.players.jersey_number}</span>
                  )}
                  <span className="truncate">{s.players?.first_name?.[0]}. {s.players?.last_name}</span>
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
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export default function PlayersTab({ fixture, result, homeClub, awayClub }: PlayersTabProps) {
  const fixtureId = fixture?.id;
  const homeTeamId = (fixture as any)?.home_team?.id;
  const awayTeamId = (fixture as any)?.away_team?.id;
  const { data: allStats, isLoading: loadingStats } = useMatchPlayerStats(fixtureId);
  const { data: homePlayers, isLoading: loadingHome } = usePlayers(homeTeamId);
  const { data: awayPlayers, isLoading: loadingAway } = usePlayers(awayTeamId);

  const homeStats = allStats?.filter((s: any) => s.team_id === homeTeamId) ?? [];
  const awayStats = allStats?.filter((s: any) => s.team_id === awayTeamId) ?? [];
  const hasStats = homeStats.length > 0 || awayStats.length > 0;

  return (
    <div className="space-y-3">
      {/* Player Stats */}
      {hasStats && (
        <>
          {/* Home team stats */}
          <div className="match-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
              <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">{homeClub?.short_name} Stats</h3>
            </div>
            <StatsTable stats={homeStats} club={homeClub} />
          </div>

          {/* Away team stats */}
          <div className="match-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
              <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">{awayClub?.short_name} Stats</h3>
            </div>
            <StatsTable stats={awayStats} club={awayClub} />
          </div>
        </>
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
