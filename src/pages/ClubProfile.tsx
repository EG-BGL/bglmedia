import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, Link } from 'react-router-dom';
import { useClub, useTeams, usePlayers, useFixtures, useResults, useLadder, useCurrentSeason } from '@/hooks/useData';
import { MapPin, Calendar, Users, Trophy, ChevronLeft } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

export default function ClubProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: club, isLoading } = useClub(id!);
  const { data: season } = useCurrentSeason();
  const { data: allTeams } = useTeams(season?.id);
  const { data: fixtures } = useFixtures(season?.id);
  const { data: results } = useResults(season?.id);
  const { data: ladder } = useLadder(season?.id);

  const clubTeams = allTeams?.filter(t => t.club_id === id) ?? [];
  const firstTeam = clubTeams[0];
  const { data: players } = usePlayers(firstTeam?.id);

  const clubFixtures = fixtures?.filter((f: any) =>
    f.home_team?.clubs?.id === id || f.away_team?.clubs?.id === id
  ).filter(f => f.status === 'scheduled').slice(0, 5) ?? [];

  const clubResults = results?.filter((r: any) =>
    r.fixtures?.home_team?.clubs?.id === id || r.fixtures?.away_team?.clubs?.id === id
  ).slice(0, 5) ?? [];

  const ladderEntry = ladder?.find((e: any) => e.teams?.clubs?.id === id);
  const ladderPos = ladder ? ladder.findIndex((e: any) => e.teams?.clubs?.id === id) + 1 : 0;

  if (isLoading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!club) return <Layout><div className="page-container py-16 text-center">Club not found.</div></Layout>;

  return (
    <Layout>
      {/* Club header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${club.primary_color} 0%, ${club.primary_color}cc 100%)` }}>
        <div className="page-container py-6">
          <Link to="/clubs" className="flex items-center gap-1 text-xs mb-3" style={{ color: `${club.secondary_color}99` }}>
            <ChevronLeft className="h-3.5 w-3.5" /> Clubs
          </Link>
          <div className="flex items-center gap-4">
            <ClubLogo club={club} size="lg" className="!h-16 !w-16 ring-2 ring-white/20" />
            <div>
              <h1 className="text-xl font-black" style={{ color: club.secondary_color }}>{club.name}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: `${club.secondary_color}99` }}>
                {club.home_ground && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{club.home_ground}</span>}
                {club.founded_year && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Est. {club.founded_year}</span>}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {ladderEntry && (
            <div className="flex gap-4 mt-4">
              {[
                { label: 'Position', value: `${ladderPos}${ladderPos === 1 ? 'st' : ladderPos === 2 ? 'nd' : ladderPos === 3 ? 'rd' : 'th'}` },
                { label: 'W-L-D', value: `${ladderEntry.wins}-${ladderEntry.losses}-${ladderEntry.draws}` },
                { label: 'Pts', value: ladderEntry.competition_points },
                { label: '%', value: Number(ladderEntry.percentage).toFixed(1) },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-black" style={{ color: club.secondary_color }}>{s.value}</div>
                  <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: `${club.secondary_color}66` }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="page-container py-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/60 rounded-full p-0.5 mb-4">
            <TabsTrigger value="overview" className="rounded-full text-xs font-bold">Overview</TabsTrigger>
            <TabsTrigger value="fixtures" className="rounded-full text-xs font-bold">Matches</TabsTrigger>
            <TabsTrigger value="squad" className="rounded-full text-xs font-bold">Squad</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {club.description && (
              <div className="match-card p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{club.description}</p>
              </div>
            )}
            {clubTeams.length > 0 && (
              <div>
                <h3 className="section-label mb-2">Teams</h3>
                <div className="space-y-2">
                  {clubTeams.map((t: any) => (
                    <div key={t.id} className="match-card p-3 flex items-center gap-3">
                      <ClubLogo club={club} size="sm" />
                      <div>
                        <div className="font-bold text-sm">{club.name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.division} • {t.age_group}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fixtures" className="space-y-4">
            {clubResults.length > 0 && (
              <div>
                <h3 className="section-label mb-2">Recent Results</h3>
                <div className="space-y-2">
                  {clubResults.map((r: any) => (
                    <Link key={r.id} to={`/match/${r.fixtures?.id}`} className="block match-card p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" />
                          <span className={`font-bold text-xs truncate ${r.home_score! > r.away_score! ? '' : 'text-muted-foreground'}`}>{r.fixtures?.home_team?.clubs?.short_name}</span>
                        </div>
                        <span className="stat-number text-sm">{r.home_score} – {r.away_score}</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className={`font-bold text-xs truncate ${r.away_score! > r.home_score! ? '' : 'text-muted-foreground'}`}>{r.fixtures?.away_team?.clubs?.short_name}</span>
                          <ClubLogo club={r.fixtures?.away_team?.clubs ?? {}} size="sm" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {clubFixtures.length > 0 && (
              <div>
                <h3 className="section-label mb-2">Upcoming</h3>
                <div className="space-y-2">
                  {clubFixtures.map((f: any) => (
                    <div key={f.id} className="match-card p-3.5 flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" />
                        <span className="font-bold text-xs truncate">{f.home_team?.clubs?.short_name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground text-center">
                        {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'TBA'}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-bold text-xs truncate">{f.away_team?.clubs?.short_name}</span>
                        <ClubLogo club={f.away_team?.clubs ?? {}} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="squad">
            {players && players.length > 0 ? (
              <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-10">#</th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Player</th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/30 last:border-0">
                        <td className="py-2.5 px-3 font-black text-xs text-muted-foreground">{p.jersey_number}</td>
                        <td className="py-2.5 px-3 font-semibold text-xs">{p.first_name} {p.last_name}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{p.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">No squad data available.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
