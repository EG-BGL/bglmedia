import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, User, Mail, Shield, LogOut, Save } from 'lucide-react';

export default function Profile() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
      .then(({ data }) => { if (data?.full_name) setFullName(data.full_name); });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    if (error) toast.error('Failed to save');
    else toast.success('Profile updated');
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
      <div className="page-container py-4 max-w-lg mx-auto space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-xs">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Account Settings</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold capitalize">
                <Shield className="h-3 w-3 mr-1" />{roleLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="match-card p-4 space-y-4">
          <h2 className="section-label">Profile Information</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold text-muted-foreground">Full Name</Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-muted/50 border border-border/60">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-full font-bold gap-1.5">
            <Save className="h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Sign Out */}
        <div className="match-card p-4">
          <h2 className="section-label mb-3">Session</h2>
          <Button variant="destructive" onClick={handleSignOut} className="rounded-full font-bold gap-1.5 w-full">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
}