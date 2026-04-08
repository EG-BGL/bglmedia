import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Trophy, Users, ArrowRight, MapPin, Newspaper, ChevronRight, Clock, Star, TrendingUp } from 'lucide-react';
import { useClubs, useFixtures, useResults, useLadder, useCurrentSeason, useNews } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';

export default function Index() {
  const { data: season } = useCurrentSeason();
  const { data: clubs } = useClubs();
  const { data: fixtures } = useFixtures(season?.id);
  const { data: results } = useResults(season?.id);
  const { data: ladder } = useLadder(season?.id);
  const { data: news } = useNews(3);

  const upcomingFixtures = fixtures?.filter(f => f.status === 'scheduled').slice(0, 4) ?? [];
  const latestResults = results?.slice(0, 6) ?? [];
  const topLadder = ladder?.slice(0, 6) ?? [];
  const featuredMatch = latestResults[0];

  return (
    <Layout>
      {/* Hero */}
      <section className="sport-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--sport-gold)/0.1)_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 py-14 md:py-24 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0 text-xs font-bold uppercase tracking-wider px-3 py-1">
              {season ? `${season.name} Season` : '2026 Season'} • Live
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-primary-foreground mb-4 tracking-tight leading-[1.1]">
              Your Home for<br />
              <span className="text-accent">Community Football</span>
            </h1>
            <p className="text-primary-foreground/60 text-base md:text-lg max-w-xl mb-8 leading-relaxed">
              Live fixtures, results, ladders, and club news for your local Australian rules football competition.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                <Link to="/fixtures"><Calendar className="mr-2 h-4 w-4" />View Fixtures</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/ladder"><Trophy className="mr-2 h-4 w-4" />Ladder</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Scores Strip */}
      {latestResults.length > 0 && (
        <section className="score-strip border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 py-2 overflow-x-auto scrollbar-hide">
              <span className="text-accent text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                Latest
              </span>
              <Separator orientation="vertical" className="h-6 bg-primary-foreground/20" />
              {latestResults.slice(0, 5).map((r: any) => (
                <Link
                  key={r.id}
                  to={`/match/${r.fixture_id}`}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-primary-foreground/5 transition-colors whitespace-nowrap shrink-0"
                >
                  <span className={`text-xs font-bold ${r.home_score > r.away_score ? 'text-primary-foreground' : 'text-primary-foreground/50'}`}>
                    {r.fixtures?.home_team?.clubs?.short_name}
                  </span>
                  <span className="text-primary-foreground font-black text-sm stat-number">
                    {r.home_score}
                  </span>
                  <span className="text-primary-foreground/30 text-xs">-</span>
                  <span className="text-primary-foreground font-black text-sm stat-number">
                    {r.away_score}
                  </span>
                  <span className={`text-xs font-bold ${r.away_score > r.home_score ? 'text-primary-foreground' : 'text-primary-foreground/50'}`}>
                    {r.fixtures?.away_team?.clubs?.short_name}
                  </span>
                </Link>
              ))}
              <Link to="/results" className="text-accent text-xs font-bold hover:underline whitespace-nowrap ml-auto shrink-0 flex items-center gap-1">
                All Results <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8 md:py-12 space-y-10 md:space-y-14">

        {/* Featured Match + Upcoming Fixtures Row */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Featured Match */}
          {featuredMatch && (
            <div className="lg:col-span-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" /> Featured Result
              </h2>
              <Link to={`/match/${featuredMatch.fixture_id}`} className="block">
                <div className="card-sport-highlight p-5 md:p-6">
                  <Badge variant="outline" className="text-xs mb-3">
                    Round {featuredMatch.fixtures?.round_number}
                  </Badge>
                  <div className="space-y-4">
                    {/* Home */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                          style={{
                            backgroundColor: featuredMatch.fixtures?.home_team?.clubs?.primary_color,
                            color: featuredMatch.fixtures?.home_team?.clubs?.secondary_color
                          }}
                        >
                          {featuredMatch.fixtures?.home_team?.clubs?.short_name?.slice(0, 2)}
                        </div>
                        <span className="font-bold text-sm">{featuredMatch.fixtures?.home_team?.clubs?.name}</span>
                      </div>
                      <div className={`stat-number text-2xl ${featuredMatch.home_score! > featuredMatch.away_score! ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {featuredMatch.home_goals}.{featuredMatch.home_behinds}.{featuredMatch.home_score}
                      </div>
                    </div>
                    {/* Away */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                          style={{
                            backgroundColor: featuredMatch.fixtures?.away_team?.clubs?.primary_color,
                            color: featuredMatch.fixtures?.away_team?.clubs?.secondary_color
                          }}
                        >
                          {featuredMatch.fixtures?.away_team?.clubs?.short_name?.slice(0, 2)}
                        </div>
                        <span className="font-bold text-sm">{featuredMatch.fixtures?.away_team?.clubs?.name}</span>
                      </div>
                      <div className={`stat-number text-2xl ${featuredMatch.away_score! > featuredMatch.home_score! ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {featuredMatch.away_goals}.{featuredMatch.away_behinds}.{featuredMatch.away_score}
                      </div>
                    </div>
                  </div>
                  {featuredMatch.fixtures?.venue && (
                    <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {featuredMatch.fixtures?.venue}
                    </div>
                  )}
                  <div className="mt-4 text-xs font-bold text-accent flex items-center gap-1">
                    Match Centre <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Upcoming Fixtures */}
          <div className={featuredMatch ? 'lg:col-span-3' : 'lg:col-span-5'}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" /> Upcoming Fixtures
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-accent text-xs font-bold">
                <Link to="/fixtures">View All <ChevronRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {upcomingFixtures.length === 0 ? (
                <p className="text-muted-foreground text-sm col-span-2 py-8 text-center">No upcoming fixtures scheduled.</p>
              ) : upcomingFixtures.map((f: any) => (
                <div key={f.id} className="card-sport p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <Badge variant="outline" className="text-xs">Rd {f.round_number}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBA'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: f.home_team?.clubs?.primary_color, color: f.home_team?.clubs?.secondary_color }}
                      >
                        {f.home_team?.clubs?.short_name?.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-sm truncate">{f.home_team?.clubs?.short_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-bold px-2">vs</span>
                    <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: f.away_team?.clubs?.primary_color, color: f.away_team?.clubs?.secondary_color }}
                      >
                        {f.away_team?.clubs?.short_name?.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-sm truncate">{f.away_team?.clubs?.short_name}</span>
                    </div>
                  </div>
                  {f.venue && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{f.venue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ladder + Latest Results Row */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Ladder */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Ladder
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-accent text-xs font-bold">
                <Link to="/ladder">Full Ladder <ChevronRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground w-8">#</th>
                        <th className="text-left py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Team</th>
                        <th className="text-center py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">P</th>
                        <th className="text-center py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">W</th>
                        <th className="text-center py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">L</th>
                        <th className="text-center py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">%</th>
                        <th className="text-center py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLadder.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No ladder data yet.</td></tr>
                      ) : topLadder.map((entry: any, i: number) => (
                        <tr key={entry.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i < 4 ? '' : 'opacity-70'}`}>
                          <td className="py-2.5 px-3">
                            <span className={`font-black text-sm ${i < 4 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                style={{ backgroundColor: entry.teams?.clubs?.primary_color, color: entry.teams?.clubs?.secondary_color }}
                              >
                                {entry.teams?.clubs?.short_name?.slice(0, 2)}
                              </div>
                              <span className="font-semibold text-sm">{entry.teams?.clubs?.short_name}</span>
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-3 stat-number">{entry.played}</td>
                          <td className="text-center py-2.5 px-3 stat-number">{entry.wins}</td>
                          <td className="text-center py-2.5 px-3 stat-number">{entry.losses}</td>
                          <td className="text-center py-2.5 px-3 stat-number hidden sm:table-cell">{Number(entry.percentage).toFixed(1)}</td>
                          <td className="text-center py-2.5 px-3 stat-number font-black">{entry.competition_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Results */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" /> Results
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-accent text-xs font-bold">
                <Link to="/results">View All <ChevronRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="space-y-2">
              {latestResults.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No results yet.</p>
              ) : latestResults.slice(0, 5).map((r: any) => (
                <Link key={r.id} to={`/match/${r.fixture_id}`} className="block card-sport p-3 group">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Rd {r.fixtures?.round_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-bold ${r.home_score! > r.away_score! ? '' : 'text-muted-foreground'}`}>
                      {r.fixtures?.home_team?.clubs?.short_name}
                    </span>
                    <span className="stat-number text-base">
                      {r.home_goals}.{r.home_behinds}.{r.home_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-bold ${r.away_score! > r.home_score! ? '' : 'text-muted-foreground'}`}>
                      {r.fixtures?.away_team?.clubs?.short_name}
                    </span>
                    <span className="stat-number text-base">
                      {r.away_goals}.{r.away_behinds}.{r.away_score}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Clubs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" /> Clubs
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-accent text-xs font-bold">
              <Link to="/clubs">All Clubs <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(clubs ?? []).slice(0, 8).map((club: any) => (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <div className="card-sport text-center p-4 group">
                  <div
                    className="h-14 w-14 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-black group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: club.primary_color, color: club.secondary_color }}
                  >
                    {club.short_name?.slice(0, 2)}
                  </div>
                  <div className="font-bold text-sm truncate">{club.name}</div>
                  {club.home_ground && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{club.home_ground}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* News */}
        {(news ?? []).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-accent" /> News & Announcements
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {(news ?? []).map((article: any, i: number) => (
                <Card key={article.id} className={`overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-1' : ''}`}>
                  <div className="p-5">
                    <span className="text-xs text-muted-foreground">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                    <h3 className={`font-bold mt-1 mb-2 leading-snug ${i === 0 ? 'text-lg' : 'text-base'}`}>{article.title}</h3>
                    <p className={`text-sm text-muted-foreground ${i === 0 ? 'line-clamp-4' : 'line-clamp-2'}`}>
                      {article.excerpt || article.content}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
