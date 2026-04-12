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
import {
  ChevronLeft, User, Mail, Shield, LogOut, Save, TrendingUp, ChevronRight,
  Pencil, Camera, Trophy, ClipboardList, CircleDot, Flame, Target, Swords, Zap,
} from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

// Hardcoded multi-sport showcase coach data
type SportKey = 'afl' | 'cricket';

interface SportProfile {
  sport: SportKey;
  icon: string;
  label: string;
  team: string;
  premierships: number;
  premLabel: string;
  winRate: number;
  games: number;
  dynasty: boolean;
  finalsWin: number;
  gfRecord: string;
  closeGames: number;
  avgFor: number;
  avgForLabel: string;
  style: string;
  defence: number;
  adaptability: string;
  efficiency: number;
  form: string[];
  streak: string;
  teamsCoached: { name: string; division: string; seasons: string }[];
  seasons: { year: number; premier?: boolean }[];
  achievements: { icon: string; label: string }[];
  history: { season: number; result: string }[];
}

const coachName = "Kyle Ettridge";
const coachAvatar = "https://via.placeholder.com/100";

const sportProfiles: Record<SportKey, SportProfile> = {
  afl: {
    sport: 'afl',
    icon: '🏈',
    label: 'AFL',
    team: "Rebellion",
    premierships: 3,
    premLabel: 'Flags',
    winRate: 68,
    games: 120,
    dynasty: true,
    finalsWin: 65,
    gfRecord: "3-1",
    closeGames: 70,
    avgFor: 85,
    avgForLabel: 'Avg Score',
    style: "Attacking",
    defence: 7,
    adaptability: "High",
    efficiency: 64,
    form: ["W", "W", "L", "W", "W"],
    streak: "3 Wins",
    seasons: [
      { year: 1 }, { year: 2 }, { year: 3, premier: true },
      { year: 4 }, { year: 5, premier: true }, { year: 6, premier: true },
    ],
    achievements: [
      { icon: "🏆", label: "3x Premiership" },
      { icon: "🔥", label: "Dynasty Coach" },
      { icon: "🔁", label: "Back-to-Back" },
    ],
    teamsCoached: [
      { name: "Rebellion", division: "Senior", seasons: "S1–S6" },
      { name: "Rebellion Reserves", division: "Reserves", seasons: "S2–S4" },
    ],
    history: [
      { season: 3, result: "🏆 Premiers" },
      { season: 4, result: "Prelim Final" },
      { season: 5, result: "🏆 Premiers" },
    ],
  },
  cricket: {
    sport: 'cricket',
    icon: '🏏',
    label: 'Cricket',
    team: "Rebellion CC",
    premierships: 1,
    premLabel: 'Titles',
    winRate: 58,
    games: 42,
    dynasty: false,
    finalsWin: 50,
    gfRecord: "1-2",
    closeGames: 55,
    avgFor: 165,
    avgForLabel: 'Avg Runs',
    style: "Balanced",
    defence: 6,
    adaptability: "Medium",
    efficiency: 52,
    form: ["W", "L", "W", "W", "L"],
    streak: "1 Loss",
    seasons: [
      { year: 3 }, { year: 4, premier: true }, { year: 5 }, { year: 6 },
    ],
    achievements: [
      { icon: "🏆", label: "1x Premiership" },
      { icon: "💯", label: "300+ Team Score" },
      { icon: "🎯", label: "Best NRR" },
    ],
    teamsCoached: [
      { name: "Rebellion CC", division: "A Grade", seasons: "S3–S6" },
    ],
    history: [
      { season: 3, result: "Semi Final" },
      { season: 4, result: "🏆 Premiers" },
      { season: 5, result: "Prelim Final" },
    ],
  },
};

interface SeasonStats {
  seasonName: string;
  compName: string;
  sportSlug: string;
  year: number;
  isCurrent: boolean;
  teams: any[];
  ladderEntries: any[];
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  competitionPoints: number;
  bestFinish: number | null;
  winRate: string;
}

export default function Profile() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [seasonStats, setSeasonStats] = useState<SeasonStats[]>([]);
  const [allTimeStats, setAllTimeStats] = useState({ totalSeasons: 0, totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: '0' });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeSport, setActiveSport] = useState<SportKey>('afl');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sp = sportProfiles[activeSport];

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
    loadCoachData();
  }, [user]);

  async function loadCoachData() {
    if (!user) return;
    setLoadingData(true);

    const { data: assignData } = await supabase.from('coaches_to_teams')
      .select('*, teams(*, clubs(*), seasons(*, competitions(*, sports(*))))')
      .eq('user_id', user.id);

    const assigns = assignData ?? [];
    const teamIds = assigns.map(a => a.team_id).filter(Boolean);
    const seasonIds = [...new Set(assigns.map(a => a.season_id).filter(Boolean))];

    let ladderData: any[] = [];
    if (teamIds.length > 0) {
      const { data } = await supabase.from('ladder_entries').select('*, teams(*, clubs(*))').in('team_id', teamIds);
      ladderData = data ?? [];
    }

    let allSeasonLadders: any[] = [];
    if (seasonIds.length > 0) {
      const { data } = await supabase.from('ladder_entries').select('*, teams(*, clubs(*))').in('season_id', seasonIds)
        .order('competition_points', { ascending: false }).order('percentage', { ascending: false });
      allSeasonLadders = data ?? [];
    }

    const seasonMap: Record<string, SeasonStats> = {};
    assigns.forEach((a: any) => {
      const season = a.teams?.seasons;
      const comp = season?.competitions;
      const sport = comp?.sports;
      const key = season?.id;
      if (!key) return;
      if (!seasonMap[key]) {
        seasonMap[key] = {
          seasonName: season?.name ?? '', compName: comp?.name ?? '', sportSlug: sport?.slug ?? 'afl',
          year: season?.year ?? 0, isCurrent: season?.is_current ?? false, teams: [], ladderEntries: [],
          played: 0, wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, competitionPoints: 0,
          bestFinish: null, winRate: '0',
        };
      }
      seasonMap[key].teams.push(a);
    });

    Object.entries(seasonMap).forEach(([seasonId, ss]) => {
      const coachTeamIds = ss.teams.map((t: any) => t.team_id);
      const coachLadder = ladderData.filter(le => coachTeamIds.includes(le.team_id) && le.season_id === seasonId);
      ss.ladderEntries = coachLadder;
      coachLadder.forEach((le: any) => {
        ss.played += le.played ?? 0; ss.wins += le.wins ?? 0; ss.losses += le.losses ?? 0;
        ss.draws += le.draws ?? 0; ss.pointsFor += le.points_for ?? 0; ss.pointsAgainst += le.points_against ?? 0;
        ss.competitionPoints += le.competition_points ?? 0;
      });
      ss.winRate = ss.played > 0 ? ((ss.wins / ss.played) * 100).toFixed(0) : '0';
      const seasonLadder = allSeasonLadders.filter(le => le.season_id === seasonId);
      let bestPos: number | null = null;
      coachTeamIds.forEach((tid: string) => {
        const pos = seasonLadder.findIndex(le => le.team_id === tid);
        if (pos !== -1) { const position = pos + 1; if (bestPos === null || position < bestPos) bestPos = position; }
      });
      ss.bestFinish = bestPos;
    });

    const sortedSeasons = Object.values(seasonMap).sort((a, b) => b.year - a.year || (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
    setSeasonStats(sortedSeasons);

    const totals = sortedSeasons.reduce((acc, s) => ({
      totalSeasons: acc.totalSeasons + 1, totalMatches: acc.totalMatches + s.played,
      wins: acc.wins + s.wins, losses: acc.losses + s.losses, draws: acc.draws + s.draws,
    }), { totalSeasons: 0, totalMatches: 0, wins: 0, losses: 0, draws: 0 });

    setAllTimeStats({ ...totals, winRate: totals.totalMatches > 0 ? ((totals.wins / totals.totalMatches) * 100).toFixed(0) : '0' });

    const { data: resultsData } = await supabase.from('results').select(`
      *, fixtures(*, home_team:teams!fixtures_home_team_id_fkey(*, clubs(*)), away_team:teams!fixtures_away_team_id_fkey(*, clubs(*)),
      seasons:seasons!fixtures_season_id_fkey(*, competitions:competitions!seasons_competition_id_fkey(*, sports:sports!competitions_sport_id_fkey(*))))
    `).eq('submitted_by', user.id).order('created_at', { ascending: false }).limit(5);
    setRecentResults(resultsData ?? []);
    setLoadingData(false);
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const url = `${publicUrl}?t=${Date.now()}`;
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url } as any).eq('id', user.id);
    if (updateError) { toast.error('Failed to save avatar'); } else { setAvatarUrl(url); toast.success('Profile photo updated'); }
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

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  if (loading || loadingData) return <Layout><div className="page-container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  const roleLabel = role === 'league_admin' ? 'League Admin' : role === 'club_admin' ? 'Club Admin' : role === 'coach' ? 'Coach' : 'Member';
  const getOrdinal = (n: number) => { const s = ['th', 'st', 'nd', 'rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  return (
    <Layout hideFooter>
      <div className="page-container py-4 max-w-lg mx-auto space-y-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-xs">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 group">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><Pencil className="h-3.5 w-3.5" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle className="text-base font-black">Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1.5"
                      onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Camera className="h-3.5 w-3.5" />{uploading ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Full Name</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-muted/50 border border-border/60">
                      <Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{user?.email}</span>
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

        {/* ═══ Sport Switcher ═══ */}
        <div className="flex gap-1 p-0.5 rounded-full bg-muted/60 w-fit">
          {(['afl', 'cricket'] as SportKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSport(s)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                activeSport === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {sportProfiles[s].icon} {sportProfiles[s].label}
            </button>
          ))}
        </div>

        {/* ═══ Coach Showcase Card ═══ */}
        <div className="match-card overflow-hidden">
          <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-primary/10 via-transparent to-accent/5">
            <div className="flex items-center gap-3">
              <img src={coachAvatar} alt={coachName} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/20" />
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight truncate">{coachName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold text-muted-foreground">{sp.team}</span>
                  {sp.dynasty && (
                    <Badge className="rounded-full text-[8px] font-black px-1.5 py-0 bg-amber-500/15 text-amber-600 border-amber-500/30">
                      <Flame className="h-2.5 w-2.5 mr-0.5" />Dynasty
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-2xl font-black text-primary tabular-nums">{sp.premierships}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{sp.premLabel}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border border-t border-border/50 px-1 py-2.5">
            <QuickStat value={sp.games} label={activeSport === 'cricket' ? 'Matches' : 'Games'} />
            <QuickStat value={`${sp.winRate}%`} label="Win Rate" className="text-emerald-600" />
            <QuickStat value={sp.gfRecord} label="GF Record" />
            <QuickStat value={`${sp.finalsWin}%`} label="Finals %" />
          </div>
          {/* Teams Coached */}
          {sp.teamsCoached.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border/50 space-y-1.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Teams Coached</div>
              {sp.teamsCoached.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{t.name}</span>
                    <Badge variant="outline" className="rounded text-[8px] px-1.5 py-0">{t.division}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold">{t.seasons}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trophy Timeline */}
        <div className="match-card p-3.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
            {sp.icon} Season Timeline
          </div>
          <div className="flex items-center gap-1">
            {sp.seasons.map((s) => (
              <div key={s.year} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-8 w-full rounded-md flex items-center justify-center text-xs font-black transition-all ${
                  s.premier ? 'bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/40' : 'bg-muted/60 text-muted-foreground'
                }`}>
                  {s.premier ? '🏆' : ''}
                </div>
                <span className="text-[8px] font-bold text-muted-foreground">S{s.year}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="flex gap-1.5">
          {sp.achievements.map((a, i) => (
            <div key={i} className="match-card flex-1 p-2.5 text-center">
              <div className="text-lg">{a.icon}</div>
              <div className="text-[9px] font-bold text-muted-foreground mt-0.5 leading-tight">{a.label}</div>
            </div>
          ))}
        </div>

        {/* Style & Form */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="match-card p-3.5 space-y-2.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Style Profile</div>
            <div className="space-y-2">
              <StyleRow icon={<Swords className="h-3 w-3" />} label="Style" value={sp.style} />
              <StyleRow icon={<Shield className="h-3 w-3" />} label="Defence" value={`${sp.defence}/10`} />
              <StyleRow icon={<Zap className="h-3 w-3" />} label="Adapt." value={sp.adaptability} />
              <StyleRow icon={<Target className="h-3 w-3" />} label="Efficiency" value={`${sp.efficiency}%`} />
            </div>
          </div>
          <div className="match-card p-3.5 space-y-2.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Current Form</div>
            <div className="flex items-center gap-1 justify-center">
              {sp.form.map((f, i) => (
                <span key={i} className={`h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-black ${
                  f === 'W' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
                }`}>{f}</span>
              ))}
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-foreground">{sp.streak}</div>
              <div className="text-[8px] text-muted-foreground font-bold uppercase">Current Streak</div>
            </div>
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <MiniStat label="Close Games" value={`${sp.closeGames}%`} />
              <MiniStat label={sp.avgForLabel} value={`${sp.avgFor}`} />
            </div>
          </div>
        </div>

        {/* Finals History */}
        <div className="match-card p-3.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Finals History</div>
          <div className="space-y-1.5">
            {sp.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-bold text-muted-foreground">Season {h.season}</span>
                <span className={`text-xs font-black ${h.result.includes('🏆') ? 'text-amber-600' : 'text-foreground'}`}>{h.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-1.5">
          <Link to="/portal/submit" className="match-card flex-1 p-3 flex items-center justify-center gap-1.5 text-primary font-bold text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Submit AFL Result
          </Link>
          <Link to="/portal/submit-cricket" className="match-card flex-1 p-3 flex items-center justify-center gap-1.5 text-primary font-bold text-xs">
            <CircleDot className="h-3.5 w-3.5" /> Submit Cricket
          </Link>
        </div>

        {/* DB Season Cards */}
        {seasonStats.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="section-label flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Seasons</h2>
            {seasonStats.map((ss, i) => (
              <SeasonCard key={i} ss={ss} getOrdinal={getOrdinal} />
            ))}
          </section>
        )}

        {/* Recent Submissions */}
        <section className="space-y-2">
          <h2 className="section-label flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Recent Submissions</h2>
          {recentResults.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center match-card">No submissions yet.</p>
          ) : (
            <div className="space-y-1.5">
              {recentResults.map((r: any) => (
                <Link key={r.id} to={`/match/${r.fixture_id}`} className="match-card p-3 flex items-center gap-3 group">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <ClubLogo club={r.fixtures?.home_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                    <span className={`text-xs font-bold truncate ${r.home_score > r.away_score ? '' : 'text-muted-foreground'}`}>
                      {r.fixtures?.home_team?.clubs?.short_name}
                    </span>
                  </div>
                  <span className="text-xs font-black tabular-nums shrink-0">{r.home_score} – {r.away_score}</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={`text-xs font-bold truncate ${r.away_score > r.home_score ? '' : 'text-muted-foreground'}`}>
                      {r.fixtures?.away_team?.clubs?.short_name}
                    </span>
                    <ClubLogo club={r.fixtures?.away_team?.clubs ?? {}} size="sm" className="!h-5 !w-5" />
                  </div>
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}
                    className="rounded-full text-[8px] capitalize shrink-0 px-1.5 py-0">{r.status}</Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

/* ── Sub-components ── */

function QuickStat({ value, label, className = '' }: { value: string | number; label: string; className?: string }) {
  return (
    <div className="text-center px-1">
      <div className={`text-sm font-black tabular-nums ${className}`}>{value}</div>
      <div className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StyleRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground flex-1">{label}</span>
      <span className="text-[10px] font-bold">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-bold">{value}</span>
    </div>
  );
}

function RecordPill({ value, label, variant }: { value: number; label: string; variant: 'win' | 'loss' | 'draw' }) {
  const styles = { win: 'bg-emerald-500/10 text-emerald-600', loss: 'bg-red-500/10 text-red-500', draw: 'bg-amber-500/10 text-amber-600' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[variant]}`}>{value}{label}</span>;
}

function SeasonCard({ ss, getOrdinal }: { ss: SeasonStats; getOrdinal: (n: number) => string }) {
  const getPercentage = () => {
    if (ss.pointsAgainst <= 0) return '–';
    if (ss.sportSlug === 'cricket') return ((ss.pointsFor - ss.pointsAgainst) / Math.max(ss.played, 1)).toFixed(2);
    return ((ss.pointsFor / ss.pointsAgainst) * 100).toFixed(1);
  };
  return (
    <div className="match-card overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-muted/40 border-b border-border/50">
        <Badge variant="outline" className="rounded text-[9px] font-bold px-1.5 py-0 shrink-0">
          {ss.sportSlug === 'cricket' ? '🏏' : '🏈'}
        </Badge>
        <span className="font-bold text-xs truncate">{ss.compName}</span>
        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{ss.seasonName}</span>
        {ss.isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
      </div>
      <div className="p-3.5 space-y-3">
        {ss.teams.map((a: any) => (
          <div key={a.id} className="flex items-center gap-2.5">
            <ClubLogo club={a.teams?.clubs ?? {}} size="sm" className="!h-6 !w-6" />
            <span className="font-semibold text-xs truncate">{a.teams?.clubs?.name}</span>
            <span className="text-[10px] text-muted-foreground">{a.teams?.division}</span>
            {a.is_primary && <Badge variant="secondary" className="text-[8px] rounded-full px-1.5 py-0 ml-auto shrink-0">Primary</Badge>}
          </div>
        ))}
        {ss.played > 0 ? (
          <>
            <div className="flex items-center gap-1.5">
              <RecordPill value={ss.wins} label="W" variant="win" />
              <RecordPill value={ss.losses} label="L" variant="loss" />
              <RecordPill value={ss.draws} label="D" variant="draw" />
              <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{ss.played} played</span>
                <span className="font-bold text-foreground">{ss.winRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
              <span>PF <strong className="text-foreground">{ss.pointsFor}</strong></span>
              <span>PA <strong className="text-foreground">{ss.pointsAgainst}</strong></span>
              <span>{ss.sportSlug === 'cricket' ? 'NRR' : '%'} <strong className="text-foreground">{getPercentage()}</strong></span>
              <span>Pts <strong className="text-foreground">{ss.competitionPoints}</strong></span>
              {ss.bestFinish && (
                <span className="flex items-center gap-0.5">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  <strong className="text-foreground">{getOrdinal(ss.bestFinish)}</strong>
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-muted-foreground text-center py-1">No matches played yet</p>
        )}
      </div>
    </div>
  );
}
