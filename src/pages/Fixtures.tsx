import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { useFixtures, useResults, useCurrentSeason } from '@/hooks/useData';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClubLogo from '@/components/ClubLogo';
import { useSport } from '@/hooks/useSport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useCricketInningsForSeason(seasonId?: string, isCricket?: boolean) {
  return useQuery({
    queryKey: ['cricket-innings-season', seasonId],
    queryFn: async () => {
      // Get all fixture ids for this season, then get innings
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('id')
        .eq('season_id', seasonId!);
      if (!fixtures?.length) return {};
      const fixtureIds = fixtures.map(f => f.id);
      const { data, error } = await supabase
        .from('cricket_match_results')
        .select('*')
        .in('fixture_id', fixtureIds)
        .order('innings_number');
      if (error) throw error;
      // Group by fixture_id
      const map: Record<string, any[]> = {};
      (data ?? []).forEach((inn: any) => {
        if (!map[inn.fixture_id]) map[inn.fixture_id] = [];
        map[inn.fixture_id].push(inn);
      });
      return map;
    },
    enabled: !!seasonId && !!isCricket,
  });
}

function getCricketResultText(innings: any[], homeTeamId: string, awayTeamId: string, homeShort: string, awayShort: string) {
  if (!innings?.length) return null;
  const homeRuns = innings.filter((i: any) => i.team_id === homeTeamId).reduce((s: number, i: any) => s + (i.total_runs ?? 0), 0);
  const awayRuns = innings.filter((i: any) => i.team_id === awayTeamId).reduce((s: number, i: any) => s + (i.total_runs ?? 0), 0);

  if (homeRuns === awayRuns) return 'Match Tied';

  const winnerIsHome = homeRuns > awayRuns;
  const winnerName = winnerIsHome ? homeShort : awayShort;

  // If the team batting second won, margin is in wickets
  // Determine who batted second (last innings team)
  const sortedInnings = [...innings].sort((a, b) => a.innings_number - b.innings_number);
  const lastInnings = sortedInnings[sortedInnings.length - 1];
  const chasingTeamId = lastInnings.team_id;
  const winnerTeamId = winnerIsHome ? homeTeamId : awayTeamId;

  if (winnerTeamId === chasingTeamId) {
    // Won while chasing → margin in wickets
    const wicketsLost = lastInnings.total_wickets ?? 0;
    const wicketsRemaining = 10 - wicketsLost;
    return `${winnerName} won by ${wicketsRemaining} wkt${wicketsRemaining !== 1 ? 's' : ''}`;
  } else {
    // Won batting first → margin in runs
    const margin = Math.abs(homeRuns - awayRuns);
    return `${winnerName} won by ${margin} run${margin !== 1 ? 's' : ''}`;
  }
}

export default function Fixtures() {
  const { sports, currentSport, setSport } = useSport();
  const isCricket = currentSport?.slug === 'cricket';
  const { data: season } = useCurrentSeason(currentSport?.id);
  const { data: fixtures, isLoading } = useFixtures(season?.id);
  const { data: results } = useResults(season?.id);
  const { data: cricketInningsMap } = useCricketInningsForSeason(season?.id, isCricket);

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
                  {matches.map((f: any) => {
                    const homeTeamId = f.home_team?.id;
                    const awayTeamId = f.away_team?.id;
                    const homeShort = f.home_team?.clubs?.short_name ?? '';
                    const awayShort = f.away_team?.clubs?.short_name ?? '';
                    const cricketInnings = isCricket ? cricketInningsMap?.[f.id] : null;
                    const hasCricketResult = isCricket && cricketInnings && cricketInnings.length > 0;
                    const resultText = hasCricketResult
                      ? getCricketResultText(cricketInnings, homeTeamId, awayTeamId, homeShort, awayShort)
                      : null;

                    // Build cricket score strings per team e.g. "125/8" or "245/8 & 180/10"
                    const homeInnings = hasCricketResult ? cricketInnings.filter((i: any) => i.team_id === homeTeamId) : [];
                    const awayInnings = hasCricketResult ? cricketInnings.filter((i: any) => i.team_id === awayTeamId) : [];
                    const formatInningsScore = (inns: any[]) => inns.map((i: any) => `${i.total_runs ?? 0}/${i.total_wickets ?? 0}${i.declared ? 'd' : ''}`).join(' & ');
                    const homeScore = formatInningsScore(homeInnings);
                    const awayScore = formatInningsScore(awayInnings);

                    const homeWon = hasCricketResult && homeInnings.reduce((s: number, i: any) => s + (i.total_runs ?? 0), 0) > awayInnings.reduce((s: number, i: any) => s + (i.total_runs ?? 0), 0);
                    const awayWon = hasCricketResult && awayInnings.reduce((s: number, i: any) => s + (i.total_runs ?? 0), 0) > homeInnings.reduce((s: number, i: any) => s + (i.total_runs ?? 0), 0);

                    return (
                      <Link key={f.id} to={`/match/${f.id}`} className="block match-card px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" />
                            <span className={`font-bold text-xs truncate ${(hasCricketResult && !homeWon) || (aflResult && !aflResult.homeWon && !aflResult.draw) ? 'text-muted-foreground' : ''}`}>{homeShort}</span>
                            {hasCricketResult && (
                              <span className={`text-xs tabular-nums ml-auto shrink-0 ${homeWon ? 'font-black text-foreground' : 'font-semibold text-muted-foreground'}`}>{homeScore}</span>
                            )}
                            {aflResult && (
                              <span className={`text-xs tabular-nums ml-auto shrink-0 ${aflResult.homeWon ? 'font-black text-foreground' : 'font-semibold text-muted-foreground'}`}>{aflResult.r.home_goals}.{aflResult.r.home_behinds}</span>
                            )}
                          </div>
                          <div className="text-center shrink-0 px-1">
                            {f.status === 'completed' && hasCricketResult ? (
                              <div>
                                <Badge className="rounded-full text-[9px] px-1.5 py-0 bg-destructive text-destructive-foreground border-0 font-black tracking-wider">COMPLETED</Badge>
                                {resultText && (
                                  <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 whitespace-nowrap">{resultText}</div>
                                )}
                              </div>
                            ) : aflResult ? (
                              <div>
                                <Badge className="rounded-full text-[9px] px-1.5 py-0 bg-destructive text-destructive-foreground border-0 font-black tracking-wider">FULL TIME</Badge>
                                <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 whitespace-nowrap">{aflResult.text}</div>
                              </div>
                            ) : f.status === 'completed' ? (
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
                            {aflResult && (
                              <span className={`text-xs tabular-nums mr-auto shrink-0 ${aflResult.awayWon ? 'font-black text-foreground' : 'font-semibold text-muted-foreground'}`}>{aflResult.r.away_goals}.{aflResult.r.away_behinds}</span>
                            )}
                            {hasCricketResult && (
                              <span className={`text-xs tabular-nums mr-auto shrink-0 ${awayWon ? 'font-black text-foreground' : 'font-semibold text-muted-foreground'}`}>{awayScore}</span>
                            )}
                            <span className={`font-bold text-xs truncate ${(hasCricketResult && !awayWon) || (aflResult && !aflResult.awayWon && !aflResult.draw) ? 'text-muted-foreground' : ''}`}>{awayShort}</span>
                            <ClubLogo club={f.away_team?.clubs ?? {}} size="sm" />
                          </div>
                        </div>
                        {f.venue && (
                          <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground justify-center">
                            <MapPin className="h-2.5 w-2.5" />{f.venue}
                          </div>
                        )}
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
