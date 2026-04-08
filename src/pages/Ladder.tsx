import Layout from '@/components/layout/Layout';
import { useLadder, useCurrentSeason } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { Link } from 'react-router-dom';

export default function Ladder() {
  const { data: season } = useCurrentSeason();
  const { data: ladder, isLoading } = useLadder(season?.id);

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">Ladder</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{season?.name ?? '2026'} Season Standings</p>
        </div>

        <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left py-3 pl-3 pr-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-7"></th>
                  <th className="text-left py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">P</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">W</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">L</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">D</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">PF</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">PA</th>
                  <th className="text-center py-3 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">%</th>
                  <th className="text-center py-3 px-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pts</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="py-16 text-center text-sm text-muted-foreground">Loading...</td></tr>
                ) : (ladder ?? []).length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-sm text-muted-foreground">No ladder data yet.</td></tr>
                ) : (ladder ?? []).map((entry: any, i: number) => (
                  <tr key={entry.id} className={`border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20 ${i < 4 ? 'bg-accent/[0.03]' : ''}`}>
                    <td className="py-3 pl-3 pr-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        i < 4 ? 'bg-accent/15 text-accent' : 'text-muted-foreground'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Link to={`/clubs/${entry.teams?.clubs?.id}`} className="flex items-center gap-2 hover:opacity-80">
                        <ClubLogo club={entry.teams?.clubs ?? {}} size="sm" className="!h-7 !w-7" />
                        <div>
                          <span className="font-bold text-xs block">{entry.teams?.clubs?.short_name}</span>
                          <span className="text-[10px] text-muted-foreground hidden sm:block">{entry.teams?.clubs?.name}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums text-muted-foreground">{entry.played}</td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums font-bold">{entry.wins}</td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums text-muted-foreground">{entry.losses}</td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums text-muted-foreground">{entry.draws}</td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums text-muted-foreground hidden sm:table-cell">{entry.points_for}</td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums text-muted-foreground hidden sm:table-cell">{entry.points_against}</td>
                    <td className="text-center py-3 px-1.5 text-xs tabular-nums font-semibold">{Number(entry.percentage).toFixed(1)}</td>
                    <td className="text-center py-3 px-2 pr-3 stat-number text-sm">{entry.competition_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
