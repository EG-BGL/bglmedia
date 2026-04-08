import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Trophy, ChevronRight, MapPin, Newspaper, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useClubs, useFixtures, useResults, useLadder, useCurrentSeason, useNews } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';

export default function Index() {
  const { data: season } = useCurrentSeason();
  const { data: clubs } = useClubs();
  const { data: fixtures } = useFixtures(season?.id);
  const { data: results } = useResults(season?.id);
  const { data: ladder } = useLadder(season?.id);
  const { data: news } = useNews(3);

  const upcomingFixtures = fixtures?.filter(f => f.status === 'scheduled').slice(0, 6) ?? [];
  const latestResults = results?.slice(0, 8) ?? [];
  const topLadder = ladder?.slice(0, 8) ?? [];
  const featuredMatch = latestResults[0];

  return (
    <Layout>
      {/* Scores strip - horizontal scroll */}
      {latestResults.length > 0 && (
        <div className="bg-card border-b border-border/50">
          <div className="page-container">
            <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
              <Badge variant="secondary" className="shrink-0 rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mr-1.5 animate-pulse inline-block" />
                Scores
              </Badge>
              {latestResults.slice(0, 6).map((r: any) => (
                <Link
                  key={r.id}
                  to={`/match/${r.fixture_id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/60 transition-colors shrink-0"
                >
                  <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                  <span className={`text-xs font-bold tabular-nums ${r.home_score! > r.away_score! ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {r.home_score}
                  </span>
                  <span className="text-muted-foreground/40 text-[10px]">–</span>
                  <span className={`text-xs font-bold tabular-nums ${r.away_score! > r.home_score! ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {r.away_score}
                  </span>
                  <ClubLogo club={r.fixtures?.away_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                </Link>
              ))}
              <Link to="/results" className="text-xs font-bold text-primary hover:underline shrink-0 ml-auto flex items-center gap-0.5">
                All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="page-container space-y-6 py-5">

        {/* Featured Match */}
        {featuredMatch && (
          <Link to={`/match/${featuredMatch.fixture_id}`} className="block">
            <div className="sport-gradient rounded-2xl p-5 md:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-accent/20 text-accent border-0 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Latest Result
                  </Badge>
                  <span className="text-[11px] text-white/50">Round {featuredMatch.fixtures?.round_number}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Home */}
                  <div className="flex-1 text-center">
                    <ClubLogo club={featuredMatch.fixtures?.home_team?.clubs ?? {}} size="lg" className="mx-auto !h-14 !w-14 md:!h-16 md:!w-16 mb-2" />
                    <div className="text-white/80 text-xs font-semibold truncate">{featuredMatch.fixtures?.home_team?.clubs?.short_name}</div>
                  </div>

                  {/* Score */}
                  <div className="text-center shrink-0">
                    <div className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tighter">
                      {featuredMatch.home_score}
                      <span className="text-white/20 mx-1.5">–</span>
                      {featuredMatch.away_score}
                    </div>
                    <div className="text-white/40 text-[10px] mt-1 tabular-nums">
                      {featuredMatch.home_goals}.{featuredMatch.home_behinds} – {featuredMatch.away_goals}.{featuredMatch.away_behinds}
                    </div>
                  </div>

                  {/* Away */}
                  <div className="flex-1 text-center">
                    <ClubLogo club={featuredMatch.fixtures?.away_team?.clubs ?? {}} size="lg" className="mx-auto !h-14 !w-14 md:!h-16 md:!w-16 mb-2" />
                    <div className="text-white/80 text-xs font-semibold truncate">{featuredMatch.fixtures?.away_team?.clubs?.short_name}</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-white/40 text-[11px]">
                  {featuredMatch.fixtures?.venue && <><MapPin className="h-3 w-3" />{featuredMatch.fixtures.venue}</>}
                </div>
                <div className="text-center mt-3">
                  <span className="text-accent text-xs font-bold flex items-center justify-center gap-1">
                    Match Centre <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Upcoming Fixtures */}
        {upcomingFixtures.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Upcoming</h2>
              <Link to="/fixtures" className="text-xs font-bold text-primary flex items-center gap-0.5">All <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="space-y-2">
              {upcomingFixtures.map((f: any) => (
                <Link key={f.id} to={`/match/${f.id}`} className="block match-card p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" />
                      <span className="font-bold text-sm truncate">{f.home_team?.clubs?.short_name}</span>
                    </div>
                    <div className="text-center shrink-0 px-2">
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBA'}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">
                        {f.scheduled_at ? new Date(f.scheduled_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="font-bold text-sm truncate">{f.away_team?.clubs?.short_name}</span>
                      <ClubLogo club={f.away_team?.clubs ?? {}} size="sm" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ladder */}
        {topLadder.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Ladder</h2>
              <Link to="/ladder" className="text-xs font-bold text-primary flex items-center gap-0.5">Full <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left py-2.5 pl-3 pr-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-7"></th>
                      <th className="text-left py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">P</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">W</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-10 hidden sm:table-cell">%</th>
                      <th className="text-center py-2.5 px-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLadder.map((entry: any, i: number) => (
                      <tr key={entry.id} className={`border-b border-border/40 last:border-0 ${i < 4 ? '' : 'opacity-60'}`}>
                        <td className="py-2.5 pl-3 pr-1">
                          <span className={`text-xs font-black ${i < 4 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <ClubLogo club={entry.teams?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                            <span className="font-semibold text-xs">{entry.teams?.clubs?.short_name}</span>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-2 text-xs tabular-nums">{entry.played}</td>
                        <td className="text-center py-2.5 px-2 text-xs tabular-nums font-bold">{entry.wins}</td>
                        <td className="text-center py-2.5 px-2 text-xs tabular-nums hidden sm:table-cell">{Number(entry.percentage).toFixed(1)}</td>
                        <td className="text-center py-2.5 px-2 pr-3 text-xs stat-number">{entry.competition_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Latest Results */}
        {latestResults.length > 1 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Results</h2>
              <Link to="/results" className="text-xs font-bold text-primary flex items-center gap-0.5">All <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="space-y-2">
              {latestResults.slice(1, 6).map((r: any) => (
                <Link key={r.id} to={`/match/${r.fixture_id}`} className="block match-card p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" />
                      <span className={`font-bold text-sm truncate ${r.home_score! > r.away_score! ? '' : 'text-muted-foreground'}`}>
                        {r.fixtures?.home_team?.clubs?.short_name}
                      </span>
                    </div>
                    <div className="text-center shrink-0">
                      <span className="stat-number text-base">
                        {r.home_score} – {r.away_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className={`font-bold text-sm truncate ${r.away_score! > r.home_score! ? '' : 'text-muted-foreground'}`}>
                        {r.fixtures?.away_team?.clubs?.short_name}
                      </span>
                      <ClubLogo club={r.fixtures?.away_team?.clubs ?? {}} size="sm" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Clubs row */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-label">Clubs</h2>
            <Link to="/clubs" className="text-xs font-bold text-primary flex items-center gap-0.5">All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {(clubs ?? []).map((club: any) => (
              <Link key={club.id} to={`/clubs/${club.id}`} className="shrink-0 text-center group">
                <div className="match-card p-3 w-20">
                  <ClubLogo club={club} size="lg" className="mx-auto !h-12 !w-12 mb-1.5 group-hover:scale-105 transition-transform" />
                  <div className="font-bold text-[10px] truncate">{club.short_name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* News */}
        {(news ?? []).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5"><Newspaper className="h-3.5 w-3.5" />News</h2>
            </div>
            <div className="space-y-3">
              {(news ?? []).map((article: any) => (
                <div key={article.id} className="match-card p-4">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                  <h3 className="font-bold text-sm mt-1 leading-snug">{article.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.excerpt || article.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
