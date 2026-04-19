import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ClipboardList, BarChart3, Trophy, Users } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

type RugbySectionKey = 'scoreboard' | 'team_stats' | 'player_stats';
const SECTIONS: { key: RugbySectionKey; label: string; icon: any }[] = [
  { key: 'scoreboard', label: 'Scoreboard', icon: Trophy },
  { key: 'team_stats', label: 'Team Stats', icon: BarChart3 },
  { key: 'player_stats', label: 'Player Stats', icon: Users },
];

interface TeamScore {
  total_points: string;
  tries: string;
  conversions: string;
  penalty_goals: string;
  field_goals: string;
  half_time_points: string;
}
const emptyScore = (): TeamScore => ({
  total_points: '', tries: '', conversions: '', penalty_goals: '', field_goals: '', half_time_points: '',
});

interface TeamStats {
  run_metres: string;
  line_breaks: string;
  tackles: string;
  missed_tackles: string;
  errors: string;
  penalties_conceded: string;
  sets_completed: string;
  sets_total: string;
  possession_pct: string;
}
const emptyTeamStats = (): TeamStats => ({
  run_metres: '', line_breaks: '', tackles: '', missed_tackles: '', errors: '', penalties_conceded: '',
  sets_completed: '', sets_total: '', possession_pct: '',
});

const SCORE_FIELDS: { key: keyof TeamScore; label: string }[] = [
  { key: 'tries', label: 'Tries' },
  { key: 'conversions', label: 'Conv' },
  { key: 'penalty_goals', label: 'Pen' },
  { key: 'field_goals', label: 'FG' },
  { key: 'half_time_points', label: 'HT Pts' },
];

const TEAM_STAT_FIELDS: { key: keyof TeamStats; label: string }[] = [
  { key: 'run_metres', label: 'Run Metres' },
  { key: 'line_breaks', label: 'Line Breaks' },
  { key: 'tackles', label: 'Tackles' },
  { key: 'missed_tackles', label: 'Missed Tackles' },
  { key: 'errors', label: 'Errors' },
  { key: 'penalties_conceded', label: 'Penalties Conceded' },
  { key: 'sets_completed', label: 'Sets Completed' },
  { key: 'sets_total', label: 'Sets Total' },
  { key: 'possession_pct', label: 'Possession %' },
];

const calcPoints = (s: TeamScore) => {
  const tries = parseInt(s.tries) || 0;
  const conv = parseInt(s.conversions) || 0;
  const pen = parseInt(s.penalty_goals) || 0;
  const fg = parseInt(s.field_goals) || 0;
  return tries * 4 + conv * 2 + pen * 2 + fg;
};

export default function SubmitRugbyResult() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selectedFixture, setSelectedFixture] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [matchNotes, setMatchNotes] = useState('');

  const [homeScore, setHomeScore] = useState<TeamScore>(emptyScore());
  const [awayScore, setAwayScore] = useState<TeamScore>(emptyScore());
  const [homeTeamStats, setHomeTeamStats] = useState<TeamStats>(emptyTeamStats());
  const [awayTeamStats, setAwayTeamStats] = useState<TeamStats>(emptyTeamStats());
  const [extractedPlayerStats, setExtractedPlayerStats] = useState<any[]>([]);

  const [sectionPreviews, setSectionPreviews] = useState<Record<RugbySectionKey, string | null>>({ scoreboard: null, team_stats: null, player_stats: null });
  const [sectionExtracting, setSectionExtracting] = useState<Record<RugbySectionKey, boolean>>({ scoreboard: false, team_stats: false, player_stats: false });
  const [sectionConfidence, setSectionConfidence] = useState<Record<RugbySectionKey, string | null>>({ scoreboard: null, team_stats: null, player_stats: null });

  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const loadFixtures = async () => {
      const { data: teams } = await supabase.from('coaches_to_teams').select('team_id').eq('user_id', user.id);
      const teamIds = teams?.map(t => t.team_id) ?? [];
      const baseSelect = '*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))';

      if (role === 'league_admin' && teamIds.length === 0) {
        const { data } = await supabase.from('fixtures').select(baseSelect)
          .eq('match_format', 'Rugby League')
          .in('status', ['scheduled', 'in_progress']).order('round_number');
        setFixtures(data ?? []);
      } else if (teamIds.length > 0) {
        const { data } = await supabase.from('fixtures').select(baseSelect)
          .eq('match_format', 'Rugby League')
          .or(teamIds.map(id => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(','))
          .in('status', ['scheduled', 'in_progress']).order('round_number');
        setFixtures(data ?? []);
      }
    };
    loadFixtures();
  }, [user, role]);

  const selectedMatch = useMemo(() => fixtures.find(f => f.id === selectedFixture), [fixtures, selectedFixture]);

  // Auto-recalc total points if user fills tries/conv/pen/fg without total
  const computedHomeTotal = calcPoints(homeScore);
  const computedAwayTotal = calcPoints(awayScore);

  const handleSectionUpload = async (sectionKey: RugbySectionKey, file: File) => {
    if (!selectedMatch) return;
    setSectionExtracting(prev => ({ ...prev, [sectionKey]: true }));
    setSectionConfidence(prev => ({ ...prev, [sectionKey]: null }));

    const reader = new FileReader();
    reader.onload = (e) => setSectionPreviews(prev => ({ ...prev, [sectionKey]: e.target?.result as string }));
    reader.readAsDataURL(file);

    try {
      const fileName = `rugby-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('scorecard-images').upload(fileName, file);
      if (uploadError) { toast.error('Upload failed: ' + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from('scorecard-images').getPublicUrl(fileName);

      const extractionType = sectionKey === 'scoreboard' ? 'rugby_scoreboard' : sectionKey === 'team_stats' ? 'rugby_team_stats' : 'rugby_player_stats';
      const { data: result, error: fnError } = await supabase.functions.invoke('extract-rugby-scorecard', {
        body: { imageUrl: urlData.publicUrl, extractionType },
      });

      if (fnError || !result || result.error) {
        toast.error('Could not extract data from this image');
        setSectionConfidence(prev => ({ ...prev, [sectionKey]: 'failed' }));
        return;
      }

      setSectionConfidence(prev => ({ ...prev, [sectionKey]: result.confidence ?? 'medium' }));

      if (sectionKey === 'scoreboard') {
        const apply = (src: any, setter: (s: TeamScore) => void) => {
          if (!src) return;
          setter({
            total_points: src.total_points != null ? String(src.total_points) : '',
            tries: src.tries != null ? String(src.tries) : '',
            conversions: src.conversions != null ? String(src.conversions) : '',
            penalty_goals: src.penalty_goals != null ? String(src.penalty_goals) : '',
            field_goals: src.field_goals != null ? String(src.field_goals) : '',
            half_time_points: src.half_time_points != null ? String(src.half_time_points) : '',
          });
        };
        apply(result.home, setHomeScore);
        apply(result.away, setAwayScore);
        toast.success('Scoreboard extracted!');
      } else if (sectionKey === 'team_stats') {
        const apply = (src: any, setter: (s: TeamStats) => void) => {
          if (!src) return;
          const out: any = {};
          for (const f of TEAM_STAT_FIELDS) out[f.key] = src[f.key] != null ? String(src[f.key]) : '';
          setter(out as TeamStats);
        };
        apply(result.home_team_stats, setHomeTeamStats);
        apply(result.away_team_stats, setAwayTeamStats);
        toast.success('Team stats extracted!');
      } else if (sectionKey === 'player_stats') {
        if (Array.isArray(result.player_stats)) {
          setExtractedPlayerStats(result.player_stats);
          toast.success(`${result.player_stats.length} players extracted!`);
        }
      }
    } catch (err: any) {
      toast.error('AI reading failed: ' + (err?.message ?? 'Unknown'));
      setSectionConfidence(prev => ({ ...prev, [sectionKey]: 'failed' }));
    } finally {
      setSectionExtracting(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  const buildTeamStatsPayload = (s: TeamStats) => ({
    run_metres: parseInt(s.run_metres) || 0,
    line_breaks: parseInt(s.line_breaks) || 0,
    tackles: parseInt(s.tackles) || 0,
    missed_tackles: parseInt(s.missed_tackles) || 0,
    errors: parseInt(s.errors) || 0,
    penalties_conceded: parseInt(s.penalties_conceded) || 0,
    sets_completed: parseInt(s.sets_completed) || 0,
    sets_total: parseInt(s.sets_total) || 0,
    possession_pct: parseFloat(s.possession_pct) || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture || !user || !selectedMatch) { toast.error('Select a match'); return; }
    const homeTotal = parseInt(homeScore.total_points) || computedHomeTotal;
    const awayTotal = parseInt(awayScore.total_points) || computedAwayTotal;
    if (homeTotal === 0 && awayTotal === 0 && !homeScore.tries && !awayScore.tries) {
      toast.error('Enter at least the final score'); return;
    }

    setSubmitting(true);
    try {
      // Save match results for each team
      const upsertScore = async (teamId: string, s: TeamScore, total: number) => {
        await supabase.from('rugby_match_results').upsert({
          fixture_id: selectedFixture, team_id: teamId,
          tries: parseInt(s.tries) || 0,
          conversions: parseInt(s.conversions) || 0,
          penalty_goals: parseInt(s.penalty_goals) || 0,
          field_goals: parseInt(s.field_goals) || 0,
          total_points: total,
          half_time_points: parseInt(s.half_time_points) || 0,
        }, { onConflict: 'fixture_id,team_id' });
      };
      await upsertScore(selectedMatch.home_team_id, homeScore, homeTotal);
      await upsertScore(selectedMatch.away_team_id, awayScore, awayTotal);

      // Save team stats
      await supabase.from('rugby_team_stats').upsert({
        fixture_id: selectedFixture, team_id: selectedMatch.home_team_id,
        ...buildTeamStatsPayload(homeTeamStats),
      }, { onConflict: 'fixture_id,team_id' });
      await supabase.from('rugby_team_stats').upsert({
        fixture_id: selectedFixture, team_id: selectedMatch.away_team_id,
        ...buildTeamStatsPayload(awayTeamStats),
      }, { onConflict: 'fixture_id,team_id' });

      // Save player stats via edge function
      if (extractedPlayerStats.length > 0) {
        await supabase.functions.invoke('save-rugby-player-stats', {
          body: { fixture_id: selectedFixture, player_stats: extractedPlayerStats },
        });
      }

      // Create results record (auto-approved) so it shows in the standard results pipeline
      await supabase.from('results').insert({
        fixture_id: selectedFixture,
        team_id: selectedMatch.home_team_id,
        home_score: homeTotal,
        away_score: awayTotal,
        home_goals: 0, home_behinds: 0, away_goals: 0, away_behinds: 0,
        status: 'approved', submitted_by: user.id,
        submitted_at: new Date().toISOString(), approved_at: new Date().toISOString(),
        match_notes: matchNotes || `Rugby League: ${selectedMatch.home_team?.clubs?.short_name} ${homeTotal} - ${awayTotal} ${selectedMatch.away_team?.clubs?.short_name}`,
      });

      await supabase.from('fixtures').update({ status: 'completed' }).eq('id', selectedFixture);
      await supabase.rpc('update_ladder_from_rugby_result', { p_fixture_id: selectedFixture });

      setShowSuccess(true);
    } catch (err: any) {
      toast.error('Failed to submit: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderScoreCard = (label: string, club: any, score: TeamScore, setScore: (s: TeamScore) => void, computed: number) => (
    <div className="match-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClubLogo club={club ?? {}} size="sm" />
        <h3 className="font-bold text-sm">{label} — {club?.short_name}</h3>
      </div>
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Points {!score.total_points && <span className="text-primary">(auto: {computed})</span>}</Label>
        <Input type="number" inputMode="numeric" value={score.total_points} onChange={e => setScore({ ...score, total_points: e.target.value })}
          className="mt-1 text-center text-2xl font-black h-14 rounded-xl" placeholder={String(computed)} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {SCORE_FIELDS.map(f => (
          <div key={f.key}>
            <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
            <Input type="number" inputMode="numeric" value={score[f.key]} onChange={e => setScore({ ...score, [f.key]: e.target.value })}
              className="mt-1 text-center font-bold h-10 rounded-lg" placeholder="0" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamStatsCard = (label: string, club: any, stats: TeamStats, setStats: (s: TeamStats) => void) => (
    <div className="match-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClubLogo club={club ?? {}} size="sm" />
        <h3 className="font-bold text-sm">{label} — {club?.short_name}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TEAM_STAT_FIELDS.map(f => (
          <div key={f.key}>
            <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
            <Input type="number" inputMode="numeric" value={stats[f.key]} onChange={e => setStats({ ...stats, [f.key]: e.target.value })}
              className="mt-1 text-center font-bold h-10 rounded-lg" placeholder="0" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto">
        <button onClick={() => navigate('/portal')} className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight">Submit Rugby League Result</h1>
        </div>

        <div className="match-card p-4">
          <h3 className="section-label mb-3 flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-primary" /> What You'll Need
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Final Scoreboard</p>
                <p className="text-[10px] text-muted-foreground">Total points, tries, conversions, penalties, field goals for both teams</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Team Stats (optional)</p>
                <p className="text-[10px] text-muted-foreground">Run metres, line breaks, tackles, errors, penalties</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Player Stats (optional)</p>
                <p className="text-[10px] text-muted-foreground">Per-player attacking, defensive, kicking and discipline stats</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="match-card p-4">
            <h3 className="section-label mb-2">Match</h3>
            <Select value={selectedFixture} onValueChange={setSelectedFixture}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select a Rugby League match..." />
              </SelectTrigger>
              <SelectContent>
                {fixtures.length === 0 ? <div className="p-3 text-sm text-muted-foreground text-center">No Rugby League matches available</div> :
                  fixtures.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="font-semibold">Rd {f.round_number}:</span> {f.home_team?.clubs?.short_name} vs {f.away_team?.clubs?.short_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedMatch && (
              <div className="mt-3 flex items-center justify-center gap-4 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2"><ClubLogo club={selectedMatch.home_team?.clubs ?? {}} size="sm" /><span className="font-bold text-xs">{selectedMatch.home_team?.clubs?.short_name}</span></div>
                <span className="text-xs text-muted-foreground font-bold">vs</span>
                <div className="flex items-center gap-2"><span className="font-bold text-xs">{selectedMatch.away_team?.clubs?.short_name}</span><ClubLogo club={selectedMatch.away_team?.clubs ?? {}} size="sm" /></div>
              </div>
            )}
          </div>

          {selectedMatch && (
            <>
              <div className="match-card p-4">
                <h3 className="section-label mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Scorecard Reader
                </h3>
                <p className="text-[10px] text-muted-foreground mb-3">Upload photos for each section and AI will extract the data automatically</p>
                <div className="grid grid-cols-3 gap-2">
                  {SECTIONS.map(({ key, label, icon: Icon }) => (
                    <label key={key} className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleSectionUpload(key, file); e.target.value = ''; }}
                        disabled={sectionExtracting[key]} />
                      <div className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                        sectionPreviews[key] ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      } ${sectionExtracting[key] ? 'border-primary/50 bg-primary/5 animate-pulse' : ''}`} style={{ aspectRatio: '1' }}>
                        {sectionPreviews[key] ? (
                          <>
                            <img src={sectionPreviews[key]!} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                            <div className="relative z-10 flex flex-col items-center gap-1">
                              {sectionExtracting[key] ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                : sectionConfidence[key] === 'failed' ? <AlertCircle className="h-5 w-5 text-destructive" />
                                : <CheckCircle2 className="h-5 w-5 text-primary" />}
                              <span className="text-[9px] font-bold text-center px-1 leading-tight">{label}</span>
                              {sectionConfidence[key] && sectionConfidence[key] !== 'failed' && (
                                <Badge variant="outline" className="text-[8px] rounded-full">{sectionConfidence[key]}</Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {sectionExtracting[key] ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Icon className="h-5 w-5 text-muted-foreground" />}
                            <span className="text-[9px] font-bold text-muted-foreground text-center px-1 leading-tight">{label}</span>
                          </>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {renderScoreCard('Home', selectedMatch.home_team?.clubs, homeScore, setHomeScore, computedHomeTotal)}
              {renderScoreCard('Away', selectedMatch.away_team?.clubs, awayScore, setAwayScore, computedAwayTotal)}

              <h3 className="section-label">Team Stats (optional)</h3>
              {renderTeamStatsCard('Home', selectedMatch.home_team?.clubs, homeTeamStats, setHomeTeamStats)}
              {renderTeamStatsCard('Away', selectedMatch.away_team?.clubs, awayTeamStats, setAwayTeamStats)}

              {extractedPlayerStats.length > 0 && (
                <div className="match-card p-4">
                  <h3 className="section-label mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> Extracted Players ({extractedPlayerStats.length})
                  </h3>
                  <p className="text-[10px] text-muted-foreground mb-2">These will be saved with the result. Re-upload the player stats image to replace.</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {extractedPlayerStats.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-muted/30">
                        <span className="font-semibold truncate">{p.name}</span>
                        <Badge variant="outline" className="text-[9px] rounded-full ml-2">{p.team}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="match-card p-4">
                <h3 className="section-label mb-2">Match Notes</h3>
                <Textarea value={matchNotes} onChange={e => setMatchNotes(e.target.value)} placeholder="Optional notes about the match..." rows={2} className="rounded-lg" />
              </div>

              <div className="flex gap-3 pb-8">
                <Button type="submit" disabled={submitting} className="flex-1 h-14 font-bold text-base gap-2 rounded-xl">
                  {submitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Rugby Result</>}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Result submitted!</AlertDialogTitle>
            <AlertDialogDescription>The match has been recorded and the ladder updated.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate('/portal')}>Back to Dashboard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
