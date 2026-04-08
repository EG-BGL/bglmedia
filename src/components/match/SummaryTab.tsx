import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Trophy, FileText, Info, ChevronDown, Zap, Target, Hand, Shield, ArrowUpCircle } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
}

function getClubForTeam(teamId: string, fixture: any, homeClub: any, awayClub: any) {
  if (teamId === fixture?.home_team_id || teamId === (fixture as any)?.home_team?.id) return homeClub;
  return awayClub;
}

export default function SummaryTab({ fixture, result, homeClub, awayClub, matchDate, homeWon, awayWon, statusLabel }: SummaryTabProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
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

  // Build match leaders from player stats
  const leaders: LeaderStat[] = [];
  if (playerStats && playerStats.length > 0) {
    const statDefs: { key: string; label: string; icon: React.ReactNode; suffix: string }[] = [
      { key: 'afl_fantasy', label: 'Fantasy', icon: <Zap className="h-4 w-4" />, suffix: 'pts' },
      { key: 'disposals', label: 'Disposals', icon: <Hand className="h-4 w-4" />, suffix: 'disp' },
      { key: 'goals', label: 'Goals', icon: <Target className="h-4 w-4" />, suffix: 'goals' },
      { key: 'marks', label: 'Marks', icon: <ArrowUpCircle className="h-4 w-4" />, suffix: 'marks' },
      { key: 'tackles', label: 'Tackles', icon: <Shield className="h-4 w-4" />, suffix: 'tackles' },
      { key: 'kicks', label: 'Kicks', icon: <Target className="h-4 w-4" />, suffix: 'kicks' },
    ];
    for (const def of statDefs) {
      const sorted = [...playerStats].sort((a: any, b: any) => (b[def.key] ?? 0) - (a[def.key] ?? 0));
      const top = sorted[0];
      if (top && (top as any)[def.key] > 0) {
        const player = (top as any)?.players;
        const name = player ? `${player.first_name} ${player.last_name}` : 'Unknown';
        leaders.push({
          label: def.label,
          icon: def.icon,
          playerName: name,
          value: (top as any)[def.key],
          club: getClubForTeam((top as any).team_id, fixture, homeClub, awayClub),
          suffix: def.suffix,
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
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Quarter by Quarter</h3>
        </div>
        <div className="px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-2 font-bold text-muted-foreground w-24"></th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q1</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q2</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q3</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q4</th>
                <th className="text-center py-2 font-black text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                    <span className={`font-bold truncate ${homeWon ? 'text-foreground' : 'text-muted-foreground'}`}>{homeClub?.short_name}</span>
                  </div>
                </td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q1 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q2 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q3 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q4 || `${result.home_goals}.${result.home_behinds}`}</td>
                <td className={`text-center py-2.5 tabular-nums font-black text-sm ${homeWon ? 'text-primary' : ''}`}>{result.home_score}</td>
              </tr>
              <tr>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                    <span className={`font-bold truncate ${awayWon ? 'text-foreground' : 'text-muted-foreground'}`}>{awayClub?.short_name}</span>
                  </div>
                </td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q1 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q2 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q3 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q4 || `${result.away_goals}.${result.away_behinds}`}</td>
                <td className={`text-center py-2.5 tabular-nums font-black text-sm ${awayWon ? 'text-primary' : ''}`}>{result.away_score}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Leaders */}
      {(leaders.length > 0 || fallbackGoalLeaders.length > 0) && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Match Leaders</h3>
          </div>

          {leaders.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border/20">
              {leaders.map((leader, i) => {
                const initials = leader.playerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={i} className="bg-card p-3 flex flex-col items-center text-center gap-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {leader.icon}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{leader.label}</span>
                    </div>
                    <Avatar className="h-11 w-11">
                      <AvatarFallback
                        className="text-xs font-black"
                        style={{
                          backgroundColor: leader.club?.primary_color ?? '#1a365d',
                          color: leader.club?.secondary_color ?? '#d69e2e',
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold text-foreground truncate max-w-[100px]">{leader.playerName}</p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <ClubLogo club={leader.club ?? {}} size="sm" className="!h-3.5 !w-3.5" />
                        <span className="text-[10px] text-muted-foreground">{leader.club?.short_name}</span>
                      </div>
                    </div>
                    <Badge className="bg-primary/15 text-primary border-0 text-sm font-black tabular-nums px-2.5 py-0.5 rounded-full">
                      {leader.value}
                    </Badge>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold -mt-1">{leader.suffix}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback: goal kickers as leader tiles */
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fallbackGoalLeaders.slice(0, 6).map((gk, i) => {
                const initials = gk.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-1.5">
                    <Avatar className="h-10 w-10">
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
                    <p className="text-xs font-semibold text-foreground truncate max-w-[90px]">{gk.name}</p>
                    <div className="flex items-center gap-1">
                      <ClubLogo club={gk.club ?? {}} size="sm" className="!h-3.5 !w-3.5" />
                      <span className="text-[10px] text-muted-foreground">{gk.club?.short_name}</span>
                    </div>
                    <Badge className="bg-primary/15 text-primary border-0 text-xs font-black tabular-nums px-2 py-0 rounded-full">
                      {gk.goals} {gk.goals === 1 ? 'goal' : 'goals'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Match Notes */}
      {result.match_notes && (
        <div className="match-card overflow-hidden">
          <button onClick={() => setNotesExpanded(!notesExpanded)} className="w-full px-4 py-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Match Notes</h3>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${notesExpanded ? 'rotate-180' : ''}`} />
          </button>
          {notesExpanded && (
            <div className="px-4 pb-4 border-t border-border/30 pt-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{result.match_notes}</p>
            </div>
          )}
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
