import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { useParams, Link } from 'react-router-dom';
import { useFixture } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { MapPin, Calendar, Clock, ChevronLeft, Target, Award, FileText, Info, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const { data: fixture, isLoading } = useFixture(id!);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [showStickyScore, setShowStickyScore] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyScore(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [fixture]);

  const result = (fixture as any)?.results?.[0];
  const homeClub = (fixture as any)?.home_team?.clubs;
  const awayClub = (fixture as any)?.away_team?.clubs;
  const matchDate = fixture?.scheduled_at ? new Date(fixture.scheduled_at) : null;

  if (isLoading) return <Layout><div className="page-container py-16 text-center text-sm text-muted-foreground">Loading match...</div></Layout>;
  if (!fixture) return <Layout><div className="page-container py-16 text-center text-sm text-muted-foreground">Match not found.</div></Layout>;

  const homeWon = result && result.home_score > result.away_score;
  const awayWon = result && result.away_score > result.home_score;
  const isDraw = result && result.home_score === result.away_score;
  const isCompleted = fixture.status === 'completed' && result;
  const isLive = fixture.status === 'in_progress';

  const statusLabel = isLive ? 'LIVE' : isCompleted ? 'FINAL' : 'UPCOMING';
  const statusClass = isLive
    ? 'bg-destructive text-destructive-foreground'
    : isCompleted
      ? 'bg-muted text-muted-foreground'
      : 'bg-primary/15 text-primary';

  return (
    <Layout>
      <div className="page-container py-4 space-y-3">
        {/* Back link */}
        <Link to="/fixtures" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Fixtures & Results
        </Link>

        {/* ─── TILE 1: Hero Score ─── */}
        <div className="match-card overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-center py-2 border-b border-border/30">
            <Badge className={`rounded-full text-[10px] font-black tracking-widest px-3 py-0.5 border-0 ${statusClass}`}>
              {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block" />}
              {statusLabel}
            </Badge>
          </div>

          {/* Score area */}
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              {/* Home team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <ClubLogo club={homeClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
                <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !homeWon && !isDraw ? 'text-muted-foreground' : ''}`}>
                  {homeClub?.short_name}
                </span>
                {homeWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
              </div>

              {/* Score */}
              <div className="text-center px-2 shrink-0">
                {result ? (
                  <>
                    <div className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none text-foreground">
                      {result.home_score}
                      <span className="text-muted-foreground/20 mx-1.5">–</span>
                      {result.away_score}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5 tabular-nums font-semibold">
                      {result.home_goals}.{result.home_behinds} – {result.away_goals}.{result.away_behinds}
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-black text-muted-foreground/25 tracking-tight">VS</div>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <ClubLogo club={awayClub ?? {}} size="lg" className="!h-14 !w-14 md:!h-16 md:!w-16" />
                <span className={`text-xs font-bold text-center leading-tight ${isCompleted && !awayWon && !isDraw ? 'text-muted-foreground' : ''}`}>
                  {awayClub?.short_name}
                </span>
                {awayWon && <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black bg-primary/10 text-primary border-0">WIN</Badge>}
              </div>
            </div>
          </div>

          {/* Venue / date strip */}
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

        {/* Only show detail tiles for completed/live matches */}
        {result && (
          <>
            {/* ─── TILE 2: Quarter Breakdown ─── */}
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
                    <tr className={`border-b border-border/20 ${homeWon ? '' : ''}`}>
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

            {/* ─── TILE 3: Best Players ─── */}
            {(result.best_players_home?.length > 0 || result.best_players_away?.length > 0) && (
              <div className="match-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Best Players</h3>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-4">
                  {/* Home */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                      <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-xs">{homeClub?.short_name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {result.best_players_home?.map((p: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="text-xs">{p}</span>
                        </div>
                      )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
                    </div>
                  </div>
                  {/* Away */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                      <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-xs">{awayClub?.short_name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {result.best_players_away?.map((p: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="text-xs">{p}</span>
                        </div>
                      )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TILE 4: Goal Kickers ─── */}
            {(result.goal_kickers_home?.length > 0 || result.goal_kickers_away?.length > 0) && (
              <div className="match-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Goal Kickers</h3>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                      <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-xs">{homeClub?.short_name}</span>
                    </div>
                    <div className="space-y-1">
                      {result.goal_kickers_home?.map((gk: string, i: number) => (
                        <div key={i} className="text-xs text-muted-foreground py-0.5">{gk}</div>
                      )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                      <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-xs">{awayClub?.short_name}</span>
                    </div>
                    <div className="space-y-1">
                      {result.goal_kickers_away?.map((gk: string, i: number) => (
                        <div key={i} className="text-xs text-muted-foreground py-0.5">{gk}</div>
                      )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TILE 5: Match Notes ─── */}
            {result.match_notes && (
              <div className="match-card overflow-hidden">
                <button
                  onClick={() => setNotesExpanded(!notesExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
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

            {/* ─── TILE 6: Match Info ─── */}
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
          </>
        )}

        {/* Upcoming match placeholder */}
        {!result && (
          <div className="match-card p-8 text-center">
            <div className="text-3xl mb-3">🏈</div>
            <p className="text-sm font-semibold text-foreground mb-1">Match details available after the game</p>
            <p className="text-xs text-muted-foreground">Check back after kick-off for live scores and stats.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
