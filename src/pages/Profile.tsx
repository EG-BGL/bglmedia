import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChevronLeft, User, Mail, Shield, LogOut, Save, TrendingUp, ChevronRight, Pencil, Camera } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

interface CoachStats {
  totalSeasons: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: string;
  currentTeams: any[];
}

export default function Profile() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [coachStats, setCoachStats] = useState<CoachStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
    loadCoachStats();
  }, [user]);

  async function loadCoachStats() {
    if (!user) return;

    const { data: assigns } = await supabase.from('coaches_to_teams')
      .select('*, teams(*, clubs(*), seasons(*, competitions(*, sports(*))))')
      .eq('user_id', user.id);

    if (!assigns || assigns.length === 0) return;

    const teamIds = assigns.map(a => a.team_id).filter(Boolean);
    const seasonIds = [...new Set(assigns.map(a => a.season_id).filter(Boolean))];

    let ladderData: any[] = [];
    if (teamIds.length > 0) {
      const { data } = await supabase.from('ladder_entries')
        .select('*')
        .in('team_id', teamIds);
      ladderData = data ?? [];
    }

    const totals = ladderData.reduce((acc, le) => ({
      played: acc.played + (le.played ?? 0),
      wins: acc.wins + (le.wins ?? 0),
      losses: acc.losses + (le.losses ?? 0),
      draws: acc.draws + (le.draws ?? 0),
    }), { played: 0, wins: 0, losses: 0, draws: 0 });

    const currentTeams = assigns
      .filter((a: any) => a.teams?.seasons?.is_current)
      .map((a: any) => ({
        id: a.id,
        clubName: a.teams?.clubs?.name,
        club: a.teams?.clubs,
        division: a.teams?.division,
        sport: a.teams?.seasons?.competitions?.sports?.slug,
      }));

    setCoachStats({
      totalSeasons: seasonIds.length,
      totalMatches: totals.played,
      wins: totals.wins,
      losses: totals.losses,
      draws: totals.draws,
      winRate: totals.played > 0 ? ((totals.wins / totals.played) * 100).toFixed(0) : '0',
      currentTeams,
    });
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.from('profiles')
      .update({ avatar_url: url } as any)
      .eq('id', user.id);

    if (updateError) {
      toast.error('Failed to save avatar');
    } else {
      setAvatarUrl(url);
      toast.success('Profile photo updated');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    if (error) toast.error('Failed to save');
    else { toast.success('Profile updated'); setEditOpen(false); }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  const roleLabel = role === 'league_admin' ? 'League Admin' : role === 'club_admin' ? 'Club Admin' : role === 'coach' ? 'Coach' : 'Member';

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-xs">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="flex items-center gap-3">
          {/* Avatar with upload */}
          <div className="relative shrink-0 group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            {uploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight truncate">{fullName || 'Your Profile'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold capitalize">
                <Shield className="h-3 w-3 mr-1" />{roleLabel}
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base font-black">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  {/* Avatar upload in dialog */}
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-bold gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Full Name</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-muted/50 border border-border/60">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user?.email}</span>
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-full font-bold gap-1.5 w-full">
                    <Save className="h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" size="icon" onClick={handleSignOut} className="h-8 w-8 rounded-full">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Coaching Stats Summary */}
        {coachStats && (
          <div className="match-card overflow-hidden">
            <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Coaching Record
              </h2>
              <Link to="/coach-hub" className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                Full Stats <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-3.5">
              <div className="grid grid-cols-5 divide-x divide-border mb-3">
                <StatCell value={coachStats.totalSeasons} label="Seasons" />
                <StatCell value={coachStats.totalMatches} label="Played" />
                <StatCell value={coachStats.wins} label="Wins" className="text-emerald-600" />
                <StatCell value={coachStats.losses} label="Losses" className="text-red-500" />
                <StatCell value={`${coachStats.winRate}%`} label="Win %" className="text-primary" />
              </div>

              {coachStats.currentTeams.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Current Teams</div>
                  {coachStats.currentTeams.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <ClubLogo club={t.club ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="text-xs font-semibold truncate">{t.clubName}</span>
                      <span className="text-[10px] text-muted-foreground">{t.division}</span>
                      <Badge variant="outline" className="ml-auto rounded text-[8px] px-1.5 py-0">
                        {t.sport === 'cricket' ? '🏏' : '🏈'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

function StatCell({ value, label, className = '' }: { value: string | number; label: string; className?: string }) {
  return (
    <div className="text-center px-1">
      <div className={`text-base font-black tabular-nums ${className}`}>{value}</div>
      <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}
