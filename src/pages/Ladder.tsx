import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useLadder, useCurrentSeason } from '@/hooks/useData';

export default function Ladder() {
  const { data: season } = useCurrentSeason();
  const { data: ladder, isLoading } = useLadder(season?.id);

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black text-primary-foreground">Ladder</h1>
          <p className="text-primary-foreground/70 mt-1">{season?.name ?? '2026'} Season Standings</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-3 font-semibold w-8">#</th>
                    <th className="text-left py-3 px-3 font-semibold">Team</th>
                    <th className="text-center py-3 px-2 font-semibold">P</th>
                    <th className="text-center py-3 px-2 font-semibold">W</th>
                    <th className="text-center py-3 px-2 font-semibold">L</th>
                    <th className="text-center py-3 px-2 font-semibold">D</th>
                    <th className="text-center py-3 px-2 font-semibold hidden sm:table-cell">PF</th>
                    <th className="text-center py-3 px-2 font-semibold hidden sm:table-cell">PA</th>
                    <th className="text-center py-3 px-2 font-semibold">%</th>
                    <th className="text-center py-3 px-3 font-semibold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : (ladder ?? []).length === 0 ? (
                    <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No ladder data yet.</td></tr>
                  ) : (ladder ?? []).map((entry: any, i: number) => (
                    <tr key={entry.id} className={`border-b last:border-0 hover:bg-muted/30 ${i < 4 ? 'bg-sport-green/5' : ''}`}>
                      <td className="py-3 px-3 font-bold">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: entry.teams?.clubs?.primary_color, color: entry.teams?.clubs?.secondary_color }}>
                            {entry.teams?.clubs?.short_name?.slice(0, 2)}
                          </div>
                          <span className="font-semibold">{entry.teams?.clubs?.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">{entry.played}</td>
                      <td className="text-center py-3 px-2 font-medium">{entry.wins}</td>
                      <td className="text-center py-3 px-2">{entry.losses}</td>
                      <td className="text-center py-3 px-2">{entry.draws}</td>
                      <td className="text-center py-3 px-2 hidden sm:table-cell">{entry.points_for}</td>
                      <td className="text-center py-3 px-2 hidden sm:table-cell">{entry.points_against}</td>
                      <td className="text-center py-3 px-2">{Number(entry.percentage).toFixed(1)}</td>
                      <td className="text-center py-3 px-3 font-black">{entry.competition_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
