import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface RugbyMatchHeroProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  statusLabel: string;
  statusClass: string;
  isLive: boolean;
  heroRef: React.RefObject<HTMLDivElement>;
  rugbyResults?: any[];
}

export default function RugbyMatchHero({
  fixture, result, homeClub, awayClub, matchDate, statusLabel, statusClass, isLive, heroRef, rugbyResults
}: RugbyMatchHeroProps) {
  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;
  const home = rugbyResults?.find((r: any) => r.team_id === homeTeamId);
  const away = rugbyResults?.find((r: any) => r.team_id === awayTeamId);

  const homePts = home?.total_points ?? result?.home_score ?? null;
  const awayPts = away?.total_points ?? result?.away_score ?? null;
  const hasResult = homePts != null && awayPts != null;
  const homeWon = hasResult && homePts > awayPts;
  const awayWon = hasResult && awayPts > homePts;
  const isCompleted = fixture.status === 'completed' && hasResult;

  return (
    <div ref={heroRef} className="match-card overflow-hidden">
      <div className="flex items-center justify-center py-2 border-b border-border/30 gap-2">
        <Badge className={`rounded-full text-[10px] font-black tracking-widest px-3 py-0.5 border-0 ${statusClass}`}>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block" />}
          {statusLabel}
        </Badge>
        <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2 py-0.5 border-0">
          Rugby League
        </Badge>
      </div>

      <div className="px-4 pt-4 pb-6">
        <div className="text-center mb-4">
          <div className="text-sm font-black tracking-tight">
            {homeClub?.name ?? homeClub?.short_name} <span className="text-muted-foreground font-bold mx-1">v</span> {awayClub?.name ?? awayClub?.short_name}
          </div>
          {(fixture?.round_number || matchDate) && (
            <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              {fixture?.round_number ? `Round ${fixture.round_number}` : ''}
              {fixture?.round_number && matchDate ? ' • ' : ''}
              {matchDate ? matchDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
              {matchDate ? ` • ${matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between relative">
          {homeClub?.logo_url && (
            <img src={homeClub.logo_url} alt="" aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 h-32 w-32 md:h-40 md:w-40 object-contain opacity-[0.06] pointer-events-none select-none" />
          )}
          {awayClub?.logo_url && (
            <img src={awayClub.logo_url} alt="" aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 h-32 w-32 md:h-40 md:w-40 object-contain opacity-[0.06] pointer-events-none select-none" />
          )}
          <div className="flex flex-col items-center gap-2 flex-1 relative z-10">
            <ClubLogo club={homeClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
            <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !homeWon ? 'text-muted-foreground' : ''}`}>
              {homeClub?.short_name}
            </span>
            {isCompleted && homeWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
          </div>

          <div className="text-center px-3 shrink-0 min-w-[100px] relative z-10">
            {hasResult ? (
              <div className="flex items-center justify-center gap-2">
                <span className={`text-4xl font-black tabular-nums tracking-tight ${isCompleted && homeWon ? 'text-foreground' : 'text-muted-foreground'}`}>{homePts}</span>
                <span className="text-muted-foreground/40 font-bold">–</span>
                <span className={`text-4xl font-black tabular-nums tracking-tight ${isCompleted && awayWon ? 'text-foreground' : 'text-muted-foreground'}`}>{awayPts}</span>
              </div>
            ) : (
              <div className="text-3xl font-black text-muted-foreground/25 tracking-tight">VS</div>
            )}
            {hasResult && (home?.half_time_points != null || away?.half_time_points != null) && (
              <div className="text-[9px] text-muted-foreground font-semibold mt-1 tabular-nums">
                HT {home?.half_time_points ?? 0}-{away?.half_time_points ?? 0}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1 relative z-10">
            <ClubLogo club={awayClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
            <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !awayWon ? 'text-muted-foreground' : ''}`}>
              {awayClub?.short_name}
            </span>
            {isCompleted && awayWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
          </div>
        </div>

        {/* Try / Conv / Pen / FG breakdown */}
        {hasResult && (home || away) && (
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-border/30">
            {[
              { label: 'Tries', h: home?.tries ?? 0, a: away?.tries ?? 0 },
              { label: 'Conv', h: home?.conversions ?? 0, a: away?.conversions ?? 0 },
              { label: 'Pen', h: home?.penalty_goals ?? 0, a: away?.penalty_goals ?? 0 },
              { label: 'FG', h: home?.field_goals ?? 0, a: away?.field_goals ?? 0 },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</div>
                <div className="flex items-center justify-center gap-2 text-xs tabular-nums font-bold">
                  <span>{stat.h}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{stat.a}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
