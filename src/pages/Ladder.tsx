import Layout from '@/components/layout/Layout';
import { useLadder, useSeasons } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSport } from '@/hooks/useSport';
import { useState, useMemo, useEffect } from 'react';

export default function Ladder() {
  const { sports, currentSport, setSport } = useSport();
  const { data: allSeasons } = useSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  // Filter seasons by current sport
  const seasons = useMemo(() => {
    if (!allSeasons || !currentSport) return [];
    return allSeasons.filter((s: any) => s.competitions?.sport_id === currentSport.id);
  }, [allSeasons, currentSport]);

  // Auto-select current season when sport changes
  useEffect(() => {
    const current = seasons.find((s: any) => s.is_current);
    if (current) {
      setSelectedSeasonId(current.id);
    } else if (seasons.length > 0) {
      setSelectedSeasonId(seasons[0].id);
    } else {
      setSelectedSeasonId('');
    }
  }, [seasons]);

  const isCricket = currentSport?.slug === 'cricket';
  const selectedSeason = seasons.find((s: any) => s.id === selectedSeasonId);
  const { data: ladder, isLoading } = useLadder(selectedSeasonId || undefined);

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">Ladder</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedSeason?.name ?? ''} Season Standings</p>
        </div>

        {/* Filters */}
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
          {seasons.length > 0 && (
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger className="w-[160px] h-9 rounded-full text-xs font-semibold">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.is_current ? ' (Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (ladder ?? []).length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No ladder data yet.</div>
        ) : (
          <div className="space-y-2">
            {isCricket && (
              <div className="match-card p-2.5 hidden sm:flex items-center gap-3 text-[9px] text-muted-foreground uppercase font-bold">
                <div className="w-7 shrink-0" />
                <div className="w-8 shrink-0" />
                <div className="flex-1 min-w-0">Team</div>
                <div className="flex items-center gap-3 shrink-0 tabular-nums">
                  <div className="w-10 text-center">P</div>
                  <div className="w-14 text-center">W-L-D</div>
                  <div className="w-10 text-center">RF</div>
                  <div className="w-10 text-center">RA</div>
                  <div className="w-12 text-center">NRR</div>
                  <div className="w-10 text-center">Pts</div>
                </div>
              </div>
            )}
            {!isCricket && (
              <div className="match-card p-2.5 hidden sm:flex items-center gap-3 text-[9px] text-muted-foreground uppercase font-bold">
                <div className="w-7 shrink-0" />
                <div className="w-8 shrink-0" />
                <div className="flex-1 min-w-0">Team</div>
                <div className="flex items-center gap-3 shrink-0 tabular-nums">
                  <div className="w-14 text-center">W-L-D</div>
                  <div className="w-10 text-center">PF</div>
                  <div className="w-10 text-center">PA</div>
                  <div className="w-10 text-center">%</div>
                  <div className="w-10 text-center">Pts</div>
                </div>
              </div>
            )}
            {(ladder ?? []).map((entry: any, i: number) => {
              const club = entry.teams?.clubs;
              const isTop4 = i < 4;
              const pf = entry.points_for ?? 0;
              const pa = entry.points_against ?? 0;
              const played = entry.played ?? 0;
              const nrr = played > 0 && pa > 0 ? (pf / played) - (pa / played) : pf > 0 ? 99.999 : 0;
              return (
                <Link key={entry.id} to={`/clubs/${club?.id}`}>
                  <div className={`match-card p-3.5 flex items-center gap-3 ${isTop4 ? 'border-l-2 border-l-primary' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isTop4 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <ClubLogo club={club ?? {}} size="sm" className="!h-8 !w-8" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">{club?.name}</span>
                      <span className="text-[10px] text-muted-foreground sm:hidden">{played} played · {entry.wins ?? 0}W {entry.losses ?? 0}L{isCricket ? ` · NRR ${nrr > 0 ? '+' : ''}${nrr.toFixed(3)}` : ''}</span>
                    </div>
                    {isCricket ? (
                      <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                        <div className="w-10 text-center hidden sm:block">
                          <div className="font-semibold">{played}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold sm:hidden">W-L-D</div>
                          <div className="font-bold hidden sm:block w-14 text-center">{entry.wins ?? 0}-{entry.losses ?? 0}-{entry.draws ?? 0}</div>
                        </div>
                        <div className="w-10 text-center hidden sm:block">
                          <div className="font-semibold">{pf}</div>
                        </div>
                        <div className="w-10 text-center hidden sm:block">
                          <div className="font-semibold">{pa}</div>
                        </div>
                        <div className="w-12 text-center hidden sm:block">
                          <div className={`font-semibold ${nrr > 0 ? 'text-green-600' : nrr < 0 ? 'text-red-500' : ''}`}>{nrr > 0 ? '+' : ''}{nrr.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold sm:hidden">Pts</div>
                          <div className="font-black text-sm text-primary w-10 text-center">{entry.competition_points ?? 0}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                        <div className="text-center">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold sm:hidden">W-L-D</div>
                          <div className="font-bold w-14 text-center">{entry.wins ?? 0}-{entry.losses ?? 0}-{entry.draws ?? 0}</div>
                        </div>
                        <div className="w-10 text-center hidden sm:block">
                          <div className="font-semibold">{entry.points_for ?? 0}</div>
                        </div>
                        <div className="w-10 text-center hidden sm:block">
                          <div className="font-semibold">{entry.points_against ?? 0}</div>
                        </div>
                        <div className="text-center hidden sm:block">
                          <div className="font-semibold w-10 text-center">{Number(entry.percentage ?? 0).toFixed(1)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold sm:hidden">Pts</div>
                          <div className="font-black text-sm text-primary w-10 text-center">{entry.competition_points ?? 0}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

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
