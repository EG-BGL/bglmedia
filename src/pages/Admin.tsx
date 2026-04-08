import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Clock, Shield, FileText, Users, Newspaper, Plus, Pencil, Trash2, Upload, Image } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface ClubForm {
  id?: string;
  name: string;
  short_name: string;
  primary_color: string;
  secondary_color: string;
  home_ground: string;
  coach: string;
  description: string;
  founded_year: string;
  logo_url: string;
}

const emptyClub: ClubForm = {
  name: '', short_name: '', primary_color: '#1a365d', secondary_color: '#d69e2e',
  home_ground: '', coach: '', description: '', founded_year: '', logo_url: '',
};

export default function Admin() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsExcerpt, setNewsExcerpt] = useState('');
  const [clubForm, setClubForm] = useState<ClubForm>(emptyClub);
  const [editingClub, setEditingClub] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'league_admin')) navigate('/login');
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (role !== 'league_admin') return;
    loadData();
  }, [role]);

  const loadData = async () => {
    const [{ data: pendingResults }, { data: logs }, { data: clubData }, { data: newsData }] = await Promise.all([
      supabase.from('results').select(`*, fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)))`).in('status', ['submitted', 'draft']).order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('news').select('*').order('created_at', { ascending: false }),
    ]);
    setPending(pendingResults ?? []);
    setAuditLogs(logs ?? []);
    setClubs(clubData ?? []);
    setNewsList(newsData ?? []);
  };

  const handleApprove = async (resultId: string) => {
    const { error } = await supabase.from('results').update({ status: 'approved' as any, approved_by: user!.id, approved_at: new Date().toISOString() }).eq('id', resultId);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'results', record_id: resultId, action: 'approved', performed_by: user!.id });
    toast.success('Result approved!');
    loadData();
  };

  const handleReject = async (resultId: string) => {
    const { error } = await supabase.from('results').update({ status: 'rejected' as any }).eq('id', resultId);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'results', record_id: resultId, action: 'rejected', performed_by: user!.id });
    toast.success('Result rejected.');
    loadData();
  };

  const handlePublishNews = async () => {
    if (!newsTitle.trim() || !newsContent.trim()) { toast.error('Title and content are required'); return; }
    const { error } = await supabase.from('news').insert({ title: newsTitle.trim(), content: newsContent.trim(), excerpt: newsExcerpt.trim() || null, author_id: user!.id, is_published: true, published_at: new Date().toISOString() } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('News published!');
    setNewsTitle(''); setNewsContent(''); setNewsExcerpt(''); setShowNewsForm(false);
    loadData();
  };

  const handleDeleteNews = async (id: string) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('News deleted.');
    loadData();
  };

  // Club CRUD
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('club-logos').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('club-logos').getPublicUrl(path);
    setClubForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast.success('Logo uploaded!');
  };

  const handleSaveClub = async () => {
    if (!clubForm.name.trim() || !clubForm.short_name.trim()) { toast.error('Name and short name are required'); return; }

    const payload: any = {
      name: clubForm.name.trim(),
      short_name: clubForm.short_name.trim(),
      primary_color: clubForm.primary_color,
      secondary_color: clubForm.secondary_color,
      home_ground: clubForm.home_ground.trim() || null,
      coach: clubForm.coach.trim() || null,
      description: clubForm.description.trim() || null,
      founded_year: clubForm.founded_year ? parseInt(clubForm.founded_year) : null,
      logo_url: clubForm.logo_url || null,
    };

    if (clubForm.id) {
      const { error } = await supabase.from('clubs').update(payload).eq('id', clubForm.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from('audit_logs').insert({ table_name: 'clubs', record_id: clubForm.id, action: 'updated', performed_by: user!.id, new_data: payload });
      toast.success('Club updated!');
    } else {
      const { data, error } = await supabase.from('clubs').insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      await supabase.from('audit_logs').insert({ table_name: 'clubs', record_id: data.id, action: 'created', performed_by: user!.id, new_data: payload });
      toast.success('Club created!');
    }
    setClubForm(emptyClub);
    setEditingClub(false);
    loadData();
  };

  const handleEditClub = (club: any) => {
    setClubForm({
      id: club.id,
      name: club.name ?? '',
      short_name: club.short_name ?? '',
      primary_color: club.primary_color ?? '#1a365d',
      secondary_color: club.secondary_color ?? '#d69e2e',
      home_ground: club.home_ground ?? '',
      coach: club.coach ?? '',
      description: club.description ?? '',
      founded_year: club.founded_year?.toString() ?? '',
      logo_url: club.logo_url ?? '',
    });
    setEditingClub(true);
  };

  const handleDeleteClub = async (id: string) => {
    if (!confirm('Delete this club? This cannot be undone.')) return;
    const { error } = await supabase.from('clubs').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ table_name: 'clubs', record_id: id, action: 'deleted', performed_by: user!.id });
    toast.success('Club deleted.');
    loadData();
  };

  if (loading) return <Layout><div className="page-container py-8 text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight">League Admin</h1>
        </div>

        <Tabs defaultValue="clubs">
          <TabsList className="w-full grid grid-cols-4 h-9 bg-muted/60 rounded-full p-0.5">
            <TabsTrigger value="clubs" className="rounded-full text-[10px] font-bold">Teams</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full text-[10px] font-bold">Pending</TabsTrigger>
            <TabsTrigger value="news" className="rounded-full text-[10px] font-bold">News</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-full text-[10px] font-bold">Audit</TabsTrigger>
          </TabsList>

          {/* ── Teams Tab ── */}
          <TabsContent value="clubs" className="space-y-4 mt-4">
            {!editingClub ? (
              <Button onClick={() => { setClubForm(emptyClub); setEditingClub(true); }} className="rounded-full gap-1.5 font-bold">
                <Plus className="h-4 w-4" /> Add Team
              </Button>
            ) : (
              <div className="match-card p-4 space-y-4">
                <h3 className="font-black text-sm">{clubForm.id ? 'Edit Team' : 'New Team'}</h3>

                {/* Logo upload */}
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
                  <Button onClick={handleSaveClub} className="rounded-full font-bold gap-1.5">
                    <Check className="h-4 w-4" /> {clubForm.id ? 'Update' : 'Create'} Team
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => { setEditingClub(false); setClubForm(emptyClub); }}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Club list */}
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleEditClub(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive" onClick={() => handleDeleteClub(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {clubs.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No teams yet. Add your first team above.</div>
              )}
            </div>
          </TabsContent>

          {/* ── Pending Tab ── */}
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pending.length === 0 ? (
              <div className="match-card p-8 text-center text-sm text-muted-foreground">No pending submissions.</div>
            ) : pending.map((r: any) => (
              <div key={r.id} className="match-card p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={r.status === 'submitted' ? 'secondary' : 'outline'} className="text-[10px] rounded-full">{r.status}</Badge>
                      <span className="font-bold text-sm">{r.fixtures?.home_team?.clubs?.short_name} vs {r.fixtures?.away_team?.clubs?.short_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rd {r.fixtures?.round_number} • {r.home_goals}.{r.home_behinds}.{r.home_score} to {r.away_goals}.{r.away_behinds}.{r.away_score}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(r.id)} className="rounded-full gap-1 text-xs font-bold"><Check className="h-3 w-3" />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)} className="rounded-full gap-1 text-xs font-bold"><X className="h-3 w-3" />Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── News Tab ── */}
          <TabsContent value="news" className="space-y-3 mt-4">
            {!showNewsForm ? (
              <Button onClick={() => setShowNewsForm(true)} className="rounded-full gap-1.5 font-bold"><Plus className="h-4 w-4" />New Article</Button>
            ) : (
              <div className="match-card p-4 space-y-3">
                <Input placeholder="Title" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
                <Input placeholder="Short excerpt (optional)" value={newsExcerpt} onChange={e => setNewsExcerpt(e.target.value)} />
                <Textarea placeholder="Full content..." value={newsContent} onChange={e => setNewsContent(e.target.value)} rows={5} />
                <div className="flex gap-2">
                  <Button onClick={handlePublishNews} className="rounded-full font-bold">Publish</Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setShowNewsForm(false)}>Cancel</Button>
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
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-destructive shrink-0" onClick={() => handleDeleteNews(n.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
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
