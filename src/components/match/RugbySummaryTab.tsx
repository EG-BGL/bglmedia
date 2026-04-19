import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Info, Trophy, Star } from 'lucide-react';
import { useRugbyPlayerStats, useRugbyTeamStats, useRugbyMatchResults } from '@/hooks/useRugbyData';
import { useMemo } from 'react';

interface RugbySummaryTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  statusLabel: string;
}

const TEAM_STAT_ROWS = [
  { key: 'run_metres', label: 'Run Metres' },
  { key: 'line_breaks', label: 'Line Breaks' },
  { key: 'tackles', label: 'Tackles' },
  { key: 'missed_tackles', label: 'Missed Tackles' },
  { key: 'errors', label: 'Errors' },
  { key: 'penalties_conceded', label: 'Penalties Conceded' },
] as const;

export default function RugbySummaryTab({ fixture, homeClub, awayClub, matchDate, statusLabel }: RugbySummaryTabProps) {
  const { data: rugbyResults } = useRugbyMatchResults(fixture?.id);
  const { data: playerStats } = useRugbyPlayerStats(fixture?.id);
  const { data: teamStats } = useRugbyTeamStats(fixture?.id);

  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;
  const homeTeamStats = teamStats?.find((t: any) => t.team_id === homeTeamId);
  const awayTeamStats = teamStats?.find((t: any) => t.team_id === awayTeamId);

  // POM: highest score = tries*4 + try_assists*3 + line_breaks*2 + tackles*0.5 + (kicking points)
  const playerOfMatch = useMemo(() => {
    if (!playerStats?.length) return null;
    let best: any = null;
    let bestScore = -1;
    playerStats.forEach((s: any) => {
      const kickPts = (s.conversions ?? 0) * 2 + (s.penalty_goals ?? 0) * 2 + (s.field_goals ?? 0);
      const score = (s.tries ?? 0) * 8 + (s.try_assists ?? 0) * 4 + (s.line_breaks ?? 0) * 3 + (s.tackle_busts ?? 0) * 1 + (s.tackles ?? 0) * 0.3 + kickPts;
      if (score > bestScore) { bestScore = score; best = s; }
    });
    return best;
  }, [playerStats]);

  const pomClub = playerOfMatch?.team_id === homeTeamId ? homeClub : awayClub;

  if (!rugbyResults?.length) {
    return (
      <div className="match-card p-8 text-center">
        <div className="text-3xl mb-3">🏉</div>
        <p className="text-sm font-semibold text-foreground mb-1">Match details available after the game</p>
        <p className="text-xs text-muted-foreground">Check back after kick-off for live scores and stats.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Player of the Match */}
      {playerOfMatch && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Player of the Match</h3>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">
                  {playerOfMatch.players?.first_name} {playerOfMatch.players?.last_name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ClubLogo club={pomClub ?? {}} size="sm" className="!h-4 !w-4" />
                  <span className="text-[10px] text-muted-foreground font-semibold">{pomClub?.short_name}</span>
                  {playerOfMatch.position && <Badge variant="secondary" className="text-[9px] rounded-full px-1.5 py-0 border-0">{playerOfMatch.position}</Badge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tries', value: playerOfMatch.tries ?? 0 },
                { label: 'Run M', value: playerOfMatch.run_metres ?? 0 },
                { label: 'Tackles', value: playerOfMatch.tackles ?? 0 },
              ].map(s => (
                <div key={s.label} className="bg-muted/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black tabular-nums text-foreground">{s.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Stats Comparison */}
      {(homeTeamStats || awayTeamStats) && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Team Stats</h3>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {TEAM_STAT_ROWS.map(row => {
              const h = (homeTeamStats as any)?.[row.key] ?? 0;
              const a = (awayTeamStats as any)?.[row.key] ?? 0;
              const total = h + a;
              const hPct = total > 0 ? (h / total) * 100 : 50;
              return (
                <div key={row.key}>
                  <div className="flex justify-between items-center text-[10px] mb-1 tabular-nums">
                    <span className="font-bold text-foreground">{h}</span>
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider">{row.label}</span>
                    <span className="font-bold text-foreground">{a}</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/30">
                    <div className="bg-primary/60" style={{ width: `${hPct}%` }} />
                    <div className="bg-accent/60" style={{ width: `${100 - hPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Info */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Match Info</h3>
        </div>
        <div className="px-4 py-2">
          <dl className="divide-y divide-border/30">
            {[
              { label: 'Round', value: `Round ${fixture.round_number}` },
              { label: 'Sport', value: 'Rugby League' },
              matchDate && { label: 'Date', value: matchDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              matchDate && { label: 'Time', value: matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) },
              fixture.venue && { label: 'Venue', value: fixture.venue },
              { label: 'Status', value: statusLabel },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="text-xs font-semibold text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
