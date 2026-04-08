import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, Link } from 'react-router-dom';
import { useFixture } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { MapPin, Calendar, Clock, ChevronLeft, Target, TrendingUp, Award } from 'lucide-react';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';

function generateWormData(result: any) {
  if (!result) return [];
  const parseQ = (q: string | null) => {
    if (!q) return { g: 0, b: 0 };
    const parts = q.split('.');
    return { g: parseInt(parts[0]) || 0, b: parseInt(parts[1]) || 0 };
  };
  const hq1 = parseQ(result.home_q1); const hq2 = parseQ(result.home_q2);
  const hq3 = parseQ(result.home_q3); const aq1 = parseQ(result.away_q1);
  const aq2 = parseQ(result.away_q2); const aq3 = parseQ(result.away_q3);
  const hScores = [0, hq1.g*6+hq1.b, hq2.g*6+hq2.b, hq3.g*6+hq3.b, result.home_score ?? 0];
  const aScores = [0, aq1.g*6+aq1.b, aq2.g*6+aq2.b, aq3.g*6+aq3.b, result.away_score ?? 0];
  return ['Start','Q1','Q2','Q3','Final'].map((label,i) => ({ label, margin: hScores[i]-aScores[i] }));
}

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const pct = (home / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-bold tabular-nums">{home}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</span>
        <span className="font-bold tabular-nums">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted gap-0.5">
        <div className="bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        <div className="bg-accent rounded-full transition-all" style={{ width: `${100-pct}%` }} />
      </div>
    </div>
  );
}

export default function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const { data: fixture, isLoading } = useFixture(id!);
  const result = (fixture as any)?.results?.[0];
  const homeClub = (fixture as any)?.home_team?.clubs;
  const awayClub = (fixture as any)?.away_team?.clubs;
  const wormData = useMemo(() => generateWormData(result), [result]);
  const matchDate = fixture?.scheduled_at ? new Date(fixture.scheduled_at) : null;

  if (isLoading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!fixture) return <Layout><div className="page-container py-16 text-center">Match not found.</div></Layout>;

  const homeWon = result && result.home_score > result.away_score;
  const awayWon = result && result.away_score > result.home_score;

  return (
    <Layout>
      {/* Scoreboard */}
      <div className="sport-gradient relative overflow-hidden">
        <div className="page-container py-5 relative">
          <Link to="/fixtures" className="flex items-center gap-1 text-white/40 text-xs mb-4">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>

          {/* Meta */}
          <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] mb-5 flex-wrap">
            <span className="font-bold uppercase tracking-wider">Rd {fixture.round_number}</span>
            {matchDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{matchDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
            {fixture.venue && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{fixture.venue}</span>}
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-6 md:gap-12">
            <div className={`text-center ${homeWon ? '' : 'opacity-70'}`}>
              <ClubLogo club={homeClub ?? {}} size="lg" className="mx-auto !h-14 !w-14 md:!h-16 md:!w-16 mb-1.5" />
              <div className="text-white text-xs font-bold">{homeClub?.short_name}</div>
            </div>

            <div className="text-center">
              {result ? (
                <>
                  <div className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tighter leading-none">
                    {result.home_score}<span className="text-white/15 mx-2">–</span>{result.away_score}
                  </div>
                  <div className="text-white/30 text-[10px] mt-1 tabular-nums">
                    {result.home_goals}.{result.home_behinds} – {result.away_goals}.{result.away_behinds}
                  </div>
                  <Badge className="mt-2 bg-accent/20 text-accent border-0 rounded-full text-[10px] font-bold">Full Time</Badge>
                </>
              ) : (
                <>
                  <div className="text-3xl font-black text-white/30">VS</div>
                  <Badge variant="outline" className="mt-2 text-white/40 border-white/15 rounded-full text-[10px] capitalize">{fixture.status}</Badge>
                </>
              )}
            </div>

            <div className={`text-center ${awayWon ? '' : 'opacity-70'}`}>
              <ClubLogo club={awayClub ?? {}} size="lg" className="mx-auto !h-14 !w-14 md:!h-16 md:!w-16 mb-1.5" />
              <div className="text-white text-xs font-bold">{awayClub?.short_name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container py-4">
        {result ? (
          <Tabs defaultValue="summary">
            <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/60 rounded-full p-0.5 mb-4">
              <TabsTrigger value="summary" className="rounded-full text-xs font-bold">Summary</TabsTrigger>
              <TabsTrigger value="players" className="rounded-full text-xs font-bold">Players</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-full text-xs font-bold">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              {/* Quarter scores */}
              <div className="match-card overflow-hidden">
                <div className="p-3.5">
                  <h3 className="section-label mb-3">Quarter by Quarter</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 font-bold text-muted-foreground w-20"></th>
                        <th className="text-center py-2 font-bold text-muted-foreground">Q1</th>
                        <th className="text-center py-2 font-bold text-muted-foreground">Q2</th>
                        <th className="text-center py-2 font-bold text-muted-foreground">Q3</th>
                        <th className="text-center py-2 font-bold text-muted-foreground">Q4</th>
                        <th className="text-center py-2 font-bold text-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 flex items-center gap-1.5"><ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" /><span className="font-bold">{homeClub?.short_name}</span></td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q1||'-'}</td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q2||'-'}</td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q3||'-'}</td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q4||`${result.home_goals}.${result.home_behinds}`}</td>
                        <td className="text-center py-2.5 tabular-nums font-black text-sm">{result.home_score}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 flex items-center gap-1.5"><ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" /><span className="font-bold">{awayClub?.short_name}</span></td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q1||'-'}</td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q2||'-'}</td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q3||'-'}</td>
                        <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q4||`${result.away_goals}.${result.away_behinds}`}</td>
                        <td className="text-center py-2.5 tabular-nums font-black text-sm">{result.away_score}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Worm */}
              {wormData.length > 0 && (
                <div className="match-card p-3.5">
                  <h3 className="section-label mb-2 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" />Momentum</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={wormData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(v: number) => v > 0 ? [`${homeClub?.short_name} +${v}`,''] : v < 0 ? [`${awayClub?.short_name} +${Math.abs(v)}`,''] : ['Tied','']}
                        />
                        <Line type="monotone" dataKey="margin" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                    <span>↑ {homeClub?.short_name}</span>
                    <span>{awayClub?.short_name} ↓</span>
                  </div>
                </div>
              )}

              {/* Goal Kickers */}
              {(result.goal_kickers_home?.length > 0 || result.goal_kickers_away?.length > 0) && (
                <div className="match-card p-3.5">
                  <h3 className="section-label mb-3 flex items-center gap-1.5"><Target className="h-3 w-3" />Goal Kickers</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                        <span className="font-bold text-xs">{homeClub?.short_name}</span>
                      </div>
                      {result.goal_kickers_home?.map((gk: string, i: number) => (
                        <div key={i} className="text-xs text-muted-foreground py-0.5">{gk}</div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                        <span className="font-bold text-xs">{awayClub?.short_name}</span>
                      </div>
                      {result.goal_kickers_away?.map((gk: string, i: number) => (
                        <div key={i} className="text-xs text-muted-foreground py-0.5">{gk}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.match_notes && (
                <div className="match-card p-3.5">
                  <h3 className="section-label mb-2">Match Notes</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.match_notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="players" className="space-y-4">
              <div className="match-card p-3.5">
                <h3 className="section-label mb-3 flex items-center gap-1.5"><Award className="h-3 w-3" />Best Players</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-xs">{homeClub?.short_name}</span>
                    </div>
                    {result.best_players_home?.length > 0 ? result.best_players_home.map((p: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center">{i+1}</span>
                        <span className="text-xs">{p}</span>
                      </div>
                    )) : <p className="text-xs text-muted-foreground/50 italic">Not recorded</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-xs">{awayClub?.short_name}</span>
                    </div>
                    {result.best_players_away?.length > 0 ? result.best_players_away.map((p: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[9px] font-black flex items-center justify-center">{i+1}</span>
                        <span className="text-xs">{p}</span>
                      </div>
                    )) : <p className="text-xs text-muted-foreground/50 italic">Not recorded</p>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="match-card p-3.5 space-y-4">
                <h3 className="section-label">Match Stats</h3>
                <StatBar label="Total Score" home={result.home_score ?? 0} away={result.away_score ?? 0} />
                <StatBar label="Goals" home={result.home_goals ?? 0} away={result.away_goals ?? 0} />
                <StatBar label="Behinds" home={result.home_behinds ?? 0} away={result.away_behinds ?? 0} />
                <StatBar
                  label="Accuracy %"
                  home={result.home_goals ? Math.round((result.home_goals/((result.home_goals||0)+(result.home_behinds||0)))*100) : 0}
                  away={result.away_goals ? Math.round((result.away_goals/((result.away_goals||0)+(result.away_behinds||0)))*100) : 0}
                />
              </div>

              <div className="match-card p-3.5">
                <h3 className="section-label mb-3">Match Info</h3>
                <dl className="space-y-2 text-xs">
                  {[
                    { label: 'Round', value: fixture.round_number },
                    matchDate && { label: 'Date', value: matchDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                    fixture.venue && { label: 'Venue', value: fixture.venue },
                    { label: 'Status', value: fixture.status },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="font-semibold capitalize">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="match-card p-8 text-center">
            <div className="text-3xl mb-2">🏈</div>
            <p className="text-sm text-muted-foreground">Match details available after the game.</p>
            {fixture.venue && <p className="text-xs text-muted-foreground/60 mt-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{fixture.venue}</p>}
          </div>
        )}
      </div>
    </Layout>
  );
}
