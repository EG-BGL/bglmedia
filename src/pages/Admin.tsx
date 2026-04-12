import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Shield, Plus, Pencil, Trash2, Upload, Image, Calendar, Newspaper, FileText, Users, Clock, AlertTriangle, CircleDot, Trophy, UserCheck, Ban, UserX, Search } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface ClubForm {
  id?: string; name: string; short_name: string; primary_color: string; secondary_color: string;
  home_ground: string; coach: string; description: string; founded_year: string; logo_url: string;
}
const emptyClub: ClubForm = {
  name: '', short_name: '', primary_color: '#1a365d', secondary_color: '#d69e2e',
  home_ground: '', coach: '', description: '', founded_year: '', logo_url: '',
};

interface FixtureForm {
  home_team_id: string; away_team_id: string; round_number: string;
  venue: string; scheduled_at: string; match_format: string;
  competition_id: string; season_id: string;
}
const emptyFixture: FixtureForm = { home_team_id: '', away_team_id: '', round_number: '', venue: '', scheduled_at: '', match_format: '', competition_id: '', season_id: '' };

interface CompetitionForm {
  id?: string; name: string; short_name: string; description: string; competition_type: string; sport_id: string;
}
const emptyCompetition: CompetitionForm = { name: '', short_name: '', description: '', competition_type: 'AFL26', sport_id: '' };

interface SeasonForm {
  id?: string; name: string; year: string; competition_id: string; start_date: string; end_date: string; is_current: boolean;
}
const emptySeason: SeasonForm = { name: '', year: new Date().getFullYear().toString(), competition_id: '', start_date: '', end_date: '', is_current: false };

export default function Admin() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [allSeasons, setAllSeasons] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsExcerpt, setNewsExcerpt] = useState('');
  const [clubForm, setClubForm] = useState<ClubForm>(emptyClub);
  const [editingClub, setEditingClub] = useState(false);
  const [fixtureForm, setFixtureForm] = useState<FixtureForm>(emptyFixture);
  const [showFixtureForm, setShowFixtureForm] = useState(false);
  const [compForm, setCompForm] = useState<CompetitionForm>(emptyCompetition);
  const [showCompForm, setShowCompForm] = useState(false);
  const [seasonForm, setSeasonForm] = useState<SeasonForm>(emptySeason);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  // Coach assignment state
  const [coachAssignments, setCoachAssignments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [coachForm, setCoachForm] = useState({ user_id: '', team_id: '', season_id: '', is_primary: true });
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || role !== 'league_admin')) navigate('/login');
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (role !== 'league_admin') return;
    loadData();
  }, [role]);

  const loadData = async () => {
    const [{ data: pendingResults }, { data: logs }, { data: clubData }, { data: newsData }, { data: seasonData }, { data: teamData }, { data: fixtureData }, { data: compData }, { data: sportData }, { data: allSeasonData }, { data: coachData }, { data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from('results').select(`*, fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)))`).in('status', ['submitted', 'draft']).order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('news').select('*').order('created_at', { ascending: false }),
      supabase.from('seasons').select('*').eq('is_current', true).maybeSingle(),
      supabase.from('teams').select('*, clubs(*)').order('clubs(name)'),
      supabase.from('fixtures').select(`*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))`).order('round_number').order('scheduled_at'),
      supabase.from('competitions').select('*, sports(*)').order('name'),
      supabase.from('sports').select('*').order('name'),
      supabase.from('seasons').select('*, competitions(*, sports(*))').order('year', { ascending: false }),
      supabase.from('coaches_to_teams').select('*, teams(*, clubs(*), seasons(*, competitions(*, sports(*))))').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('user_roles').select('*'),
    ]);
    setPending(pendingResults ?? []);
    setAuditLogs(logs ?? []);
    setClubs(clubData ?? []);
    setNewsList(newsData ?? []);
    setCurrentSeason(seasonData);
    setTeams(teamData ?? []);
    setFixtures(fixtureData ?? []);
    setCompetitions(compData ?? []);
    setSports(sportData ?? []);
    setAllSeasons(allSeasonData ?? []);
    setCoachAssignments(coachData ?? []);
    setProfiles(profileData ?? []);
    setUserRoles(roleData ?? []);
  };

  // ── Result actions ──
  const handleApprove = async (resultId: string) => {
    const { error } = await supabase.from('results').update({ status: 'approved' as any, approved_by: user!.id, approved_at: new Date().toISOString() }).eq('id', resultId);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'results', record_id: resultId, action: 'approved', performed_by: user!.id });
    toast.success('Result approved!'); loadData();
  };
  const handleReject = async (resultId: string) => {
    const { error } = await supabase.from('results').update({ status: 'rejected' as any }).eq('id', resultId);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'results', record_id: resultId, action: 'rejected', performed_by: user!.id });
    toast.success('Result rejected.'); loadData();
  };

  // ── News actions ──
  const handlePublishNews = async () => {
    if (!newsTitle.trim() || !newsContent.trim()) { toast.error('Title and content required'); return; }
    const { error } = await supabase.from('news').insert({ title: newsTitle.trim(), content: newsContent.trim(), excerpt: newsExcerpt.trim() || null, author_id: user!.id, is_published: true, published_at: new Date().toISOString() } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Published!'); setNewsTitle(''); setNewsContent(''); setNewsExcerpt(''); setShowNewsForm(false); loadData();
  };
  const handleDeleteNews = async (id: string) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted.'); loadData();
  };

  // ── Club CRUD ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    setUploading(true);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('club-logos').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('club-logos').getPublicUrl(path);
    setClubForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false); toast.success('Logo uploaded!');
  };
  const handleSaveClub = async () => {
    if (!clubForm.name.trim() || !clubForm.short_name.trim()) { toast.error('Name and short name required'); return; }
    const payload: any = { name: clubForm.name.trim(), short_name: clubForm.short_name.trim(), primary_color: clubForm.primary_color, secondary_color: clubForm.secondary_color, home_ground: clubForm.home_ground.trim() || null, coach: clubForm.coach.trim() || null, description: clubForm.description.trim() || null, founded_year: clubForm.founded_year ? parseInt(clubForm.founded_year) : null, logo_url: clubForm.logo_url || null };
    if (clubForm.id) {
      const { error } = await supabase.from('clubs').update(payload).eq('id', clubForm.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from('audit_logs').insert({ table_name: 'clubs', record_id: clubForm.id, action: 'updated', performed_by: user!.id, new_data: payload });
      toast.success('Updated!');
    } else {
      const { data, error } = await supabase.from('clubs').insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      await supabase.from('audit_logs').insert({ table_name: 'clubs', record_id: data.id, action: 'created', performed_by: user!.id, new_data: payload });
      if (currentSeason) {
        const { data: compData } = await supabase.from('competitions').select('id').limit(1).single();
        if (compData) {
          await supabase.from('teams').insert({ club_id: data.id, season_id: currentSeason.id, competition_id: compData.id });
        }
      }
      toast.success('Created!');
    }
    setClubForm(emptyClub); setEditingClub(false); loadData();
  };
  const handleEditClub = (club: any) => {
    setClubForm({ id: club.id, name: club.name ?? '', short_name: club.short_name ?? '', primary_color: club.primary_color ?? '#1a365d', secondary_color: club.secondary_color ?? '#d69e2e', home_ground: club.home_ground ?? '', coach: club.coach ?? '', description: club.description ?? '', founded_year: club.founded_year?.toString() ?? '', logo_url: club.logo_url ?? '' });
    setEditingClub(true);
  };
  const handleDeleteClub = async (id: string) => {
    if (!confirm('Delete this club?')) return;
    const { error } = await supabase.from('clubs').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'clubs', record_id: id, action: 'deleted', performed_by: user!.id });
    toast.success('Deleted.'); loadData();
  };

  // ── Fixture CRUD ──
  const handleSaveFixture = async () => {
    if (!fixtureForm.home_team_id || !fixtureForm.away_team_id || !fixtureForm.round_number) {
      toast.error('Home team, away team, and round are required'); return;
    }
    if (fixtureForm.home_team_id === fixtureForm.away_team_id) {
      toast.error('Home and away teams must be different'); return;
    }
    const selectedSeasonId = fixtureForm.season_id || currentSeason?.id;
    if (!selectedSeasonId) { toast.error('No season selected'); return; }

    const payload: any = {
      home_team_id: fixtureForm.home_team_id,
      away_team_id: fixtureForm.away_team_id,
      round_number: parseInt(fixtureForm.round_number),
      season_id: selectedSeasonId,
      venue: fixtureForm.venue.trim() || null,
      scheduled_at: fixtureForm.scheduled_at || null,
      match_format: fixtureForm.match_format || null,
      status: 'scheduled',
    };

    const { data, error } = await supabase.from('fixtures').insert(payload).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'fixtures', record_id: data.id, action: 'created', performed_by: user!.id, new_data: payload });
    toast.success('Fixture created!');
    setFixtureForm(emptyFixture); setShowFixtureForm(false); loadData();
  };

  const handleDeleteFixture = async (id: string) => {
    if (!confirm('Delete this fixture?')) return;
    await supabase.from('results').delete().eq('fixture_id', id);
    await supabase.from('cricket_match_results').delete().eq('fixture_id', id);
    await supabase.from('cricket_player_stats').delete().eq('fixture_id', id);
    await supabase.from('cricket_team_stats').delete().eq('fixture_id', id);
    const { error } = await supabase.from('fixtures').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'fixtures', record_id: id, action: 'deleted', performed_by: user!.id });
    toast.success('Fixture deleted.'); loadData();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentSeason) { toast.error('No current season found'); return; }

    setUploadingCsv(true);
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0].toLowerCase();

    if (!header.includes('round') || !header.includes('home') || !header.includes('away')) {
      toast.error('CSV must have columns: round, home, away, venue (optional), date (optional), format (optional)');
      setUploadingCsv(false); return;
    }

    const teamLookup: Record<string, string> = {};
    teams.forEach((t: any) => {
      if (t.clubs?.short_name) teamLookup[t.clubs.short_name.toLowerCase()] = t.id;
      if (t.clubs?.name) teamLookup[t.clubs.name.toLowerCase()] = t.id;
    });

    const rows: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 3) continue;

      const round = parseInt(cols[0]);
      const homeId = teamLookup[cols[1].toLowerCase()];
      const awayId = teamLookup[cols[2].toLowerCase()];
      const venue = cols[3] || null;
      const date = cols[4] || null;
      const format = cols[5] || null;

      if (!round || isNaN(round)) { errors.push(`Row ${i + 1}: invalid round`); continue; }
      if (!homeId) { errors.push(`Row ${i + 1}: unknown home team "${cols[1]}"`); continue; }
      if (!awayId) { errors.push(`Row ${i + 1}: unknown away team "${cols[2]}"`); continue; }

      rows.push({
        round_number: round,
        home_team_id: homeId,
        away_team_id: awayId,
        venue,
        scheduled_at: date || null,
        match_format: format,
        season_id: currentSeason.id,
        status: 'scheduled',
      });
    }

    if (errors.length > 0) {
      toast.error(`${errors.length} errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('fixtures').insert(rows);
      if (error) { toast.error(error.message); }
      else {
        toast.success(`${rows.length} fixtures imported!`);
        await supabase.from('audit_logs').insert({ table_name: 'fixtures', action: 'csv_import', performed_by: user!.id, new_data: { count: rows.length } as any });
      }
    }

    setUploadingCsv(false);
    if (csvRef.current) csvRef.current.value = '';
    loadData();
  };

  // ── Competition CRUD ──
  const handleSaveCompetition = async () => {
    if (!compForm.name.trim() || !compForm.sport_id) { toast.error('Name and sport are required'); return; }
    const payload: any = {
      name: compForm.name.trim(),
      short_name: compForm.short_name.trim() || null,
      description: compForm.description.trim() || null,
      competition_type: compForm.competition_type || 'senior',
      sport_id: compForm.sport_id,
    };
    if (compForm.id) {
      const { error } = await supabase.from('competitions').update(payload).eq('id', compForm.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Competition updated!');
    } else {
      const { error } = await supabase.from('competitions').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Competition created!');
    }
    setCompForm(emptyCompetition); setShowCompForm(false); loadData();
  };

  const handleDeleteCompetition = async (id: string) => {
    if (!confirm('Delete this competition? This will affect all linked seasons.')) return;
    const { error } = await supabase.from('competitions').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Competition deleted.'); loadData();
  };

  // ── Season CRUD ──
  const handleSaveSeason = async () => {
    if (!seasonForm.name.trim() || !seasonForm.competition_id || !seasonForm.year) { toast.error('Name, competition, and year are required'); return; }
    const payload: any = {
      name: seasonForm.name.trim(),
      year: parseInt(seasonForm.year),
      competition_id: seasonForm.competition_id,
      start_date: seasonForm.start_date || null,
      end_date: seasonForm.end_date || null,
      is_current: seasonForm.is_current,
    };
    if (seasonForm.id) {
      const { error } = await supabase.from('seasons').update(payload).eq('id', seasonForm.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Season updated!');
    } else {
      const { error } = await supabase.from('seasons').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Season created!');
    }
    setSeasonForm(emptySeason); setShowSeasonForm(false); loadData();
  };

  const handleDeleteSeason = async (id: string) => {
    if (!confirm('Delete this season?')) return;
    const { error } = await supabase.from('seasons').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Season deleted.'); loadData();
  };

  if (loading) return <Layout><div className="page-container py-8 text-muted-foreground">Loading...</div></Layout>;

  // Group fixtures by round
  const fixturesByRound: Record<number, any[]> = {};
  fixtures.forEach((f: any) => {
    if (!fixturesByRound[f.round_number]) fixturesByRound[f.round_number] = [];
    fixturesByRound[f.round_number].push(f);
  });

  // Filter teams based on fixture form's selected season, fallback to current season
  const fixtureSeasonId = fixtureForm.season_id || currentSeason?.id;
  const seasonTeams = fixtureSeasonId ? teams.filter((t: any) => t.season_id === fixtureSeasonId) : teams;

  // Helper to get sport name
  const getSportName = (sportId: string) => sports.find(s => s.id === sportId)?.slug?.toUpperCase() ?? 'Unknown';
  const cricketSport = sports.find(s => s.slug === 'cricket');

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight">League Admin</h1>
        </div>

        <Tabs defaultValue="fixtures">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="inline-flex h-9 bg-muted/60 rounded-full p-0.5 gap-0.5">
              <TabsTrigger value="fixtures" className="rounded-full text-[10px] font-bold px-3"><Calendar className="h-3 w-3 mr-1" />Fixtures</TabsTrigger>
              <TabsTrigger value="competitions" className="rounded-full text-[10px] font-bold px-3"><Trophy className="h-3 w-3 mr-1" />Competitions</TabsTrigger>
              <TabsTrigger value="clubs" className="rounded-full text-[10px] font-bold px-3"><Users className="h-3 w-3 mr-1" />Teams</TabsTrigger>
              <TabsTrigger value="players" className="rounded-full text-[10px] font-bold px-3"><Users className="h-3 w-3 mr-1" />Players</TabsTrigger>
              <TabsTrigger value="coaches" className="rounded-full text-[10px] font-bold px-3"><UserCheck className="h-3 w-3 mr-1" />Coaches</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-full text-[10px] font-bold px-3"><Clock className="h-3 w-3 mr-1" />Pending</TabsTrigger>
              <TabsTrigger value="news" className="rounded-full text-[10px] font-bold px-3"><Newspaper className="h-3 w-3 mr-1" />News</TabsTrigger>
              <TabsTrigger value="members" className="rounded-full text-[10px] font-bold px-3"><Shield className="h-3 w-3 mr-1" />Members</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-full text-[10px] font-bold px-3"><FileText className="h-3 w-3 mr-1" />Audit</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Competitions & Seasons Tab ── */}
          <TabsContent value="competitions" className="space-y-6 mt-4">
            {/* Competitions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm">Competitions</h3>
                {!showCompForm && (
                  <Button onClick={() => { setCompForm(emptyCompetition); setShowCompForm(true); }} size="sm" className="rounded-full gap-1.5 font-bold text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Competition
                  </Button>
                )}
              </div>

              {showCompForm && (
                <div className="match-card p-4 space-y-3">
                  <h3 className="font-black text-sm">{compForm.id ? 'Edit Competition' : 'New Competition'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs font-bold">Sport *</Label>
                      <Select value={compForm.sport_id} onValueChange={v => setCompForm(f => ({ ...f, sport_id: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select sport" /></SelectTrigger>
                        <SelectContent>
                          {sports.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs font-bold">Games</Label>
                      <Select value={compForm.competition_type} onValueChange={v => setCompForm(f => ({ ...f, competition_type: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AFL26">AFL26</SelectItem>
                          <SelectItem value="Cricket 26">Cricket 26</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs font-bold">Name *</Label>
                      <Input value={compForm.name} onChange={e => setCompForm(f => ({ ...f, name: e.target.value }))} placeholder="Senior Cricket" className="mt-1" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs font-bold">Short Name</Label>
                      <Input value={compForm.short_name} onChange={e => setCompForm(f => ({ ...f, short_name: e.target.value }))} placeholder="SRC" className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold">Description</Label>
                      <Textarea value={compForm.description} onChange={e => setCompForm(f => ({ ...f, description: e.target.value }))} placeholder="About this competition..." rows={2} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCompetition} className="rounded-full font-bold gap-1.5 text-xs"><Check className="h-3.5 w-3.5" />{compForm.id ? 'Update' : 'Create'}</Button>
                    <Button variant="outline" className="rounded-full text-xs" onClick={() => { setShowCompForm(false); setCompForm(emptyCompetition); }}>Cancel</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {competitions.map((c: any) => (
                  <div key={c.id} className="match-card p-3.5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {c.sports?.slug === 'cricket' ? <CircleDot className="h-4 w-4 text-primary" /> : <Trophy className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] rounded-full">{c.sports?.name ?? 'Unknown'}</Badge>
                        {c.short_name && <span>{c.short_name}</span>}
                        <span className="capitalize">{c.competition_type}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => {
                        setCompForm({ id: c.id, name: c.name, short_name: c.short_name ?? '', description: c.description ?? '', competition_type: c.competition_type ?? 'senior', sport_id: c.sport_id ?? '' });
                        setShowCompForm(true);
                      }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive" onClick={() => handleDeleteCompetition(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
                {competitions.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No competitions yet.</div>}
              </div>
            </div>

            {/* Seasons Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm">Seasons</h3>
                {!showSeasonForm && (
                  <Button onClick={() => { setSeasonForm(emptySeason); setShowSeasonForm(true); }} size="sm" className="rounded-full gap-1.5 font-bold text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Season
                  </Button>
                )}
              </div>

              {showSeasonForm && (
                <div className="match-card p-4 space-y-3">
                  <h3 className="font-black text-sm">{seasonForm.id ? 'Edit Season' : 'New Season'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs font-bold">Competition *</Label>
                      <Select value={seasonForm.competition_id} onValueChange={v => setSeasonForm(f => ({ ...f, competition_id: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select competition" /></SelectTrigger>
                        <SelectContent>
                          {competitions.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.sports?.name})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Name *</Label>
                      <Input value={seasonForm.name} onChange={e => setSeasonForm(f => ({ ...f, name: e.target.value }))} placeholder="2026 Season" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Year *</Label>
                      <Input type="number" value={seasonForm.year} onChange={e => setSeasonForm(f => ({ ...f, year: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Start Date</Label>
                      <Input type="date" value={seasonForm.start_date} onChange={e => setSeasonForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">End Date</Label>
                      <Input type="date" value={seasonForm.end_date} onChange={e => setSeasonForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="is_current" checked={seasonForm.is_current} onChange={e => setSeasonForm(f => ({ ...f, is_current: e.target.checked }))} className="h-4 w-4 rounded border-border" />
                      <Label htmlFor="is_current" className="text-xs font-bold cursor-pointer">Set as current season</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSeason} className="rounded-full font-bold gap-1.5 text-xs"><Check className="h-3.5 w-3.5" />{seasonForm.id ? 'Update' : 'Create'}</Button>
                    <Button variant="outline" className="rounded-full text-xs" onClick={() => { setShowSeasonForm(false); setSeasonForm(emptySeason); }}>Cancel</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {allSeasons.map((s: any) => (
                  <div key={s.id} className="match-card p-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{s.name}</span>
                        {s.is_current && <Badge className="text-[9px] rounded-full bg-primary text-primary-foreground border-0">Current</Badge>}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{s.competitions?.name}</span>
                        <Badge variant="outline" className="text-[9px] rounded-full">{s.competitions?.sports?.name ?? 'Unknown'}</Badge>
                        <span>{s.year}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => {
                        setSeasonForm({ id: s.id, name: s.name, year: s.year.toString(), competition_id: s.competition_id, start_date: s.start_date ?? '', end_date: s.end_date ?? '', is_current: s.is_current ?? false });
                        setShowSeasonForm(true);
                      }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive" onClick={() => handleDeleteSeason(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
                {allSeasons.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No seasons yet.</div>}
              </div>
            </div>
          </TabsContent>

          {/* ── Players Tab ── */}
          <TabsContent value="players" className="mt-4">
            <div className="text-center py-8 space-y-3">
              <Users className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Manage player rosters for each team</p>
              <Button asChild className="rounded-full font-bold text-xs gap-1.5">
                <Link to="/admin/players"><Plus className="h-3.5 w-3.5" /> Manage Players</Link>
              </Button>
            </div>
          </TabsContent>

          {/* ── Fixtures Tab ── */}
          <TabsContent value="fixtures" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {!showFixtureForm && (
                <Button onClick={() => setShowFixtureForm(true)} className="rounded-full gap-1.5 font-bold text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Fixture
                </Button>
              )}
              <div>
                <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                <Button variant="outline" className="rounded-full gap-1.5 font-bold text-xs" onClick={() => csvRef.current?.click()} disabled={uploadingCsv}>
                  <Upload className="h-3.5 w-3.5" />{uploadingCsv ? 'Importing...' : 'Upload CSV'}
                </Button>
              </div>
            </div>

            {/* CSV help */}
            <div className="text-[10px] text-muted-foreground bg-muted/40 rounded-lg p-3">
              <strong>CSV format:</strong> round, home, away, venue, date, format<br />
              Use team short names. Format: T20, One-Day, Multi-Day (optional, for cricket).<br />
              Example: <code className="bg-muted px-1 rounded">1,Bears,Hawks,Bayside Oval,2026-04-18T14:00,T20</code>
            </div>

            {showFixtureForm && (
              <div className="match-card p-4 space-y-3">
                <h3 className="font-black text-sm">New Fixture</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Competition *</Label>
                    <Select value={fixtureForm.competition_id} onValueChange={v => {
                      setFixtureForm(f => ({ ...f, competition_id: v, season_id: '', home_team_id: '', away_team_id: '' }));
                    }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select competition" /></SelectTrigger>
                      <SelectContent>
                        {competitions.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name} ({c.sports?.name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Season *</Label>
                    <Select value={fixtureForm.season_id} onValueChange={v => {
                      setFixtureForm(f => ({ ...f, season_id: v, home_team_id: '', away_team_id: '' }));
                    }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select season" /></SelectTrigger>
                      <SelectContent>
                        {allSeasons.filter((s: any) => !fixtureForm.competition_id || s.competition_id === fixtureForm.competition_id).map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.year})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Home Team *</Label>
                    <Select value={fixtureForm.home_team_id} onValueChange={v => setFixtureForm(f => ({ ...f, home_team_id: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger>
                      <SelectContent>
                        {seasonTeams.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.clubs?.name} {t.division ? `(${t.division})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Away Team *</Label>
                    <Select value={fixtureForm.away_team_id} onValueChange={v => setFixtureForm(f => ({ ...f, away_team_id: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger>
                      <SelectContent>
                        {seasonTeams.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.clubs?.name} {t.division ? `(${t.division})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Round *</Label>
                    <Input type="number" value={fixtureForm.round_number} onChange={e => setFixtureForm(f => ({ ...f, round_number: e.target.value }))} placeholder="1" className="mt-1" inputMode="numeric" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Venue</Label>
                    <Input value={fixtureForm.venue} onChange={e => setFixtureForm(f => ({ ...f, venue: e.target.value }))} placeholder="Bayside Oval" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Match Format</Label>
                    <Select value={fixtureForm.match_format} onValueChange={v => setFixtureForm(f => ({ ...f, match_format: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="None (AFL)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (AFL)</SelectItem>
                        <SelectItem value="T20">T20</SelectItem>
                        <SelectItem value="One-Day">One-Day</SelectItem>
                        <SelectItem value="Multi-Day">Multi-Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Date & Time</Label>
                    <Input type="datetime-local" value={fixtureForm.scheduled_at} onChange={e => setFixtureForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveFixture} className="rounded-full font-bold gap-1.5 text-xs"><Check className="h-3.5 w-3.5" />Create Fixture</Button>
                  <Button variant="outline" className="rounded-full text-xs" onClick={() => { setShowFixtureForm(false); setFixtureForm(emptyFixture); }}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Fixture list divided by sport & season */}
            {(() => {
              // Group fixtures by sport -> season -> round
              type GroupedFixtures = Record<string, Record<string, Record<number, any[]>>>;
              const grouped: GroupedFixtures = {};

              fixtures.forEach((f: any) => {
                const season = allSeasons.find((s: any) => s.season_id === f.season_id || s.id === f.season_id);
                const comp = season ? competitions.find((c: any) => c.id === season.competition_id) : null;
                const sport = comp ? sports.find((s: any) => s.id === comp.sport_id) : null;
                const sportLabel = sport?.slug === 'cricket' ? 'Cricket' : 'AFL';
                const seasonLabel = season?.name ?? 'Unknown Season';

                if (!grouped[sportLabel]) grouped[sportLabel] = {};
                if (!grouped[sportLabel][seasonLabel]) grouped[sportLabel][seasonLabel] = {};
                if (!grouped[sportLabel][seasonLabel][f.round_number]) grouped[sportLabel][seasonLabel][f.round_number] = [];
                grouped[sportLabel][seasonLabel][f.round_number].push(f);
              });

              const sportOrder = ['AFL', 'Cricket'];
              const sortedSports = Object.keys(grouped).sort((a, b) => sportOrder.indexOf(a) - sportOrder.indexOf(b));

              if (sortedSports.length === 0) {
                return <div className="py-12 text-center text-sm text-muted-foreground">No fixtures yet.</div>;
              }

              return sortedSports.map((sportLabel) => (
                <div key={sportLabel} className="space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    {sportLabel === 'Cricket' ? <CircleDot className="h-4 w-4 text-primary" /> : <Trophy className="h-4 w-4 text-primary" />}
                    <h3 className="text-sm font-black">{sportLabel}</h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {Object.entries(grouped[sportLabel]).map(([seasonLabel, rounds]) => (
                    <div key={seasonLabel} className="space-y-2">
                      <Badge variant="outline" className="text-[10px] rounded-full font-bold">{seasonLabel}</Badge>
                      {Object.entries(rounds).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
                        <div key={round}>
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Round {round}</h4>
                          <div className="space-y-1.5">
                            {matches.map((f: any) => (
                              <div key={f.id} className="match-card p-3 flex items-center gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                                  <span className="text-xs font-bold truncate">{f.home_team?.clubs?.short_name}</span>
                                </div>
                                <div className="text-center shrink-0 px-1 flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[9px] rounded-full capitalize">{f.status}</Badge>
                                  {f.match_format && (
                                    <Badge className="text-[9px] rounded-full bg-accent/20 text-accent border-0">{f.match_format}</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                  <span className="text-xs font-bold truncate">{f.away_team?.clubs?.short_name}</span>
                                  <ClubLogo club={f.away_team?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-destructive shrink-0" onClick={() => handleDeleteFixture(f.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </TabsContent>

          {/* ── Teams Tab ── */}
          <TabsContent value="clubs" className="space-y-4 mt-4">
            {!editingClub ? (
              <Button onClick={() => { setClubForm(emptyClub); setEditingClub(true); }} className="rounded-full gap-1.5 font-bold text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Team
              </Button>
            ) : (
              <div className="match-card p-4 space-y-4">
                <h3 className="font-black text-sm">{clubForm.id ? 'Edit Team' : 'New Team'}</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {clubForm.logo_url ? (
                      <img src={clubForm.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-contain bg-muted border border-border" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted border border-dashed border-border flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      <Upload className="h-3.5 w-3.5" />{uploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Name *</Label>
                    <Input value={clubForm.name} onChange={e => setClubForm(f => ({ ...f, name: e.target.value }))} placeholder="Bayside Bears" className="mt-1" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Short Name *</Label>
                    <Input value={clubForm.short_name} onChange={e => setClubForm(f => ({ ...f, short_name: e.target.value }))} placeholder="Bears" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Primary Colour</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={clubForm.primary_color} onChange={e => setClubForm(f => ({ ...f, primary_color: e.target.value }))} className="h-9 w-9 rounded-lg border border-border cursor-pointer" />
                      <Input value={clubForm.primary_color} onChange={e => setClubForm(f => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Secondary Colour</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={clubForm.secondary_color} onChange={e => setClubForm(f => ({ ...f, secondary_color: e.target.value }))} className="h-9 w-9 rounded-lg border border-border cursor-pointer" />
                      <Input value={clubForm.secondary_color} onChange={e => setClubForm(f => ({ ...f, secondary_color: e.target.value }))} className="flex-1" />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Home Ground</Label>
                    <Input value={clubForm.home_ground} onChange={e => setClubForm(f => ({ ...f, home_ground: e.target.value }))} placeholder="Bayside Oval" className="mt-1" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Coach</Label>
                    <Input value={clubForm.coach} onChange={e => setClubForm(f => ({ ...f, coach: e.target.value }))} placeholder="John Smith" className="mt-1" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold">Founded Year</Label>
                    <Input value={clubForm.founded_year} onChange={e => setClubForm(f => ({ ...f, founded_year: e.target.value }))} placeholder="1920" type="number" className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-bold">Description</Label>
                    <Textarea value={clubForm.description} onChange={e => setClubForm(f => ({ ...f, description: e.target.value }))} placeholder="About this club..." rows={2} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveClub} className="rounded-full font-bold gap-1.5 text-xs"><Check className="h-3.5 w-3.5" />{clubForm.id ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" className="rounded-full text-xs" onClick={() => { setEditingClub(false); setClubForm(emptyClub); }}>Cancel</Button>
                </div>
              </div>
            )}
            {/* Team list divided by sport */}
            {(() => {
              // Build a map of club_id -> sport slugs they're enrolled in
              const clubSportMap: Record<string, Set<string>> = {};
              teams.forEach((t: any) => {
                const comp = competitions.find((c: any) => c.id === t.competition_id);
                const sport = comp ? sports.find((s: any) => s.id === comp.sport_id) : null;
                if (!clubSportMap[t.club_id]) clubSportMap[t.club_id] = new Set();
                if (sport?.slug) clubSportMap[t.club_id].add(sport.slug);
              });

              const aflSport = sports.find((s: any) => s.slug === 'afl');
              const crickSport = sports.find((s: any) => s.slug === 'cricket');

              const handleAddToSport = async (clubId: string, sportSlug: string) => {
                const sport = sports.find((s: any) => s.slug === sportSlug);
                if (!sport) { toast.error('Sport not found'); return; }
                const comp = competitions.find((c: any) => c.sport_id === sport.id);
                if (!comp) { toast.error(`No ${sportSlug} competition found. Create one first.`); return; }
                const season = allSeasons.find((s: any) => s.competition_id === comp.id && s.is_current);
                if (!season) { toast.error(`No current season for ${sportSlug}. Create one first.`); return; }
                const { error } = await supabase.from('teams').insert({ club_id: clubId, competition_id: comp.id, season_id: season.id });
                if (error) { toast.error(error.message); return; }
                toast.success(`Added to ${sportSlug.toUpperCase()}!`); loadData();
              };

              const aflClubs = clubs.filter((c: any) => clubSportMap[c.id]?.has('afl'));
              const cricketClubs = clubs.filter((c: any) => clubSportMap[c.id]?.has('cricket'));
              const unenrolledClubs = clubs.filter((c: any) => !clubSportMap[c.id] || clubSportMap[c.id].size === 0);

              const renderClub = (c: any) => (
                <div key={c.id} className="match-card p-3.5 flex items-center gap-3">
                  <ClubLogo club={c} size="md" className="!h-11 !w-11" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                      {c.short_name && <span>{c.short_name}</span>}
                      {c.home_ground && <span>• {c.home_ground}</span>}
                      {c.coach && <span>• Coach: {c.coach}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {aflSport && !clubSportMap[c.id]?.has('afl') && (
                      <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold h-7 px-2.5 gap-1" onClick={() => handleAddToSport(c.id, 'afl')}>
                        <Plus className="h-3 w-3" /> AFL
                      </Button>
                    )}
                    {crickSport && !clubSportMap[c.id]?.has('cricket') && (
                      <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold h-7 px-2.5 gap-1" onClick={() => handleAddToSport(c.id, 'cricket')}>
                        <Plus className="h-3 w-3" /> Cricket
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.primary_color }} />
                    <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.secondary_color }} />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleEditClub(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive" onClick={() => handleDeleteClub(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );

              return (
                <div className="space-y-4">
                  {aflClubs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">AFL Teams</h3>
                        <Badge variant="outline" className="text-[9px] rounded-full">{aflClubs.length}</Badge>
                      </div>
                      {aflClubs.map(renderClub)}
                    </div>
                  )}
                  {cricketClubs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Cricket Teams</h3>
                        <Badge variant="outline" className="text-[9px] rounded-full">{cricketClubs.length}</Badge>
                      </div>
                      {cricketClubs.map(renderClub)}
                    </div>
                  )}
                  {unenrolledClubs.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Not Enrolled</h3>
                      {unenrolledClubs.map(renderClub)}
                    </div>
                  )}
                  {clubs.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No teams yet.</div>}
                </div>
              );
            })()}

          </TabsContent>

          {/* ── Pending Tab ── */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {(() => {
              const byFixture: Record<string, any[]> = {};
              pending.forEach((r: any) => {
                const fid = r.fixture_id;
                if (!byFixture[fid]) byFixture[fid] = [];
                byFixture[fid].push(r);
              });
              const fixtureGroups = Object.entries(byFixture);
              if (fixtureGroups.length === 0) return <div className="match-card p-8 text-center text-sm text-muted-foreground">No pending submissions.</div>;

              return fixtureGroups.map(([fixtureId, submissions]) => {
                const fixture = submissions[0]?.fixtures;
                const hasConflict = submissions.length >= 2 && !(
                  submissions[0].home_goals === submissions[1].home_goals &&
                  submissions[0].home_behinds === submissions[1].home_behinds &&
                  submissions[0].away_goals === submissions[1].away_goals &&
                  submissions[0].away_behinds === submissions[1].away_behinds
                );

                return (
                  <div key={fixtureId} className="match-card p-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{fixture?.home_team?.clubs?.short_name} vs {fixture?.away_team?.clubs?.short_name}</span>
                      <Badge variant="outline" className="text-[10px] rounded-full">Rd {fixture?.round_number}</Badge>
                      {hasConflict && (
                        <Badge className="text-[10px] rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0 gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" /> Conflict
                        </Badge>
                      )}
                      {submissions.length === 1 && (
                        <Badge className="text-[10px] rounded-full bg-accent text-accent-foreground border-0">1 of 2 submitted</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {submissions.map((r: any) => {
                        const teamName = r.team_id === fixture?.home_team_id
                          ? fixture?.home_team?.clubs?.short_name
                          : r.team_id === fixture?.away_team_id
                          ? fixture?.away_team?.clubs?.short_name
                          : 'Unknown';
                        return (
                          <div key={r.id} className={`rounded-xl p-3 border ${hasConflict ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50 bg-muted/30'}`}>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <Badge variant={r.status === 'submitted' ? 'secondary' : 'outline'} className="text-[10px] rounded-full">{r.status}</Badge>
                                <span className="text-xs font-bold">{teamName}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {r.submitted_at ? new Date(r.submitted_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className="text-sm font-black tabular-nums">
                              {r.home_goals}.{r.home_behinds}.{r.home_score} to {r.away_goals}.{r.away_behinds}.{r.away_score}
                            </div>
                            {r.match_notes && <p className="text-[10px] text-muted-foreground mt-1">{r.match_notes}</p>}
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={() => handleApprove(r.id)} className="rounded-full gap-1 text-xs font-bold h-7"><Check className="h-3 w-3" />Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)} className="rounded-full gap-1 text-xs font-bold h-7"><X className="h-3 w-3" />Reject</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </TabsContent>

          {/* ── News Tab ── */}
          <TabsContent value="news" className="space-y-3 mt-4">
            {!showNewsForm ? (
              <Button onClick={() => setShowNewsForm(true)} className="rounded-full gap-1.5 font-bold text-xs"><Plus className="h-3.5 w-3.5" />New Article</Button>
            ) : (
              <div className="match-card p-4 space-y-3">
                <Input placeholder="Title" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
                <Input placeholder="Short excerpt (optional)" value={newsExcerpt} onChange={e => setNewsExcerpt(e.target.value)} />
                <Textarea placeholder="Full content..." value={newsContent} onChange={e => setNewsContent(e.target.value)} rows={5} />
                <div className="flex gap-2">
                  <Button onClick={handlePublishNews} className="rounded-full font-bold text-xs">Publish</Button>
                  <Button variant="outline" className="rounded-full text-xs" onClick={() => setShowNewsForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {newsList.map((n: any) => (
              <div key={n.id} className="match-card p-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm truncate">{n.title}</span>
                    <Badge variant={n.is_published ? 'default' : 'outline'} className="text-[10px] rounded-full shrink-0">{n.is_published ? 'Live' : 'Draft'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.excerpt || n.content}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-AU')}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-destructive shrink-0" onClick={() => handleDeleteNews(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </TabsContent>

          {/* ── Coaches Tab ── */}
          <TabsContent value="coaches" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm">Coach Assignments</h3>
              {!showCoachForm && (
                <Button onClick={() => { setCoachForm({ user_id: '', team_id: '', season_id: currentSeason?.id || '', is_primary: true }); setShowCoachForm(true); }} size="sm" className="rounded-full gap-1.5 font-bold text-xs">
                  <Plus className="h-3.5 w-3.5" /> Assign Coach
                </Button>
              )}
            </div>

            {showCoachForm && (
              <div className="match-card p-4 space-y-3">
                <h3 className="font-black text-sm">Assign Coach to Team</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold">Coach *</Label>
                    <Select value={coachForm.user_id} onValueChange={v => setCoachForm(f => ({ ...f, user_id: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select coach" /></SelectTrigger>
                      <SelectContent>
                        {profiles.filter((p: any) => p.id).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name || 'Unnamed'} ({p.id.slice(0, 8)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Season *</Label>
                    <Select value={coachForm.season_id} onValueChange={v => setCoachForm(f => ({ ...f, season_id: v, team_id: '' }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select season" /></SelectTrigger>
                      <SelectContent>
                        {allSeasons.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name} - {s.competitions?.name} ({s.competitions?.sports?.name}){s.is_current ? ' ★' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Team *</Label>
                    <Select value={coachForm.team_id} onValueChange={v => setCoachForm(f => ({ ...f, team_id: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger>
                      <SelectContent>
                        {teams.filter((t: any) => !coachForm.season_id || t.season_id === coachForm.season_id).map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.clubs?.name} ({t.division})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="checkbox" checked={coachForm.is_primary} onChange={e => setCoachForm(f => ({ ...f, is_primary: e.target.checked }))} className="rounded" />
                      Primary Coach
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    if (!coachForm.user_id || !coachForm.team_id || !coachForm.season_id) { toast.error('Coach, team, and season are required'); return; }
                    const { error } = await supabase.from('coaches_to_teams').insert({
                      user_id: coachForm.user_id,
                      team_id: coachForm.team_id,
                      season_id: coachForm.season_id,
                      is_primary: coachForm.is_primary,
                    });
                    if (error) { toast.error(error.message); return; }
                    // Ensure the user has the 'coach' role
                    await supabase.from('user_roles').upsert({ user_id: coachForm.user_id, role: 'coach' } as any, { onConflict: 'user_id,role' });
                    await supabase.from('audit_logs').insert({ table_name: 'coaches_to_teams', action: 'assigned', performed_by: user!.id, new_data: coachForm as any });
                    toast.success('Coach assigned!');
                    setShowCoachForm(false);
                    setCoachForm({ user_id: '', team_id: '', season_id: '', is_primary: true });
                    loadData();
                  }} className="rounded-full font-bold gap-1.5 text-xs"><Check className="h-3.5 w-3.5" />Assign</Button>
                  <Button variant="outline" className="rounded-full text-xs" onClick={() => setShowCoachForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Group by season */}
            {(() => {
              const bySeasonMap: Record<string, { season: any; items: any[] }> = {};
              coachAssignments.forEach((a: any) => {
                const sName = a.teams?.seasons?.name ?? 'Unknown Season';
                const sId = a.season_id;
                if (!bySeasonMap[sId]) bySeasonMap[sId] = { season: a.teams?.seasons, items: [] };
                bySeasonMap[sId].items.push(a);
              });
              const groups = Object.values(bySeasonMap);
              if (groups.length === 0) return <div className="match-card p-8 text-center text-sm text-muted-foreground">No coach assignments yet.</div>;
              return (
                <div className="space-y-4">
                  {groups.map((group: any, gi: number) => (
                    <div key={gi}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                          {group.season?.competitions?.name} · {group.season?.name}
                        </h4>
                        <Badge variant="outline" className="text-[9px] rounded-full">{group.season?.competitions?.sports?.name}</Badge>
                        {group.season?.is_current && <Badge className="text-[9px] rounded-full bg-accent/20 text-accent border-0">Current</Badge>}
                      </div>
                      <div className="space-y-2">
                        {group.items.map((a: any) => {
                          const profile = profiles.find((p: any) => p.id === a.user_id);
                          return (
                            <div key={a.id} className="match-card p-3.5 flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <UserCheck className="h-4 w-4 text-primary" />
                              </div>
                              <ClubLogo club={a.teams?.clubs ?? {}} size="sm" className="!h-7 !w-7" />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{profile?.full_name || a.user_id.slice(0, 8)}</div>
                                <div className="text-[10px] text-muted-foreground">{a.teams?.clubs?.name} · {a.teams?.division}</div>
                              </div>
                              {a.is_primary && <Badge variant="secondary" className="text-[9px] rounded-full shrink-0">Primary</Badge>}
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive shrink-0" onClick={async () => {
                                if (!confirm('Remove this coach assignment?')) return;
                                const { error } = await supabase.from('coaches_to_teams').delete().eq('id', a.id);
                                if (error) { toast.error(error.message); return; }
                                await supabase.from('audit_logs').insert({ table_name: 'coaches_to_teams', record_id: a.id, action: 'removed', performed_by: user!.id });
                                toast.success('Assignment removed.'); loadData();
                              }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* ── Members Tab ── */}
          <TabsContent value="members" className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, gamertag..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-secondary/40 border-border/40 text-xs"
                />
              </div>
            </div>
            <div className="match-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Name</th>
                      <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Gamertag</th>
                      <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Facebook</th>
                      <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Role</th>
                      <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Status</th>
                      <th className="text-right py-2.5 px-3 font-bold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles
                      .filter((p: any) => {
                        if (!memberSearch.trim()) return true;
                        const q = memberSearch.toLowerCase();
                        return (
                          (p.full_name ?? '').toLowerCase().includes(q) ||
                          (p.first_name ?? '').toLowerCase().includes(q) ||
                          (p.last_name ?? '').toLowerCase().includes(q) ||
                          (p.gamertag ?? '').toLowerCase().includes(q) ||
                          (p.facebook_name ?? '').toLowerCase().includes(q)
                        );
                      })
                      .map((p: any) => (
                        <tr key={p.id} className={`border-b border-border/30 last:border-0 ${p.is_banned ? 'opacity-60 bg-destructive/5' : ''}`}>
                          <td className="py-2.5 px-3">
                            <div className="font-medium">{p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unnamed'}</div>
                            {p.birth_year && <div className="text-[10px] text-muted-foreground">Born {p.birth_year}</div>}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{p.gamertag || '—'}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{p.facebook_name || '—'}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="text-[10px] rounded-full">{p.role ?? 'member'}</Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            {p.is_banned ? (
                              <Badge variant="destructive" className="text-[10px] rounded-full gap-1"><Ban className="h-2.5 w-2.5" />Banned</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] rounded-full">Active</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {p.id !== user?.id && (
                                <>
                                  {p.is_banned ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-[10px] rounded-full gap-1 font-bold"
                                      onClick={async () => {
                                        const { error } = await supabase.from('profiles').update({ is_banned: false, banned_at: null, banned_reason: null } as any).eq('id', p.id);
                                        if (error) { toast.error(error.message); return; }
                                        await supabase.from('audit_logs').insert({ table_name: 'profiles', record_id: p.id, action: 'unbanned', performed_by: user!.id });
                                        toast.success('Member unbanned.'); loadData();
                                      }}
                                    >
                                      <Check className="h-3 w-3" /> Unban
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-[10px] rounded-full gap-1 font-bold text-destructive"
                                      onClick={async () => {
                                        const reason = prompt('Reason for banning (optional):');
                                        if (reason === null) return;
                                        const { error } = await supabase.from('profiles').update({ is_banned: true, banned_at: new Date().toISOString(), banned_reason: reason || null } as any).eq('id', p.id);
                                        if (error) { toast.error(error.message); return; }
                                        await supabase.from('audit_logs').insert({ table_name: 'profiles', record_id: p.id, action: 'banned', performed_by: user!.id, new_data: { reason } as any });
                                        toast.success('Member banned.'); loadData();
                                      }}
                                    >
                                      <Ban className="h-3 w-3" /> Ban
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] rounded-full gap-1 font-bold text-destructive"
                                    onClick={async () => {
                                      if (!confirm(`Remove this member (${p.full_name || 'Unnamed'})? This will delete their profile and role assignments.`)) return;
                                      await supabase.from('user_roles').delete().eq('user_id', p.id);
                                      await supabase.from('coaches_to_teams').delete().eq('user_id', p.id);
                                      const { error } = await supabase.from('profiles').delete().eq('id', p.id);
                                      if (error) { toast.error(error.message); return; }
                                      await supabase.from('audit_logs').insert({ table_name: 'profiles', record_id: p.id, action: 'removed', performed_by: user!.id });
                                      toast.success('Member removed.'); loadData();
                                    }}
                                  >
                                    <UserX className="h-3 w-3" /> Remove
                                  </Button>
                                </>
                              )}
                              {p.id === user?.id && <span className="text-[10px] text-muted-foreground italic">You</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {profiles.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No members found.</div>}
            </div>
            <div className="text-[10px] text-muted-foreground">
              <strong>Note:</strong> Banning prevents a member from accessing the site. Removing deletes their profile and role assignments permanently.
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            {auditLogs.length === 0 ? (
              <div className="match-card p-8 text-center text-sm text-muted-foreground">No audit logs yet.</div>
            ) : (
              <div className="match-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Time</th>
                        <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Table</th>
                        <th className="text-left py-2.5 px-3 font-bold text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2 px-3 text-muted-foreground">{new Date(log.created_at).toLocaleString('en-AU')}</td>
                          <td className="py-2 px-3 font-medium">{log.table_name}</td>
                          <td className="py-2 px-3"><Badge variant="outline" className="text-[10px] rounded-full">{log.action}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
