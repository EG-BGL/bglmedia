import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useResults, useCurrentSeason } from '@/hooks/useData';
import { Link } from 'react-router-dom';

export default function Results() {
  const { data: season } = useCurrentSeason();
  const { data: results, isLoading } = useResults(season?.id);

  const groupedByRound: Record<number, any[]> = {};
  (results ?? []).forEach((r: any) => {
    const round = r.fixtures?.round_number ?? 0;
    if (!groupedByRound[round]) groupedByRound[round] = [];
    groupedByRound[round].push(r);
  });

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black text-primary-foreground">Results</h1>
          <p className="text-primary-foreground/70 mt-1">{season?.name ?? '2026'} Season Results</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading results...</p>
        ) : Object.keys(groupedByRound).length === 0 ? (
          <p className="text-muted-foreground">No results yet.</p>
        ) : (
          Object.entries(groupedByRound).sort(([a], [b]) => Number(b) - Number(a)).map(([round, matches]) => (
            <div key={round} className="mb-8">
              <h2 className="text-lg font-bold mb-3">Round {round}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((r: any) => {
                  const homeWin = r.home_score > r.away_score;
                  const awayWin = r.away_score > r.home_score;
                  return (
                    <Link key={r.id} to={`/match/${r.fixtures?.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <Badge variant="outline" className="text-xs mb-3">Final</Badge>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: r.fixtures?.home_team?.clubs?.primary_color, color: r.fixtures?.home_team?.clubs?.secondary_color }}>
                                  {r.fixtures?.home_team?.clubs?.short_name?.slice(0, 2)}
                                </div>
                                <span className={`font-semibold text-sm ${homeWin ? '' : 'text-muted-foreground'}`}>{r.fixtures?.home_team?.clubs?.name}</span>
                              </div>
                              <div className={`font-black text-lg tabular-nums ${homeWin ? '' : 'text-muted-foreground'}`}>
                                {r.home_goals}.{r.home_behinds}.{r.home_score}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: r.fixtures?.away_team?.clubs?.primary_color, color: r.fixtures?.away_team?.clubs?.secondary_color }}>
                                  {r.fixtures?.away_team?.clubs?.short_name?.slice(0, 2)}
                                </div>
                                <span className={`font-semibold text-sm ${awayWin ? '' : 'text-muted-foreground'}`}>{r.fixtures?.away_team?.clubs?.name}</span>
                              </div>
                              <div className={`font-black text-lg tabular-nums ${awayWin ? '' : 'text-muted-foreground'}`}>
                                {r.away_goals}.{r.away_behinds}.{r.away_score}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
