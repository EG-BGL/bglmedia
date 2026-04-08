import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import { useFixture, usePlayers } from '@/hooks/useData';

export default function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const { data: fixture, isLoading } = useFixture(id!);

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-8 text-muted-foreground">Loading...</div></Layout>;
  if (!fixture) return <Layout><div className="container mx-auto px-4 py-8">Match not found.</div></Layout>;

  const result = (fixture as any).results?.[0];
  const homeClub = (fixture as any).home_team?.clubs;
  const awayClub = (fixture as any).away_team?.clubs;

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-3 text-primary-foreground/70 border-primary-foreground/20">
            Round {fixture.round_number} • {fixture.scheduled_at ? new Date(fixture.scheduled_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}
          </Badge>

          <div className="flex items-center justify-between md:justify-center md:gap-12 mt-4">
            <div className="text-center">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full mx-auto flex items-center justify-center text-xl font-black" style={{ backgroundColor: homeClub?.primary_color, color: homeClub?.secondary_color }}>
                {homeClub?.short_name?.slice(0, 2)}
              </div>
              <div className="mt-2 font-bold text-primary-foreground text-sm md:text-base">{homeClub?.name}</div>
            </div>

            <div className="text-center">
              {result ? (
                <div>
                  <div className="text-3xl md:text-4xl font-black text-primary-foreground tabular-nums">
                    {result.home_score} - {result.away_score}
                  </div>
                  <Badge className="mt-1 bg-accent text-accent-foreground border-0">Final</Badge>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-primary-foreground/50">vs</div>
                  <Badge variant="outline" className="mt-1 text-primary-foreground/60 border-primary-foreground/20">{fixture.status}</Badge>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full mx-auto flex items-center justify-center text-xl font-black" style={{ backgroundColor: awayClub?.primary_color, color: awayClub?.secondary_color }}>
                {awayClub?.short_name?.slice(0, 2)}
              </div>
              <div className="mt-2 font-bold text-primary-foreground text-sm md:text-base">{awayClub?.name}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {result ? (
          <Tabs defaultValue="scores">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="scores">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-3">Quarter by Quarter</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-semibold">Team</th>
                          <th className="text-center py-2 px-2 font-semibold">Q1</th>
                          <th className="text-center py-2 px-2 font-semibold">Q2</th>
                          <th className="text-center py-2 px-2 font-semibold">Q3</th>
                          <th className="text-center py-2 px-2 font-semibold">Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-semibold">{homeClub?.short_name}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{result.home_q1}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{result.home_q2}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{result.home_q3}</td>
                          <td className="text-center py-2 px-2 font-bold tabular-nums">{result.home_q4 ?? `${result.home_goals}.${result.home_behinds}.${result.home_score}`}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold">{awayClub?.short_name}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{result.away_q1}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{result.away_q2}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{result.away_q3}</td>
                          <td className="text-center py-2 px-2 font-bold tabular-nums">{result.away_q4 ?? `${result.away_goals}.${result.away_behinds}.${result.away_score}`}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="details">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {result.best_players_home?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Best Players - {homeClub?.short_name}</h4>
                      <p className="text-sm text-muted-foreground">{result.best_players_home.join(', ')}</p>
                    </div>
                  )}
                  {result.best_players_away?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Best Players - {awayClub?.short_name}</h4>
                      <p className="text-sm text-muted-foreground">{result.best_players_away.join(', ')}</p>
                    </div>
                  )}
                  {result.goal_kickers_home?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Goal Kickers - {homeClub?.short_name}</h4>
                      <p className="text-sm text-muted-foreground">{result.goal_kickers_home.join(', ')}</p>
                    </div>
                  )}
                  {result.goal_kickers_away?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Goal Kickers - {awayClub?.short_name}</h4>
                      <p className="text-sm text-muted-foreground">{result.goal_kickers_away.join(', ')}</p>
                    </div>
                  )}
                  {result.match_notes && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Match Notes</h4>
                      <p className="text-sm text-muted-foreground">{result.match_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Match details will be available after the game.</p>
              {fixture.venue && <p className="mt-2 text-sm">Venue: {fixture.venue}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
