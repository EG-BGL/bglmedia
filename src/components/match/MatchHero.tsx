import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface MatchHeroProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  homeWon: boolean;
  awayWon: boolean;
  isDraw: boolean;
  statusLabel: string;
  statusClass: string;
  isLive: boolean;
  heroRef: React.RefObject<HTMLDivElement>;
  homeLadder?: any;
  awayLadder?: any;
}

function calcOdds(homeLadder: any, awayLadder: any) {
  const homeWins = homeLadder?.wins ?? 0;
  const homeDraws = homeLadder?.draws ?? 0;
  const homePct = homeLadder?.percentage ?? 100;
  const awayWins = awayLadder?.wins ?? 0;
  const awayDraws = awayLadder?.draws ?? 0;
  const awayPct = awayLadder?.percentage ?? 100;
  const homeStrength = (homeWins * 3 + homeDraws) * (homePct / 100) + 1;
  const awayStrength = (awayWins * 3 + awayDraws) * (awayPct / 100) + 1;
  const total = homeStrength + awayStrength;
  const homeProb = homeStrength / total;
  const awayProb = awayStrength / total;
  const drawProb = 0.08;
  const margin = 1.08;
  return {
    home: Math.max(1.1, (1 / (homeProb * (1 - drawProb / 2))) * margin),
    away: Math.max(1.1, (1 / (awayProb * (1 - drawProb / 2))) * margin),
  };
}

export default function MatchHero({ fixture, result, homeClub, awayClub, matchDate, homeWon, awayWon, isDraw, statusLabel, statusClass, isLive, heroRef, homeLadder, awayLadder }: MatchHeroProps) {
  const odds = calcOdds(homeLadder, awayLadder);
  const homeFav = odds.home < odds.away;
  const isCompleted = fixture.status === 'completed' && result;

  return (
    <div ref={heroRef} className="match-card overflow-hidden">
      <div className="flex items-center justify-center py-2 border-b border-border/30">
        <Badge className={`rounded-full text-[10px] font-black tracking-widest px-3 py-0.5 border-0 ${statusClass}`}>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block" />}
          {statusLabel}
        </Badge>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            <ClubLogo club={homeClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
            <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !homeWon && !isDraw ? 'text-muted-foreground' : ''}`}>
              {homeClub?.short_name}
            </span>
            {homeWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
          </div>

          <div className="text-center px-2 shrink-0">
            {result ? (
              <>
                <div className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none text-foreground">
                  {result.home_score}<span className="text-muted-foreground/20 mx-1.5">–</span>{result.away_score}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5 tabular-nums font-semibold">
                  {result.home_goals}.{result.home_behinds} – {result.away_goals}.{result.away_behinds}
                </div>
              </>
            ) : (
              <div className="text-3xl font-black text-muted-foreground/25 tracking-tight">VS</div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <ClubLogo club={awayClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
            <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !awayWon && !isDraw ? 'text-muted-foreground' : ''}`}>
              {awayClub?.short_name}
            </span>
            {awayWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
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
