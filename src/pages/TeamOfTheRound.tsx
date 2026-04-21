import Layout from '@/components/layout/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSport } from '@/hooks/useSport';
import { useSeasons } from '@/hooks/useData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClubLogo from '@/components/ClubLogo';
import { Trophy, Sparkles } from 'lucide-react';

type Slot = { row: 'B' | 'HB' | 'C' | 'HF' | 'F' | 'R' | 'IC'; positions: string[]; count: number };

// AFL field formation: 6 backs, 6 mids, 1 ruck, 6 forwards, 3 bench
const FORMATION: Slot[] = [
  { row: 'F', positions: ['Forward'], count: 3 },
  { row: 'HF', positions: ['Forward'], count: 3 },
  { row: 'C', positions: ['Midfielder'], count: 3 },
  { row: 'R', positions: ['Ruck', 'Midfielder'], count: 3 },
  { row: 'HB', positions: ['Defender'], count: 3 },
  { row: 'B', positions: ['Defender'], count: 3 },
];

const ROW_LABELS: Record<Slot['row'], string> = {
  F: 'FORWARDS',
  HF: 'HALF FORWARDS',
  C: 'CENTRES',
  R: 'RUCK / MIDS',
  HB: 'HALF BACKS',
  B: 'BACKS',
  IC: 'INTERCHANGE',
};

export default function TeamOfTheRound() {
  const { sports, currentSport, setSport } = useSport();
  const { data: allSeasons } = useSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const seasons = useMemo(() => {
    if (!allSeasons || !currentSport) return [];
    return allSeasons.filter((s: any) => s.competitions?.sport_id === currentSport.id);
  }, [allSeasons, currentSport]);

  useEffect(() => {
    const stillValid = seasons.some((s: any) => s.id === selectedSeasonId);
    if (stillValid) return;
    const current = seasons.find((s: any) => s.is_current);
    if (current) setSelectedSeasonId(current.id);
    else if (seasons.length > 0) setSelectedSeasonId(seasons[0].id);
    else setSelectedSeasonId('');
  }, [seasons, selectedSeasonId]);

  const isAfl = currentSport?.slug === 'afl';

  const { data, isLoading } = useQuery({
    queryKey: ['team-of-the-round', selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return null;
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('id, round_number, status')
        .eq('season_id', selectedSeasonId);
      if (!fixtures?.length) return { rounds: [], stats: [] };

      const fixtureIds = fixtures.map(f => f.id);
      const { data: stats } = await supabase
        .from('match_player_stats')
        .select('*, players(id, first_name, last_name, position, photo_url, jersey_number, teams(id, club_id, clubs(id, name, short_name, logo_url, primary_color, secondary_color)))')
        .in('fixture_id', fixtureIds);

      const completedRounds = Array.from(
        new Set(fixtures.filter((f: any) => f.status === 'completed').map((f: any) => f.round_number))
      ).sort((a, b) => b - a);

      const fixtureRound = new Map<string, number>();
      for (const f of fixtures) fixtureRound.set(f.id, f.round_number);

      return { rounds: completedRounds, stats: stats ?? [], fixtureRound };
    },
    enabled: !!selectedSeasonId && isAfl,
  });

  // Default to most recent completed round
  useEffect(() => {
    if (data?.rounds?.length && (selectedRound === null || !data.rounds.includes(selectedRound))) {
      setSelectedRound(data.rounds[0]);
    }
  }, [data, selectedRound]);

  const team = useMemo(() => {
    if (!data || selectedRound === null) return null;
    const roundStats = data.stats.filter((s: any) => data.fixtureRound?.get(s.fixture_id) === selectedRound);
    if (!roundStats.length) return null;

    // Best score per player (deduped)
    const bestByPlayer = new Map<string, any>();
    for (const s of roundStats) {
      const existing = bestByPlayer.get(s.player_id);
      if (!existing || (s.afl_fantasy ?? 0) > (existing.afl_fantasy ?? 0)) {
        bestByPlayer.set(s.player_id, s);
      }
    }
    const pool = Array.from(bestByPlayer.values()).filter(s => (s.afl_fantasy ?? 0) > 0);
    if (!pool.length) return null;

    const used = new Set<string>();
    const result: { row: Slot['row']; players: any[] }[] = [];

    for (const slot of FORMATION) {
      const eligible = pool
        .filter(s => !used.has(s.player_id))
        .filter(s => slot.positions.includes(s.players?.position ?? ''))
        .sort((a, b) => (b.afl_fantasy ?? 0) - (a.afl_fantasy ?? 0))
        .slice(0, slot.count);
      // Strict: only play position-eligible players in their position. No fillers.
      eligible.forEach(p => used.add(p.player_id));
      result.push({ row: slot.row, players: eligible });
    }

    // Interchange: top 4 remaining position-eligible players (any of the on-field positions)
    const benchPositions = new Set(FORMATION.flatMap(f => f.positions));
    const bench = pool
      .filter(s => !used.has(s.player_id))
      .filter(s => benchPositions.has(s.players?.position ?? ''))
      .sort((a, b) => (b.afl_fantasy ?? 0) - (a.afl_fantasy ?? 0))
      .slice(0, 4);
    bench.forEach(p => used.add(p.player_id));
    result.push({ row: 'IC', players: bench });

    // Captain: highest fantasy across whole team
    const captain = [...bestByPlayer.values()]
      .filter(s => used.has(s.player_id))
      .sort((a, b) => (b.afl_fantasy ?? 0) - (a.afl_fantasy ?? 0))[0];

    return { rows: result, captain };
  }, [data, selectedRound]);

  return (
    <Layout>
      <div className="page-container py-4 space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
              <Trophy className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">Team of the Round</h1>
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mt-1.5">
                Top 22 · AFL Fantasy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {sports.length > 1 && (
              <Select value={currentSport?.slug ?? ''} onValueChange={setSport}>
                <SelectTrigger className="h-9 text-xs font-semibold w-[100px] rounded-lg border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sports.map((s: any) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {seasons.length > 0 && (
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="h-9 text-xs font-semibold w-[130px] rounded-lg border-border/60"><SelectValue placeholder="Season" /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {data?.rounds?.length ? (
              <Select value={String(selectedRound ?? '')} onValueChange={(v) => setSelectedRound(Number(v))}>
                <SelectTrigger className="h-9 text-xs font-semibold w-[100px] rounded-lg border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.rounds.map((r: number) => <SelectItem key={r} value={String(r)}>Round {r}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        {!isAfl ? (
          <div className="match-card p-10 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Team of the Round is currently AFL-only.</p>
          </div>
        ) : isLoading ? (
          <div className="match-card p-10 text-center text-xs font-semibold text-muted-foreground">Loading…</div>
        ) : !team ? (
          <div className="match-card p-10 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No completed match stats available yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Once player stats are recorded for a round, the team will appear here.</p>
          </div>
        ) : (
          <FieldView rows={team.rows} captainId={team.captain?.player_id} />
        )}
      </div>
    </Layout>
  );
}

function FieldView({ rows, captainId }: { rows: { row: Slot['row']; players: any[] }[]; captainId?: string }) {
  const onField = rows.filter(r => r.row !== 'IC');
  const bench = rows.find(r => r.row === 'IC');

  return (
    <div className="space-y-4">
      {/* Field */}
      <div
        className="relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black/40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, hsl(140 55% 32%) 0%, hsl(142 60% 24%) 45%, hsl(145 65% 14%) 100%)',
        }}
      >
        {/* Subtle turf stripes */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 80px)',
          }}
        />

        {/* Field markings */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.35]" viewBox="0 0 100 140" preserveAspectRatio="none">
          <ellipse cx="50" cy="70" rx="48" ry="68" stroke="white" strokeWidth="0.35" fill="none" />
          <circle cx="50" cy="70" r="6" stroke="white" strokeWidth="0.3" fill="none" />
          <circle cx="50" cy="70" r="2" stroke="white" strokeWidth="0.3" fill="none" />
          <rect x="40" y="60" width="20" height="20" stroke="white" strokeWidth="0.3" fill="none" />
          <path d="M 25 18 Q 50 38 75 18" stroke="white" strokeWidth="0.3" fill="none" />
          <path d="M 25 122 Q 50 102 75 122" stroke="white" strokeWidth="0.3" fill="none" />
          <rect x="44" y="2" width="12" height="6" stroke="white" strokeWidth="0.3" fill="none" />
          <rect x="44" y="132" width="12" height="6" stroke="white" strokeWidth="0.3" fill="none" />
        </svg>

        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative grid grid-rows-6 gap-2 py-6 px-2 sm:px-6 min-h-[680px]">
          {onField.map((r) => (
            <div key={r.row} className="flex flex-col">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-px w-6 bg-white/15" />
                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60">
                  {ROW_LABELS[r.row]}
                </div>
                <div className="h-px w-6 bg-white/15" />
              </div>
              <div className="flex items-center justify-around gap-1 flex-1">
                {r.players.length === 0 ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25">No eligible players</div>
                ) : (
                  r.players.map((p) => (
                    <FieldPlayer key={p.player_id} stat={p} isCaptain={p.player_id === captainId} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interchange */}
      {bench && bench.players.length > 0 && (
        <div className="match-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/70">
              {ROW_LABELS.IC}
            </div>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {bench.players.map((p) => (
              <FieldPlayer key={p.player_id} stat={p} isCaptain={p.player_id === captainId} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldPlayer({ stat, isCaptain, compact }: { stat: any; isCaptain?: boolean; compact?: boolean }) {
  const player = stat?.players;
  const club = player?.teams?.clubs;
  const initials = player ? `${player.first_name?.[0] ?? ''}${player.last_name?.[0] ?? ''}`.toUpperCase() : '?';
  const primary = club?.primary_color ?? '#1a365d';
  const secondary = club?.secondary_color ?? '#fff';
  const size = compact ? 'h-12 w-12' : 'h-14 w-14 sm:h-[60px] sm:w-[60px]';

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0 max-w-[78px]">
      <div className="relative">
        <div
          className="absolute -inset-0.5 rounded-full opacity-60 blur-[2px]"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        />
        <Avatar className={`${size} relative ring-2 ring-white/90 shadow-xl shadow-black/40`}>
          {player?.photo_url && <AvatarImage src={player.photo_url} alt="" className="object-cover" />}
          <AvatarFallback
            className="text-sm font-black"
            style={{ backgroundColor: primary, color: secondary }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {isCaptain && (
          <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-lg">
            C
          </div>
        )}
        {club?.logo_url && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <ClubLogo club={club} size="sm" className="!h-5 !w-5 ring-1 ring-white rounded-full bg-white shadow-md" />
          </div>
        )}
      </div>
      <div className="text-center min-w-0 w-full flex flex-col items-center gap-0.5">
        <div className="text-[10px] font-bold text-white truncate leading-tight w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {player?.last_name ?? '—'}
        </div>
        <div className="text-[10px] font-black tabular-nums text-white bg-black/55 backdrop-blur-sm rounded-md px-1.5 py-px ring-1 ring-white/10">
          {stat.afl_fantasy ?? 0}
        </div>
      </div>
    </div>
  );
}
