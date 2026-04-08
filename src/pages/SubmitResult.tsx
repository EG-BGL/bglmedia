import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SubmitResult() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selectedFixture, setSelectedFixture] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    // Get fixtures for teams this coach is assigned to
    supabase.from('coaches_to_teams').select('team_id').eq('user_id', user.id).then(async ({ data: teams }) => {
      if (!teams?.length) return;
      const teamIds = teams.map(t => t.team_id);
      const { data } = await supabase.from('fixtures').select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)),
        away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))
      `)
        .eq('is_locked', false)
        .eq('status', 'completed')
        .or(teamIds.map(id => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(','));
      setFixtures(data ?? []);
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture || !user) return;
    setSubmitting(true);

    const hg = parseInt(homeGoals) || 0;
    const hb = parseInt(homeBehinds) || 0;
    const ag = parseInt(awayGoals) || 0;
    const ab = parseInt(awayBehinds) || 0;

    const { error } = await supabase.from('results').insert({
      fixture_id: selectedFixture,
      home_goals: hg,
      home_behinds: hb,
      home_score: hg * 6 + hb,
      away_goals: ag,
      away_behinds: ab,
      away_score: ag * 6 + ab,
      home_q1: homeQ1, home_q2: homeQ2, home_q3: homeQ3, home_q4: homeQ4,
      away_q1: awayQ1, away_q2: awayQ2, away_q3: awayQ3, away_q4: awayQ4,
      best_players_home: bestHome ? bestHome.split(',').map(s => s.trim()) : [],
      best_players_away: bestAway ? bestAway.split(',').map(s => s.trim()) : [],
      goal_kickers_home: goalKickersHome ? goalKickersHome.split(',').map(s => s.trim()) : [],
      goal_kickers_away: goalKickersAway ? goalKickersAway.split(',').map(s => s.trim()) : [],
      match_notes: matchNotes,
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

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-black text-primary-foreground">Submit Result</h1>
          <p className="text-primary-foreground/70 mt-1">Enter match scores for approval</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Match</Label>
                <Select value={selectedFixture} onValueChange={setSelectedFixture}>
                  <SelectTrigger><SelectValue placeholder="Select a match" /></SelectTrigger>
                  <SelectContent>
                    {fixtures.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        R{f.round_number}: {f.home_team?.clubs?.short_name} vs {f.away_team?.clubs?.short_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Home Goals</Label>
                  <Input type="number" value={homeGoals} onChange={e => setHomeGoals(e.target.value)} min="0" />
                </div>
                <div>
                  <Label>Home Behinds</Label>
                  <Input type="number" value={homeBehinds} onChange={e => setHomeBehinds(e.target.value)} min="0" />
                </div>
                <div>
                  <Label>Away Goals</Label>
                  <Input type="number" value={awayGoals} onChange={e => setAwayGoals(e.target.value)} min="0" />
                </div>
                <div>
                  <Label>Away Behinds</Label>
                  <Input type="number" value={awayBehinds} onChange={e => setAwayBehinds(e.target.value)} min="0" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Quarter Scores (G.B.Total format)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input placeholder="H Q1" value={homeQ1} onChange={e => setHomeQ1(e.target.value)} />
                  <Input placeholder="H Q2" value={homeQ2} onChange={e => setHomeQ2(e.target.value)} />
                  <Input placeholder="H Q3" value={homeQ3} onChange={e => setHomeQ3(e.target.value)} />
                  <Input placeholder="H Q4" value={homeQ4} onChange={e => setHomeQ4(e.target.value)} />
                  <Input placeholder="A Q1" value={awayQ1} onChange={e => setAwayQ1(e.target.value)} />
                  <Input placeholder="A Q2" value={awayQ2} onChange={e => setAwayQ2(e.target.value)} />
                  <Input placeholder="A Q3" value={awayQ3} onChange={e => setAwayQ3(e.target.value)} />
                  <Input placeholder="A Q4" value={awayQ4} onChange={e => setAwayQ4(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Best Players (Home, comma separated)</Label>
                  <Input value={bestHome} onChange={e => setBestHome(e.target.value)} placeholder="J. Mitchell, T. Williams" />
                </div>
                <div>
                  <Label>Best Players (Away, comma separated)</Label>
                  <Input value={bestAway} onChange={e => setBestAway(e.target.value)} placeholder="S. Kelly, M. Brown" />
                </div>
                <div>
                  <Label>Goal Kickers (Home)</Label>
                  <Input value={goalKickersHome} onChange={e => setGoalKickersHome(e.target.value)} placeholder="M. Lewis 3, Z. Wilson 2" />
                </div>
                <div>
                  <Label>Goal Kickers (Away)</Label>
                  <Input value={goalKickersAway} onChange={e => setGoalKickersAway(e.target.value)} placeholder="N. Harris 2, E. White 1" />
                </div>
              </div>

              <div>
                <Label>Match Notes</Label>
                <Textarea value={matchNotes} onChange={e => setMatchNotes(e.target.value)} placeholder="Optional notes about the match..." />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting || !selectedFixture}>
                  {submitting ? 'Submitting...' : 'Submit Result'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/portal')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
