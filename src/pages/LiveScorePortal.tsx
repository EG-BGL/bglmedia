import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ClubLogo from '@/components/ClubLogo';
import { Radio, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScorableFixture {
  id: string;
  scheduled_at: string | null;
  round_number: number;
  match_format: string | null;
  status: string | null;
  home_team: any;
  away_team: any;
  live: { match_status: string } | null;
}

export default function LiveScorePortal() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<ScorableFixture[]>([]);
  const [canScore, setCanScore] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Determine eligibility: league_admin, scorer role, or assigned to any fixture
      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id);
      const roleSet = new Set((roles ?? []).map((r: any) => r.role));
      const { data: assignments } = await supabase
        .from('fixture_scorers').select('fixture_id').eq('user_id', user.id);
      const eligible = roleSet.has('league_admin') || roleSet.has('scorer') || (assignments ?? []).length > 0;
      setCanScore(eligible);

      // Load AFL fixtures: upcoming today/future + currently live
      const today = new Date(); today.setHours(0,0,0,0);
      const { data: fx } = await supabase
        .from('fixtures')
        .select(`
          id, scheduled_at, round_number, match_format, status,
          home_team:teams!fixtures_home_team_id_fkey(id, clubs(id, name, short_name, logo_url, primary_color, secondary_color)),
          away_team:teams!fixtures_away_team_id_fkey(id, clubs(id, name, short_name, logo_url, primary_color, secondary_color))
        `)
        .or('match_format.is.null,match_format.eq.AFL')
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_at', { ascending: true })
        .limit(50);

      const ids = (fx ?? []).map((f: any) => f.id);
      const { data: live } = await supabase
        .from('live_match_state').select('fixture_id, match_status').in('fixture_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      const liveMap = new Map((live ?? []).map((l: any) => [l.fixture_id, l]));

      // Filter to fixtures user can score
      const filtered = (fx ?? []).filter((f: any) =>
        roleSet.has('league_admin') || roleSet.has('scorer') ||
        (assignments ?? []).some((a: any) => a.fixture_id === f.id)
      );

      setFixtures(filtered.map((f: any) => ({ ...f, live: liveMap.get(f.id) ?? null })));
    })();
  }, [user]);

  if (loading) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Radio className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Live Scoring</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Score AFL matches in real time</p>
          </div>
        </div>

        {!canScore ? (
          <div className="match-card p-6 text-center space-y-2">
            <p className="text-sm font-bold">You don't have live scoring access</p>
            <p className="text-xs text-muted-foreground">Ask a league admin to grant you the Scorer role or assign you to a fixture.</p>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="match-card p-6 text-center text-sm text-muted-foreground">No AFL fixtures available to score right now.</div>
        ) : (
          <div className="space-y-2">
            {fixtures.map((f) => {
              const homeClub = (f.home_team as any)?.clubs;
              const awayClub = (f.away_team as any)?.clubs;
              const isLive = f.live?.match_status === 'live';
              const date = f.scheduled_at ? new Date(f.scheduled_at) : null;
              return (
                <Link key={f.id} to={`/portal/score/${f.id}`} className="match-card p-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <ClubLogo club={homeClub ?? {}} size="sm" />
                    <span className="text-xs font-bold truncate">{homeClub?.short_name}</span>
                    <span className="text-muted-foreground text-[10px] mx-1">v</span>
                    <ClubLogo club={awayClub ?? {}} size="sm" />
                    <span className="text-xs font-bold truncate">{awayClub?.short_name}</span>
                  </div>
                  <div className="text-right">
                    {isLive ? (
                      <Badge className="bg-destructive text-destructive-foreground rounded-full text-[9px] font-black px-2 py-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 animate-pulse inline-block" />LIVE
                      </Badge>
                    ) : (
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        Rd {f.round_number}{date ? ` • ${date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` : ''}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
