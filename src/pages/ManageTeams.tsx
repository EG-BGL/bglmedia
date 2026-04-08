import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Plus, Pencil, Upload, Image, Check, X } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface TeamForm {
  id?: string;
  name: string;
  short_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  home_ground: string;
  coach: string;
  contact_email: string;
  division: string;
  is_active: boolean;
}

const emptyForm: TeamForm = {
  name: '', short_name: '', logo_url: '', primary_color: '#1a365d',
  secondary_color: '#d69e2e', home_ground: '', coach: '', contact_email: '',
  division: '', is_active: true,
};

export default function ManageTeams() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<any[]>([]);
  const [form, setForm] = useState<TeamForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'league_admin')) navigate('/login');
  }, [user, role, loading, navigate]);

  useEffect(() => { if (role === 'league_admin') loadTeams(); }, [role]);

  const loadTeams = async () => {
    const { data } = await supabase.from('clubs').select('*').order('name');
    setClubs(data ?? []);
  };

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
    setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast.success('Logo uploaded!');
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.short_name.trim()) {
      toast.error('Team name and short name are required');
      return;
    }
    const payload: any = {
      name: form.name.trim(),
      short_name: form.short_name.trim(),
      logo_url: form.logo_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      home_ground: form.home_ground.trim() || null,
      coach: form.coach.trim() || null,
      contact_email: form.contact_email.trim() || null,
      is_active: form.is_active,
    };

    if (form.id) {
      const { error } = await supabase.from('clubs').update(payload).eq('id', form.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Team updated!');
    } else {
      const { error } = await supabase.from('clubs').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Team created!');
    }
    setForm(emptyForm);
    setEditing(false);
    loadTeams();
  };

  const handleEdit = (club: any) => {
    setForm({
      id: club.id, name: club.name ?? '', short_name: club.short_name ?? '',
      logo_url: club.logo_url ?? '', primary_color: club.primary_color ?? '#1a365d',
      secondary_color: club.secondary_color ?? '#d69e2e', home_ground: club.home_ground ?? '',
      coach: club.coach ?? '', contact_email: club.contact_email ?? '',
      division: club.division ?? '', is_active: club.is_active ?? true,
    });
    setEditing(true);
  };

  const handleToggleActive = async (club: any) => {
    const newActive = !club.is_active;
    const { error } = await supabase.from('clubs').update({ is_active: newActive }).eq('id', club.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newActive ? 'Team activated' : 'Team deactivated');
    loadTeams();
  };

  if (loading) return <Layout><div className="page-container py-8 text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-container py-5 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight">Manage Teams</h1>
        </div>

        {/* Add / Edit Form */}
        {!editing ? (
          <Button onClick={() => { setForm(emptyForm); setEditing(true); }} className="rounded-full gap-1.5 font-bold text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Team
          </Button>
        ) : (
          <div className="match-card p-4 space-y-4">
            <h3 className="font-black text-sm">{form.id ? 'Edit Team' : 'New Team'}</h3>

            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-contain bg-muted border border-border" />
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

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold">Team Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bayside Bears" className="mt-1" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold">Short Name *</Label>
                <Input value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))} placeholder="Bears" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Primary Colour</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="h-9 w-9 rounded-lg border border-border cursor-pointer" />
                  <Input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Secondary Colour</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={form.secondary_color} onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="h-9 w-9 rounded-lg border border-border cursor-pointer" />
                  <Input value={form.secondary_color} onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold">Home Ground</Label>
                <Input value={form.home_ground} onChange={e => setForm(f => ({ ...f, home_ground: e.target.value }))} placeholder="Bayside Oval" className="mt-1" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold">Coach</Label>
                <Input value={form.coach} onChange={e => setForm(f => ({ ...f, coach: e.target.value }))} placeholder="John Smith" className="mt-1" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold">Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="info@bears.com" className="mt-1" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold">Division</Label>
                <Input value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} placeholder="Senior" className="mt-1" />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-xs font-bold">Active</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="rounded-full font-bold gap-1.5 text-xs">
                <Check className="h-3.5 w-3.5" />{form.id ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" className="rounded-full text-xs" onClick={() => { setEditing(false); setForm(emptyForm); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Team List */}
        <div className="space-y-2">
          {clubs.map((c: any) => (
            <div key={c.id} className={`match-card p-3.5 flex items-center gap-3 ${!c.is_active ? 'opacity-50' : ''}`}>
              <ClubLogo club={c} size="md" className="!h-11 !w-11" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">{c.name}</span>
                  {!c.is_active && <Badge variant="outline" className="text-[9px] rounded-full">Inactive</Badge>}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  {c.short_name && <span>{c.short_name}</span>}
                  {c.home_ground && <span>• {c.home_ground}</span>}
                  {c.coach && <span>• {c.coach}</span>}
                  {c.contact_email && <span>• {c.contact_email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.primary_color }} />
                <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.secondary_color }} />
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-full ${c.is_active ? 'text-destructive' : 'text-primary'}`} onClick={() => handleToggleActive(c)}>
                  {c.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
          {clubs.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No teams yet.</div>}
        </div>
      </div>
    </Layout>
  );
}
