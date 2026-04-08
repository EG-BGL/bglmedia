import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { useFixtures, useResults, useCurrentSeason } from '@/hooks/useData';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClubLogo from '@/components/ClubLogo';
import { useSport } from '@/hooks/useSport';

export default function Fixtures() {
  const { sports, currentSport, setSport } = useSport();
  const { data: season } = useCurrentSeason(currentSport?.id);
  const { data: fixtures, isLoading } = useFixtures(season?.id);
  const { data: results } = useResults(season?.id);

  const fixtureIdsWithResults = new Set(results?.map((r: any) => r.fixture_id ?? r.fixtures?.id) ?? []);
  const resultsByFixture = new Map((results ?? []).map((r: any) => [r.fixture_id ?? r.fixtures?.id, r]));
  const [selectedRound, setSelectedRound] = useState<string>('all');

  const rounds = [...new Set(fixtures?.map(f => f.round_number) ?? [])].sort((a, b) => a - b);
  const filtered = selectedRound === 'all' ? fixtures : fixtures?.filter(f => f.round_number === Number(selectedRound));

  const groupedFixtures: Record<number, any[]> = {};
  (filtered ?? []).forEach((f: any) => {
    if (!groupedFixtures[f.round_number]) groupedFixtures[f.round_number] = [];
    groupedFixtures[f.round_number].push(f);
  });

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">Fixtures & Results</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find your fixture</p>
        </div>

        {/* Sport filter + Round filter */}
        <div className="flex items-center gap-3">
          {sports.length > 1 && (
            <div className="flex items-center bg-muted/60 rounded-full p-0.5 gap-0.5">
              {sports.map((sport) => {
                const active = currentSport?.slug === sport.slug;
                return (
                  <button
                    key={sport.id}
                    onClick={() => setSport(sport.slug)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sport.slug === 'afl' ? 'AFL' : 'Cricket'}
                  </button>
                );
              })}
            </div>
          )}
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-[130px] h-9 rounded-full text-xs font-semibold">
              <SelectValue placeholder="Round" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {rounds.map(r => (
                <SelectItem key={r} value={String(r)}>Round {r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
        ) : Object.keys(groupedFixtures).length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No fixtures found.</div>
        ) : (
            Object.entries(groupedFixtures).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
              <div key={round}>
                <h2 className="section-label mb-2">Round {round}</h2>
                <div className="space-y-2">
                  {matches.map((f: any) => (
                    <Link key={f.id} to={`/match/${f.id}`} className="block match-card px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" />
                          <span className="font-bold text-xs truncate">{f.home_team?.clubs?.short_name}</span>
                        </div>
                        <div className="text-center shrink-0 px-1">
                          {f.status === 'completed' && resultsByFixture.has(f.id) ? (() => {
                            const r = resultsByFixture.get(f.id);
                            return (
                              <div>
                                <div className="stat-number text-xl font-black">{r.home_score} – {r.away_score}</div>
                                <Badge className="rounded-full text-[9px] px-1.5 py-0 bg-destructive text-destructive-foreground border-0 font-black tracking-wider">FT</Badge>
                              </div>
                            );
                          })() : f.status === 'completed' ? (
                            <Badge className="rounded-full text-[9px] px-1.5 py-0 bg-destructive text-destructive-foreground border-0 font-black tracking-wider">FT</Badge>
                          ) : (
                            <div>
                              <div className="text-[10px] text-muted-foreground">
                                {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBA'}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className="font-bold text-xs truncate">{f.away_team?.clubs?.short_name}</span>
                          <ClubLogo club={f.away_team?.clubs ?? {}} size="sm" />
                        </div>
                      </div>
                      {f.venue && (
                        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground justify-center">
                          <MapPin className="h-2.5 w-2.5" />{f.venue}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </Layout>
  );
}
