import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Shield, Plus, Pencil, Trash2, Upload, Image, Calendar, Newspaper, FileText, Users, Clock, AlertTriangle } from 'lucide-react';
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
  venue: string; scheduled_at: string;
}
const emptyFixture: FixtureForm = { home_team_id: '', away_team_id: '', round_number: '', venue: '', scheduled_at: '' };

export default function Admin() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsExcerpt, setNewsExcerpt] = useState('');
  const [clubForm, setClubForm] = useState<ClubForm>(emptyClub);
  const [editingClub, setEditingClub] = useState(false);
  const [fixtureForm, setFixtureForm] = useState<FixtureForm>(emptyFixture);
  const [showFixtureForm, setShowFixtureForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'league_admin')) navigate('/login');
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (role !== 'league_admin') return;
    loadData();
  }, [role]);

  const loadData = async () => {
    const [{ data: pendingResults }, { data: logs }, { data: clubData }, { data: newsData }, { data: seasonData }, { data: teamData }, { data: fixtureData }] = await Promise.all([
      supabase.from('results').select(`*, fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)))`).in('status', ['submitted', 'draft']).order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('news').select('*').order('created_at', { ascending: false }),
      supabase.from('seasons').select('*').eq('is_current', true).maybeSingle(),
      supabase.from('teams').select('*, clubs(*)').order('clubs(name)'),
      supabase.from('fixtures').select(`*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*))`).order('round_number').order('scheduled_at'),
    ]);
    setPending(pendingResults ?? []);
    setAuditLogs(logs ?? []);
    setClubs(clubData ?? []);
    setNewsList(newsData ?? []);
    setCurrentSeason(seasonData);
    setTeams(teamData ?? []);
    setFixtures(fixtureData ?? []);
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
    if (!currentSeason) { toast.error('No current season found'); return; }

    const payload: any = {
      home_team_id: fixtureForm.home_team_id,
      away_team_id: fixtureForm.away_team_id,
      round_number: parseInt(fixtureForm.round_number),
      season_id: currentSeason.id,
      venue: fixtureForm.venue.trim() || null,
      scheduled_at: fixtureForm.scheduled_at || null,
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
    // Delete associated results first
    await supabase.from('results').delete().eq('fixture_id', id);
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

    // Expect: round,home,away,venue,date
    if (!header.includes('round') || !header.includes('home') || !header.includes('away')) {
      toast.error('CSV must have columns: round, home, away, venue (optional), date (optional)');
      setUploadingCsv(false); return;
    }

    // Build team lookup by short_name
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

      if (!round || isNaN(round)) { errors.push(`Row ${i + 1}: invalid round`); continue; }
      if (!homeId) { errors.push(`Row ${i + 1}: unknown home team "${cols[1]}"`); continue; }
      if (!awayId) { errors.push(`Row ${i + 1}: unknown away team "${cols[2]}"`); continue; }

      rows.push({
        round_number: round,
        home_team_id: homeId,
        away_team_id: awayId,
        venue,
        scheduled_at: date || null,
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

  if (loading) return <Layout><div className="page-container py-8 text-muted-foreground">Loading...</div></Layout>;

  // Group fixtures by round
  const fixturesByRound: Record<number, any[]> = {};
  fixtures.forEach((f: any) => {
    if (!fixturesByRound[f.round_number]) fixturesByRound[f.round_number] = [];
    fixturesByRound[f.round_number].push(f);
  });

  // Filter teams for current season
  const seasonTeams = currentSeason ? teams.filter((t: any) => t.season_id === currentSeason.id) : teams;

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
              <TabsTrigger value="clubs" className="rounded-full text-[10px] font-bold px-3"><Users className="h-3 w-3 mr-1" />Teams</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-full text-[10px] font-bold px-3"><Clock className="h-3 w-3 mr-1" />Pending</TabsTrigger>
              <TabsTrigger value="news" className="rounded-full text-[10px] font-bold px-3"><Newspaper className="h-3 w-3 mr-1" />News</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-full text-[10px] font-bold px-3"><FileText className="h-3 w-3 mr-1" />Audit</TabsTrigger>
            </TabsList>
          </div>

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
              <strong>CSV format:</strong> round, home, away, venue, date<br />
              Use team short names. Example: <code className="bg-muted px-1 rounded">1,Bears,Hawks,Bayside Oval,2026-04-18T14:00</code>
            </div>

            {showFixtureForm && (
              <div className="match-card p-4 space-y-3">
                <h3 className="font-black text-sm">New Fixture</h3>
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="col-span-2">
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

            {/* Fixture list */}
            {Object.keys(fixturesByRound).length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No fixtures yet.</div>
            ) : (
              Object.entries(fixturesByRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
                <div key={round}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Round {round}</h3>
                  <div className="space-y-1.5">
                    {matches.map((f: any) => (
                      <div key={f.id} className="match-card p-3 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <ClubLogo club={f.home_team?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                          <span className="text-xs font-bold truncate">{f.home_team?.clubs?.short_name}</span>
                        </div>
                        <div className="text-center shrink-0 px-1">
                          <Badge variant="outline" className="text-[9px] rounded-full capitalize">{f.status}</Badge>
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
              ))
            )}
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
            <div className="space-y-2">
              {clubs.map((c: any) => (
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
                    <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.primary_color }} />
                    <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.secondary_color }} />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleEditClub(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive" onClick={() => handleDeleteClub(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
              {clubs.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No teams yet.</div>}
            </div>
          </TabsContent>

          {/* ── Pending Tab ── */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {(() => {
              // Group submissions by fixture_id
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
                    {/* Match header */}
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

                    {/* Submissions */}
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

          {/* ── Audit Tab ── */}
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
