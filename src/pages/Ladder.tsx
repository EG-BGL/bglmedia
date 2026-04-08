import Layout from '@/components/layout/Layout';
import { useLadder, useCurrentSeason } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

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

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (ladder ?? []).length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No ladder data yet.</div>
        ) : (
          <div className="space-y-2">
            {(ladder ?? []).map((entry: any, i: number) => {
              const club = entry.teams?.clubs;
              const isTop4 = i < 4;
              return (
                <Link key={entry.id} to={`/clubs/${club?.id}`}>
                  <div className={`match-card p-3.5 flex items-center gap-3 ${isTop4 ? 'border-l-2 border-l-primary' : ''}`}>
                    {/* Position */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isTop4 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>

                    {/* Team */}
                    <ClubLogo club={club ?? {}} size="sm" className="!h-8 !w-8" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">{club?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{entry.played ?? 0} played</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                      <div className="text-center">
                        <div className="text-[9px] text-muted-foreground uppercase font-bold">W-L-D</div>
                        <div className="font-bold">{entry.wins ?? 0}-{entry.losses ?? 0}-{entry.draws ?? 0}</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <div className="text-[9px] text-muted-foreground uppercase font-bold">%</div>
                        <div className="font-semibold">{Number(entry.percentage ?? 0).toFixed(1)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-muted-foreground uppercase font-bold">Pts</div>
                        <div className="font-black text-sm text-primary">{entry.competition_points ?? 0}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-primary rounded-full" />
            <span>Finals qualifying</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
