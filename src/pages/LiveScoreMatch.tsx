import Layout from '@/components/layout/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ClubLogo from '@/components/ClubLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Plus, Minus, Play, Pause, Flag, Undo2, Loader2 } from 'lucide-react';
import { useLiveMatch } from '@/hooks/useLiveMatch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

export default function LiveScoreMatch() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, events } = useLiveMatch(id);
  const [fixture, setFixture] = useState<any>(null);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCtx, setPickerCtx] = useState<{ team: 'home' | 'away'; type: 'goal' | 'behind' } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: f } = await supabase
        .from('fixtures')
        .select(`
          id, scheduled_at, round_number, venue, match_format,
          home_team:teams!fixtures_home_team_id_fkey(id, clubs(id, name, short_name, logo_url, primary_color, secondary_color)),
          away_team:teams!fixtures_away_team_id_fkey(id, clubs(id, name, short_name, logo_url, primary_color, secondary_color))
        `)
        .eq('id', id).maybeSingle();
      setFixture(f);
      const homeId = (f as any)?.home_team?.id;
      const awayId = (f as any)?.away_team?.id;
      if (homeId) {
        const { data: hp } = await supabase.from('players').select('id, first_name, last_name, jersey_number').eq('team_id', homeId).order('last_name');
        setHomePlayers(hp ?? []);
      }
      if (awayId) {
        const { data: ap } = await supabase.from('players').select('id, first_name, last_name, jersey_number').eq('team_id', awayId).order('last_name');
        setAwayPlayers(ap ?? []);
      }
    })();
  }, [id]);

  const homeClub = (fixture as any)?.home_team?.clubs;
  const awayClub = (fixture as any)?.away_team?.clubs;
  const homeScore = (state?.home_goals ?? 0) * 6 + (state?.home_behinds ?? 0);
  const awayScore = (state?.away_goals ?? 0) * 6 + (state?.away_behinds ?? 0);
  const matchStatus = state?.match_status ?? 'not_started';
  const quarter = state?.current_quarter ?? 1;
  const isFinished = matchStatus === 'finished';

  const callAction = async (action: any) => {
    if (!id) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('live-score-action', {
        body: { fixture_id: id, action },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message ?? 'Unable to update', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleScore = (team: 'home' | 'away', type: 'goal' | 'behind') => {
    if (type === 'goal') {
      setPickerCtx({ team, type });
      setPickerOpen(true);
    } else {
      callAction({ type: 'add_behind', team });
    }
  };

  const pickPlayer = (playerId: string | null) => {
    if (!pickerCtx) return;
    callAction({ type: pickerCtx.type === 'goal' ? 'add_goal' : 'add_behind', team: pickerCtx.team, player_id: playerId });
    setPickerOpen(false);
    setPickerCtx(null);
  };

  const recentEvents = useMemo(() => events.slice(0, 6), [events]);
  const playersById = useMemo(() => {
    const m = new Map<string, any>();
    [...homePlayers, ...awayPlayers].forEach(p => m.set(p.id, p));
    return m;
  }, [homePlayers, awayPlayers]);

  if (authLoading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-container py-4 space-y-4">
        <Link to="/portal/score" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" /> All matches
        </Link>

        {/* Score header with logo backdrops */}
        <div className="match-card overflow-hidden">
          <div className="flex items-center justify-center py-2 border-b border-border/30 gap-2">
            <Badge className={`rounded-full text-[10px] font-black tracking-widest px-3 py-0.5 border-0 ${
              matchStatus === 'live' ? 'bg-destructive text-destructive-foreground' :
              isFinished ? 'bg-muted text-foreground' : 'bg-primary/15 text-primary'
            }`}>
              {matchStatus === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block" />}
              {matchStatus === 'live' ? `LIVE • Q${quarter}` : isFinished ? 'FULL TIME' : 'PRE-MATCH'}
            </Badge>
            {state?.quarter_status === 'break' && !isFinished && (
              <Badge variant="secondary" className="text-[9px] rounded-full">Q{quarter} BREAK</Badge>
            )}
          </div>
          <div className="px-4 pt-4 pb-5 relative">
            {homeClub?.logo_url && <img src={homeClub.logo_url} alt="" aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 h-32 w-32 object-contain opacity-[0.06] pointer-events-none select-none" />}
            {awayClub?.logo_url && <img src={awayClub.logo_url} alt="" aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 h-32 w-32 object-contain opacity-[0.06] pointer-events-none select-none" />}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <ClubLogo club={homeClub ?? {}} size="lg" className="!h-12 !w-12" />
                <span className="text-xs font-bold">{homeClub?.short_name}</span>
                <div className="text-3xl font-black tabular-nums">{homeScore}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">{state?.home_goals ?? 0}.{state?.home_behinds ?? 0}</div>
              </div>
              <div className="text-muted-foreground/30 font-black text-2xl px-2">–</div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <ClubLogo club={awayClub ?? {}} size="lg" className="!h-12 !w-12" />
                <span className="text-xs font-bold">{awayClub?.short_name}</span>
                <div className="text-3xl font-black tabular-nums">{awayScore}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">{state?.away_goals ?? 0}.{state?.away_behinds ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Quarter table */}
          <div className="border-t border-border/30 px-4 py-2 grid grid-cols-5 gap-1 text-[10px] tabular-nums">
            <div className="font-bold text-muted-foreground">Team</div>
            {[1,2,3,4].map(q => <div key={q} className="text-center font-bold text-muted-foreground">Q{q}</div>)}
            <div className="font-bold truncate">{homeClub?.short_name}</div>
            {[1,2,3,4].map(q => <div key={q} className="text-center">{(state as any)?.[`home_q${q}`] ?? '–'}</div>)}
            <div className="font-bold truncate">{awayClub?.short_name}</div>
            {[1,2,3,4].map(q => <div key={q} className="text-center">{(state as any)?.[`away_q${q}`] ?? '–'}</div>)}
          </div>
        </div>

        {/* Match controls */}
        {!isFinished && (
          <div className="match-card p-3 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Control</div>
            <div className="grid grid-cols-2 gap-2">
              {matchStatus === 'not_started' && (
                <Button onClick={() => callAction({ type: 'start_match' })} disabled={busy} className="col-span-2">
                  <Play className="h-4 w-4 mr-1" /> Start Match
                </Button>
              )}
              {matchStatus === 'live' && state?.quarter_status === 'in_progress' && (
                <Button variant="secondary" onClick={() => callAction({ type: 'end_quarter' })} disabled={busy || quarter >= 4}>
                  <Pause className="h-4 w-4 mr-1" /> End Q{quarter}
                </Button>
              )}
              {matchStatus === 'live' && state?.quarter_status === 'break' && quarter <= 4 && (
                <Button variant="secondary" onClick={() => callAction({ type: 'start_quarter' })} disabled={busy}>
                  <Play className="h-4 w-4 mr-1" /> Start Q{quarter}
                </Button>
              )}
              {matchStatus === 'live' && (
                <Button variant="destructive" onClick={() => {
                  if (confirm('End the match? This will lock in the final score and update the ladder.')) callAction({ type: 'end_match' });
                }} disabled={busy}>
                  <Flag className="h-4 w-4 mr-1" /> End Match
                </Button>
              )}
              <Button variant="outline" onClick={() => callAction({ type: 'undo_last' })} disabled={busy || events.length === 0} className="col-span-2">
                <Undo2 className="h-4 w-4 mr-1" /> Undo Last
              </Button>
            </div>
          </div>
        )}

        {/* Scoring buttons */}
        {matchStatus !== 'finished' && (
          <div className="grid grid-cols-2 gap-3">
            {(['home','away'] as const).map((team) => {
              const club = team === 'home' ? homeClub : awayClub;
              return (
                <div key={team} className="match-card p-3 space-y-2 relative overflow-hidden">
                  {club?.logo_url && <img src={club.logo_url} alt="" aria-hidden className="absolute right-1 bottom-1 h-20 w-20 object-contain opacity-[0.07] pointer-events-none select-none" />}
                  <div className="flex items-center gap-2 relative z-10">
                    <ClubLogo club={club ?? {}} size="sm" />
                    <span className="font-black text-sm">{club?.short_name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative z-10">
                    <Button onClick={() => handleScore(team, 'goal')} disabled={busy || matchStatus !== 'live'} className="h-14 flex-col gap-0">
                      <span className="text-xs font-black">GOAL</span>
                      <span className="text-[9px] opacity-80">+6</span>
                    </Button>
                    <Button onClick={() => handleScore(team, 'behind')} disabled={busy || matchStatus !== 'live'} variant="secondary" className="h-14 flex-col gap-0">
                      <span className="text-xs font-black">BEHIND</span>
                      <span className="text-[9px] opacity-80">+1</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent events */}
        <div className="match-card p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Recent Events</div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {recentEvents.map(e => {
                const player = e.player_id ? playersById.get(e.player_id) : null;
                const teamLabel = e.team_id === (fixture as any)?.home_team?.id ? homeClub?.short_name : awayClub?.short_name;
                return (
                  <li key={e.id} className="flex items-center justify-between text-xs">
                    <span>
                      <span className="font-black">{teamLabel}</span>{' '}
                      <span className={e.is_goal ? 'text-primary font-bold' : 'text-muted-foreground font-bold'}>
                        {e.is_goal ? 'GOAL' : 'BEHIND'}
                      </span>
                      {player && <span className="text-muted-foreground"> — {player.first_name} {player.last_name}</span>}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Q{e.quarter}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {busy && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
          </div>
        )}
      </div>

      {/* Goal kicker picker */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Who kicked the {pickerCtx?.type}?</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => pickPlayer(null)}>Unknown / Skip</Button>
            <div className="grid grid-cols-2 gap-2">
              {(pickerCtx?.team === 'home' ? homePlayers : awayPlayers).map(p => (
                <Button key={p.id} variant="secondary" className="justify-start text-xs" onClick={() => pickPlayer(p.id)}>
                  {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.first_name} {p.last_name}
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
