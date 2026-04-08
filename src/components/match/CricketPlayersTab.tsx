import { BarChart3 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMemo, useState } from 'react';
import { useCricketPlayerStats, useCricketMatchResults } from '@/hooks/useCricketData';
import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';

interface CricketPlayersTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
}

const BATTING_COLS = [
  { key: 'runs_scored', label: 'R' },
  { key: 'balls_faced', label: 'B' },
  { key: 'fours', label: '4s' },
  { key: 'sixes', label: '6s' },
  { key: 'strike_rate', label: 'SR' },
] as const;

const BOWLING_COLS = [
  { key: 'overs_bowled', label: 'O' },
  { key: 'maidens', label: 'M' },
  { key: 'runs_conceded', label: 'R' },
  { key: 'wickets', label: 'W' },
  { key: 'economy', label: 'Econ' },
] as const;

export default function CricketPlayersTab({ fixture, result, homeClub, awayClub }: CricketPlayersTabProps) {
  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;
  const { data: allStats, isLoading } = useCricketPlayerStats(fixture?.id);
  const { data: inningsData } = useCricketMatchResults(fixture?.id);

  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedInnings, setSelectedInnings] = useState<number>(1);

  const getClub = (teamId: string) => teamId === homeTeamId ? homeClub : awayClub;
  const activeTeamId = selectedTeam === 'home' ? homeTeamId : awayTeamId;
  const activeClub = selectedTeam === 'home' ? homeClub : awayClub;

  // Get innings numbers that actually exist for the active team
  const inningsNumbers = useMemo(() => {
    if (!inningsData) return [1];
    const nums = [...new Set(
      inningsData
        .filter((i: any) => i.team_id === activeTeamId)
        .map((i: any) => i.innings_number)
    )].sort();
    return nums.length > 0 ? nums : [1];
  }, [inningsData, activeTeamId]);

  // Reset selected innings if it doesn't exist for this team
  useMemo(() => {
    if (!inningsNumbers.includes(selectedInnings)) {
      setSelectedInnings(inningsNumbers[0] ?? 1);
    }
  }, [inningsNumbers, selectedInnings]);

  const filteredStats = useMemo(() => {
    if (!allStats?.length) return [];
    return allStats.filter((s: any) => s.team_id === activeTeamId && s.innings_number === selectedInnings);
  }, [allStats, activeTeamId, selectedInnings]);

  const batters = useMemo(() => {
    return filteredStats.filter((s: any) => (s.balls_faced ?? 0) > 0 || (s.runs_scored ?? 0) > 0 || s.how_out);
  }, [filteredStats]);

  const bowlers = useMemo(() => {
    const opposingTeamId = selectedTeam === 'home' ? awayTeamId : homeTeamId;
    if (!allStats?.length) return [];
    return allStats
      .filter((s: any) => s.team_id === opposingTeamId && s.innings_number === selectedInnings && (Number(s.overs_bowled) > 0 || (s.wickets ?? 0) > 0))
      .sort((a: any, b: any) => (b.wickets ?? 0) - (a.wickets ?? 0));
  }, [allStats, selectedTeam, homeTeamId, awayTeamId, selectedInnings]);

  const inningsResult = inningsData?.find((i: any) => i.team_id === activeTeamId && i.innings_number === selectedInnings);
  const hasData = batters.length > 0 || bowlers.length > 0;
  const showInningsToggle = inningsNumbers.length > 1;

  return (
    <div className="space-y-3">
      {/* Team Selector */}
      <div className="match-card p-1.5 flex gap-1">
        <button
          onClick={() => setSelectedTeam('home')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
            selectedTeam === 'home' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <ClubLogo club={homeClub ?? {}} size="sm" className="!h-4 !w-4" />
          {homeClub?.short_name}
        </button>
        <button
          onClick={() => setSelectedTeam('away')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
            selectedTeam === 'away' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <ClubLogo club={awayClub ?? {}} size="sm" className="!h-4 !w-4" />
          {awayClub?.short_name}
        </button>
      </div>

      {/* Innings toggle - only show if multiple innings exist */}
      {showInningsToggle && (
        <div className="match-card p-1.5 flex gap-1">
          {inningsNumbers.map(num => (
            <button
              key={num}
              onClick={() => setSelectedInnings(num)}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                selectedInnings === num ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {num === 1 ? '1st Innings' : '2nd Innings'}
            </button>
          ))}
        </div>
      )}

      {/* Innings Score Header */}
      {inningsResult && (
        <div className="match-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClubLogo club={activeClub ?? {}} size="sm" className="!h-6 !w-6" />
            <span className="text-sm font-black">{activeClub?.short_name}</span>
            {!showInningsToggle && (
              <Badge variant="secondary" className="text-[9px] rounded-full px-1.5 py-0 font-bold border-0">1st Innings</Badge>
            )}
          </div>
          <div className="text-right">
            <span className="text-xl font-black tabular-nums">{inningsResult.total_runs}/{inningsResult.total_wickets}</span>
            <span className="text-xs text-muted-foreground ml-1.5">({inningsResult.total_overs} ov)</span>
          </div>
        </div>
      )}

      {/* Batting Scorecard */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Batting</h3>
        </div>
        {batters.length > 0 ? (
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground sticky left-0 bg-card z-10 min-w-[130px]">Batter</th>
                  <th className="text-left py-2 px-1.5 font-bold text-muted-foreground min-w-[70px]">Dismissal</th>
                  {BATTING_COLS.map(col => (
                    <th key={col.label} className="text-center py-2 px-1.5 font-bold text-muted-foreground min-w-[30px]">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {batters.map((s: any, i: number) => {
                  const primaryColor = activeClub?.primary_color || 'hsl(var(--primary))';
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-muted/15' : ''}>
                      <td className="py-2 px-3 sticky left-0 z-10" style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.15)' : 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-1.5">
                          {s.players?.jersey_number != null && (
                            <span className="w-4.5 h-4.5 rounded text-[7px] font-black flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: primaryColor, width: '18px', height: '18px' }}>
                              {s.players.jersey_number}
                            </span>
                          )}
                          <span className="font-bold truncate">
                            {s.players?.first_name?.[0]}. {s.players?.last_name}
                            {s.not_out && <span className="text-primary ml-0.5">*</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-1.5 text-[9px] text-muted-foreground truncate max-w-[70px]">
                        {s.not_out ? 'not out' : s.how_out || '-'}
                      </td>
                      <td className={`text-center py-2 px-1.5 font-bold ${(s.runs_scored ?? 0) >= 50 ? 'text-accent' : (s.runs_scored ?? 0) >= 30 ? 'text-primary' : ''}`}>
                        {s.runs_scored ?? 0}
                      </td>
                      <td className="text-center py-2 px-1.5 text-muted-foreground">{s.balls_faced ?? 0}</td>
                      <td className="text-center py-2 px-1.5">{s.fours ?? 0}</td>
                      <td className="text-center py-2 px-1.5">{s.sixes ?? 0}</td>
                      <td className="text-center py-2 px-1.5 tabular-nums">{Number(s.strike_rate ?? 0).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Extras & Total row */}
            {inningsResult && (
              <div className="border-t border-border/30 px-3 py-2 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Extras: <span className="font-bold text-foreground">{inningsResult.extras ?? 0}</span></span>
                <span className="font-black text-foreground">Total: {inningsResult.total_runs}/{inningsResult.total_wickets} ({inningsResult.total_overs} ov)</span>
              </div>
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="px-4 py-5 text-center">
            <p className="text-[10px] text-muted-foreground/50">No batting data recorded</p>
          </div>
        )}
      </div>

      {/* Bowling Figures */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Bowling</h3>
        </div>
        {bowlers.length > 0 ? (
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground sticky left-0 bg-card z-10 min-w-[130px]">Bowler</th>
                  {BOWLING_COLS.map(col => (
                    <th key={col.label} className="text-center py-2 px-1.5 font-bold text-muted-foreground min-w-[30px]">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {bowlers.map((s: any, i: number) => {
                  const bowlerClub = getClub(s.team_id);
                  const primaryColor = bowlerClub?.primary_color || 'hsl(var(--primary))';
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-muted/15' : ''}>
                      <td className="py-2 px-3 sticky left-0 z-10" style={{ backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.15)' : 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-1.5">
                          {s.players?.jersey_number != null && (
                            <span className="rounded text-[7px] font-black flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: primaryColor, width: '18px', height: '18px' }}>
                              {s.players.jersey_number}
                            </span>
                          )}
                          <span className="font-bold truncate">{s.players?.first_name?.[0]}. {s.players?.last_name}</span>
                        </div>
                      </td>
                      <td className="text-center py-2 px-1.5">{Number(s.overs_bowled ?? 0).toFixed(1)}</td>
                      <td className="text-center py-2 px-1.5">{s.maidens ?? 0}</td>
                      <td className="text-center py-2 px-1.5">{s.runs_conceded ?? 0}</td>
                      <td className={`text-center py-2 px-1.5 font-bold ${(s.wickets ?? 0) >= 5 ? 'text-accent' : (s.wickets ?? 0) >= 3 ? 'text-primary' : ''}`}>
                        {s.wickets ?? 0}
                      </td>
                      <td className="text-center py-2 px-1.5 tabular-nums">{Number(s.economy ?? 0).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="px-4 py-5 text-center">
            <p className="text-[10px] text-muted-foreground/50">No bowling data recorded</p>
          </div>
        )}
      </div>

      {isLoading && !hasData && (
        <div className="match-card px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground/50">Loading stats...</p>
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="match-card px-4 py-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground/50">No player stats recorded for this match</p>
        </div>
      )}
    </div>
  );
}
