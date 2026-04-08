import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Info, Trophy, Star } from 'lucide-react';
import { useCricketMatchResults, useCricketPlayerStats } from '@/hooks/useCricketData';
import { useMemo } from 'react';

interface CricketSummaryTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  statusLabel: string;
}

export default function CricketSummaryTab({ fixture, result, homeClub, awayClub, matchDate, statusLabel }: CricketSummaryTabProps) {
  const { data: inningsData } = useCricketMatchResults(fixture?.id);
  const { data: playerStats } = useCricketPlayerStats(fixture?.id);

  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;

  const hasInnings = inningsData && inningsData.length > 0;

  // Determine player of the match - pick the best performer based on a simple heuristic
  const playerOfMatch = useMemo(() => {
    if (!playerStats?.length) return null;

    // Group stats by player
    const playerMap = new Map<string, { player: any; totalRuns: number; totalWickets: number; catches: number; teamId: string }>();

    playerStats.forEach((s: any) => {
      const existing = playerMap.get(s.player_id) ?? {
        player: s.players,
        totalRuns: 0,
        totalWickets: 0,
        catches: 0,
        teamId: s.team_id,
      };
      existing.totalRuns += s.runs_scored ?? 0;
      existing.totalWickets += s.wickets ?? 0;
      existing.catches += s.catches ?? 0;
      playerMap.set(s.player_id, existing);
    });

    // Score each player: runs + (wickets * 25) + (catches * 10)
    let best: any = null;
    let bestScore = -1;

    playerMap.forEach((val) => {
      const score = val.totalRuns + val.totalWickets * 25 + val.catches * 10;
      if (score > bestScore) {
        bestScore = score;
        best = val;
      }
    });

    return best;
  }, [playerStats]);

  // Get detailed stats for player of match
  const pomDetails = useMemo(() => {
    if (!playerOfMatch || !playerStats?.length) return null;
    const stats = playerStats.filter((s: any) =>
      s.players?.first_name === playerOfMatch.player?.first_name &&
      s.players?.last_name === playerOfMatch.player?.last_name
    );

    const batting = stats.filter((s: any) => (s.runs_scored ?? 0) > 0 || s.balls_faced > 0);
    const bowling = stats.filter((s: any) => (s.overs_bowled ?? 0) > 0);

    return { batting, bowling };
  }, [playerOfMatch, playerStats]);

  const pomClub = playerOfMatch?.teamId === homeTeamId ? homeClub : awayClub;

  if (!hasInnings && !result) {
    return (
      <div className="match-card p-8 text-center">
        <div className="text-3xl mb-3">🏏</div>
        <p className="text-sm font-semibold text-foreground mb-1">Match details available after the game</p>
        <p className="text-xs text-muted-foreground">Check back after the toss for live scores and stats.</p>
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
                  {playerOfMatch.player?.first_name} {playerOfMatch.player?.last_name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ClubLogo club={pomClub ?? {}} size="sm" className="!h-4 !w-4" />
                  <span className="text-[10px] text-muted-foreground font-semibold">{pomClub?.short_name}</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Batting */}
              {pomDetails?.batting && pomDetails.batting.length > 0 && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">Batting</div>
                  {pomDetails.batting.map((s: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black tabular-nums text-foreground">{s.runs_scored ?? 0}</span>
                        <span className="text-[10px] text-muted-foreground">runs</span>
                        {s.not_out && <Badge className="text-[8px] rounded-full px-1 py-0 bg-primary/10 text-primary border-0 font-black">NO</Badge>}
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>{s.balls_faced ?? 0}b</span>
                        <span>{s.fours ?? 0}×4</span>
                        <span>{s.sixes ?? 0}×6</span>
                        <span>SR {Number(s.strike_rate ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bowling */}
              {pomDetails?.bowling && pomDetails.bowling.length > 0 && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">Bowling</div>
                  {pomDetails.bowling.map((s: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black tabular-nums text-foreground">{s.wickets ?? 0}/{s.runs_conceded ?? 0}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>{s.overs_bowled ?? 0} ov</span>
                        <span>{s.maidens ?? 0} mdn</span>
                        <span>Econ {Number(s.economy ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fielding */}
              {playerOfMatch.catches > 0 && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">Fielding</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black tabular-nums text-foreground">{playerOfMatch.catches}</span>
                    <span className="text-[10px] text-muted-foreground">catches</span>
                  </div>
                </div>
              )}
            </div>
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
              fixture.match_format && { label: 'Format', value: fixture.match_format },
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
