import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ClubLogo from '@/components/ClubLogo';
import { Activity } from 'lucide-react';

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
  behinds?: number | null;
  quarter: number;
  scored_at: string;
}

function parseQ(q: string | null | undefined): { goals: number; behinds: number; pts: number } {
  if (!q) return { goals: 0, behinds: 0, pts: 0 };
  const m = q.match(/(\d+)\.(\d+)/);
  if (!m) return { goals: 0, behinds: 0, pts: 0 };
  const g = parseInt(m[1]);
  const b = parseInt(m[2]);
  return { goals: g, behinds: b, pts: g * 6 + b };
}

export default function MomentumPanel({ fixture, result, homeClub, awayClub }: MomentumPanelProps) {
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const homeTeamId = fixture?.home_team?.id ?? fixture?.home_team_id;

  useEffect(() => {
    if (!fixture?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('live_goal_events')
        .select('*')
        .eq('fixture_id', fixture.id)
        .order('scored_at', { ascending: true });
      if (active) setEvents((data as any) ?? []);
    })();
    return () => { active = false; };
  }, [fixture?.id]);

  // Build worm points: cumulative (home - away) point differential over time.
  // Prefer live event timeline when available; fall back to quarter-end snapshots from result.
  const worm = useMemo(() => {
    const pts: { x: number; diff: number; label: string }[] = [{ x: 0, diff: 0, label: 'Start' }];

    if (events.length > 0) {
      let home = 0;
      let away = 0;
      events.forEach((e, i) => {
        const add = (e.is_goal ? 6 : 1);
        if (e.team_id === homeTeamId) home += add; else away += add;
        pts.push({ x: i + 1, diff: home - away, label: `Q${e.quarter}` });
      });
      return pts;
    }

    if (result) {
      const homeQ = [parseQ(result.home_q1).pts, parseQ(result.home_q2).pts, parseQ(result.home_q3).pts, parseQ(result.home_q4).pts];
      const awayQ = [parseQ(result.away_q1).pts, parseQ(result.away_q2).pts, parseQ(result.away_q3).pts, parseQ(result.away_q4).pts];
      homeQ.forEach((h, i) => {
        if (h > 0 || awayQ[i] > 0) pts.push({ x: i + 1, diff: h - awayQ[i], label: `Q${i + 1}` });
      });
      return pts;
    }
    return pts;
  }, [events, result, homeTeamId]);

  const hasData = worm.length > 1;
  if (!hasData) return null;

  // Chart geometry
  const W = 600;
  const H = 140;
  const padX = 24;
  const padY = 14;
  const maxAbs = Math.max(6, ...worm.map(p => Math.abs(p.diff)));
  const xStep = (W - padX * 2) / Math.max(1, worm.length - 1);
  const yMid = H / 2;
  const yScale = (H / 2 - padY) / maxAbs;

  const points = worm.map((p, i) => ({
    x: padX + i * xStep,
    y: yMid - p.diff * yScale,
    diff: p.diff,
    label: p.label,
  }));

  // Smooth path via Catmull-Rom-ish approximation (simple bezier)
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = arr[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} Q ${cx.toFixed(1)} ${prev.y.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const lastDiff = points[points.length - 1].diff;
  const leader = lastDiff === 0 ? null : (lastDiff > 0 ? 'home' : 'away');
  const homeColor = homeClub?.primary_color ?? 'hsl(var(--primary))';
  const awayColor = awayClub?.primary_color ?? 'hsl(var(--accent))';

  return (
    <div className="match-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Scoring Worm</h3>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1" style={{ color: homeColor }}>
            <span className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: homeColor }} />
            {homeClub?.short_name ?? 'Home'}
          </span>
          <span className="flex items-center gap-1" style={{ color: awayColor }}>
            <span className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: awayColor }} />
            {awayClub?.short_name ?? 'Away'}
          </span>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
            <defs>
              <linearGradient id="worm-home" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={homeColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={homeColor} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="worm-away" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={awayColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={awayColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Home zone (above midline) */}
            <rect x="0" y="0" width={W} height={yMid} fill="url(#worm-home)" />
            {/* Away zone (below midline) */}
            <rect x="0" y={yMid} width={W} height={H - yMid} fill="url(#worm-away)" />

            {/* Midline */}
            <line x1="0" y1={yMid} x2={W} y2={yMid} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 3" />

            {/* Quarter dividers if we have 4+ points */}
            {points.length >= 4 && [1, 2, 3].map(i => {
              const x = padX + (i * (W - padX * 2)) / Math.max(1, points.length - 1) * (points.length - 1) / 4;
              return <line key={i} x1={x} y1={padY} x2={x} y2={H - padY} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />;
            })}

            {/* Worm path */}
            <path d={pathD} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* End point marker */}
            {points.length > 0 && (() => {
              const last = points[points.length - 1];
              const color = leader === 'home' ? homeColor : leader === 'away' ? awayColor : 'hsl(var(--muted-foreground))';
              return (
                <>
                  <circle cx={last.x} cy={last.y} r="5" fill={color} stroke="hsl(var(--background))" strokeWidth="2" />
                </>
              );
            })()}
          </svg>

          {/* Side labels */}
          <div className="absolute top-1 left-1 text-[8px] font-black uppercase tracking-wider" style={{ color: homeColor }}>
            ▲ {homeClub?.short_name ?? 'Home'}
          </div>
          <div className="absolute bottom-1 left-1 text-[8px] font-black uppercase tracking-wider" style={{ color: awayColor }}>
            ▼ {awayClub?.short_name ?? 'Away'}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px] font-bold">
          <span className="text-muted-foreground">
            {events.length > 0 ? `${events.length} scoring events` : 'Quarter snapshots'}
          </span>
          <span
            className="tabular-nums px-2 py-0.5 rounded font-black"
            style={{
              color: leader ? (leader === 'home' ? homeColor : awayColor) : 'hsl(var(--muted-foreground))',
              backgroundColor: leader ? `${leader === 'home' ? homeColor : awayColor}1A` : 'hsl(var(--muted) / 0.3)',
            }}
          >
            {lastDiff === 0 ? 'SCORES LEVEL' : `${leader === 'home' ? homeClub?.short_name ?? 'Home' : awayClub?.short_name ?? 'Away'} +${Math.abs(lastDiff)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
