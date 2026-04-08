import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Clock, Shield, FileText, Users } from 'lucide-react';

export default function Admin() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || role !== 'league_admin')) navigate('/login');
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (role !== 'league_admin') return;
    loadData();
  }, [role]);

  const loadData = async () => {
    const { data: pendingResults } = await supabase.from('results').select(`
      *,
      fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)))
    `).in('status', ['submitted', 'draft']).order('created_at', { ascending: false });
    setPending(pendingResults ?? []);

    const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setAuditLogs(logs ?? []);

    const { data: clubData } = await supabase.from('clubs').select('*').order('name');
    setClubs(clubData ?? []);
  };

  const handleApprove = async (resultId: string) => {
    const { error } = await supabase.from('results').update({
      status: 'approved' as any,
      approved_by: user!.id,
      approved_at: new Date().toISOString()
    }).eq('id', resultId);
    if (error) { toast.error(error.message); return; }

    await supabase.from('audit_logs').insert({
      table_name: 'results',
      record_id: resultId,
      action: 'approved',
      performed_by: user!.id,
    });
    toast.success('Result approved!');
    loadData();
  };

  const handleReject = async (resultId: string) => {
    const { error } = await supabase.from('results').update({ status: 'rejected' as any }).eq('id', resultId);
    if (error) { toast.error(error.message); return; }

    await supabase.from('audit_logs').insert({
      table_name: 'results',
      record_id: resultId,
      action: 'rejected',
      performed_by: user!.id,
    });
    toast.success('Result rejected.');
    loadData();
  };

  if (loading) return <Layout><div className="container mx-auto px-4 py-8 text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-black text-primary-foreground">League Admin</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-4 w-4" />Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="clubs" className="gap-1">
              <Users className="h-4 w-4" />Clubs
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1">
              <FileText className="h-4 w-4" />Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No pending submissions.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {pending.map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={r.status === 'submitted' ? 'secondary' : 'outline'}>{r.status}</Badge>
                            <span className="font-semibold text-sm">
                              {r.fixtures?.home_team?.clubs?.short_name} vs {r.fixtures?.away_team?.clubs?.short_name}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Round {r.fixtures?.round_number} • Score: {r.home_goals}.{r.home_behinds}.{r.home_score} to {r.away_goals}.{r.away_behinds}.{r.away_score}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(r.id)} className="gap-1">
                            <Check className="h-3 w-3" />Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)} className="gap-1">
                            <X className="h-3 w-3" />Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clubs">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: c.primary_color, color: c.secondary_color }}>
                      {c.short_name?.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.home_ground}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit">
            {auditLogs.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No audit logs yet.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-semibold">Time</th>
                          <th className="text-left py-2 px-3 font-semibold">Table</th>
                          <th className="text-left py-2 px-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log: any) => (
                          <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 px-3 text-muted-foreground">{new Date(log.created_at).toLocaleString('en-AU')}</td>
                            <td className="py-2 px-3">{log.table_name}</td>
                            <td className="py-2 px-3"><Badge variant="outline">{log.action}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
