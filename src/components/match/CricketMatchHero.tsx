import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface CricketMatchHeroProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  statusLabel: string;
  statusClass: string;
  isLive: boolean;
  heroRef: React.RefObject<HTMLDivElement>;
  inningsData?: any[];
}

export default function CricketMatchHero({
  fixture, result, homeClub, awayClub, matchDate, statusLabel, statusClass, isLive, heroRef, inningsData
}: CricketMatchHeroProps) {
  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;

  const homeInnings = inningsData?.filter((i: any) => i.team_id === homeTeamId) ?? [];
  const awayInnings = inningsData?.filter((i: any) => i.team_id === awayTeamId) ?? [];

  const homeTotalRuns = homeInnings.reduce((sum: number, i: any) => sum + (i.total_runs ?? 0), 0);
  const awayTotalRuns = awayInnings.reduce((sum: number, i: any) => sum + (i.total_runs ?? 0), 0);
  const homeWon = homeTotalRuns > awayTotalRuns;
  const awayWon = awayTotalRuns > homeTotalRuns;

  const hasInnings = inningsData && inningsData.length > 0;
  const isCompleted = fixture.status === 'completed';

  // Format innings scores like "245/8d & 180/10"
  const formatInnings = (innings: any[]) => {
    return innings.map((inn: any) => {
      let s = `${inn.total_runs}/${inn.total_wickets}`;
      if (inn.declared) s += 'd';
      return s;
    }).join(' & ');
  };

  return (
    <div ref={heroRef} className="match-card overflow-hidden">
      <div className="flex items-center justify-center py-2 border-b border-border/30 gap-2">
        <Badge className={`rounded-full text-[10px] font-black tracking-widest px-3 py-0.5 border-0 ${statusClass}`}>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block" />}
          {statusLabel}
        </Badge>
        {fixture.match_format && (
          <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2 py-0.5 border-0">
            {fixture.match_format}
          </Badge>
        )}
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            <ClubLogo club={homeClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
            <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !homeWon ? 'text-muted-foreground' : ''}`}>
              {homeClub?.short_name}
            </span>
            {isCompleted && homeWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
          </div>

          <div className="text-center px-2 shrink-0">
            {hasInnings ? (
              <div>
                <div className="text-3xl md:text-4xl font-black tabular-nums tracking-tighter leading-none text-foreground">
                  {homeTotalRuns}<span className="text-muted-foreground/20 mx-1.5">–</span>{awayTotalRuns}
                </div>
                <div className="mt-2 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground tabular-nums">{formatInnings(homeInnings)}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">{formatInnings(awayInnings)}</div>
                </div>
              </div>
            ) : result ? (
              <div className="text-3xl md:text-4xl font-black tabular-nums tracking-tighter leading-none text-foreground">
                {result.home_score}<span className="text-muted-foreground/20 mx-1.5">–</span>{result.away_score}
              </div>
            ) : (
              <div className="text-3xl font-black text-muted-foreground/25 tracking-tight">VS</div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <ClubLogo club={awayClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
            <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !awayWon ? 'text-muted-foreground' : ''}`}>
              {awayClub?.short_name}
            </span>
            {isCompleted && awayWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
          </div>
        </div>
      </div>

      <div className="bg-muted/40 border-t border-border/30 px-4 py-2.5 flex items-center justify-center gap-3 text-[10px] text-muted-foreground flex-wrap">
        {fixture.venue && (
          <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5 shrink-0" />{fixture.venue}</span>
        )}
        {matchDate && (
          <>
            <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5 shrink-0" />{matchDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5 shrink-0" />{matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
          </>
        )}
      </div>
    </div>
  );
}
