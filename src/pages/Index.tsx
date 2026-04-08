import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Trophy, Users, ArrowRight, MapPin, Newspaper } from 'lucide-react';
import { useClubs, useFixtures, useResults, useLadder, useCurrentSeason, useNews } from '@/hooks/useData';

export default function Index() {
  const { data: season } = useCurrentSeason();
  const { data: clubs } = useClubs();
  const { data: fixtures } = useFixtures(season?.id);
  const { data: results } = useResults(season?.id);
  const { data: ladder } = useLadder(season?.id);

  const upcomingFixtures = fixtures?.filter(f => f.status === 'scheduled').slice(0, 4) ?? [];
  const latestResults = results?.slice(0, 4) ?? [];
  const topLadder = ladder?.slice(0, 5) ?? [];

  return (
    <Layout>
      {/* Hero */}
      <section className="sport-gradient py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-accent text-accent-foreground border-0">
            {season ? `${season.name} Season` : '2026 Season'}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black text-primary-foreground mb-4 tracking-tight">
            FootyLeague
          </h1>
          <p className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Your home for local Australian rules football. Live fixtures, results, ladders, and club news.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/fixtures"><Calendar className="mr-2 h-4 w-4" />View Fixtures</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/ladder"><Trophy className="mr-2 h-4 w-4" />Ladder</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Upcoming Fixtures */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Upcoming Fixtures</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/fixtures">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingFixtures.length === 0 ? (
              <p className="text-muted-foreground col-span-2">No upcoming fixtures yet.</p>
            ) : upcomingFixtures.map((f: any) => (
              <Card key={f.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">Round {f.round_number}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBA'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{f.home_team?.clubs?.short_name}</div>
                    <span className="text-xs text-muted-foreground px-2">vs</span>
                    <div className="font-semibold text-sm">{f.away_team?.clubs?.short_name}</div>
                  </div>
                  {f.venue && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{f.venue}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Latest Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Latest Results</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/results">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {latestResults.length === 0 ? (
              <p className="text-muted-foreground col-span-2">No results yet.</p>
            ) : latestResults.map((r: any) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Badge variant="outline" className="text-xs mb-2">Round {r.fixtures?.round_number}</Badge>
                  <div className="flex items-center justify-between text-sm">
                    <div className={`font-bold ${r.home_score > r.away_score ? 'text-sport-green' : ''}`}>
                      {r.fixtures?.home_team?.clubs?.short_name}
                    </div>
                    <div className="font-black text-lg tabular-nums">
                      {r.home_goals}.{r.home_behinds}.{r.home_score}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className={`font-bold ${r.away_score > r.home_score ? 'text-sport-green' : ''}`}>
                      {r.fixtures?.away_team?.clubs?.short_name}
                    </div>
                    <div className="font-black text-lg tabular-nums">
                      {r.away_goals}.{r.away_behinds}.{r.away_score}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ladder Snapshot */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Ladder</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ladder">Full Ladder <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-3 font-semibold">#</th>
                      <th className="text-left py-2 px-3 font-semibold">Team</th>
                      <th className="text-center py-2 px-3 font-semibold">P</th>
                      <th className="text-center py-2 px-3 font-semibold">W</th>
                      <th className="text-center py-2 px-3 font-semibold">L</th>
                      <th className="text-center py-2 px-3 font-semibold">%</th>
                      <th className="text-center py-2 px-3 font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLadder.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No ladder data yet.</td></tr>
                    ) : topLadder.map((entry: any, i: number) => (
                      <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-3 font-bold">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold">{entry.teams?.clubs?.short_name}</td>
                        <td className="text-center py-2 px-3">{entry.played}</td>
                        <td className="text-center py-2 px-3">{entry.wins}</td>
                        <td className="text-center py-2 px-3">{entry.losses}</td>
                        <td className="text-center py-2 px-3">{Number(entry.percentage).toFixed(1)}</td>
                        <td className="text-center py-2 px-3 font-bold">{entry.competition_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Clubs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Clubs</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/clubs">All Clubs <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(clubs ?? []).slice(0, 8).map((club: any) => (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <Card className="hover:shadow-md transition-shadow text-center">
                  <CardContent className="p-4">
                    <div
                      className="h-12 w-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-black"
                      style={{ backgroundColor: club.primary_color, color: club.secondary_color }}
                    >
                      {club.short_name?.slice(0, 2)}
                    </div>
                    <div className="font-semibold text-sm truncate">{club.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
