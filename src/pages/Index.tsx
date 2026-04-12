import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronRight, MapPin, Newspaper, TrendingUp, ArrowRight, Star, Award, Clock, CheckCircle } from 'lucide-react';
import { useClubs, useLadder, useCurrentSeason, useNews, usePlayerOfTheRound, useAllCurrentSeasons, useAllResults, useCoachOfTheWeek, useCurrentRoundFixtures } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { useSport } from '@/hooks/useSport';

export default function Index() {
  const { currentSport } = useSport();
  const { data: season } = useCurrentSeason(currentSport?.id);
  const { data: allCurrentSeasons } = useAllCurrentSeasons();
  const { data: allResults } = useAllResults();
  const { data: news } = useNews(3);
  const { data: playerOfRound } = usePlayerOfTheRound(season?.id);

  const aflSeason = allCurrentSeasons?.find((s: any) => s.competitions?.sports?.slug === 'afl');
  const cricketSeason = allCurrentSeasons?.find((s: any) => s.competitions?.sports?.slug === 'cricket');
  const { data: coachOfWeek } = useCoachOfTheWeek(aflSeason?.id ?? season?.id);

  const { data: aflLadder } = useLadder(aflSeason?.id);
  const { data: cricketLadder } = useLadder(cricketSeason?.id);

  const currentSeasonIds = allCurrentSeasons?.map((s: any) => s.id).filter(Boolean) ?? [];
  const { data: currentRoundFixtures } = useCurrentRoundFixtures(currentSeasonIds.length > 0 ? currentSeasonIds : undefined);

  const latestResults = allResults?.slice(0, 10) ?? [];
  const featuredMatch = latestResults[0];
  const currentRound = currentRoundFixtures?.[0]?.roundNumber;

  const topAflLadder = (aflLadder ?? []).slice(0, 8);
  const topCricketLadder = (cricketLadder ?? []).slice(0, 8);

  return (
    <Layout>
      {/* Scores strip */}
      {latestResults.length > 0 && (
        <div className="score-strip border-b border-border/30">
          <div className="page-container">
            <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
              <Badge variant="secondary" className="shrink-0 rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-primary/15 text-primary border-0">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse inline-block" />
                Scores
              </Badge>
              {latestResults.slice(0, 6).map((r: any) => (
                <Link
                  key={r.id}
                  to={`/match/${r.fixture_id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary/40 transition-colors shrink-0"
                >
                  <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                  <span className={`text-xs font-bold tabular-nums ${r.home_score! > r.away_score! ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {r.home_score}
                  </span>
                  <span className="text-muted-foreground/30 text-[10px]">–</span>
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

        {/* Current Round */}
        {currentRoundFixtures && currentRoundFixtures.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />Round {currentRound}
              </h2>
              <Link to="/fixtures" className="text-xs font-bold text-primary flex items-center gap-0.5">
                All Fixtures <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentRoundFixtures.map((f: any) => {
                const isCompleted = f.status === 'completed' && f.result;
                const sportSlug = f.seasons?.competitions?.sports?.slug;
                const isCricket = sportSlug === 'cricket';
                return (
                  <Link
                    key={f.id}
                    to={`/match/${f.id}`}
                    className="match-card p-3.5"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge
                        variant={isCompleted ? 'default' : 'secondary'}
                        className={`rounded-full text-[9px] font-bold px-2 py-0 gap-1 ${isCompleted ? 'bg-primary/15 text-primary border-0' : 'border-border/40'}`}
                      >
                        {isCompleted ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {isCompleted ? 'Full Time' : 'Upcoming'}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2 py-0 border-border/40 text-muted-foreground">
                        {isCricket ? 'Cricket' : 'AFL'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" />
                        <span className={`font-bold text-sm truncate ${isCompleted && (f.result?.home_score ?? 0) > (f.result?.away_score ?? 0) ? '' : isCompleted ? 'text-muted-foreground' : ''}`}>
                          {f.home_team?.clubs?.short_name}
                        </span>
                      </div>
                      <div className="text-center shrink-0">
                        {isCompleted ? (
                          <span className="stat-number text-base">{f.result.home_score} – {f.result.away_score}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`font-bold text-sm truncate ${isCompleted && (f.result?.away_score ?? 0) > (f.result?.home_score ?? 0) ? '' : isCompleted ? 'text-muted-foreground' : ''}`}>
                          {f.away_team?.clubs?.short_name}
                        </span>
                        <ClubLogo club={f.away_team?.clubs ?? {}} size="sm" />
                      </div>
                    </div>
                    {isCompleted && f.venue && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />{f.venue}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {/* Featured Match */}
        {featuredMatch && (() => {
          const sportSlug = featuredMatch.fixtures?.seasons?.competitions?.sports?.slug;
          const isCricketMatch = sportSlug === 'cricket';
          const seasonName = featuredMatch.fixtures?.seasons?.name ?? '';
          const compName = featuredMatch.fixtures?.seasons?.competitions?.short_name || featuredMatch.fixtures?.seasons?.competitions?.name || '';
          return (
          <Link to={`/match/${featuredMatch.fixture_id}`} className="block">
            <div className="sport-gradient rounded-2xl p-5 md:p-6 relative overflow-hidden border border-border/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-primary/20 text-primary border-0 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Latest Result
                  </Badge>
                  <Badge className="bg-white/5 text-white/50 border-0 rounded-full text-[10px] font-medium">
                    {isCricketMatch ? 'Cricket' : 'AFL'}
                  </Badge>
                </div>
                <div className="text-[10px] text-white/30 mb-4">
                  {compName}{compName && seasonName ? ' · ' : ''}{seasonName} · Round {featuredMatch.fixtures?.round_number}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <ClubLogo club={featuredMatch.fixtures?.home_team?.clubs ?? {}} size="lg" className="mx-auto !h-14 !w-14 md:!h-16 md:!w-16 mb-2" />
                    <div className="text-white/70 text-xs font-semibold truncate">{featuredMatch.fixtures?.home_team?.clubs?.short_name}</div>
                  </div>
                  <div className="text-center shrink-0">
                    {isCricketMatch ? (
                      <div className="text-3xl md:text-4xl font-black text-white tabular-nums tracking-tighter">
                        {featuredMatch.home_score}
                        <span className="text-white/15 mx-2">v</span>
                        {featuredMatch.away_score}
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tighter">
                          {featuredMatch.home_score}
                          <span className="text-white/15 mx-1.5">–</span>
                          {featuredMatch.away_score}
                        </div>
                        <div className="text-white/30 text-[10px] mt-1 tabular-nums">
                          {featuredMatch.home_goals}.{featuredMatch.home_behinds} – {featuredMatch.away_goals}.{featuredMatch.away_behinds}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 text-center">
                    <ClubLogo club={featuredMatch.fixtures?.away_team?.clubs ?? {}} size="lg" className="mx-auto !h-14 !w-14 md:!h-16 md:!w-16 mb-2" />
                    <div className="text-white/70 text-xs font-semibold truncate">{featuredMatch.fixtures?.away_team?.clubs?.short_name}</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-white/30 text-[11px]">
                  {featuredMatch.fixtures?.venue && <><MapPin className="h-3 w-3" />{featuredMatch.fixtures.venue}</>}
                </div>
                <div className="text-center mt-3">
                  <span className="text-primary text-xs font-bold flex items-center justify-center gap-1">
                    Match Centre <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
          );
        })()}

        {/* Player of the Round */}
        {playerOfRound && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />Player of the Round</h2>
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold bg-secondary/60">Rd {playerOfRound.round_number}</Badge>
            </div>
            <div className="match-card p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <span className="text-2xl font-black text-primary">
                    {playerOfRound.players?.jersey_number ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-base">
                    {playerOfRound.players?.first_name} {playerOfRound.players?.last_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ClubLogo club={playerOfRound.players?.teams?.clubs ?? {}} size="sm" className="!h-4 !w-4" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {playerOfRound.players?.teams?.clubs?.short_name}
                    </span>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-2xl font-black text-accent">{playerOfRound.afl_fantasy}</div>
                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Fantasy</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-border/30">
                {[
                  { label: 'D', value: playerOfRound.disposals },
                  { label: 'K', value: playerOfRound.kicks },
                  { label: 'M', value: playerOfRound.marks },
                  { label: 'T', value: playerOfRound.tackles },
                  { label: 'G', value: `${playerOfRound.goals ?? 0}.${playerOfRound.behinds ?? 0}` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-sm font-black tabular-nums">{s.value ?? 0}</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


        {latestResults.length > 1 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Recent Matches</h2>
              <Link to="/results" className="text-xs font-bold text-primary flex items-center gap-0.5">All <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="space-y-2">
              {latestResults.slice(1, 8).map((r: any) => {
                const sportSlug = r.fixtures?.seasons?.competitions?.sports?.slug;
                const isCricket = sportSlug === 'cricket';
                const compName = r.fixtures?.seasons?.competitions?.short_name || r.fixtures?.seasons?.competitions?.name || '';
                return (
                  <Link key={r.id} to={`/match/${r.fixture_id}`} className="block match-card p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2 py-0 border-border/40 text-muted-foreground">
                        {isCricket ? 'Cricket' : 'AFL'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{compName} · Rd {r.fixtures?.round_number}</span>
                    </div>
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
                );
              })}
            </div>
          </section>
        )}

        {/* Ladders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aflSeason && topAflLadder.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="section-label flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />AFL Ladder</h2>
                  <span className="text-[10px] text-muted-foreground font-medium">{aflSeason.name}</span>
                </div>
                <Link to="/ladder" className="text-xs font-bold text-primary flex items-center gap-0.5">Full <ChevronRight className="h-3 w-3" /></Link>
              </div>
              <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-secondary/20">
                      <th className="text-left py-2.5 pl-3 pr-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-7"></th>
                      <th className="text-left py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">P</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">W</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-10 hidden sm:table-cell">%</th>
                      <th className="text-center py-2.5 px-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAflLadder.map((entry: any, i: number) => (
                      <tr key={entry.id} className={`border-b border-border/20 last:border-0 ${i < 4 ? '' : 'opacity-50'}`}>
                        <td className="py-2.5 pl-3 pr-1">
                          <span className={`text-xs font-black ${i < 4 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
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
                        <td className="text-center py-2.5 px-2 pr-3 text-xs stat-number text-primary">{entry.competition_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {cricketSeason && topCricketLadder.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="section-label flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Cricket Ladder</h2>
                  <span className="text-[10px] text-muted-foreground font-medium">{cricketSeason?.name}</span>
                </div>
                <Link to="/ladder" className="text-xs font-bold text-primary flex items-center gap-0.5">Full <ChevronRight className="h-3 w-3" /></Link>
              </div>
              <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-secondary/20">
                      <th className="text-left py-2.5 pl-3 pr-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-7"></th>
                      <th className="text-left py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">P</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">W</th>
                      <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-12 hidden sm:table-cell">NRR</th>
                      <th className="text-center py-2.5 px-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCricketLadder.map((entry: any, i: number) => {
                      const pf = entry.points_for ?? 0;
                      const pa = entry.points_against ?? 0;
                      const played = entry.played ?? 0;
                      const nrr = played > 0 && pa > 0 ? (pf / played) - (pa / played) : pf > 0 ? 99.999 : 0;
                      return (
                        <tr key={entry.id} className={`border-b border-border/20 last:border-0 ${i < 4 ? '' : 'opacity-50'}`}>
                          <td className="py-2.5 pl-3 pr-1">
                            <span className={`text-xs font-black ${i < 4 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <ClubLogo club={entry.teams?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                              <span className="font-semibold text-xs">{entry.teams?.clubs?.short_name}</span>
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-2 text-xs tabular-nums">{played}</td>
                          <td className="text-center py-2.5 px-2 text-xs tabular-nums font-bold">{entry.wins}</td>
                          <td className={`text-center py-2.5 px-2 text-xs tabular-nums hidden sm:table-cell ${nrr > 0 ? 'text-green-400' : nrr < 0 ? 'text-red-400' : ''}`}>
                            {nrr > 0 ? '+' : ''}{nrr.toFixed(2)}
                          </td>
                          <td className="text-center py-2.5 px-2 pr-3 text-xs stat-number text-primary">{entry.competition_points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Coach of the Week */}
          {coachOfWeek && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-label flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />Coach of the Week</h2>
                <Badge variant="secondary" className="rounded-full text-[10px] font-bold bg-secondary/60">Rd {coachOfWeek.roundNumber}</Badge>
              </div>
              <div className="match-card p-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center shrink-0 border border-accent/10 overflow-hidden">
                    {coachOfWeek.avatarUrl ? (
                      <img src={coachOfWeek.avatarUrl} alt={coachOfWeek.coachName} className="h-full w-full object-cover" />
                    ) : (
                      <Award className="h-7 w-7 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-base">{coachOfWeek.coachName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <ClubLogo club={coachOfWeek.club ?? {}} size="sm" className="!h-4 !w-4" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {coachOfWeek.club?.short_name ?? coachOfWeek.club?.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-accent">+{coachOfWeek.margin}</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Win Margin</div>
                  </div>
                </div>
                {coachOfWeek.result && (
                  <Link to={`/match/${coachOfWeek.result.fixture_id}`} className="block mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClubLogo club={coachOfWeek.result.fixtures?.home_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                        <span className={`text-xs font-bold ${(coachOfWeek.result.home_score ?? 0) > (coachOfWeek.result.away_score ?? 0) ? '' : 'text-muted-foreground'}`}>
                          {coachOfWeek.result.fixtures?.home_team?.clubs?.short_name}
                        </span>
                        <span className="text-xs font-black tabular-nums">{coachOfWeek.result.home_score} – {coachOfWeek.result.away_score}</span>
                        <span className={`text-xs font-bold ${(coachOfWeek.result.away_score ?? 0) > (coachOfWeek.result.home_score ?? 0) ? '' : 'text-muted-foreground'}`}>
                          {coachOfWeek.result.fixtures?.away_team?.clubs?.short_name}
                        </span>
                        <ClubLogo club={coachOfWeek.result.fixtures?.away_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                    </div>
                  </Link>
                )}
              </div>
            </section>
          )}
        </div>

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
