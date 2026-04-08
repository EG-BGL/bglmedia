import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'react-router-dom';
import { useFixture } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { MapPin, Calendar, Clock, Trophy, Target, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';

function generateWormData(result: any) {
  if (!result) return [];
  const homeFinal = result.home_score ?? 0;
  const awayFinal = result.away_score ?? 0;

  const parseQ = (q: string | null) => {
    if (!q) return { g: 0, b: 0 };
    const parts = q.split('.');
    return { g: parseInt(parts[0]) || 0, b: parseInt(parts[1]) || 0 };
  };

  const hq1 = parseQ(result.home_q1);
  const hq2 = parseQ(result.home_q2);
  const hq3 = parseQ(result.home_q3);
  const aq1 = parseQ(result.away_q1);
  const aq2 = parseQ(result.away_q2);
  const aq3 = parseQ(result.away_q3);

  const hScores = [
    0,
    hq1.g * 6 + hq1.b,
    hq2.g * 6 + hq2.b,
    hq3.g * 6 + hq3.b,
    homeFinal,
  ];
  const aScores = [
    0,
    aq1.g * 6 + aq1.b,
    aq2.g * 6 + aq2.b,
    aq3.g * 6 + aq3.b,
    awayFinal,
  ];

  const labels = ['Start', 'Q1', 'Q2', 'Q3', 'Final'];
  return labels.map((label, i) => ({
    label,
    margin: hScores[i] - aScores[i],
    home: hScores[i],
    away: aScores[i],
  }));
}

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="tabular-nums">{home}</span>
        <span className="text-muted-foreground uppercase tracking-wide text-[10px]">{label}</span>
        <span className="tabular-nums">{away}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div className="bg-primary rounded-l-full transition-all" style={{ width: `${homePct}%` }} />
        <div className="bg-secondary rounded-r-full transition-all" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

function QuarterTable({ result, homeClub, awayClub }: { result: any; homeClub: any; awayClub: any }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Team</th>
            <th className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Q1</th>
            <th className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Q2</th>
            <th className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Q3</th>
            <th className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Q4</th>
            <th className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2.5 px-3">
              <div className="flex items-center gap-2">
                <ClubLogo club={homeClub} size="sm" />
                <span className="font-semibold">{homeClub?.short_name}</span>
              </div>
            </td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.home_q1 || '-'}</td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.home_q2 || '-'}</td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.home_q3 || '-'}</td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.home_q4 || `${result.home_goals}.${result.home_behinds}`}</td>
            <td className="text-center py-2.5 px-2 tabular-nums font-bold">{result.home_score}</td>
          </tr>
          <tr>
            <td className="py-2.5 px-3">
              <div className="flex items-center gap-2">
                <ClubLogo club={awayClub} size="sm" />
                <span className="font-semibold">{awayClub?.short_name}</span>
              </div>
            </td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.away_q1 || '-'}</td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.away_q2 || '-'}</td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.away_q3 || '-'}</td>
            <td className="text-center py-2.5 px-2 tabular-nums text-muted-foreground">{result.away_q4 || `${result.away_goals}.${result.away_behinds}`}</td>
            <td className="text-center py-2.5 px-2 tabular-nums font-bold">{result.away_score}</td>
          </tr>
        </tbody>
      </table>
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

  const matchDate = fixture?.scheduled_at
    ? new Date(fixture.scheduled_at)
    : null;

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading match...</div></Layout>;
  if (!fixture) return <Layout><div className="container mx-auto px-4 py-16 text-center">Match not found.</div></Layout>;

  const homeWon = result && result.home_score > result.away_score;
  const awayWon = result && result.away_score > result.home_score;
  const isDraw = result && result.home_score === result.away_score;

  return (
    <Layout>
      {/* Hero Header */}
      <section className="sport-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="container mx-auto px-4 py-6 md:py-10 relative">
          {/* Match meta */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-primary-foreground/60 text-xs md:text-sm">
            <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground/70 font-semibold">
              Round {fixture.round_number}
            </Badge>
            {matchDate && (
              <>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{matchDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
            {fixture.venue && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{fixture.venue}</span>
            )}
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-4 md:gap-10 lg:gap-16">
            {/* Home Team */}
            <div className={`text-center flex-1 max-w-[180px] ${homeWon ? '' : 'opacity-80'}`}>
              <div className="mx-auto mb-2">
                <ClubLogo club={homeClub || {}} size="lg" className="mx-auto !h-16 !w-16 md:!h-20 md:!w-20 shadow-lg" />
              </div>
              <div className="font-bold text-primary-foreground text-sm md:text-base truncate">{homeClub?.name}</div>
              {homeWon && <Badge className="mt-1 bg-accent/20 text-accent border-0 text-[10px]">Winner</Badge>}
            </div>

            {/* Score */}
            <div className="text-center shrink-0">
              {result ? (
                <div>
                  <div className="text-4xl md:text-5xl lg:text-6xl font-black text-primary-foreground tabular-nums tracking-tight">
                    {result.home_score}
                    <span className="text-primary-foreground/30 mx-2 md:mx-3">-</span>
                    {result.away_score}
                  </div>
                  <div className="mt-1 text-xs text-primary-foreground/50 tabular-nums">
                    {result.home_goals}.{result.home_behinds} ({result.home_score}) vs {result.away_goals}.{result.away_behinds} ({result.away_score})
                  </div>
                  <Badge className="mt-2 bg-accent text-accent-foreground border-0 text-xs font-bold">
                    {isDraw ? 'Draw' : 'Full Time'}
                  </Badge>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-bold text-primary-foreground/40">VS</div>
                  <Badge variant="outline" className="mt-2 text-primary-foreground/50 border-primary-foreground/20 capitalize">
                    {fixture.status}
                  </Badge>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className={`text-center flex-1 max-w-[180px] ${awayWon ? '' : 'opacity-80'}`}>
              <div className="mx-auto mb-2">
                <ClubLogo club={awayClub || {}} size="lg" className="mx-auto !h-16 !w-16 md:!h-20 md:!w-20 shadow-lg" />
              </div>
              <div className="font-bold text-primary-foreground text-sm md:text-base truncate">{awayClub?.name}</div>
              {awayWon && <Badge className="mt-1 bg-accent/20 text-accent border-0 text-[10px]">Winner</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {result ? (
          <>
            {/* Tabs */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 p-1">
                <TabsTrigger value="summary" className="text-xs md:text-sm">Summary</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs md:text-sm">Stats</TabsTrigger>
                <TabsTrigger value="players" className="text-xs md:text-sm">Players</TabsTrigger>
                <TabsTrigger value="info" className="text-xs md:text-sm">Info</TabsTrigger>
              </TabsList>

              {/* SUMMARY TAB */}
              <TabsContent value="summary" className="space-y-4 mt-4">
                {/* Quarter Scores */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quarter by Quarter</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <QuarterTable result={result} homeClub={homeClub} awayClub={awayClub} />
                  </CardContent>
                </Card>

                {/* Match Momentum Worm */}
                {wormData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Match Momentum
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                      <div className="h-48 md:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={wormData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip
                              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                              formatter={(value: number) => {
                                if (value > 0) return [`${homeClub?.short_name} +${value}`, 'Margin'];
                                if (value < 0) return [`${awayClub?.short_name} +${Math.abs(value)}`, 'Margin'];
                                return ['Tied', 'Margin'];
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="margin"
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                              dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                              activeDot={{ r: 7 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-4">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                          Above = {homeClub?.short_name} leading
                        </span>
                        <span className="flex items-center gap-1">
                          Below = {awayClub?.short_name} leading
                          <span className="h-2 w-2 rounded-full bg-secondary inline-block" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Goal Kickers */}
                {(result.goal_kickers_home?.length > 0 || result.goal_kickers_away?.length > 0) && (
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" /> Goal Kickers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ClubLogo club={homeClub || {}} size="sm" />
                            <span className="font-semibold text-sm">{homeClub?.short_name}</span>
                          </div>
                          {result.goal_kickers_home?.length > 0 ? (
                            <ul className="space-y-1">
                              {result.goal_kickers_home.map((gk: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground pl-2 border-l-2 border-primary/20">{gk}</li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-muted-foreground/50 italic">No goal kickers recorded</p>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ClubLogo club={awayClub || {}} size="sm" />
                            <span className="font-semibold text-sm">{awayClub?.short_name}</span>
                          </div>
                          {result.goal_kickers_away?.length > 0 ? (
                            <ul className="space-y-1">
                              {result.goal_kickers_away.map((gk: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground pl-2 border-l-2 border-secondary/40">{gk}</li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-muted-foreground/50 italic">No goal kickers recorded</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* STATS TAB */}
              <TabsContent value="stats" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Stats</CardTitle>
                    <p className="text-xs text-muted-foreground/60 mt-1">Based on scoring data</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    <StatBar label="Total Score" home={result.home_score ?? 0} away={result.away_score ?? 0} />
                    <StatBar label="Goals" home={result.home_goals ?? 0} away={result.away_goals ?? 0} />
                    <StatBar label="Behinds" home={result.home_behinds ?? 0} away={result.away_behinds ?? 0} />
                    <StatBar
                      label="Accuracy %"
                      home={result.home_goals ? Math.round((result.home_goals / ((result.home_goals || 0) + (result.home_behinds || 0))) * 100) : 0}
                      away={result.away_goals ? Math.round((result.away_goals / ((result.away_goals || 0) + (result.away_behinds || 0))) * 100) : 0}
                    />
                  </CardContent>
                </Card>

                {/* Match Leaders */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Match Leaders
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/60 mt-1">Best players as nominated by coaches</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ClubLogo club={homeClub || {}} size="sm" />
                          <span className="font-semibold text-sm">{homeClub?.short_name}</span>
                        </div>
                        {result.best_players_home?.length > 0 ? (
                          <div className="space-y-2">
                            {result.best_players_home.map((p: string, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                                <span className="text-sm">{p}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground/50 italic">Not recorded</p>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ClubLogo club={awayClub || {}} size="sm" />
                          <span className="font-semibold text-sm">{awayClub?.short_name}</span>
                        </div>
                        {result.best_players_away?.length > 0 ? (
                          <div className="space-y-2">
                            {result.best_players_away.map((p: string, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary/30 text-secondary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                                <span className="text-sm">{p}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground/50 italic">Not recorded</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PLAYERS TAB */}
              <TabsContent value="players" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Best Players</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ClubLogo club={homeClub || {}} size="sm" />
                          <span className="font-semibold text-sm">{homeClub?.name}</span>
                        </div>
                        {result.best_players_home?.length > 0 ? (
                          <div className="space-y-1.5">
                            {result.best_players_home.map((p: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="text-xs font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                                <span className="text-sm font-medium">{p}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground/50 italic">No best players recorded</p>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ClubLogo club={awayClub || {}} size="sm" />
                          <span className="font-semibold text-sm">{awayClub?.name}</span>
                        </div>
                        {result.best_players_away?.length > 0 ? (
                          <div className="space-y-1.5">
                            {result.best_players_away.map((p: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="text-xs font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                                <span className="text-sm font-medium">{p}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground/50 italic">No best players recorded</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Goal Kickers detail */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Goal Kickers</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ClubLogo club={homeClub || {}} size="sm" />
                          <span className="font-semibold text-sm">{homeClub?.short_name}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">{result.home_goals ?? 0} goals</Badge>
                        </div>
                        {result.goal_kickers_home?.length > 0 ? (
                          <ul className="space-y-1">
                            {result.goal_kickers_home.map((gk: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground py-1 px-2 hover:bg-muted/50 rounded">{gk}</li>
                            ))}
                          </ul>
                        ) : <p className="text-sm text-muted-foreground/50 italic">Not recorded</p>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ClubLogo club={awayClub || {}} size="sm" />
                          <span className="font-semibold text-sm">{awayClub?.short_name}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">{result.away_goals ?? 0} goals</Badge>
                        </div>
                        {result.goal_kickers_away?.length > 0 ? (
                          <ul className="space-y-1">
                            {result.goal_kickers_away.map((gk: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground py-1 px-2 hover:bg-muted/50 rounded">{gk}</li>
                            ))}
                          </ul>
                        ) : <p className="text-sm text-muted-foreground/50 italic">Not recorded</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* INFO TAB */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Information</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <dt className="text-muted-foreground">Round</dt>
                        <dd className="font-semibold">{fixture.round_number}</dd>
                      </div>
                      {matchDate && (
                        <>
                          <div className="flex justify-between py-1.5 border-b border-border/50">
                            <dt className="text-muted-foreground">Date</dt>
                            <dd className="font-semibold">{matchDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-border/50">
                            <dt className="text-muted-foreground">Time</dt>
                            <dd className="font-semibold">{matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</dd>
                          </div>
                        </>
                      )}
                      {fixture.venue && (
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                          <dt className="text-muted-foreground">Venue</dt>
                          <dd className="font-semibold">{fixture.venue}</dd>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <dt className="text-muted-foreground">Status</dt>
                        <dd><Badge variant="outline" className="capitalize text-xs">{fixture.status}</Badge></dd>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <dt className="text-muted-foreground">Home Team</dt>
                        <dd className="font-semibold flex items-center gap-2"><ClubLogo club={homeClub || {}} size="sm" />{homeClub?.name}</dd>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <dt className="text-muted-foreground">Away Team</dt>
                        <dd className="font-semibold flex items-center gap-2"><ClubLogo club={awayClub || {}} size="sm" />{awayClub?.name}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {result.match_notes && (
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.match_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <div className="text-4xl">🏈</div>
              <p className="text-muted-foreground font-medium">Match details will be available after the game.</p>
              {fixture.venue && (
                <p className="text-sm text-muted-foreground/70 flex items-center justify-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {fixture.venue}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
