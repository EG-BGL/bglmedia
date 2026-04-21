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
      // Top up with any remaining if not enough at that position
      if (eligible.length < slot.count) {
        const fillers = pool
          .filter(s => !used.has(s.player_id) && !eligible.find(e => e.player_id === s.player_id))
          .sort((a, b) => (b.afl_fantasy ?? 0) - (a.afl_fantasy ?? 0))
          .slice(0, slot.count - eligible.length);
        eligible.push(...fillers);
      }
      eligible.forEach(p => used.add(p.player_id));
      result.push({ row: slot.row, players: eligible });
    }

    // Interchange: top 4 remaining
    const bench = pool
      .filter(s => !used.has(s.player_id))
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
      <div className="page-container py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Team of the Round</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Top 22 by AFL Fantasy</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sports.length > 1 && (
              <Select value={currentSport?.slug ?? ''} onValueChange={setSport}>
                <SelectTrigger className="h-8 text-xs w-[110px] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sports.map((s: any) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {seasons.length > 0 && (
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="h-8 text-xs w-[140px] rounded-lg"><SelectValue placeholder="Season" /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {data?.rounds?.length ? (
              <Select value={String(selectedRound ?? '')} onValueChange={(v) => setSelectedRound(Number(v))}>
                <SelectTrigger className="h-8 text-xs w-[110px] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.rounds.map((r: number) => <SelectItem key={r} value={String(r)}>Round {r}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        {!isAfl ? (
          <div className="match-card p-8 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Team of the Round is currently AFL-only.</p>
          </div>
        ) : isLoading ? (
          <div className="match-card p-8 text-center text-xs text-muted-foreground">Loading…</div>
        ) : !team ? (
          <div className="match-card p-8 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No completed match stats available yet.</p>
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
        className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(140 60% 28%) 0%, hsl(140 60% 22%) 60%, hsl(140 60% 16%) 100%)',
        }}
      >
        {/* Field markings */}
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 140" preserveAspectRatio="none">
          {/* Boundary oval */}
          <ellipse cx="50" cy="70" rx="48" ry="68" stroke="white" strokeWidth="0.4" fill="none" />
          {/* Centre circle + square */}
          <circle cx="50" cy="70" r="6" stroke="white" strokeWidth="0.3" fill="none" />
          <circle cx="50" cy="70" r="2" stroke="white" strokeWidth="0.3" fill="none" />
          <rect x="40" y="60" width="20" height="20" stroke="white" strokeWidth="0.3" fill="none" />
          {/* 50m arcs (approx) */}
          <path d="M 25 18 Q 50 38 75 18" stroke="white" strokeWidth="0.3" fill="none" />
          <path d="M 25 122 Q 50 102 75 122" stroke="white" strokeWidth="0.3" fill="none" />
          {/* Goal squares */}
          <rect x="44" y="2" width="12" height="6" stroke="white" strokeWidth="0.3" fill="none" />
          <rect x="44" y="132" width="12" height="6" stroke="white" strokeWidth="0.3" fill="none" />
        </svg>

        <div className="relative grid grid-rows-6 gap-1 py-4 px-2 sm:px-6 min-h-[640px]">
          {onField.map((r) => (
            <div key={r.row} className="flex flex-col">
              <div className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                {ROW_LABELS[r.row]}
              </div>
              <div className="flex items-center justify-around gap-1 flex-1">
                {r.players.map((p) => (
                  <FieldPlayer key={p.player_id} stat={p} isCaptain={p.player_id === captainId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interchange */}
      {bench && bench.players.length > 0 && (
        <div className="match-card p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            {ROW_LABELS.IC}
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
  const size = compact ? 'h-12 w-12' : 'h-14 w-14 sm:h-16 sm:w-16';

  return (
    <div className="flex flex-col items-center gap-1 min-w-0 max-w-[80px]">
      <div className="relative">
        <Avatar className={`${size} ring-2 ring-white/50 shadow-lg`}>
          {player?.photo_url && <AvatarImage src={player.photo_url} alt="" className="object-cover" />}
          <AvatarFallback
            className="text-xs font-black"
            style={{ backgroundColor: primary, color: secondary }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {isCaptain && (
          <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-md">
            C
          </div>
        )}
        {club?.logo_url && (
          <div className="absolute -bottom-1 -right-1">
            <ClubLogo club={club} size="sm" className="!h-5 !w-5 ring-1 ring-white/60 rounded-full bg-white" />
          </div>
        )}
      </div>
      <div className="text-center min-w-0 w-full">
        <div className="text-[10px] font-bold text-white truncate leading-tight drop-shadow">
          {player?.last_name ?? '—'}
        </div>
        <div className="text-[10px] font-black tabular-nums text-primary-foreground bg-primary/90 rounded px-1.5 py-px inline-block mt-0.5">
          {stat.afl_fantasy ?? 0}
        </div>
      </div>
    </div>
  );
}
