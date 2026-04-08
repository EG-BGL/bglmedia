import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Send, AlertCircle, CheckCircle2, Plus, Trash2, CircleDot, Camera, Loader2, Sparkles, ClipboardList, BarChart3, Trophy, Users } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface BattingEntry {
  playerName: string;
  runs: string;
  balls: string;
  fours: string;
  sixes: string;
  howOut: string;
  bowlerName: string;
  notOut: boolean;
}

interface BowlingEntry {
  playerName: string;
  overs: string;
  maidens: string;
  runs: string;
  wickets: string;
  wides: string;
  noBalls: string;
}

const emptyBatting = (): BattingEntry => ({
  playerName: '', runs: '', balls: '', fours: '', sixes: '', howOut: '', bowlerName: '', notOut: false,
});

const emptyBowling = (): BowlingEntry => ({
  playerName: '', overs: '', maidens: '', runs: '', wickets: '', wides: '', noBalls: '',
});

export default function SubmitCricketResult() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [coachTeamIds, setCoachTeamIds] = useState<string[]>([]);
  const [selectedFixture, setSelectedFixture] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [matchNotes, setMatchNotes] = useState('');

  // Innings state
  const [innings, setInnings] = useState<{
    teamId: string;
    totalRuns: string;
    totalWickets: string;
    totalOvers: string;
    extras: string;
    allOut: boolean;
    declared: boolean;
    batting: BattingEntry[];
    bowling: BowlingEntry[];
  }[]>([]);

  const [activeInnings, setActiveInnings] = useState('0');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImages, setAiImages] = useState<File[]>([]);
  const [aiFilled, setAiFilled] = useState(false);

  const handleAiScorecardUpload = async (files: FileList | null) => {
    if (!files?.length || !selectedMatch) return;
    setAiLoading(true);
    setAiFilled(false);
    const newFiles = Array.from(files);
    setAiImages(prev => [...prev, ...newFiles]);

    try {
      // Process all images and merge results
      const allInningsData: any[] = [];

      for (const file of newFiles) {
        // Upload to storage
        const fileName = `cricket-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('scorecard-images').upload(fileName, file);
        if (uploadError) { toast.error('Upload failed: ' + uploadError.message); continue; }

        const { data: urlData } = supabase.storage.from('scorecard-images').getPublicUrl(fileName);

        // Call AI extraction
        const { data: result, error: fnError } = await supabase.functions.invoke('extract-scorecard', {
          body: { imageUrl: urlData.publicUrl, extractionType: 'cricket_scorecard' },
        });

        if (fnError) { toast.error('AI extraction failed'); continue; }
        if (result?.innings?.length) {
          allInningsData.push(...result.innings);
        }
      }

      if (allInningsData.length === 0) {
        toast.error('Could not extract scorecard data from images');
        setAiLoading(false);
        return;
      }

      // Map extracted innings to our form state
      const homeId = selectedMatch.home_team_id;
      const awayId = selectedMatch.away_team_id;
      const homeName = (selectedMatch.home_team?.clubs?.short_name ?? '').toLowerCase();
      const awayName = (selectedMatch.away_team?.clubs?.short_name ?? '').toLowerCase();

      const mappedInnings = allInningsData.map((inn: any, idx: number) => {
        // Try to match team name
        const tName = (inn.team_name ?? '').toLowerCase();
        let teamId = idx % 2 === 0 ? homeId : awayId;
        if (tName.includes(homeName) && homeName) teamId = homeId;
        else if (tName.includes(awayName) && awayName) teamId = awayId;

        const batting = (inn.batting ?? []).map((b: any) => ({
          playerName: b.name ?? '',
          runs: String(b.runs ?? ''),
          balls: String(b.balls ?? ''),
          fours: String(b.fours ?? ''),
          sixes: String(b.sixes ?? ''),
          howOut: b.how_out ?? '',
          bowlerName: b.bowler ?? '',
          notOut: b.not_out ?? false,
        }));

        const bowling = (inn.bowling ?? []).map((b: any) => ({
          playerName: b.name ?? '',
          overs: String(b.overs ?? ''),
          maidens: String(b.maidens ?? ''),
          runs: String(b.runs ?? ''),
          wickets: String(b.wickets ?? ''),
          wides: String(b.wides ?? ''),
          noBalls: String(b.no_balls ?? ''),
        }));

        return {
          teamId,
          totalRuns: String(inn.total_runs ?? ''),
          totalWickets: String(inn.total_wickets ?? ''),
          totalOvers: String(inn.total_overs ?? ''),
          extras: String(inn.extras ?? ''),
          allOut: inn.all_out ?? false,
          declared: inn.declared ?? false,
          batting: batting.length > 0 ? batting : [emptyBatting()],
          bowling: bowling.length > 0 ? bowling : [emptyBowling()],
        };
      });

      if (mappedInnings.length >= 2) {
        setInnings(mappedInnings);
      } else if (mappedInnings.length === 1) {
        // Only got one innings, keep the other as empty
        setInnings(prev => {
          const updated = [...prev];
          updated[0] = mappedInnings[0];
          return updated;
        });
      }

      setAiFilled(true);
      toast.success('Scorecard extracted! Review the data below.');
    } catch (err: any) {
      toast.error('AI reading failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setAiLoading(false);
    }
  };
  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const loadFixtures = async () => {
      if (role === 'league_admin') {
        const { data } = await supabase.from('fixtures').select('*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))').in('match_format', ['T20', 'One-Day', 'Multi-Day']).order('round_number');
        setFixtures(data ?? []);
        const ids = new Set<string>();
        (data ?? []).forEach((f: any) => { ids.add(f.home_team_id); ids.add(f.away_team_id); });
        setCoachTeamIds(Array.from(ids));
      } else {
        const { data: teams } = await supabase.from('coaches_to_teams').select('team_id').eq('user_id', user.id);
        if (!teams?.length) return;
        const teamIds = teams.map(t => t.team_id);
        setCoachTeamIds(teamIds);
        const { data } = await supabase.from('fixtures').select('*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))').in('match_format', ['T20', 'One-Day', 'Multi-Day']).or(teamIds.map(id => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(',')).order('round_number');
        setFixtures(data ?? []);
      }
    };
    loadFixtures();
  }, [user, role]);

  const selectedMatch = useMemo(() => fixtures.find(f => f.id === selectedFixture), [fixtures, selectedFixture]);

  // Initialize innings when fixture is selected
  useEffect(() => {
    if (!selectedMatch) { setInnings([]); return; }
    const homeId = selectedMatch.home_team_id;
    const awayId = selectedMatch.away_team_id;
    // Default: 1 innings per team
    setInnings([
      { teamId: homeId, totalRuns: '', totalWickets: '', totalOvers: '', extras: '', allOut: false, declared: false, batting: [emptyBatting()], bowling: [emptyBowling()] },
      { teamId: awayId, totalRuns: '', totalWickets: '', totalOvers: '', extras: '', allOut: false, declared: false, batting: [emptyBatting()], bowling: [emptyBowling()] },
    ]);
    setActiveInnings('0');
  }, [selectedMatch]);

  const getTeamName = (teamId: string) => {
    if (!selectedMatch) return 'Unknown';
    if (teamId === selectedMatch.home_team_id) return selectedMatch.home_team?.clubs?.short_name ?? 'Home';
    return selectedMatch.away_team?.clubs?.short_name ?? 'Away';
  };

  const getTeamClub = (teamId: string) => {
    if (!selectedMatch) return {};
    if (teamId === selectedMatch.home_team_id) return selectedMatch.home_team?.clubs ?? {};
    return selectedMatch.away_team?.clubs ?? {};
  };

  const addInnings = () => {
    if (!selectedMatch) return;
    // Alternate teams
    const lastTeam = innings[innings.length - 1]?.teamId;
    const nextTeam = lastTeam === selectedMatch.home_team_id ? selectedMatch.away_team_id : selectedMatch.home_team_id;
    setInnings(prev => [...prev, {
      teamId: nextTeam, totalRuns: '', totalWickets: '', totalOvers: '', extras: '', allOut: false, declared: false,
      batting: [emptyBatting()], bowling: [emptyBowling()],
    }]);
    setActiveInnings(String(innings.length));
  };

  const removeInnings = (idx: number) => {
    if (innings.length <= 2) { toast.error('Minimum 2 innings required'); return; }
    setInnings(prev => prev.filter((_, i) => i !== idx));
    setActiveInnings('0');
  };

  const updateInnings = (idx: number, field: string, value: any) => {
    setInnings(prev => prev.map((inn, i) => i === idx ? { ...inn, [field]: value } : inn));
  };

  const addBatting = (inningsIdx: number) => {
    setInnings(prev => prev.map((inn, i) => i === inningsIdx ? { ...inn, batting: [...inn.batting, emptyBatting()] } : inn));
  };

  const updateBatting = (inningsIdx: number, batIdx: number, field: string, value: any) => {
    setInnings(prev => prev.map((inn, i) => i === inningsIdx ? {
      ...inn, batting: inn.batting.map((b, j) => j === batIdx ? { ...b, [field]: value } : b),
    } : inn));
  };

  const removeBatting = (inningsIdx: number, batIdx: number) => {
    setInnings(prev => prev.map((inn, i) => i === inningsIdx ? {
      ...inn, batting: inn.batting.filter((_, j) => j !== batIdx),
    } : inn));
  };

  const addBowling = (inningsIdx: number) => {
    setInnings(prev => prev.map((inn, i) => i === inningsIdx ? { ...inn, bowling: [...inn.bowling, emptyBowling()] } : inn));
  };

  const updateBowling = (inningsIdx: number, bowlIdx: number, field: string, value: any) => {
    setInnings(prev => prev.map((inn, i) => i === inningsIdx ? {
      ...inn, bowling: inn.bowling.map((b, j) => j === bowlIdx ? { ...b, [field]: value } : b),
    } : inn));
  };

  const removeBowling = (inningsIdx: number, bowlIdx: number) => {
    setInnings(prev => prev.map((inn, i) => i === inningsIdx ? {
      ...inn, bowling: inn.bowling.filter((_, j) => j !== bowlIdx),
    } : inn));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture || !user) { toast.error('Select a match'); return; }
    if (innings.length < 2) { toast.error('At least 2 innings required'); return; }

    // Validate each innings has totals
    for (let i = 0; i < innings.length; i++) {
      if (!innings[i].totalRuns) { toast.error(`Innings ${i + 1}: Total runs required`); return; }
    }

    setSubmitting(true);
    try {
      // Save cricket_match_results for each innings
      for (let i = 0; i < innings.length; i++) {
        const inn = innings[i];
        const overs = parseFloat(inn.totalOvers) || 0;
        const runs = parseInt(inn.totalRuns) || 0;
        const wickets = parseInt(inn.totalWickets) || 0;
        const extras = parseInt(inn.extras) || 0;
        const runRate = overs > 0 ? Math.round((runs / overs) * 100) / 100 : 0;

        const { error: matchError } = await supabase.from('cricket_match_results').insert({
          fixture_id: selectedFixture,
          team_id: inn.teamId,
          innings_number: i + 1,
          total_runs: runs,
          total_wickets: wickets,
          total_overs: overs,
          extras,
          run_rate: runRate,
          all_out: inn.allOut,
          declared: inn.declared,
        });
        if (matchError) { toast.error(`Innings ${i + 1}: ${matchError.message}`); setSubmitting(false); return; }

        // Save cricket_team_stats
        await supabase.from('cricket_team_stats').insert({
          fixture_id: selectedFixture,
          team_id: inn.teamId,
          innings_number: i + 1,
          total_runs: runs,
          total_wickets: wickets,
          total_overs: overs,
          extras,
          run_rate: runRate,
        });

        // Save batting stats — find or create players
        for (const bat of inn.batting) {
          if (!bat.playerName.trim()) continue;
          const nameParts = bat.playerName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Try to find existing player on this team
          const { data: existingPlayers } = await supabase.from('players')
            .select('id').eq('team_id', inn.teamId)
            .ilike('first_name', firstName).ilike('last_name', lastName || '%').limit(1);

          let playerId: string;
          if (existingPlayers?.length) {
            playerId = existingPlayers[0].id;
          } else {
            const { data: newPlayer, error: playerError } = await supabase.from('players')
              .insert({ first_name: firstName, last_name: lastName || 'Unknown', team_id: inn.teamId })
              .select('id').single();
            if (playerError || !newPlayer) continue;
            playerId = newPlayer.id;
          }

          const runsScored = parseInt(bat.runs) || 0;
          const ballsFaced = parseInt(bat.balls) || 0;
          const strikeRate = ballsFaced > 0 ? Math.round((runsScored / ballsFaced) * 10000) / 100 : 0;

          await supabase.from('cricket_player_stats').insert({
            fixture_id: selectedFixture,
            player_id: playerId,
            team_id: inn.teamId,
            innings_number: i + 1,
            runs_scored: runsScored,
            balls_faced: ballsFaced,
            fours: parseInt(bat.fours) || 0,
            sixes: parseInt(bat.sixes) || 0,
            strike_rate: strikeRate,
            not_out: bat.notOut,
            how_out: bat.howOut || null,
            bowler_name: bat.bowlerName || null,
          });
        }

        // Save bowling stats
        for (const bowl of inn.bowling) {
          if (!bowl.playerName.trim()) continue;
          // Bowlers are from the OTHER team
          const bowlingTeamId = inn.teamId === selectedMatch!.home_team_id ? selectedMatch!.away_team_id : selectedMatch!.home_team_id;
          const nameParts = bowl.playerName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const { data: existingPlayers } = await supabase.from('players')
            .select('id').eq('team_id', bowlingTeamId)
            .ilike('first_name', firstName).ilike('last_name', lastName || '%').limit(1);

          let playerId: string;
          if (existingPlayers?.length) {
            playerId = existingPlayers[0].id;
          } else {
            const { data: newPlayer, error: playerError } = await supabase.from('players')
              .insert({ first_name: firstName, last_name: lastName || 'Unknown', team_id: bowlingTeamId })
              .select('id').single();
            if (playerError || !newPlayer) continue;
            playerId = newPlayer.id;
          }

          const oversBowled = parseFloat(bowl.overs) || 0;
          const runsConceded = parseInt(bowl.runs) || 0;
          const economy = oversBowled > 0 ? Math.round((runsConceded / oversBowled) * 100) / 100 : 0;

          await supabase.from('cricket_player_stats').upsert({
            fixture_id: selectedFixture,
            player_id: playerId,
            team_id: bowlingTeamId,
            innings_number: i + 1,
            overs_bowled: oversBowled,
            maidens: parseInt(bowl.maidens) || 0,
            runs_conceded: runsConceded,
            wickets: parseInt(bowl.wickets) || 0,
            economy,
            wides: parseInt(bowl.wides) || 0,
            no_balls: parseInt(bowl.noBalls) || 0,
          });
        }
      }

      // Mark fixture as completed
      await supabase.from('fixtures').update({ status: 'completed' }).eq('id', selectedFixture);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error('Failed to submit: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto">
        <button onClick={() => navigate('/portal')} className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
        </button>
        <div className="flex items-center gap-2 mb-4">
          <CircleDot className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight">Submit Cricket Result</h1>
        </div>

        {/* What You'll Need Checklist */}
        <div className="match-card p-4">
          <h3 className="section-label mb-3 flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-primary" /> What You'll Need
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Match Summary</p>
                <p className="text-[10px] text-muted-foreground">Total runs, wickets, overs and extras for each innings</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Batting Scorecard — Both Teams</p>
                <p className="text-[10px] text-muted-foreground">Runs, balls faced, 4s, 6s and dismissal details for each batter</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Bowling Scorecard — Both Teams</p>
                <p className="text-[10px] text-muted-foreground">Overs, maidens, runs, wickets and extras for each bowler</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Match Selection */}
          <div className="match-card p-4">
            <h3 className="section-label mb-2">Match</h3>
            <Select value={selectedFixture} onValueChange={setSelectedFixture}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select a cricket match..." />
              </SelectTrigger>
              <SelectContent>
                {fixtures.length === 0 ? <div className="p-3 text-sm text-muted-foreground text-center">No cricket matches available</div> :
                  fixtures.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="font-semibold">Rd {f.round_number}:</span> {f.home_team?.clubs?.short_name} vs {f.away_team?.clubs?.short_name}
                      <Badge variant="outline" className="ml-2 text-[9px] rounded-full">{f.match_format}</Badge>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedMatch && (
              <div className="mt-3 flex items-center justify-center gap-4 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2"><ClubLogo club={getTeamClub(selectedMatch.home_team_id)} size="sm" /><span className="font-bold text-xs">{selectedMatch.home_team?.clubs?.short_name}</span></div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-bold">vs</span>
                  <Badge variant="outline" className="ml-2 text-[9px] rounded-full">{selectedMatch.match_format}</Badge>
                </div>
                <div className="flex items-center gap-2"><span className="font-bold text-xs">{selectedMatch.away_team?.clubs?.short_name}</span><ClubLogo club={getTeamClub(selectedMatch.away_team_id)} size="sm" /></div>
              </div>
            )}
          </div>

          {/* AI Scorecard Reader */}
          {selectedMatch && (
            <div className="match-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="section-label">AI Scorecard Reader</h3>
                {aiFilled && <Badge className="bg-primary/10 text-primary text-[9px] rounded-full border-0">AI filled</Badge>}
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                Upload photos of the scorecard and AI will extract all batting, bowling, and innings data automatically.
              </p>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleAiScorecardUpload(e.target.files)}
                    disabled={aiLoading}
                  />
                  <div className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${aiLoading ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                    {aiLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-xs font-bold text-primary">Reading scorecard...</span></>
                    ) : (
                      <><Camera className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-bold text-muted-foreground">Upload Scorecard Photos</span></>
                    )}
                  </div>
                </label>
              </div>
              {aiImages.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {aiImages.map((file, i) => (
                    <img key={i} src={URL.createObjectURL(file)} alt={`Scorecard ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-border/50" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Innings */}
          {selectedMatch && innings.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="section-label">Innings</h3>
                {selectedMatch.match_format === 'Multi-Day' && (
                  <Button type="button" variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1" onClick={addInnings}>
                    <Plus className="h-3 w-3" /> Add Innings
                  </Button>
                )}
              </div>

              <Tabs value={activeInnings} onValueChange={setActiveInnings}>
                <div className="overflow-x-auto -mx-4 px-4">
                  <TabsList className="inline-flex h-9 bg-muted/60 rounded-full p-0.5 gap-0.5">
                    {innings.map((inn, idx) => (
                      <TabsTrigger key={idx} value={String(idx)} className="rounded-full text-[10px] font-bold px-3">
                        {getTeamName(inn.teamId)} Inn {Math.ceil((idx + 1) / 2) > 1 ? Math.ceil((idx + 1) / 2) : ''}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {innings.map((inn, idx) => (
                  <TabsContent key={idx} value={String(idx)} className="space-y-4 mt-3">
                    {/* Innings Totals */}
                    <div className="match-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ClubLogo club={getTeamClub(inn.teamId)} size="sm" />
                          <h3 className="font-bold text-sm">{getTeamName(inn.teamId)} — Innings {Math.ceil((idx + 1) / 2)}</h3>
                        </div>
                        {innings.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-destructive" onClick={() => removeInnings(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Runs *</Label>
                          <Input type="number" inputMode="numeric" value={inn.totalRuns} onChange={e => updateInnings(idx, 'totalRuns', e.target.value)}
                            className="mt-1 text-center text-xl font-black h-14 rounded-xl" placeholder="0" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wickets</Label>
                          <Input type="number" inputMode="numeric" value={inn.totalWickets} onChange={e => updateInnings(idx, 'totalWickets', e.target.value)}
                            className="mt-1 text-center text-xl font-black h-14 rounded-xl" placeholder="0" max="10" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overs</Label>
                          <Input type="number" inputMode="decimal" step="0.1" value={inn.totalOvers} onChange={e => updateInnings(idx, 'totalOvers', e.target.value)}
                            className="mt-1 text-center text-lg font-bold h-12 rounded-xl" placeholder="0.0" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Extras</Label>
                          <Input type="number" inputMode="numeric" value={inn.extras} onChange={e => updateInnings(idx, 'extras', e.target.value)}
                            className="mt-1 text-center text-lg font-bold h-12 rounded-xl" placeholder="0" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={inn.allOut} onChange={e => updateInnings(idx, 'allOut', e.target.checked)} className="h-4 w-4 rounded border-border" />
                          <span className="font-bold">All Out</span>
                        </label>
                        {selectedMatch.match_format === 'Multi-Day' && (
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={inn.declared} onChange={e => updateInnings(idx, 'declared', e.target.checked)} className="h-4 w-4 rounded border-border" />
                            <span className="font-bold">Declared</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Batting Scorecard */}
                    <div className="match-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="section-label">Batting</h3>
                        <Button type="button" variant="outline" size="sm" className="rounded-full text-[10px] font-bold gap-1 h-7" onClick={() => addBatting(idx)}>
                          <Plus className="h-3 w-3" /> Add Batter
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {inn.batting.map((bat, batIdx) => (
                          <div key={batIdx} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] rounded-full shrink-0">#{batIdx + 1}</Badge>
                              <Input value={bat.playerName} onChange={e => updateBatting(idx, batIdx, 'playerName', e.target.value)}
                                placeholder="Player name" className="text-xs h-8 flex-1" />
                              {inn.batting.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-destructive shrink-0" onClick={() => removeBatting(idx, batIdx)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">Runs</Label>
                                <Input type="number" value={bat.runs} onChange={e => updateBatting(idx, batIdx, 'runs', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">Balls</Label>
                                <Input type="number" value={bat.balls} onChange={e => updateBatting(idx, batIdx, 'balls', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">4s</Label>
                                <Input type="number" value={bat.fours} onChange={e => updateBatting(idx, batIdx, 'fours', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">6s</Label>
                                <Input type="number" value={bat.sixes} onChange={e => updateBatting(idx, batIdx, 'sixes', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">How Out</Label>
                                <Select value={bat.howOut} onValueChange={v => updateBatting(idx, batIdx, 'howOut', v)}>
                                  <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Dismissal" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bowled">Bowled</SelectItem>
                                    <SelectItem value="caught">Caught</SelectItem>
                                    <SelectItem value="lbw">LBW</SelectItem>
                                    <SelectItem value="run_out">Run Out</SelectItem>
                                    <SelectItem value="stumped">Stumped</SelectItem>
                                    <SelectItem value="hit_wicket">Hit Wicket</SelectItem>
                                    <SelectItem value="retired">Retired</SelectItem>
                                    <SelectItem value="not_out">Not Out</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">Bowler</Label>
                                <Input value={bat.bowlerName} onChange={e => updateBatting(idx, batIdx, 'bowlerName', e.target.value)} placeholder="Bowler name" className="text-xs h-8 rounded-lg" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bowling Figures */}
                    <div className="match-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="section-label">Bowling</h3>
                        <Button type="button" variant="outline" size="sm" className="rounded-full text-[10px] font-bold gap-1 h-7" onClick={() => addBowling(idx)}>
                          <Plus className="h-3 w-3" /> Add Bowler
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">Bowlers from {getTeamName(inn.teamId === selectedMatch.home_team_id ? selectedMatch.away_team_id : selectedMatch.home_team_id)}</p>
                      <div className="space-y-3">
                        {inn.bowling.map((bowl, bowlIdx) => (
                          <div key={bowlIdx} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input value={bowl.playerName} onChange={e => updateBowling(idx, bowlIdx, 'playerName', e.target.value)}
                                placeholder="Bowler name" className="text-xs h-8 flex-1" />
                              {inn.bowling.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-destructive shrink-0" onClick={() => removeBowling(idx, bowlIdx)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">O</Label>
                                <Input type="number" step="0.1" value={bowl.overs} onChange={e => updateBowling(idx, bowlIdx, 'overs', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">M</Label>
                                <Input type="number" value={bowl.maidens} onChange={e => updateBowling(idx, bowlIdx, 'maidens', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">R</Label>
                                <Input type="number" value={bowl.runs} onChange={e => updateBowling(idx, bowlIdx, 'runs', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">W</Label>
                                <Input type="number" value={bowl.wickets} onChange={e => updateBowling(idx, bowlIdx, 'wickets', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                              <div>
                                <Label className="text-[9px] font-bold text-muted-foreground">Wd</Label>
                                <Input type="number" value={bowl.wides} onChange={e => updateBowling(idx, bowlIdx, 'wides', e.target.value)} className="text-center text-xs h-8 rounded-lg" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Match Notes */}
              <div className="match-card p-4">
                <h3 className="section-label mb-2">Match Notes</h3>
                <Textarea value={matchNotes} onChange={e => setMatchNotes(e.target.value)} placeholder="Optional notes about the match..." rows={2} className="rounded-lg" />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pb-8">
                <Button type="submit" disabled={submitting} className="flex-1 h-14 font-bold text-base gap-2 rounded-xl">
                  {submitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Cricket Result</>}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader className="text-center items-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-lg font-black">Cricket Result Submitted!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              The cricket scorecard has been saved successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => navigate('/portal')} className="w-full h-12 font-bold rounded-xl">
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
