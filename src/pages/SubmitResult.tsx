import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/lib/supabase-helpers';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Send, AlertCircle, CheckCircle2, Camera, Loader2, Sparkles } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface FormErrors { fixture?: string; homeGoals?: string; homeBehinds?: string; awayGoals?: string; awayBehinds?: string; quarters?: string; }

export default function SubmitResult() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [coachTeamIds, setCoachTeamIds] = useState<string[]>([]);
  const [existingSubmissions, setExistingSubmissions] = useState<any[]>([]);
  const [selectedFixture, setSelectedFixture] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  const [homeGoals, setHomeGoals] = useState('');
  const [homeBehinds, setHomeBehinds] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [awayBehinds, setAwayBehinds] = useState('');
  const [homeQ1, setHomeQ1] = useState(''); const [homeQ2, setHomeQ2] = useState('');
  const [homeQ3, setHomeQ3] = useState(''); const [homeQ4, setHomeQ4] = useState('');
  const [awayQ1, setAwayQ1] = useState(''); const [awayQ2, setAwayQ2] = useState('');
  const [awayQ3, setAwayQ3] = useState(''); const [awayQ4, setAwayQ4] = useState('');
  const [bestHome, setBestHome] = useState('');
  const [bestAway, setBestAway] = useState('');
  const [goalKickersHome, setGoalKickersHome] = useState('');
  const [goalKickersAway, setGoalKickersAway] = useState('');
  const [matchNotes, setMatchNotes] = useState('');

  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadFixtures = async () => {
      if (role === 'league_admin') {
        // Admins can submit for any match
        const { data } = await supabase.from('fixtures').select('*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))').eq('is_locked', false).in('status', ['scheduled', 'in_progress']).order('round_number');
        setFixtures(data ?? []);
        // Set all team IDs so admin can submit as any team
        const ids = new Set<string>();
        (data ?? []).forEach((f: any) => { ids.add(f.home_team_id); ids.add(f.away_team_id); });
        setCoachTeamIds(Array.from(ids));
      } else {
        const { data: teams } = await supabase.from('coaches_to_teams').select('team_id').eq('user_id', user.id);
        if (!teams?.length) return;
        const teamIds = teams.map(t => t.team_id);
        setCoachTeamIds(teamIds);
        const { data } = await supabase.from('fixtures').select('*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))').eq('is_locked', false).in('status', ['scheduled', 'in_progress']).or(teamIds.map(id => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(','));
        setFixtures(data ?? []);
      }
    };
    loadFixtures();
  }, [user, role]);

  // Load existing submissions for the selected fixture
  useEffect(() => {
    if (!selectedFixture || !user) { setExistingSubmissions([]); return; }
    supabase.from('results').select('*, fixtures(home_team_id, away_team_id)').eq('fixture_id', selectedFixture).then(({ data }) => {
      setExistingSubmissions(data ?? []);
    });
  }, [selectedFixture, user]);

  const selectedMatch = useMemo(() => fixtures.find(f => f.id === selectedFixture), [fixtures, selectedFixture]);

  // Determine which team the coach is submitting for
  const submittingTeamId = useMemo(() => {
    if (!selectedMatch) return null;
    if (coachTeamIds.includes(selectedMatch.home_team_id)) return selectedMatch.home_team_id;
    if (coachTeamIds.includes(selectedMatch.away_team_id)) return selectedMatch.away_team_id;
    return null;
  }, [selectedMatch, coachTeamIds]);

  const submittingTeamName = useMemo(() => {
    if (!selectedMatch || !submittingTeamId) return '';
    if (submittingTeamId === selectedMatch.home_team_id) return selectedMatch.home_team?.clubs?.name ?? 'Home';
    return selectedMatch.away_team?.clubs?.name ?? 'Away';
  }, [selectedMatch, submittingTeamId]);

  // Check if this team already submitted
  const alreadySubmitted = useMemo(() => {
    return existingSubmissions.find(s => s.team_id === submittingTeamId && s.status !== 'rejected');
  }, [existingSubmissions, submittingTeamId]);

  // Check if other team submitted
  const otherSubmission = useMemo(() => {
    if (!selectedMatch || !submittingTeamId) return null;
    const otherTeamId = submittingTeamId === selectedMatch.home_team_id ? selectedMatch.away_team_id : selectedMatch.home_team_id;
    return existingSubmissions.find(s => s.team_id === otherTeamId && s.status !== 'rejected');
  }, [existingSubmissions, selectedMatch, submittingTeamId]);

  const homeScore = useMemo(() => (parseInt(homeGoals)||0)*6+(parseInt(homeBehinds)||0), [homeGoals, homeBehinds]);
  const awayScore = useMemo(() => (parseInt(awayGoals)||0)*6+(parseInt(awayBehinds)||0), [awayGoals, awayBehinds]);

  const parseQuarterTotal = (q: string): number | null => {
    if (!q.trim()) return null;
    const p = q.trim().split('.');
    if (p.length === 3) { const t = parseInt(p[2]); if (!isNaN(t)) return t; }
    return null;
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!selectedFixture) e.fixture = 'Select a match';
    if (homeGoals === '' || isNaN(parseInt(homeGoals)) || parseInt(homeGoals) < 0) e.homeGoals = 'Required';
    if (homeBehinds === '' || isNaN(parseInt(homeBehinds)) || parseInt(homeBehinds) < 0) e.homeBehinds = 'Required';
    if (awayGoals === '' || isNaN(parseInt(awayGoals)) || parseInt(awayGoals) < 0) e.awayGoals = 'Required';
    if (awayBehinds === '' || isNaN(parseInt(awayBehinds)) || parseInt(awayBehinds) < 0) e.awayBehinds = 'Required';
    if (homeQ4.trim()) { const q = parseQuarterTotal(homeQ4); if (q !== null && q !== homeScore) e.quarters = `Home Q4 (${q}) ≠ final (${homeScore})`; }
    if (awayQ4.trim()) { const q = parseQuarterTotal(awayQ4); if (q !== null && q !== awayScore) e.quarters = `Away Q4 (${q}) ≠ final (${awayScore})`; }
    const checkProg = (q1:string,q2:string,q3:string,q4:string,l:string) => {
      const t = [q1,q2,q3,q4].map(parseQuarterTotal).filter((t):t is number => t!==null);
      for (let i=1;i<t.length;i++) if (t[i]<t[i-1]) e.quarters = `${l} quarters must be progressive`;
    };
    checkProg(homeQ1,homeQ2,homeQ3,homeQ4,'Home');
    checkProg(awayQ1,awayQ2,awayQ3,awayQ4,'Away');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setTouched(true);
    const v = validate(); setErrors(v);
    if (Object.keys(v).length > 0 || !user || !submittingTeamId) return;
    if (alreadySubmitted) { toast.error('Your team has already submitted for this match'); return; }
    setSubmitting(true);
    const hg = parseInt(homeGoals), hb = parseInt(homeBehinds), ag = parseInt(awayGoals), ab = parseInt(awayBehinds);
    const { error } = await supabase.from('results').insert({
      fixture_id: selectedFixture, team_id: submittingTeamId,
      home_goals: hg, home_behinds: hb, home_score: hg*6+hb, away_goals: ag, away_behinds: ab, away_score: ag*6+ab,
      home_q1: homeQ1||null, home_q2: homeQ2||null, home_q3: homeQ3||null, home_q4: homeQ4||null,
      away_q1: awayQ1||null, away_q2: awayQ2||null, away_q3: awayQ3||null, away_q4: awayQ4||null,
      best_players_home: bestHome ? bestHome.split(',').map(s=>s.trim()).filter(Boolean) : [],
      best_players_away: bestAway ? bestAway.split(',').map(s=>s.trim()).filter(Boolean) : [],
      goal_kickers_home: goalKickersHome ? goalKickersHome.split(',').map(s=>s.trim()).filter(Boolean) : [],
      goal_kickers_away: goalKickersAway ? goalKickersAway.split(',').map(s=>s.trim()).filter(Boolean) : [],
      match_notes: matchNotes||null, status: 'submitted', submitted_by: user.id, submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) toast.error('Failed: '+error.message); else { toast.success('Result submitted! If both teams agree, it will be auto-confirmed.'); navigate('/portal'); }
  };

  const ScoreInput = ({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) => (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} min="0"
        className={`mt-1 text-center text-xl font-black h-14 rounded-xl ${error && touched ? 'border-destructive' : ''}`} />
      {error && touched && <p className="text-destructive text-[10px] mt-1">{error}</p>}
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto">
        <button onClick={() => navigate('/portal')} className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
        </button>
        <h1 className="text-xl font-black tracking-tight mb-4">Submit Result</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Match Selection */}
          <div className="match-card p-4">
            <h3 className="section-label mb-2">Match</h3>
            <Select value={selectedFixture} onValueChange={setSelectedFixture}>
              <SelectTrigger className={`h-12 rounded-xl ${errors.fixture && touched ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select a match..." />
              </SelectTrigger>
              <SelectContent>
                {fixtures.length === 0 ? <div className="p-3 text-sm text-muted-foreground text-center">No available matches</div> :
                  fixtures.map(f => <SelectItem key={f.id} value={f.id}><span className="font-semibold">Rd {f.round_number}:</span> {f.home_team?.clubs?.short_name} vs {f.away_team?.clubs?.short_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.fixture && touched && <p className="text-destructive text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.fixture}</p>}
            {selectedMatch && (
              <div className="mt-3 flex items-center justify-center gap-4 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2"><ClubLogo club={selectedMatch.home_team?.clubs??{}} size="sm" /><span className="font-bold text-xs">{selectedMatch.home_team?.clubs?.short_name}</span></div>
                <span className="text-xs text-muted-foreground font-bold">vs</span>
                <div className="flex items-center gap-2"><span className="font-bold text-xs">{selectedMatch.away_team?.clubs?.short_name}</span><ClubLogo club={selectedMatch.away_team?.clubs??{}} size="sm" /></div>
              </div>
            )}
          </div>

          {/* Submission Status Info */}
          {selectedMatch && submittingTeamId && (
            <div className="match-card p-4">
              <h3 className="section-label mb-2">Submission Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Submitting as</span>
                  <Badge className="rounded-full text-[10px] bg-primary/10 text-primary border-0">{submittingTeamName}</Badge>
                </div>
                {alreadySubmitted && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Your team has already submitted ({alreadySubmitted.home_goals}.{alreadySubmitted.home_behinds}.{alreadySubmitted.home_score} to {alreadySubmitted.away_goals}.{alreadySubmitted.away_behinds}.{alreadySubmitted.away_score})</span>
                  </div>
                )}
                {otherSubmission && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent text-accent-foreground text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Other team has submitted — if scores match, the result will be auto-confirmed</span>
                  </div>
                )}
                {!otherSubmission && !alreadySubmitted && (
                  <div className="text-[10px] text-muted-foreground">Awaiting submission from the other team. If both teams agree on scores, the result will be auto-confirmed.</div>
                )}
              </div>
            </div>
          )}

          {/* Scores */}
          {!alreadySubmitted && (
            <>
              <div className="match-card p-4">
                <h3 className="section-label mb-3">Final Score</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedMatch && <ClubLogo club={selectedMatch.home_team?.clubs??{}} size="sm" className="!h-5 !w-5" />}
                      <span className="font-bold text-xs">{selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</span>
                      <Badge variant="outline" className="ml-auto rounded-full text-[10px] stat-number">{homeScore} pts</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ScoreInput label="Goals" value={homeGoals} onChange={setHomeGoals} error={errors.homeGoals} />
                      <ScoreInput label="Behinds" value={homeBehinds} onChange={setHomeBehinds} error={errors.homeBehinds} />
                    </div>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedMatch && <ClubLogo club={selectedMatch.away_team?.clubs??{}} size="sm" className="!h-5 !w-5" />}
                      <span className="font-bold text-xs">{selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</span>
                      <Badge variant="outline" className="ml-auto rounded-full text-[10px] stat-number">{awayScore} pts</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ScoreInput label="Goals" value={awayGoals} onChange={setAwayGoals} error={errors.awayGoals} />
                      <ScoreInput label="Behinds" value={awayBehinds} onChange={setAwayBehinds} error={errors.awayBehinds} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quarters */}
              <div className="match-card p-4">
                <h3 className="section-label mb-1">Quarter Scores</h3>
                <p className="text-[10px] text-muted-foreground mb-3">Goals.Behinds.Total (e.g. 3.2.20)</p>
                {errors.quarters && touched && <div className="mb-3 p-2 rounded-lg bg-destructive/10 text-destructive text-[10px] flex items-start gap-1.5"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{errors.quarters}</div>}
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px] font-bold mb-1 block">{selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[{v:homeQ1,s:setHomeQ1,l:'Q1'},{v:homeQ2,s:setHomeQ2,l:'Q2'},{v:homeQ3,s:setHomeQ3,l:'Q3'},{v:homeQ4,s:setHomeQ4,l:'Q4'}].map(q=><Input key={q.l} placeholder={q.l} value={q.v} onChange={e=>q.s(e.target.value)} className="text-center text-xs h-10 rounded-lg" />)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold mb-1 block">{selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[{v:awayQ1,s:setAwayQ1,l:'Q1'},{v:awayQ2,s:setAwayQ2,l:'Q2'},{v:awayQ3,s:setAwayQ3,l:'Q3'},{v:awayQ4,s:setAwayQ4,l:'Q4'}].map(q=><Input key={q.l} placeholder={q.l} value={q.v} onChange={e=>q.s(e.target.value)} className="text-center text-xs h-10 rounded-lg" />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Players */}
              <div className="match-card p-4 space-y-3">
                <h3 className="section-label">Players</h3>
                <div><Label className="text-[10px] font-bold">Best — {selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</Label><Input value={bestHome} onChange={e=>setBestHome(e.target.value)} placeholder="J. Mitchell, T. Williams" className="mt-1 rounded-lg" /></div>
                <div><Label className="text-[10px] font-bold">Best — {selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</Label><Input value={bestAway} onChange={e=>setBestAway(e.target.value)} placeholder="S. Kelly, M. Brown" className="mt-1 rounded-lg" /></div>
                <div className="border-t border-border/50 pt-3">
                  <Label className="text-[10px] font-bold">Goals — {selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</Label><Input value={goalKickersHome} onChange={e=>setGoalKickersHome(e.target.value)} placeholder="M. Lewis 3, Z. Wilson 2" className="mt-1 rounded-lg" />
                </div>
                <div><Label className="text-[10px] font-bold">Goals — {selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</Label><Input value={goalKickersAway} onChange={e=>setGoalKickersAway(e.target.value)} placeholder="N. Harris 2" className="mt-1 rounded-lg" /></div>
              </div>

              {/* Notes */}
              <div className="match-card p-4">
                <h3 className="section-label mb-2">Notes</h3>
                <Textarea value={matchNotes} onChange={e=>setMatchNotes(e.target.value)} placeholder="Optional match notes..." rows={2} className="rounded-lg" />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pb-8">
                <Button type="submit" disabled={submitting} className="flex-1 h-14 font-bold text-base gap-2 rounded-xl">
                  {submitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Result</>}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </Layout>
  );
}
