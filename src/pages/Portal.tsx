import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Shield, ChevronRight, CircleDot } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

export default function Portal() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('coaches_to_teams').select('*, teams(*, clubs(*), seasons(*))').eq('user_id', user.id).then(({ data }) => setAssignments(data ?? []));
    supabase.from('results').select('*, fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)))').eq('submitted_by', user.id).order('created_at', { ascending: false }).then(({ data }) => setSubmissions(data ?? []));
  }, [user]);

  if (loading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-container py-5 space-y-5">
        <div>
          <h1 className="text-xl font-black tracking-tight">
            {role === 'league_admin' ? 'Admin' : 'Coach'} Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {(role === 'coach' || role === 'league_admin') && (
            <Link to="/portal/submit" className="match-card p-4 flex flex-col items-center gap-2 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-sm">Submit AFL</span>
            </Link>
          )}
          {(role === 'coach' || role === 'league_admin') && (
            <Link to="/portal/submit-cricket" className="match-card p-4 flex flex-col items-center gap-2 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CircleDot className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-sm">Submit Cricket</span>
            </Link>
          )}
          {role === 'league_admin' && (
            <Link to="/admin" className="match-card p-4 flex flex-col items-center gap-2 text-center">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <span className="font-bold text-sm">Admin Panel</span>
            </Link>
          )}
        </div>

        {/* Teams */}
        {assignments.length > 0 && (
          <div>
            <h2 className="section-label mb-2">My Teams</h2>
            <div className="space-y-2">
              {assignments.map((a: any) => (
                <div key={a.id} className="match-card p-3.5 flex items-center gap-3">
                  <ClubLogo club={a.teams?.clubs ?? {}} size="sm" />
                  <div className="flex-1">
                    <div className="font-bold text-sm">{a.teams?.clubs?.name}</div>
                    <div className="text-[10px] text-muted-foreground">{a.teams?.division} • {a.teams?.seasons?.name}</div>
                  </div>
                  {a.is_primary && <Badge variant="secondary" className="text-[9px] rounded-full">Primary</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submissions */}
        <div>
          <h2 className="section-label mb-2">My Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s: any) => (
                <div key={s.id} className="match-card p-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs">
                      {s.fixtures?.home_team?.clubs?.short_name} vs {s.fixtures?.away_team?.clubs?.short_name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Rd {s.fixtures?.round_number} • {s.home_goals}.{s.home_behinds}.{s.home_score} – {s.away_goals}.{s.away_behinds}.{s.away_score}
                    </div>
                  </div>
                  <Badge
                    variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}
                    className="rounded-full text-[9px] capitalize shrink-0"
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
