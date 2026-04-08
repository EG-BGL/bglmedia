import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Pencil, Trash2, Users, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClubLogo from '@/components/ClubLogo';

interface PlayerForm {
  id?: string;
  first_name: string;
  last_name: string;
  jersey_number: string;
  position: string;
}

const emptyPlayer: PlayerForm = { first_name: '', last_name: '', jersey_number: '', position: '' };

const POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Ruck', 'Forward Pocket', 'Back Pocket', 'Wing', 'Centre', 'Half Forward', 'Half Back', 'Interchange'];

export default function ManagePlayers() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [playerForm, setPlayerForm] = useState<PlayerForm>(emptyPlayer);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && (!user || role !== 'league_admin')) navigate('/login');
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (role !== 'league_admin') return;
    loadTeams();
  }, [role]);

  useEffect(() => {
    if (selectedTeamId) loadPlayers();
  }, [selectedTeamId]);

  const loadTeams = async () => {
    const { data: seasonData } = await supabase.from('seasons').select('id').eq('is_current', true).maybeSingle();
    let q = supabase.from('teams').select('*, clubs(*)');
    if (seasonData) q = q.eq('season_id', seasonData.id);
    const { data } = await q.order('club_id');
    setTeams(data ?? []);
    if (data && data.length > 0 && !selectedTeamId) {
      setSelectedTeamId(data[0].id);
    }
  };

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', selectedTeamId)
      .order('jersey_number', { ascending: true });
    setPlayers(data ?? []);
  };

  const handleSave = async () => {
    if (!playerForm.first_name.trim() || !playerForm.last_name.trim()) {
      toast.error('First and last name required');
      return;
    }

    const payload: any = {
      first_name: playerForm.first_name.trim(),
      last_name: playerForm.last_name.trim(),
      jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
      position: playerForm.position || null,
      team_id: selectedTeamId,
    };

    if (playerForm.id) {
      const { error } = await supabase.from('players').update(payload).eq('id', playerForm.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Player updated');
    } else {
      const { error } = await supabase.from('players').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Player added');
    }

    setPlayerForm(emptyPlayer);
    setShowForm(false);
    setEditing(false);
    loadPlayers();
  };

  const handleEdit = (p: any) => {
    setPlayerForm({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      jersey_number: p.jersey_number?.toString() ?? '',
      position: p.position ?? '',
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this player?')) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Player deleted');
    loadPlayers();
  };

  const handleCancel = () => {
    setPlayerForm(emptyPlayer);
    setShowForm(false);
    setEditing(false);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const filteredPlayers = players.filter(p => {
    if (!search) return true;
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) return <Layout><div className="page-container py-8 text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight">Manage Players</h1>
        </div>

        {/* Team selector */}
        <div>
          <Label className="text-xs font-bold">Select Team</Label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    <ClubLogo club={t.clubs ?? {}} size="sm" className="!h-4 !w-4" />
                    {t.clubs?.name} {t.division ? `(${t.division})` : ''}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTeamId && (
          <>
            {/* Actions bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              {!showForm && (
                <Button onClick={() => { setShowForm(true); setEditing(false); setPlayerForm(emptyPlayer); }} className="rounded-full gap-1.5 font-bold text-xs shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add Player
                </Button>
              )}
            </div>

            {/* Add/Edit form */}
            {showForm && (
              <div className="match-card p-4 space-y-3">
                <h3 className="font-black text-sm">{editing ? 'Edit Player' : 'New Player'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold">First Name *</Label>
                    <Input className="mt-1 h-9 text-xs" value={playerForm.first_name} onChange={e => setPlayerForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Last Name *</Label>
                    <Input className="mt-1 h-9 text-xs" value={playerForm.last_name} onChange={e => setPlayerForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Jersey #</Label>
                    <Input className="mt-1 h-9 text-xs" type="number" value={playerForm.jersey_number} onChange={e => setPlayerForm(f => ({ ...f, jersey_number: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Position</Label>
                    <Select value={playerForm.position} onValueChange={v => setPlayerForm(f => ({ ...f, position: v }))}>
                      <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSave} className="rounded-full font-bold text-xs">{editing ? 'Update' : 'Add'}</Button>
                  <Button variant="ghost" onClick={handleCancel} className="rounded-full text-xs">Cancel</Button>
                </div>
              </div>
            )}

            {/* Player count */}
            <div className="flex items-center gap-2">
              {selectedTeam && (
                <div className="flex items-center gap-2">
                  <ClubLogo club={selectedTeam.clubs ?? {}} size="sm" className="!h-6 !w-6" />
                  <span className="font-bold text-sm">{selectedTeam.clubs?.name}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Players list */}
            {filteredPlayers.length > 0 ? (
              <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-10">#</th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Player</th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Position</th>
                      <th className="py-2.5 px-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/30 last:border-0">
                        <td className="py-2.5 px-3 font-black text-xs text-muted-foreground">{p.jersey_number ?? '–'}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-xs">{p.first_name} {p.last_name}</div>
                          <div className="text-[10px] text-muted-foreground sm:hidden">{p.position}</div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground hidden sm:table-cell">{p.position ?? '–'}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {search ? 'No players match your search.' : 'No players added yet. Click "Add Player" to get started.'}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
