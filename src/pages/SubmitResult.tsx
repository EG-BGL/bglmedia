import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Send, AlertCircle } from 'lucide-react';

interface FormErrors {
  fixture?: string;
  homeGoals?: string;
  homeBehinds?: string;
  awayGoals?: string;
  awayBehinds?: string;
  quarters?: string;
}

export default function SubmitResult() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selectedFixture, setSelectedFixture] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  const [homeGoals, setHomeGoals] = useState('');
  const [homeBehinds, setHomeBehinds] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [awayBehinds, setAwayBehinds] = useState('');
  const [homeQ1, setHomeQ1] = useState('');
  const [homeQ2, setHomeQ2] = useState('');
  const [homeQ3, setHomeQ3] = useState('');
  const [homeQ4, setHomeQ4] = useState('');
  const [awayQ1, setAwayQ1] = useState('');
  const [awayQ2, setAwayQ2] = useState('');
  const [awayQ3, setAwayQ3] = useState('');
  const [awayQ4, setAwayQ4] = useState('');
  const [bestHome, setBestHome] = useState('');
  const [bestAway, setBestAway] = useState('');
  const [goalKickersHome, setGoalKickersHome] = useState('');
  const [goalKickersAway, setGoalKickersAway] = useState('');
  const [matchNotes, setMatchNotes] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('coaches_to_teams').select('team_id').eq('user_id', user.id).then(async ({ data: teams }) => {
      if (!teams?.length) return;
      const teamIds = teams.map(t => t.team_id);
      const { data } = await supabase.from('fixtures').select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))
      `)
        .eq('is_locked', false)
        .in('status', ['scheduled', 'completed'])
        .or(teamIds.map(id => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(','));
      setFixtures(data ?? []);
    });
  }, [user]);

  const selectedMatch = useMemo(() => fixtures.find(f => f.id === selectedFixture), [fixtures, selectedFixture]);

  const homeScore = useMemo(() => {
    const g = parseInt(homeGoals) || 0;
    const b = parseInt(homeBehinds) || 0;
    return g * 6 + b;
  }, [homeGoals, homeBehinds]);

  const awayScore = useMemo(() => {
    const g = parseInt(awayGoals) || 0;
    const b = parseInt(awayBehinds) || 0;
    return g * 6 + b;
  }, [awayGoals, awayBehinds]);

  // Parse quarter string like "3.2.20" and return the total, or null if invalid
  const parseQuarterTotal = (q: string): number | null => {
    if (!q.trim()) return null;
    const parts = q.trim().split('.');
    if (parts.length === 3) {
      const total = parseInt(parts[2]);
      const goals = parseInt(parts[0]);
      const behinds = parseInt(parts[1]);
      if (!isNaN(goals) && !isNaN(behinds) && !isNaN(total)) {
        return total;
      }
    }
    return null;
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!selectedFixture) e.fixture = 'Select a match';
    if (homeGoals === '' || isNaN(parseInt(homeGoals)) || parseInt(homeGoals) < 0) e.homeGoals = 'Required';
    if (homeBehinds === '' || isNaN(parseInt(homeBehinds)) || parseInt(homeBehinds) < 0) e.homeBehinds = 'Required';
    if (awayGoals === '' || isNaN(parseInt(awayGoals)) || parseInt(awayGoals) < 0) e.awayGoals = 'Required';
    if (awayBehinds === '' || isNaN(parseInt(awayBehinds)) || parseInt(awayBehinds) < 0) e.awayBehinds = 'Required';

    // Validate Q4 matches final score if provided
    if (homeQ4.trim()) {
      const q4Total = parseQuarterTotal(homeQ4);
      if (q4Total !== null && q4Total !== homeScore) {
        e.quarters = `Home Q4 total (${q4Total}) doesn't match final score (${homeScore})`;
      }
    }
    if (awayQ4.trim()) {
      const q4Total = parseQuarterTotal(awayQ4);
      if (q4Total !== null && q4Total !== awayScore) {
        e.quarters = `Away Q4 total (${q4Total}) doesn't match final score (${awayScore})`;
      }
    }

    // Validate progressive quarters (each should be >= previous)
    const checkProgressive = (q1: string, q2: string, q3: string, q4: string, label: string) => {
      const totals = [q1, q2, q3, q4].map(parseQuarterTotal).filter((t): t is number => t !== null);
      for (let i = 1; i < totals.length; i++) {
        if (totals[i] < totals[i - 1]) {
          e.quarters = `${label} quarter totals must be progressive (each ≥ previous)`;
        }
      }
    };
    checkProgressive(homeQ1, homeQ2, homeQ3, homeQ4, 'Home');
    checkProgressive(awayQ1, awayQ2, awayQ3, awayQ4, 'Away');

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (!user) return;

    setSubmitting(true);
    const hg = parseInt(homeGoals);
    const hb = parseInt(homeBehinds);
    const ag = parseInt(awayGoals);
    const ab = parseInt(awayBehinds);

    const { error } = await supabase.from('results').insert({
      fixture_id: selectedFixture,
      home_goals: hg,
      home_behinds: hb,
      home_score: hg * 6 + hb,
      away_goals: ag,
      away_behinds: ab,
      away_score: ag * 6 + ab,
      home_q1: homeQ1 || null, home_q2: homeQ2 || null, home_q3: homeQ3 || null, home_q4: homeQ4 || null,
      away_q1: awayQ1 || null, away_q2: awayQ2 || null, away_q3: awayQ3 || null, away_q4: awayQ4 || null,
      best_players_home: bestHome ? bestHome.split(',').map(s => s.trim()).filter(Boolean) : [],
      best_players_away: bestAway ? bestAway.split(',').map(s => s.trim()).filter(Boolean) : [],
      goal_kickers_home: goalKickersHome ? goalKickersHome.split(',').map(s => s.trim()).filter(Boolean) : [],
      goal_kickers_away: goalKickersAway ? goalKickersAway.split(',').map(s => s.trim()).filter(Boolean) : [],
      match_notes: matchNotes || null,
      status: 'submitted',
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (error) {
      toast.error('Failed to submit: ' + error.message);
    } else {
      toast.success('Result submitted for review!');
      navigate('/portal');
    }
  };

  const ScoreInput = ({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) => (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value)}
        min="0"
        className={`mt-1 text-center text-lg font-bold h-12 ${error && touched ? 'border-destructive' : ''}`}
      />
      {error && touched && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <Layout>
      <section className="sport-gradient py-6">
        <div className="container mx-auto px-4">
          <button onClick={() => navigate('/portal')} className="text-primary-foreground/60 text-sm flex items-center gap-1 mb-2 hover:text-primary-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-primary-foreground">Submit Result</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-5 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section 1: Match Selection */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Match</h3>
              <Select value={selectedFixture} onValueChange={setSelectedFixture}>
                <SelectTrigger className={`h-12 ${errors.fixture && touched ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select a match..." />
                </SelectTrigger>
                <SelectContent>
                  {fixtures.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No available matches</div>
                  ) : fixtures.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="font-semibold">Rd {f.round_number}:</span>{' '}
                      {f.home_team?.clubs?.short_name} vs {f.away_team?.clubs?.short_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fixture && touched && <p className="text-destructive text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.fixture}</p>}

              {selectedMatch && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: selectedMatch.home_team?.clubs?.primary_color, color: selectedMatch.home_team?.clubs?.secondary_color }}>
                      {selectedMatch.home_team?.clubs?.short_name?.slice(0, 2)}
                    </div>
                    <span className="font-bold text-sm">{selectedMatch.home_team?.clubs?.short_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">vs</span>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: selectedMatch.away_team?.clubs?.primary_color, color: selectedMatch.away_team?.clubs?.secondary_color }}>
                      {selectedMatch.away_team?.clubs?.short_name?.slice(0, 2)}
                    </div>
                    <span className="font-bold text-sm">{selectedMatch.away_team?.clubs?.short_name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Final Scores */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Final Score</h3>

              {/* Home */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedMatch && (
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: selectedMatch.home_team?.clubs?.primary_color, color: selectedMatch.home_team?.clubs?.secondary_color }}>
                      {selectedMatch.home_team?.clubs?.short_name?.slice(0, 2)}
                    </div>
                  )}
                  <span className="font-bold text-sm">{selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</span>
                  <Badge variant="outline" className="ml-auto text-xs stat-number">{homeScore} pts</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ScoreInput label="Goals" value={homeGoals} onChange={setHomeGoals} error={errors.homeGoals} />
                  <ScoreInput label="Behinds" value={homeBehinds} onChange={setHomeBehinds} error={errors.homeBehinds} />
                </div>
              </div>

              <div className="border-t border-border my-4" />

              {/* Away */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedMatch && (
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: selectedMatch.away_team?.clubs?.primary_color, color: selectedMatch.away_team?.clubs?.secondary_color }}>
                      {selectedMatch.away_team?.clubs?.short_name?.slice(0, 2)}
                    </div>
                  )}
                  <span className="font-bold text-sm">{selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</span>
                  <Badge variant="outline" className="ml-auto text-xs stat-number">{awayScore} pts</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ScoreInput label="Goals" value={awayGoals} onChange={setAwayGoals} error={errors.awayGoals} />
                  <ScoreInput label="Behinds" value={awayBehinds} onChange={setAwayBehinds} error={errors.awayBehinds} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Quarter-by-Quarter */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Quarter Scores</h3>
              <p className="text-xs text-muted-foreground mb-3">Format: Goals.Behinds.Total (e.g. 3.2.20)</p>

              {errors.quarters && touched && (
                <div className="mb-3 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {errors.quarters}
                </div>
              )}

              {/* Home quarters */}
              <div className="mb-3">
                <Label className="text-xs font-semibold mb-1.5 block">{selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input placeholder="Q1" value={homeQ1} onChange={e => setHomeQ1(e.target.value)} className="text-center text-sm h-10" />
                  <Input placeholder="Q2" value={homeQ2} onChange={e => setHomeQ2(e.target.value)} className="text-center text-sm h-10" />
                  <Input placeholder="Q3" value={homeQ3} onChange={e => setHomeQ3(e.target.value)} className="text-center text-sm h-10" />
                  <Input placeholder="Q4" value={homeQ4} onChange={e => setHomeQ4(e.target.value)} className="text-center text-sm h-10" />
                </div>
              </div>

              {/* Away quarters */}
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">{selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input placeholder="Q1" value={awayQ1} onChange={e => setAwayQ1(e.target.value)} className="text-center text-sm h-10" />
                  <Input placeholder="Q2" value={awayQ2} onChange={e => setAwayQ2(e.target.value)} className="text-center text-sm h-10" />
                  <Input placeholder="Q3" value={awayQ3} onChange={e => setAwayQ3(e.target.value)} className="text-center text-sm h-10" />
                  <Input placeholder="Q4" value={awayQ4} onChange={e => setAwayQ4(e.target.value)} className="text-center text-sm h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Best Players & Goal Kickers */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Players</h3>

              <div>
                <Label className="text-xs font-semibold">Best Players — {selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</Label>
                <Input value={bestHome} onChange={e => setBestHome(e.target.value)} placeholder="J. Mitchell, T. Williams, R. Jones" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Best Players — {selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</Label>
                <Input value={bestAway} onChange={e => setBestAway(e.target.value)} placeholder="S. Kelly, M. Brown" className="mt-1" />
              </div>

              <div className="border-t border-border pt-4">
                <Label className="text-xs font-semibold">Goal Kickers — {selectedMatch?.home_team?.clubs?.short_name ?? 'Home'}</Label>
                <Input value={goalKickersHome} onChange={e => setGoalKickersHome(e.target.value)} placeholder="M. Lewis 3, Z. Wilson 2" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Goal Kickers — {selectedMatch?.away_team?.clubs?.short_name ?? 'Away'}</Label>
                <Input value={goalKickersAway} onChange={e => setGoalKickersAway(e.target.value)} placeholder="N. Harris 2, E. White 1" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Notes */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Match Notes</h3>
              <Textarea
                value={matchNotes}
                onChange={e => setMatchNotes(e.target.value)}
                placeholder="Any additional notes about the match (optional)..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 font-bold text-base gap-2"
            >
              {submitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Result</>}
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => navigate('/portal')}>Cancel</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
