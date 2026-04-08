import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Shield, Users } from 'lucide-react';

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
    
    supabase.from('coaches_to_teams').select(`
      *,
      teams(*, clubs(*), seasons(*))
    `).eq('user_id', user.id).then(({ data }) => setAssignments(data ?? []));

    // Load coach's submissions
    supabase.from('results').select(`
      *,
      fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)))
    `).eq('submitted_by', user.id).order('created_at', { ascending: false }).then(({ data }) => setSubmissions(data ?? []));
  }, [user]);

  if (loading) return <Layout><div className="container mx-auto px-4 py-8 text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-black text-primary-foreground">
            {role === 'league_admin' ? 'Admin' : 'Coach'} Dashboard
          </h1>
          <p className="text-primary-foreground/70 mt-1">Welcome back, {user?.email}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          {role === 'league_admin' && (
            <Link to="/admin">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-accent/30">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold">Admin Panel</div>
                    <div className="text-xs text-muted-foreground">Manage competitions</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          <Link to="/portal/submit">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Submit Result</div>
                  <div className="text-xs text-muted-foreground">Enter match scores</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* My Teams */}
        {assignments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="h-5 w-5" />My Teams</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {assignments.map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: a.teams?.clubs?.primary_color, color: a.teams?.clubs?.secondary_color }}>
                      {a.teams?.clubs?.short_name?.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{a.teams?.clubs?.name}</div>
                      <div className="text-xs text-muted-foreground">{a.teams?.division} • {a.teams?.seasons?.name}</div>
                    </div>
                    {a.is_primary && <Badge className="ml-auto" variant="secondary">Primary</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Submissions */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ClipboardList className="h-5 w-5" />My Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          {s.fixtures?.home_team?.clubs?.short_name} vs {s.fixtures?.away_team?.clubs?.short_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Round {s.fixtures?.round_number} • {s.home_goals}.{s.home_behinds}.{s.home_score} to {s.away_goals}.{s.away_behinds}.{s.away_score}
                        </div>
                      </div>
                      <Badge variant={
                        s.status === 'approved' ? 'default' :
                        s.status === 'rejected' ? 'destructive' :
                        s.status === 'submitted' ? 'secondary' : 'outline'
                      }>
                        {s.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
