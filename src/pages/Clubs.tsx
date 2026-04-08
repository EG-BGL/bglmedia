import Layout from '@/components/layout/Layout';
import { useClubs, useLadder, useCurrentSeason } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { MapPin, Trophy, User } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

export default function Clubs() {
  const { data: clubs, isLoading } = useClubs();
  const { data: season } = useCurrentSeason();
  const { data: ladder } = useLadder(season?.id);

  // Build a map of club stats from ladder
  const clubStats: Record<string, { wins: number; losses: number; percentage: number; position: number }> = {};
  (ladder ?? []).forEach((entry: any, i: number) => {
    const clubId = entry.teams?.clubs?.id;
    if (clubId && !clubStats[clubId]) {
      clubStats[clubId] = {
        wins: entry.wins ?? 0,
        losses: entry.losses ?? 0,
        percentage: Number(entry.percentage ?? 0),
        position: i + 1,
      };
    }
  });

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">Teams</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{season?.name ?? '2026'} Season</p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-2">
            {(clubs ?? []).filter((club: any) => club.is_active !== false).map((club: any) => {
              const stats = clubStats[club.id];
              return (
                <Link key={club.id} to={`/clubs/${club.id}`}>
                  <div className="match-card p-4 flex items-center gap-3.5 group">
                    <ClubLogo club={club} size="lg" className="!h-14 !w-14 group-hover:scale-105 transition-transform duration-200" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm">{club.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {club.home_ground && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />{club.home_ground}
                          </span>
                        )}
                        {club.coach && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <User className="h-2.5 w-2.5" />{club.coach}
                          </span>
                        )}
                      </div>
                    </div>
                    {stats && (
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end mb-0.5">
                          <Trophy className="h-3 w-3 text-primary" />
                          <span className="text-xs font-black text-primary">#{stats.position}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {stats.wins}W {stats.losses}L • {stats.percentage.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {/* Colour bar */}
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${club.primary_color ?? '#333'}, ${club.secondary_color ?? '#666'})` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
