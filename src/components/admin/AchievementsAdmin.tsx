import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, Search } from 'lucide-react';
import { BADGE_CATALOG, getBadge, TONE_CLASSES } from '@/lib/badges';

export default function AchievementsAdmin({ user }: { user: any }) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_id: '', badge_type: '', season_id: '', sport_id: '', notes: '' });

  const load = async () => {
    const [a, p, s, sp] = await Promise.all([
      supabase.from('coach_achievements').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, first_name, last_name'),
      supabase.from('seasons').select('id, name, year, competitions(name, sports(slug, name))').order('year', { ascending: false }),
      supabase.from('sports').select('id, name, slug'),
    ]);
    setAchievements(a.data ?? []);
    setProfiles(p.data ?? []);
    setSeasons(s.data ?? []);
    setSports(sp.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const profileName = (id: string) => {
    const p = profiles.find(x => x.id === id);
    return p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Unknown';
  };
  const seasonLabel = (id: string) => {
    const s = seasons.find(x => x.id === id);
    return s ? `${s.competitions?.name ?? ''} ${s.name}` : '';
  };
  const sportName = (id: string) => sports.find(x => x.id === id)?.name ?? '';

  const handleAward = async () => {
    if (!form.user_id || !form.badge_type) { toast.error('Coach and badge required'); return; }
    const { error } = await supabase.from('coach_achievements').insert({
      user_id: form.user_id,
      badge_type: form.badge_type,
      season_id: form.season_id || null,
      sport_id: form.sport_id || null,
      notes: form.notes || null,
      awarded_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Badge awarded');
    setForm({ user_id: '', badge_type: '', season_id: '', sport_id: '', notes: '' });
    setShowForm(false);
    load();
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this badge?')) return;
    const { error } = await supabase.from('coach_achievements').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Badge removed');
    load();
  };

  const filtered = achievements.filter(a =>
    !search || profileName(a.user_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search coach..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-full h-9 gap-1.5 font-bold">
          <Plus className="h-3.5 w-3.5" />Award Badge
        </Button>
      </div>

      {showForm && (
        <div className="match-card p-4 space-y-3">
          <h3 className="font-black text-sm flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-500" />Award a Badge</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Coach</Label>
              <Select value={form.user_id} onValueChange={v => setForm({ ...form, user_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select coach" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold">Badge</Label>
              <Select value={form.badge_type} onValueChange={v => setForm({ ...form, badge_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select badge" /></SelectTrigger>
                <SelectContent>
                  {BADGE_CATALOG.map(b => (
                    <SelectItem key={b.type} value={b.type}>{b.icon} {b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold">Sport</Label>
              <Select value={form.sport_id} onValueChange={v => setForm({ ...form, sport_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold">Season</Label>
              <Select value={form.season_id} onValueChange={v => setForm({ ...form, season_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select season" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {seasons
                    .filter(s => !form.sport_id || s.competitions?.sports?.id === form.sport_id || sports.find(sp => sp.id === form.sport_id)?.slug === s.competitions?.sports?.slug)
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.competitions?.name} • {s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">Notes (optional)</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Coached Rebellion to GF win" className="mt-1" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAward} className="rounded-full font-bold">Award</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">Cancel</Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="match-card p-8 text-center text-sm text-muted-foreground">No badges awarded yet.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(a => {
            const b = getBadge(a.badge_type);
            return (
              <div key={a.id} className="match-card p-3 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-lg ${TONE_CLASSES[b.tone]}`}>{b.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{profileName(a.user_id)}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {b.label}
                    {a.sport_id && ` • ${sportName(a.sport_id)}`}
                    {a.season_id && ` • ${seasonLabel(a.season_id)}`}
                  </div>
                  {a.notes && <div className="text-[10px] text-muted-foreground italic truncate">{a.notes}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(a.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
