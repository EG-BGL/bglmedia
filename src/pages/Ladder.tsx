import Layout from '@/components/layout/Layout';
import { useLadder, useSeasons } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSport } from '@/hooks/useSport';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ChevronRight } from 'lucide-react';

export default function Ladder() {
  const { sports, currentSport, setSport } = useSport();
  const { data: allSeasons } = useSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const seasons = useMemo(() => {
    if (!allSeasons || !currentSport) return [];
    return allSeasons.filter((s: any) => s.competitions?.sport_id === currentSport.id);
  }, [allSeasons, currentSport]);

  useEffect(() => {
    const current = seasons.find((s: any) => s.is_current);
    if (current) setSelectedSeasonId(current.id);
    else if (seasons.length > 0) setSelectedSeasonId(seasons[0].id);
    else setSelectedSeasonId('');
  }, [seasons]);

  const isCricket = currentSport?.slug === 'cricket';
  const selectedSeason = seasons.find((s: any) => s.id === selectedSeasonId);
  const { data: ladder, isLoading } = useLadder(selectedSeasonId || undefined);

  const { data: coaches } = useQuery({
    queryKey: ['coaches-for-season', selectedSeasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches_to_teams')
        .select('team_id, is_primary, profiles:user_id(full_name)')
        .eq('season_id', selectedSeasonId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSeasonId,
  });

  const coachMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!coaches) return map;
    for (const c of coaches) {
      const name = (c.profiles as any)?.full_name;
      if (name && (!map[c.team_id] || c.is_primary)) map[c.team_id] = name;
    }
    return map;
  }, [coaches]);

  const statColumns = isCricket
    ? [
        { key: 'played', label: 'P', width: 'w-9' },
        { key: 'wld', label: 'W-L-D', width: 'w-16' },
        { key: 'rf', label: 'RF', width: 'w-10' },
        { key: 'ra', label: 'RA', width: 'w-10' },
        { key: 'nrr', label: 'NRR', width: 'w-14' },
        { key: 'pts', label: 'PTS', width: 'w-10' },
      ]
    : [
        { key: 'wld', label: 'W-L-D', width: 'w-16' },
        { key: 'pf', label: 'PF', width: 'w-10' },
        { key: 'pa', label: 'PA', width: 'w-10' },
        { key: 'pct', label: '%', width: 'w-12' },
        { key: 'pts', label: 'PTS', width: 'w-10' },
      ];

  return (
    <Layout>
      <div className="page-container py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Ladder</h1>
              <p className="text-[11px] text-muted-foreground font-medium">{selectedSeason?.name ?? ''} Season Standings</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {sports.length > 1 && (
            <div className="flex items-center bg-secondary/60 rounded-lg p-0.5 gap-0.5">
              {sports.map((sport) => {
                const active = currentSport?.slug === sport.slug;
                return (
                  <button
                    key={sport.id}
                    onClick={() => setSport(sport.slug)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
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
              <SelectTrigger className="w-[180px] h-8 rounded-lg text-xs font-semibold border-border/40 bg-secondary/40">
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
          <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-secondary/30 border-b border-border/30">
              <div className="w-7 shrink-0" />
              <div className="w-9 shrink-0" />
              <div className="flex-1 min-w-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</div>
              <div className="flex items-center shrink-0">
                {statColumns.map((col) => (
                  <div key={col.key} className={`${col.width} text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground`}>
                    {col.label}
                  </div>
                ))}
              </div>
              <div className="w-5 shrink-0" />
            </div>

            {(ladder ?? []).map((entry: any, i: number) => {
              const club = entry.teams?.clubs;
              const teamId = entry.teams?.id;
              const coachName = teamId ? coachMap[teamId] : undefined;
              const isTop4 = i < 4;
              const isFirst = i === 0;
              const pf = entry.points_for ?? 0;
              const pa = entry.points_against ?? 0;
              const played = entry.played ?? 0;
              const nrr = played > 0 && pa > 0 ? (pf / played) - (pa / played) : pf > 0 ? 99.999 : 0;
              const isLast = i === (ladder ?? []).length - 1;

              const renderStatValue = (col: typeof statColumns[0]) => {
                switch (col.key) {
                  case 'played': return <span className="font-semibold">{played}</span>;
                  case 'wld': return <span className="font-bold">{entry.wins ?? 0}-{entry.losses ?? 0}-{entry.draws ?? 0}</span>;
                  case 'rf': return <span className="font-semibold">{pf}</span>;
                  case 'ra': return <span className="font-semibold">{pa}</span>;
                  case 'nrr': return <span className={`font-semibold ${nrr > 0 ? 'text-green-400' : nrr < 0 ? 'text-red-400' : ''}`}>{nrr > 0 ? '+' : ''}{nrr.toFixed(3)}</span>;
                  case 'pf': return <span className="font-semibold">{entry.points_for ?? 0}</span>;
                  case 'pa': return <span className="font-semibold">{entry.points_against ?? 0}</span>;
                  case 'pct': return <span className="font-semibold">{Number(entry.percentage ?? 0).toFixed(1)}</span>;
                  case 'pts': return <span className="font-black text-primary">{entry.competition_points ?? 0}</span>;
                  default: return null;
                }
              };

              return (
                <Link key={entry.id} to={`/clubs/${club?.id}`}>
                  <div
                    className={`flex items-center gap-2 px-4 py-3 transition-colors hover:bg-secondary/30 group ${
                      !isLast ? 'border-b border-border/20' : ''
                    } ${isTop4 ? 'border-l-[3px] border-l-primary' : 'border-l-[3px] border-l-transparent'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isFirst
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : isTop4
                          ? 'bg-primary/15 text-primary'
                          : 'bg-secondary/60 text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <ClubLogo club={club ?? {}} size="sm" className="!h-9 !w-9 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate leading-tight">{club?.name}</span>
                      {coachName && <span className="text-[10px] text-muted-foreground block truncate leading-tight mt-0.5">{coachName}</span>}
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <span className="text-[10px] font-bold text-foreground/80">{entry.wins ?? 0}W {entry.losses ?? 0}L {entry.draws ?? 0}D</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] font-black text-primary">{entry.competition_points ?? 0} pts</span>
                        {isCricket && (
                          <>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className={`text-[10px] font-semibold ${nrr > 0 ? 'text-green-400' : nrr < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                              NRR {nrr > 0 ? '+' : ''}{nrr.toFixed(3)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center shrink-0 text-xs tabular-nums">
                      {statColumns.map((col) => (
                        <div key={col.key} className={`${col.width} text-center`}>
                          {renderStatValue(col)}
                        </div>
                      ))}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/15 border-l-[3px] border-l-primary" />
            <span className="font-medium">Finals qualifying</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
