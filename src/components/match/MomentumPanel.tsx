import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ClubLogo from '@/components/ClubLogo';
import { Activity, Flame, TrendingUp } from 'lucide-react';

interface MomentumPanelProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
}

interface GoalEvent {
  id: string;
  fixture_id: string;
  team_id: string;
  player_id: string | null;
  is_goal: boolean;
  quarter: number;
  scored_at: string;
  players?: { first_name: string; last_name: string } | null;
}

// Parse "G.B" style quarter strings → points
function parseQ(q: string | null | undefined): number {
  if (!q) return 0;
  const m = q.match(/(\d+)\.(\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) * 6 + parseInt(m[2]);
}

export default function MomentumPanel({ fixture, result, homeClub, awayClub }: MomentumPanelProps) {
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const homeTeamId = fixture?.home_team?.id ?? fixture?.home_team_id;
  const awayTeamId = fixture?.away_team?.id ?? fixture?.away_team_id;

  useEffect(() => {
    if (!fixture?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('live_goal_events')
        .select('*, players(first_name, last_name)')
        .eq('fixture_id', fixture.id)
        .order('scored_at', { ascending: true });
      if (active) setEvents((data as any) ?? []);
    })();
    return () => { active = false; };
  }, [fixture?.id]);

  // ====== Quarter swing data ======
  const quarterSwing = useMemo(() => {
    if (!result) return [];
    const homeQ = [
      parseQ(result.home_q1), parseQ(result.home_q2), parseQ(result.home_q3), parseQ(result.home_q4),
    ];
    const awayQ = [
      parseQ(result.away_q1), parseQ(result.away_q2), parseQ(result.away_q3), parseQ(result.away_q4),
    ];
    // Convert cumulative → per-quarter
    const homePer = homeQ.map((v, i) => Math.max(0, v - (i > 0 ? homeQ[i - 1] : 0)));
    const awayPer = awayQ.map((v, i) => Math.max(0, v - (i > 0 ? awayQ[i - 1] : 0)));
    return [0, 1, 2, 3].map(i => {
      const total = homePer[i] + awayPer[i];
      const homePct = total > 0 ? (homePer[i] / total) * 100 : 50;
      return { q: i + 1, home: homePer[i], away: awayPer[i], homePct, hasData: total > 0 };
    });
  }, [result]);

  const hasQuarterData = quarterSwing.some(q => q.hasData);

  // ====== Goal timeline + scoring runs ======
  const goalEvents = useMemo(() => events.filter(e => e.is_goal), [events]);

  const runs = useMemo(() => {
    // Detect runs of N consecutive goals by same team (N >= 3)
    const out: { team_id: string; count: number; endIdx: number }[] = [];
    let cur = { team_id: '', count: 0 };
    goalEvents.forEach((e, idx) => {
      if (e.team_id === cur.team_id) {
        cur.count++;
      } else {
        if (cur.count >= 3) out.push({ ...cur, endIdx: idx - 1 });
        cur = { team_id: e.team_id, count: 1 };
      }
      if (idx === goalEvents.length - 1 && cur.count >= 3) {
        out.push({ ...cur, endIdx: idx });
      }
    });
    return out;
  }, [goalEvents]);

  // ====== Live momentum bar (last 5 goals) ======
  const liveMomentum = useMemo(() => {
    const recent = goalEvents.slice(-5);
    if (!recent.length) return { homePct: 50, awayPct: 50, recent: 0 };
    const homeCount = recent.filter(e => e.team_id === homeTeamId).length;
    return {
      homePct: (homeCount / recent.length) * 100,
      awayPct: ((recent.length - homeCount) / recent.length) * 100,
      recent: recent.length,
    };
  }, [goalEvents, homeTeamId]);

  const hasTimeline = goalEvents.length > 0;

  if (!hasQuarterData && !hasTimeline) return null;

  return (
    <div className="match-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Momentum</h3>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Live momentum bar */}
        {hasTimeline && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                  Recent momentum (last {liveMomentum.recent} goals)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClubLogo club={homeClub ?? {}} size="sm" className="!h-4 !w-4 shrink-0" />
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted/30 flex">
                <div
                  className="transition-all duration-500"
                  style={{
                    width: `${liveMomentum.homePct}%`,
                    backgroundColor: homeClub?.primary_color ?? 'hsl(var(--primary))',
                  }}
                />
                <div
                  className="transition-all duration-500"
                  style={{
                    width: `${liveMomentum.awayPct}%`,
                    backgroundColor: awayClub?.primary_color ?? 'hsl(var(--accent))',
                  }}
                />
              </div>
              <ClubLogo club={awayClub ?? {}} size="sm" className="!h-4 !w-4 shrink-0" />
            </div>
            <div className="flex justify-between mt-1 text-[9px] tabular-nums text-muted-foreground font-semibold">
              <span>{Math.round(liveMomentum.homePct)}%</span>
              <span>{Math.round(liveMomentum.awayPct)}%</span>
            </div>
          </div>
        )}

        {/* Quarter swing chart */}
        {hasQuarterData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                Quarter swing (points scored)
              </span>
            </div>
            <div className="space-y-1.5">
              {quarterSwing.map(q => (
                <div key={q.q} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-muted-foreground w-5 tabular-nums">Q{q.q}</span>
                  <span className="text-[10px] font-bold tabular-nums text-foreground w-6 text-right">{q.home}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted/30 flex">
                    <div
                      className="transition-all"
                      style={{
                        width: `${q.homePct}%`,
                        backgroundColor: homeClub?.primary_color ?? 'hsl(var(--primary))',
                      }}
                    />
                    <div
                      className="transition-all"
                      style={{
                        width: `${100 - q.homePct}%`,
                        backgroundColor: awayClub?.primary_color ?? 'hsl(var(--accent))',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-foreground w-6">{q.away}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal timeline */}
        {hasTimeline && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                Goal timeline
              </span>
              {runs.length > 0 && (
                <div className="flex items-center gap-1 text-[9px] font-black text-primary">
                  <Flame className="h-3 w-3" />
                  <span>{runs.length} scoring run{runs.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {goalEvents.slice().reverse().map((e, idxFromEnd) => {
                const trueIdx = goalEvents.length - 1 - idxFromEnd;
                const isHome = e.team_id === homeTeamId;
                const club = isHome ? homeClub : awayClub;
                const inRun = runs.find(r => trueIdx <= r.endIdx && trueIdx > r.endIdx - r.count);
                const playerName = e.players
                  ? `${e.players.first_name?.[0] ?? ''}. ${e.players.last_name}`
                  : 'Unknown';
                return (
                  <div
                    key={e.id}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-md ${
                      inRun ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20'
                    }`}
                  >
                    <span className="text-[9px] font-black text-muted-foreground tabular-nums w-6">
                      Q{e.quarter}
                    </span>
                    <ClubLogo club={club ?? {}} size="sm" className="!h-4 !w-4 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground flex-1 truncate">
                      {playerName}
                    </span>
                    {inRun && trueIdx === inRun.endIdx && (
                      <span className="flex items-center gap-0.5 text-[9px] font-black text-primary">
                        <Flame className="h-2.5 w-2.5" />
                        {inRun.count} in a row
                      </span>
                    )}
                    <span
                      className="text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${club?.primary_color ?? '#1a365d'}20`,
                        color: club?.primary_color ?? 'hsl(var(--primary))',
                      }}
                    >
                      GOAL
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
