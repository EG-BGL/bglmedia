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

  // Build a closed area path so the worm "fills" toward the leading team
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${yMid} L ${points[0].x.toFixed(1)} ${yMid} Z`;

  // Gridline values (e.g., ±multiples of 12 pts = 2 goals)
  const gridStep = maxAbs > 36 ? 24 : maxAbs > 18 ? 12 : 6;
  const gridLines: number[] = [];
  for (let v = gridStep; v <= maxAbs; v += gridStep) gridLines.push(v);

  return (
    <div className="match-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-muted/40 to-transparent">
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Scoring Worm</h3>
        </div>
        <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1" style={{ color: homeColor }}>
            <span className="h-2 w-3 rounded-sm" style={{ backgroundColor: homeColor }} />
            {homeClub?.short_name ?? 'Home'}
          </span>
          <span className="flex items-center gap-1" style={{ color: awayColor }}>
            <span className="h-2 w-3 rounded-sm" style={{ backgroundColor: awayColor }} />
            {awayClub?.short_name ?? 'Away'}
          </span>
        </div>
      </div>

      <div className="px-3 py-3 bg-background">
        <div className="relative rounded-lg overflow-hidden border border-border/40 bg-card">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" preserveAspectRatio="none">
            <defs>
              <linearGradient id="worm-home" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={homeColor} stopOpacity="0.55" />
                <stop offset="100%" stopColor={homeColor} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="worm-away" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={awayColor} stopOpacity="0.55" />
                <stop offset="100%" stopColor={awayColor} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="worm-stroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={homeColor} />
                <stop offset="50%" stopColor="hsl(var(--foreground))" />
                <stop offset="100%" stopColor={awayColor} />
              </linearGradient>
              <filter id="worm-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMerge in="blur" />
                  <feMerge in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Zone fills */}
            <rect x="0" y="0" width={W} height={yMid} fill="url(#worm-home)" />
            <rect x="0" y={yMid} width={W} height={H - yMid} fill="url(#worm-away)" />

            {/* Gridlines */}
            {gridLines.map(v => (
              <g key={v}>
                <line x1="0" y1={yMid - v * yScale} x2={W} y2={yMid - v * yScale} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.35" />
                <line x1="0" y1={yMid + v * yScale} x2={W} y2={yMid + v * yScale} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.35" />
              </g>
            ))}

            {/* Quarter dividers */}
            {[1, 2, 3].map(i => {
              const x = padX + ((W - padX * 2) * i) / 4;
              return (
                <g key={i}>
                  <line x1={x} y1={padY} x2={x} y2={H - padY} stroke="hsl(var(--border))" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.55" />
                  <text x={x + 3} y={padY + 8} fill="hsl(var(--muted-foreground))" fontSize="7" fontWeight="900" opacity="0.6">Q{i + 1}</text>
                </g>
              );
            })}

            {/* Midline (bold) */}
            <line x1="0" y1={yMid} x2={W} y2={yMid} stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.5" />

            {/* Filled area under worm */}
            <path d={areaD} fill={leader === 'home' ? homeColor : leader === 'away' ? awayColor : 'hsl(var(--muted-foreground))'} fillOpacity="0.12" />

            {/* Glow layer */}
            <path d={pathD} fill="none" stroke="url(#worm-stroke)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" filter="url(#worm-glow)" />
            {/* Main worm */}
            <path d={pathD} fill="none" stroke="url(#worm-stroke)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Point dots */}
            {points.slice(1, -1).map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="2" fill="hsl(var(--background))" stroke={pt.diff >= 0 ? homeColor : awayColor} strokeWidth="1.5" />
            ))}

            {/* End point marker (pulsing) */}
            {points.length > 0 && (() => {
              const last = points[points.length - 1];
              const color = leader === 'home' ? homeColor : leader === 'away' ? awayColor : 'hsl(var(--muted-foreground))';
              return (
                <>
                  <circle cx={last.x} cy={last.y} r="9" fill={color} fillOpacity="0.25">
                    <animate attributeName="r" values="7;11;7" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="fill-opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={last.x} cy={last.y} r="5" fill={color} stroke="hsl(var(--background))" strokeWidth="2.5" />
                </>
              );
            })()}
          </svg>

          {/* Side labels */}
          <div className="absolute top-1.5 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-background/80 backdrop-blur-sm" style={{ color: homeColor }}>
            ▲ {homeClub?.short_name ?? 'Home'}
          </div>
          <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-background/80 backdrop-blur-sm" style={{ color: awayColor }}>
            ▼ {awayClub?.short_name ?? 'Away'}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5 text-[10px] font-bold">
          <span className="text-muted-foreground uppercase tracking-wider">
            {events.length > 0 ? `${events.length} scoring events` : 'Quarter snapshots'}
          </span>
          <span
            className="tabular-nums px-2.5 py-1 rounded-md font-black text-[11px] uppercase tracking-wider shadow-sm"
            style={{
              color: leader ? '#fff' : 'hsl(var(--muted-foreground))',
              backgroundColor: leader ? (leader === 'home' ? homeColor : awayColor) : 'hsl(var(--muted) / 0.4)',
            }}
          >
            {lastDiff === 0 ? 'SCORES LEVEL' : `${leader === 'home' ? homeClub?.short_name ?? 'Home' : awayClub?.short_name ?? 'Away'} +${Math.abs(lastDiff)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
