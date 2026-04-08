import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';
import { useClub, useTeams, usePlayers, useCurrentSeason } from '@/hooks/useData';
import { MapPin, Calendar, Users } from 'lucide-react';

export default function ClubProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: club, isLoading } = useClub(id!);
  const { data: season } = useCurrentSeason();
  const { data: allTeams } = useTeams(season?.id);
  const clubTeams = allTeams?.filter(t => t.club_id === id) ?? [];
  const firstTeam = clubTeams[0];
  const { data: players } = usePlayers(firstTeam?.id);

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-8 text-muted-foreground">Loading...</div></Layout>;
  if (!club) return <Layout><div className="container mx-auto px-4 py-8">Club not found.</div></Layout>;

  return (
    <Layout>
      <section className="py-10" style={{ background: `linear-gradient(135deg, ${club.primary_color} 0%, ${club.primary_color}dd 100%)` }}>
        <div className="container mx-auto px-4 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full flex items-center justify-center text-3xl font-black shrink-0" style={{ backgroundColor: club.secondary_color, color: club.primary_color }}>
            {club.short_name?.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black" style={{ color: club.secondary_color }}>{club.name}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm" style={{ color: `${club.secondary_color}bb` }}>
              {club.home_ground && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{club.home_ground}</span>}
              {club.founded_year && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Est. {club.founded_year}</span>}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {club.description && (
          <Card><CardContent className="p-5"><p className="text-sm">{club.description}</p></CardContent></Card>
        )}

        {/* Players */}
        {players && players.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="h-5 w-5" />Squad</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-3 font-semibold w-12">#</th>
                        <th className="text-left py-2 px-3 font-semibold">Player</th>
                        <th className="text-left py-2 px-3 font-semibold">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 px-3 font-bold">{p.jersey_number}</td>
                          <td className="py-2 px-3 font-medium">{p.first_name} {p.last_name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{p.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
