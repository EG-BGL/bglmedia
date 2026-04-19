import { BarChart3 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMemo, useState } from 'react';
import { useRugbyPlayerStats } from '@/hooks/useRugbyData';
import ClubLogo from '@/components/ClubLogo';

interface RugbyPlayersTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
}

const COLS = [
  { key: 'tries', label: 'T' },
  { key: 'try_assists', label: 'TA' },
  { key: 'line_breaks', label: 'LB' },
  { key: 'run_metres', label: 'RM' },
  { key: 'tackle_busts', label: 'TB' },
  { key: 'offloads', label: 'OFF' },
  { key: 'tackles', label: 'TKL' },
  { key: 'missed_tackles', label: 'MT' },
  { key: 'errors', label: 'ERR' },
  { key: 'conversions', label: 'C' },
  { key: 'penalty_goals', label: 'PG' },
  { key: 'field_goals', label: 'FG' },
] as const;

export default function RugbyPlayersTab({ fixture, homeClub, awayClub }: RugbyPlayersTabProps) {
  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;
  const { data: allStats, isLoading } = useRugbyPlayerStats(fixture?.id);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  const activeTeamId = selectedTeam === 'home' ? homeTeamId : awayTeamId;
  const activeClub = selectedTeam === 'home' ? homeClub : awayClub;

  const filteredStats = useMemo(() => {
    if (!allStats?.length) return [];
    return allStats
      .filter((s: any) => s.team_id === activeTeamId)
      .sort((a: any, b: any) => (b.tries ?? 0) - (a.tries ?? 0) || (b.run_metres ?? 0) - (a.run_metres ?? 0));
  }, [allStats, activeTeamId]);

  return (
    <div className="space-y-3">
      <div className="match-card p-1.5 flex gap-1">
        <button
          onClick={() => setSelectedTeam('home')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
            selectedTeam === 'home' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <ClubLogo club={homeClub ?? {}} size="sm" className="!h-4 !w-4" />
          {homeClub?.short_name}
        </button>
        <button
          onClick={() => setSelectedTeam('away')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
            selectedTeam === 'away' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <ClubLogo club={awayClub ?? {}} size="sm" className="!h-4 !w-4" />
          {awayClub?.short_name}
        </button>
      </div>

      <div className="match-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Player Stats</h3>
        </div>
        {filteredStats.length > 0 ? (
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">Player</th>
                  {COLS.map(col => (
                    <th key={col.label} className="text-center py-2 px-1.5 font-bold text-muted-foreground min-w-[34px]" title={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredStats.map((s: any, i: number) => {
                  const primaryColor = activeClub?.primary_color || 'hsl(var(--primary))';
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-muted/15' : ''}>
                      <td className="py-2 px-3 sticky left-0 z-10" style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.15)' : 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-1.5">
                          {s.players?.jersey_number != null && (
                            <span className="rounded text-[7px] font-black flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: primaryColor, width: '18px', height: '18px' }}>
                              {s.players.jersey_number}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold truncate">{s.players?.first_name?.[0]}. {s.players?.last_name}</div>
                            {s.position && <div className="text-[8px] text-muted-foreground truncate">{s.position}</div>}
                          </div>
                        </div>
                      </td>
                      {COLS.map(col => {
                        const val = s[col.key] ?? 0;
                        const isHi = (col.key === 'tries' && val > 0) || (col.key === 'try_assists' && val > 0);
                        return (
                          <td key={col.label} className={`text-center py-2 px-1.5 tabular-nums ${isHi ? 'font-black text-primary' : ''}`}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : isLoading ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground/50">Loading stats...</div>
        ) : (
          <div className="px-4 py-6 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground/50">No player stats recorded for this match</p>
          </div>
        )}
      </div>

      <div className="text-[9px] text-muted-foreground px-1 leading-relaxed">
        T=Tries · TA=Try Assists · LB=Line Breaks · RM=Run Metres · TB=Tackle Busts · OFF=Offloads · TKL=Tackles · MT=Missed Tackles · ERR=Errors · C=Conversions · PG=Penalty Goals · FG=Field Goals
      </div>
    </div>
  );
}
