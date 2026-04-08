import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Award, Users } from 'lucide-react';
import { usePlayers } from '@/hooks/useData';

interface PlayersTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
}

export default function PlayersTab({ fixture, result, homeClub, awayClub }: PlayersTabProps) {
  const homeTeamId = (fixture as any)?.home_team?.id;
  const awayTeamId = (fixture as any)?.away_team?.id;
  const { data: homePlayers, isLoading: loadingHome } = usePlayers(homeTeamId);
  const { data: awayPlayers, isLoading: loadingAway } = usePlayers(awayTeamId);

  return (
    <div className="space-y-3">
      {/* Best Players */}
      {result && (result.best_players_home?.length > 0 || result.best_players_away?.length > 0) && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Best Players</h3>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                <span className="font-bold text-xs">{homeClub?.short_name}</span>
              </div>
              <div className="space-y-1.5">
                {result.best_players_home?.map((p: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-xs">{p}</span>
                  </div>
                )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                <span className="font-bold text-xs">{awayClub?.short_name}</span>
              </div>
              <div className="space-y-1.5">
                {result.best_players_away?.map((p: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-xs">{p}</span>
                  </div>
                )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rosters */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Squads</h3>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 gap-4">
          {/* Home roster */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
              <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
              <span className="font-bold text-xs">{homeClub?.short_name}</span>
            </div>
            {loadingHome ? (
              <p className="text-xs text-muted-foreground/50">Loading...</p>
            ) : homePlayers && homePlayers.length > 0 ? (
              <div className="space-y-1">
                {homePlayers.filter((p: any) => p.is_active !== false).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 py-0.5">
                    {p.jersey_number != null && (
                      <span className="w-5 h-5 rounded bg-muted text-muted-foreground text-[9px] font-bold flex items-center justify-center shrink-0">{p.jersey_number}</span>
                    )}
                    <span className="text-xs">{p.first_name} {p.last_name}</span>
                    {p.position && <span className="text-[9px] text-muted-foreground ml-auto">{p.position}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No players listed</p>
            )}
          </div>
          {/* Away roster */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
              <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
              <span className="font-bold text-xs">{awayClub?.short_name}</span>
            </div>
            {loadingAway ? (
              <p className="text-xs text-muted-foreground/50">Loading...</p>
            ) : awayPlayers && awayPlayers.length > 0 ? (
              <div className="space-y-1">
                {awayPlayers.filter((p: any) => p.is_active !== false).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 py-0.5">
                    {p.jersey_number != null && (
                      <span className="w-5 h-5 rounded bg-muted text-muted-foreground text-[9px] font-bold flex items-center justify-center shrink-0">{p.jersey_number}</span>
                    )}
                    <span className="text-xs">{p.first_name} {p.last_name}</span>
                    {p.position && <span className="text-[9px] text-muted-foreground ml-auto">{p.position}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No players listed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
