import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Trophy, Info, Zap, Target, Hand, Shield, ArrowUpCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMatchPlayerStats } from '@/hooks/useData';

interface SummaryTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  homeWon: boolean;
  awayWon: boolean;
  statusLabel: string;
}

interface LeaderStat {
  label: string;
  icon: React.ReactNode;
  playerName: string;
  value: number;
  club: any;
  suffix: string;
  photoUrl: string | null;
}

function getClubForTeam(teamId: string, fixture: any, homeClub: any, awayClub: any) {
  if (teamId === fixture?.home_team_id || teamId === (fixture as any)?.home_team?.id) return homeClub;
  return awayClub;
}

export default function SummaryTab({ fixture, result, homeClub, awayClub, matchDate, homeWon, awayWon, statusLabel }: SummaryTabProps) {
  const { data: playerStats } = useMatchPlayerStats(fixture?.id);

  if (!result) {
    return (
      <div className="match-card p-8 text-center">
        <div className="text-3xl mb-3">🏈</div>
        <p className="text-sm font-semibold text-foreground mb-1">Match details available after the game</p>
        <p className="text-xs text-muted-foreground">Check back after kick-off for live scores and stats.</p>
      </div>
    );
  }

  // Deduplicate player stats by last name + team side
  const homeTeamId = (fixture as any)?.home_team?.id;
  const dedupedStats = (() => {
    if (!playerStats?.length) return [];
    const grouped = new Map<string, any>();
    for (const stat of playerStats) {
      const lastName = ((stat as any).players?.last_name ?? '').trim().toUpperCase();
      const isHome = (stat as any).team_id === homeTeamId;
      const key = `${lastName}::${isHome ? 'home' : 'away'}`;
      if (!grouped.has(key)) {
        grouped.set(key, { ...stat });
      } else {
        const existing = grouped.get(key)!;
        const existingHasJersey = existing.players?.jersey_number != null;
        const newHasJersey = (stat as any).players?.jersey_number != null;
        if (newHasJersey && !existingHasJersey) {
          grouped.set(key, { ...stat,
            goals: Math.max(existing.goals ?? 0, (stat as any).goals ?? 0),
            behinds: Math.max(existing.behinds ?? 0, (stat as any).behinds ?? 0),
            disposals: Math.max(existing.disposals ?? 0, (stat as any).disposals ?? 0),
            kicks: Math.max(existing.kicks ?? 0, (stat as any).kicks ?? 0),
            handballs: Math.max(existing.handballs ?? 0, (stat as any).handballs ?? 0),
            marks: Math.max(existing.marks ?? 0, (stat as any).marks ?? 0),
            tackles: Math.max(existing.tackles ?? 0, (stat as any).tackles ?? 0),
            hitouts: Math.max(existing.hitouts ?? 0, (stat as any).hitouts ?? 0),
            afl_fantasy: Math.max(existing.afl_fantasy ?? 0, (stat as any).afl_fantasy ?? 0),
          });
        } else {
          existing.goals = Math.max(existing.goals ?? 0, (stat as any).goals ?? 0);
          existing.disposals = Math.max(existing.disposals ?? 0, (stat as any).disposals ?? 0);
          existing.kicks = Math.max(existing.kicks ?? 0, (stat as any).kicks ?? 0);
          existing.handballs = Math.max(existing.handballs ?? 0, (stat as any).handballs ?? 0);
          existing.marks = Math.max(existing.marks ?? 0, (stat as any).marks ?? 0);
          existing.tackles = Math.max(existing.tackles ?? 0, (stat as any).tackles ?? 0);
          existing.hitouts = Math.max(existing.hitouts ?? 0, (stat as any).hitouts ?? 0);
          existing.afl_fantasy = Math.max(existing.afl_fantasy ?? 0, (stat as any).afl_fantasy ?? 0);
        }
      }
    }
    return Array.from(grouped.values());
  })();

  // Build match leaders from deduplicated player stats
  const leaders: LeaderStat[] = [];
  if (dedupedStats.length > 0) {
    const statDefs: { key: string; label: string; icon: React.ReactNode; suffix: string }[] = [
      { key: 'afl_fantasy', label: 'Fantasy', icon: <Zap className="h-3.5 w-3.5" />, suffix: 'pts' },
      { key: 'disposals', label: 'Disposals', icon: <Hand className="h-3.5 w-3.5" />, suffix: 'disp' },
      { key: 'goals', label: 'Goals', icon: <Target className="h-3.5 w-3.5" />, suffix: 'goals' },
      { key: 'marks', label: 'Marks', icon: <ArrowUpCircle className="h-3.5 w-3.5" />, suffix: 'marks' },
      { key: 'tackles', label: 'Tackles', icon: <Shield className="h-3.5 w-3.5" />, suffix: 'tackles' },
      { key: 'kicks', label: 'Kicks', icon: <Target className="h-3.5 w-3.5" />, suffix: 'kicks' },
    ];
    for (const def of statDefs) {
      const sorted = [...dedupedStats].sort((a: any, b: any) => (b[def.key] ?? 0) - (a[def.key] ?? 0));
      const top = sorted[0];
      if (top && (top as any)[def.key] > 0) {
        const player = (top as any)?.players;
        const name = player ? `${player.first_name?.[0]}. ${player.last_name}` : 'Unknown';
        leaders.push({
          label: def.label,
          icon: def.icon,
          playerName: name,
          value: (top as any)[def.key],
          club: getClubForTeam((top as any).team_id, fixture, homeClub, awayClub),
          suffix: def.suffix,
          photoUrl: player?.photo_url ?? null,
        });
      }
    }
  }

  // Fallback: derive goal leaders from goal_kickers arrays if no player stats
  const goalKickersExist = result.goal_kickers_home?.length > 0 || result.goal_kickers_away?.length > 0;
  const fallbackGoalLeaders: { name: string; goals: number; club: any }[] = [];
  if (leaders.length === 0 && goalKickersExist) {
    const parseGK = (list: string[] | null, club: any) => {
      list?.forEach((gk: string) => {
        const m = gk.match(/^(.+?)(?:\s+(\d+))?$/);
        fallbackGoalLeaders.push({ name: m?.[1] ?? gk, goals: m?.[2] ? parseInt(m[2]) : 1, club });
      });
    };
    parseGK(result.goal_kickers_home, homeClub);
    parseGK(result.goal_kickers_away, awayClub);
    fallbackGoalLeaders.sort((a, b) => b.goals - a.goals);
  }

  return (
    <div className="space-y-3">
      {/* Quarter Breakdown */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quarter by Quarter</h3>
        </div>
        <div className="px-4 py-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-1.5 font-bold text-muted-foreground w-20"></th>
                <th className="text-center py-1.5 font-bold text-muted-foreground">Q1</th>
                <th className="text-center py-1.5 font-bold text-muted-foreground">Q2</th>
                <th className="text-center py-1.5 font-bold text-muted-foreground">Q3</th>
                <th className="text-center py-1.5 font-bold text-muted-foreground">Q4</th>
                <th className="text-center py-1.5 font-black text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/10">
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    <ClubLogo club={homeClub ?? {}} size="sm" className="!h-4 !w-4" />
                    <span className={`font-bold text-[11px] truncate ${homeWon ? 'text-foreground' : 'text-muted-foreground'}`}>{homeClub?.short_name}</span>
                  </div>
                </td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.home_q1 || '-'}</td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.home_q2 || '-'}</td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.home_q3 || '-'}</td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.home_q4 || `${result.home_goals}.${result.home_behinds}`}</td>
                <td className={`text-center py-2 tabular-nums font-black ${homeWon ? 'text-primary' : ''}`}>{result.home_score}</td>
              </tr>
              <tr>
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    <ClubLogo club={awayClub ?? {}} size="sm" className="!h-4 !w-4" />
                    <span className={`font-bold text-[11px] truncate ${awayWon ? 'text-foreground' : 'text-muted-foreground'}`}>{awayClub?.short_name}</span>
                  </div>
                </td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.away_q1 || '-'}</td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.away_q2 || '-'}</td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.away_q3 || '-'}</td>
                <td className="text-center py-2 tabular-nums text-muted-foreground">{result.away_q4 || `${result.away_goals}.${result.away_behinds}`}</td>
                <td className={`text-center py-2 tabular-nums font-black ${awayWon ? 'text-primary' : ''}`}>{result.away_score}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Leaders */}
      {(leaders.length > 0 || fallbackGoalLeaders.length > 0) && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Match Leaders</h3>
          </div>

          {leaders.length > 0 ? (
            <div className="grid grid-cols-3 gap-px bg-border/20">
              {leaders.map((leader, i) => {
                const initials = leader.playerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={i} className="bg-card px-2 py-3 flex flex-col items-center text-center gap-1.5">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {leader.icon}
                      <span className="text-[9px] font-bold uppercase tracking-wider">{leader.label}</span>
                    </div>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className="text-[10px] font-black"
                        style={{
                          backgroundColor: leader.club?.primary_color ?? '#1a365d',
                          color: leader.club?.secondary_color ?? '#d69e2e',
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[10px] font-bold text-foreground truncate max-w-[90px]">{leader.playerName}</p>
                      <div className="flex items-center justify-center gap-1">
                        <ClubLogo club={leader.club ?? {}} size="sm" className="!h-3 !w-3" />
                        <span className="text-[9px] text-muted-foreground">{leader.club?.short_name}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm font-black tabular-nums text-primary">{leader.value}</span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 font-bold">{leader.suffix}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-border/20">
              {fallbackGoalLeaders.slice(0, 6).map((gk, i) => {
                const initials = gk.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={i} className="bg-card px-2 py-3 flex flex-col items-center text-center gap-1.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className="text-[10px] font-black"
                        style={{
                          backgroundColor: gk.club?.primary_color ?? '#1a365d',
                          color: gk.club?.secondary_color ?? '#d69e2e',
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-[10px] font-bold text-foreground truncate max-w-[80px]">{gk.name}</p>
                    <div className="flex items-center gap-1">
                      <ClubLogo club={gk.club ?? {}} size="sm" className="!h-3 !w-3" />
                      <span className="text-[9px] text-muted-foreground">{gk.club?.short_name}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm font-black tabular-nums text-primary">{gk.goals}</span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 font-bold">{gk.goals === 1 ? 'goal' : 'goals'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Match Info */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Match Info</h3>
        </div>
        <div className="px-4 py-1">
          <dl className="divide-y divide-border/20">
            {[
              { label: 'Round', value: `Round ${fixture.round_number}` },
              matchDate && { label: 'Date', value: matchDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              matchDate && { label: 'Time', value: matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) },
              fixture.venue && { label: 'Venue', value: fixture.venue },
              { label: 'Status', value: statusLabel },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex justify-between py-2">
                <dt className="text-[11px] text-muted-foreground">{item.label}</dt>
                <dd className="text-[11px] font-semibold text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
